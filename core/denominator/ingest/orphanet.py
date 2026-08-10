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


_INH_MAP = {
    "Autosomal recessive": ("monogenic_recessive", "autosomal_recessive"),
    "Autosomal dominant": ("monogenic_dominant", "autosomal_dominant"),
    "X-linked recessive": ("x_linked", "x_linked_recessive"),
    "X-linked dominant": ("x_linked", "x_linked_dominant"),
}


def _best_birth_prevalence() -> dict:
    """OrphaCode -> (val_per_100k, geo, is_worldwide) using the best 'Prevalence at birth' entry.

    Worldwide is preferred; otherwise the single-country/region value is kept (flagged by geo).
    Unlike the core promote(), the rare tier accepts non-Worldwide figures because it is an
    explicitly lower-confidence, segmented tier — a cited single-country birth prevalence beats
    no citation, as long as its geography travels with it.
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
        best = None
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
            rank = 0 if geo == "Worldwide" else 1
            if best is None or rank < best[0]:
                best = (rank, v, geo)
        if best:
            out[oc] = (best[1], best[2], best[0] == 0)
    return out


def _gene_map() -> dict:
    import xml.etree.ElementTree as ET

    from .. import config

    root = ET.parse(config.DATA_RAW / "orphanet" / "genes.xml").getroot()
    out: dict = {}
    for d in root.iter("Disorder"):
        oc = d.findtext("OrphaCode")
        syms = sorted({a.findtext("Gene/Symbol") for a in d.iter("DisorderGeneAssociation")
                       if a.findtext("Gene/Symbol")})
        if syms:
            out[oc] = syms
    return out


def _inheritance_map() -> dict:
    """OrphaCode -> first clean (category, inheritance) mapping, skipping ambiguous types."""
    import xml.etree.ElementTree as ET

    from .. import config

    root = ET.parse(config.DATA_RAW / "orphanet" / "inheritance.xml").getroot()
    out: dict = {}
    for d in root.iter("Disorder"):
        oc = d.findtext("OrphaCode")
        for t in d.iter("TypeOfInheritance"):
            nm = t.findtext("Name")
            if nm in _INH_MAP:
                out[oc] = _INH_MAP[nm]
                break
    return out


def build_rare_tier(apply: bool = True) -> dict:
    """Generate library/rare_orphanet.yaml — the long tail of individually-rare monogenic disease.

    The curated ``diseases.yaml`` holds the ~97 highest-burden conditions that drive the global
    numbers. This step adds every *other* Orphanet disorder that has (a) a cited birth prevalence,
    (b) a known causal gene, and (c) a clean monogenic inheritance mode — as a distinct, segmented,
    lower-confidence **rare tier**. Intervention applicability is assigned by transparent rule, not
    by curation:

      * CS  applicable  iff recessive or X-linked (carrier detectable in parents)
      * PGT applicable  iff monogenic with a known gene (PGT-M)
      * PND applicable  iff monogenic with a known gene (molecular prenatal test)
      * NBS applicable  → False (a treat-at-birth claim needs curation we don't automate)

    Treatment modality is left ``unknown`` (not curated), and severity is assumed ``serious``.
    These defaults are deliberately conservative: they never assert a treatment or a newborn cure
    we cannot cite, so the rare tier can only *understate* what genetic medicine offers.
    """
    from ruamel.yaml import YAML
    from ruamel.yaml.comments import CommentedMap

    from .. import config

    bp = _best_birth_prevalence()
    genes = _gene_map()
    inh = _inheritance_map()

    # OrphaCodes already curated by hand — never duplicate them into the rare tier.
    yaml = YAML()
    yaml.preserve_quotes = True
    core_path = config.PKG_DIR / "library" / "diseases.yaml"
    with open(core_path, "r", encoding="utf-8") as fh:
        core = yaml.load(fh)
    curated = {str(d.get("orphanet")) for d in core["diseases"] if d.get("orphanet")}

    # Pull disorder names once from the prevalence product.
    import xml.etree.ElementTree as ET
    names = {d.findtext("OrphaCode"): (d.findtext("Name") or "")
             for d in ET.parse(config.DATA_RAW / "orphanet" / "prevalence.xml").getroot().iter("Disorder")}

    records = []
    for oc in sorted(bp, key=lambda o: -bp[o][0] if False else int(o)):
        if oc in curated or oc not in genes or oc not in inh:
            continue
        category, inheritance = inh[oc]
        val, geo, is_ww = bp[oc]
        recessive_or_xl = category in ("monogenic_recessive", "x_linked")
        rec = CommentedMap()
        rec["id"] = f"orpha_{oc}"
        rec["name"] = names.get(oc, f"OrphaCode {oc}")
        rec["category"] = category
        rec["genes"] = genes[oc][:6]
        rec["inheritance"] = inheritance
        rec["orphanet"] = oc
        rec["severity"] = "serious"          # tier-wide assumption (rare Orphanet disorders)
        rec["onset"] = "unknown"
        rec["tier"] = "rare"
        rec["confidence"] = "automated"
        rec["incidence_per_100k"] = CommentedMap([
            ("value", round(val, 3)),
            ("basis", "cited"),
            ("source", f"Orphanet (Prevalence at birth, {geo}; OrphaCode {oc})"),
            ("doi", "https://www.orphadata.com"),
            ("geography", geo),
            ("worldwide", bool(is_ww)),
        ])
        rec["interventions"] = CommentedMap([
            ("CS", CommentedMap([("applicable", recessive_or_xl),
                                 ("note", "rule: carrier screening applies to recessive/X-linked")])),
            ("PGT", CommentedMap([("applicable", True),
                                  ("note", "rule: PGT-M applies to any monogenic with a known gene")])),
            ("PND", CommentedMap([("applicable", True),
                                  ("note", "rule: molecular prenatal test applies to any monogenic with a known gene")])),
            ("NBS", CommentedMap([("applicable", False),
                                  ("note", "conservative default: no automated treat-at-birth claim")])),
        ])
        rec["editing_unique"] = False
        rec["treatment"] = CommentedMap([("modality", "unknown"),
                                         ("note", "not curated (automated rare tier)")])
        records.append(rec)

    doc = CommentedMap()
    doc["meta"] = CommentedMap([
        ("tier", "rare"),
        ("generated_by", "denominator.ingest.orphanet.build_rare_tier"),
        ("source", "Orphadata en_product9_prev + en_product6 + en_product9_ages"),
        ("selection", "cited birth prevalence + known gene + clean monogenic inheritance, "
                      "excluding the hand-curated core catalogue"),
        ("intervention_rules", "CS: recessive/X-linked; PGT & PND: any monogenic with a gene; "
                               "NBS: false (needs curation); treatment: unknown; severity: assumed serious"),
        ("note", "Individually rare, collectively a long tail. Segmented from the burden-weighted "
                 "core so it completes the catalogue without moving the headline totals."),
    ])
    doc["diseases"] = records

    out_path = config.PKG_DIR / "library" / "rare_orphanet.yaml"
    if apply:
        with open(out_path, "w", encoding="utf-8") as fh:
            yaml.dump(doc, fh)
    from collections import Counter
    return {
        "n_records": len(records),
        "by_category": dict(Counter(r["category"] for r in records)),
        "worldwide": sum(1 for r in records if r["incidence_per_100k"]["worldwide"]),
        "path": str(out_path),
    }


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
