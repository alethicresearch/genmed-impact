# Data: provenance, access, and what is / isn't in the repo

The pipeline **runs without any of these files** — every headline number has a cited
default baked into `constants.yaml` / `conditions.yaml` / the library YAMLs. External
data only *tighten* provenance (replace textbook estimates with cited figures) and
*expand* the library (the Orphanet rare tier). This keeps a clone reproducible offline
while making the upgrade path explicit.

```
core/data/
├── raw/        # inputs downloaded from providers — GIT-IGNORED (see below)
│   ├── gbd/        IHME GBD 2023 Results Tool CSV  (non-redistributable)
│   └── orphanet/   Orphadata XML: prevalence.xml, genes.xml, inheritance.xml (CC-BY-4.0)
└── curated/    # tidy parquet derived from raw/ — GIT-IGNORED, regenerable
```

`core/data/raw/` and `core/data/curated/*.parquet` are git-ignored: raw inputs are large
and, for GBD, license-restricted; curated parquet is fully regenerable from raw. Only the
small **derived anchors** (specific incidence values) live in the committed YAMLs, each
with an inline citation.

## How to obtain the inputs

| Directory | Source | How to get it | License |
|---|---|---|---|
| `raw/gbd/` | IHME **GBD 2023** Results Tool | Register at <https://vizhub.healthdata.org/gbd-results/>, run the query in `DATA_NEEDED.md §1`, save the CSV here. | IHME non-commercial agreement — **do not redistribute** |
| `raw/orphanet/` | **Orphadata** products `en_product9_prev`, `en_product6`, `en_product9_ages` | Download from <https://www.orphadata.com/> and save as `prevalence.xml`, `genes.xml`, `inheritance.xml`. Or run `python -m denominator ingest` on a networked machine. | CC-BY-4.0 |

## How the inputs are used (and made reproducible)

```bash
cd core
python -m denominator ingest          # attempt Tier-A auto-pulls -> data/curated/*.parquet
python -m denominator orphanet-sync   # from raw/orphanet/*.xml, regenerate library artefacts:
                                       #   (1) promote Worldwide birth-prevalence onto textbook
                                       #       estimates in diseases.yaml (idempotent), and
                                       #   (2) rebuild library/rare_orphanet.yaml (the rare tier)
python -m denominator run             # Monte-Carlo pipeline -> app JSON + results/
```

`orphanet-sync` is deterministic: given the same Orphadata XML it reproduces
`rare_orphanet.yaml` byte-for-byte and applies the same 26 disciplined core promotions.
Run `python -m denominator orphanet-sync --no-apply` for a dry-run diff.

## For the Zenodo deposit

Include: the committed repository at the tagged release (code + curated YAMLs + results),
and the **Orphadata** XML (CC-BY-4.0, redistributable with attribution). Exclude the raw
**GBD** CSV (non-redistributable) — reference it by the citation in
`core/data/raw/gbd/citation.txt` and the access instructions above instead.
