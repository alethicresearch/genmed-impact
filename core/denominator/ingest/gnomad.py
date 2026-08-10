"""gnomAD v4.1 (Tier A) — ancestry-stratified allele frequencies via public GraphQL API.

Fetches pathogenic-allele frequencies for the S1/S2 gene set and writes
data/curated/gnomad_allele_freqs.parquet [gene, variant, ancestry, af]. These can overwrite
the `allele_freq` anchors in conditions.yaml (ancestry-composition-weighted).
"""
from __future__ import annotations

API = "https://gnomad.broadinstitute.org/api"
GENES = ["HBB", "CFTR", "SMN1", "HEXA", "GJB2", "HTT", "PCSK9"]

_QUERY = """
query GeneAF($symbol: String!, $dataset: DatasetId!) {
  gene(gene_symbol: $symbol, reference_genome: GRCh38) {
    variants(dataset: $dataset) {
      variant_id
      genome { af populations { id af } }
    }
  }
}
"""


def fetch() -> str:
    import json
    import urllib.request

    from .. import config

    rows = []
    for gene in GENES:
        payload = json.dumps({"query": _QUERY,
                              "variables": {"symbol": gene, "dataset": "gnomad_r4"}}).encode()
        req = urllib.request.Request(API, data=payload,
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:  # noqa: S310
                data = json.loads(resp.read())
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(
                f"gnomAD GraphQL unreachable for {gene}; POST the GeneAF query to {API} "
                f"-> data/raw/gnomad/{gene}.json (auto-fetch failed: {exc})")
        variants = (((data or {}).get("data") or {}).get("gene") or {}).get("variants") or []
        for v in variants:
            genome = v.get("genome") or {}
            for pop in genome.get("populations", []):
                rows.append({"gene": gene, "variant": v["variant_id"],
                             "ancestry": pop["id"], "af": pop["af"]})
    if not rows:
        raise RuntimeError("gnomAD returned no rows; verify API schema/version.")
    import pandas as pd

    df = pd.DataFrame(rows)
    dest = config.DATA_CURATED / "gnomad_allele_freqs.parquet"
    df.to_parquet(dest, index=False)
    return f"wrote {len(df)} allele-frequency rows across {df['gene'].nunique()} genes -> {dest.name}"
