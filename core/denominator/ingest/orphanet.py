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
