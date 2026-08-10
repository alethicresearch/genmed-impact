# Data license

The **curated data products** created in this repository are licensed under the
**Creative Commons Attribution 4.0 International License (CC-BY-4.0)**:
<https://creativecommons.org/licenses/by/4.0/>.

This covers, specifically:

- the curated disease library — `core/denominator/library/diseases.yaml`,
  `core/denominator/library/multifactorial.yaml`, and the Orphanet-derived
  `core/denominator/library/rare_orphanet.yaml`;
- the cited assumption sets — `core/denominator/constants.yaml`,
  `core/denominator/conditions.yaml`;
- the generated results — everything under `results/` and the JSON under
  `app/public/data/`.

**Attribution:** cite the accompanying paper and this repository (see `CITATION.cff`).

## Third-party input data (NOT covered by the above, NOT redistributed here)

The pipeline consumes several external datasets that are **not** included in this
repository and remain under their own licenses and terms of use. To reproduce the
inputs, obtain them from the original providers (see `core/data/README.md`):

| Source | Used for | License / terms |
|---|---|---|
| IHME **GBD 2023** | condition-specific birth/<1yr incidence | IHME Free-of-Charge Non-commercial User Agreement — **not redistributable**; users must download from the GBD Results Tool |
| **Orphanet / Orphadata** (en_product9_prev, en_product6, en_product9_ages) | rare-tier prevalence, genes, inheritance | CC-BY-4.0 (Orphanet) — redistributable with attribution |
| **UN World Population Prospects 2024** | annual births | CC BY 3.0 IGO |
| **WHO**, **UNAIDS**, **World Bank** | PMTCT, HIV vertical infections, income groups | respective open-data terms |

Because GBD data are not redistributable, the raw GBD CSV is git-ignored
(`core/data/raw/`). Only the small **derived** anchors (e.g. specific incidence
values) appear in the curated files, each with an inline citation to its GBD source.

## Zenodo deposit

At submission/acceptance, a Zenodo archive will bundle this repository at a tagged
release plus the redistributable curated data. Non-redistributable inputs (GBD) will
be referenced by citation and access instructions rather than included. See
`core/data/README.md` for the exact split.
