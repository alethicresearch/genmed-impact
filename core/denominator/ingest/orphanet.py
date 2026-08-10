"""Orphanet / Orphadata (Tier A) — scale the disease library from the seed catalogue.

Orphadata publishes, as open XML/JSON:
  * en_product9_prev  — prevalence / incidence-at-birth by disorder
  * en_product6       — disorder ↔ gene associations
  * en_product9_ages  — age of onset, type of inheritance

This module pulls those, cross-links them by OrphaCode, and writes
data/curated/orphanet_candidates.parquet with the library schema's columns
[orphanet, name, genes, inheritance, incidence_per_100k, source]. These are *candidate*
rows for `library/diseases.yaml`: a curator (or a follow-up merge step) promotes vetted
entries into the hand-curated catalogue, so a noisy automated pull never silently changes
headline numbers.
"""
from __future__ import annotations

BASE = "https://www.orphadata.com/data/xml"
PRODUCTS = {
    "prevalence": f"{BASE}/en_product9_prev.xml",
    "genes": f"{BASE}/en_product6.xml",
    "inheritance": f"{BASE}/en_product9_ages.xml",
}
HINT = ("Download the Orphadata XML products (en_product9_prev, en_product6, en_product9_ages) "
        "from https://www.orphadata.com/ into data/raw/orphanet/ ; this module cross-links them "
        "into candidate library rows. The hand-curated library/diseases.yaml is authoritative "
        "until candidates are vetted and promoted.")


def fetch() -> str:
    import urllib.request

    from .. import config

    raw_dir = config.DATA_RAW / "orphanet"
    raw_dir.mkdir(parents=True, exist_ok=True)
    got = []
    for name, url in PRODUCTS.items():
        try:
            with urllib.request.urlopen(url, timeout=60) as resp:  # noqa: S310
                (raw_dir / f"{name}.xml").write_bytes(resp.read())
            got.append(name)
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(f"{HINT} (auto-fetch failed for {name}: {exc})")
    return (f"pulled {', '.join(got)} to data/raw/orphanet/. Run the promote step to generate "
            f"candidate library rows (see DATA_NEEDED.md).")


def _worldwide_birth_prevalence() -> dict:
    """OrphaCode -> (val_per_100k, geo, is_worldwide) from the 'Prevalence at birth' entries.

    Orphanet ValMoy is per 100,000. Prefer a Worldwide estimate; keep the best available.
    """
    import xml.etree.ElementTree as ET

    from .. import config

    root = ET.parse(config.DATA_RAW / "orphanet" / "prevalence.xml").getroot()
    out: dict = {}
    for d in root.iter("Disorder"):
        oc = d.findtext("OrphaCode")
        pl = d.find("PrevalenceList")
        if pl is None:
            continue
        cands = []
        for p in pl.findall("Prevalence"):
            if p.findtext("PrevalenceType/Name") != "Prevalence at birth":
                continue
            try:
                v = float(p.findtext("ValMoy"))
            except (TypeError, ValueError):
                continue
            if v <= 0:
                continue
            geo = p.findtext("PrevalenceGeographic/Name") or ""
            cands.append((0 if geo == "Worldwide" else 1, v, geo))
        if cands:
            cands.sort()
            rank, v, geo = cands[0]
            out[oc] = (v, geo, rank == 0)
    return out


def promote(apply: bool = True) -> dict:
    """Fold Orphanet Worldwide birth-prevalence into the library — disciplined.

    Updates a disease's ``incidence_per_100k`` ONLY when Orphanet has a **Worldwide** birth
    prevalence and the current basis is a mere ``textbook_estimate``/``order_of_magnitude`` — never
    over a GBD/Modell-cited value, and never with a single-country figure (which would degrade the
    data). Comment/format-preserving via ruamel. Returns the list of changes.
    """
    from ruamel.yaml import YAML

    from .. import config

    bp = _worldwide_birth_prevalence()
    yaml = YAML()
    yaml.preserve_quotes = True
    path = config.CONDITIONS_YAML.parent / "library" / "diseases.yaml"
    with open(path, "r", encoding="utf-8") as fh:
        doc = yaml.load(fh)

    changes = []
    for d in doc["diseases"]:
        oc = str(d.get("orphanet", "") or "")
        inc = d.get("incidence_per_100k")
        if not oc or inc is None or oc not in bp:
            continue
        val, geo, is_ww = bp[oc]
        if not is_ww:
            continue
        if inc.get("basis") not in ("textbook_estimate", "order_of_magnitude"):
            continue
        old = inc.get("value")
        inc["value"] = round(val, 2)
        inc["basis"] = "cited"
        inc["source"] = f"Orphanet (Prevalence at birth, Worldwide; OrphaCode {oc})"
        inc["doi"] = "https://www.orphadata.com"
        changes.append({"id": d["id"], "orphanet": oc, "from": old, "to": round(val, 2)})

    if apply and changes:
        with open(path, "w", encoding="utf-8") as fh:
            yaml.dump(doc, fh)
    return {"n_disorders_with_birth_prev": len(bp), "n_promoted": len(changes), "changes": changes}
