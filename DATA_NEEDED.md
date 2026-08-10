# DATA_NEEDED.md

## ⭐ Priority manual checklist (what to do / provide, in order)

Do these and drop files where indicated; then run `make ingest && make run && make test`. None
requires code changes — the pipeline overwrites the matching cited anchors in place.

- [ ] **1. GBD 2023 Results Tool** (highest leverage; registration, free). Run the exact query in
      §1 below → save `core/data/raw/gbd/gbd_2023_results.csv`. Fills the two `placeholder: true`
      values (DALYs/case, editing-program cost basis) and replaces the burden rates with
      uncertainty. *This is the number set referees will check first.*
- [ ] **2. Run `make ingest` on a networked machine** (this sandbox blocks egress). It auto-pulls
      the Tier-A sources — UN WPP births, gnomAD v4.1 allele frequencies, WHO PMTCT, World Bank
      income groups. gnomAD directly hardens the contested S1 number.
- [ ] **3. Consanguinity by country** (consang.net / Bittles). Transcribe the country table →
      tell me and I'll load it into `conditions.yaml` as per-region F. Enables ancestry-aware,
      region-specific S1 instead of a single global F.
- [ ] **4. Cost anchors** (a few hours of sourcing, no access needed). Provide, with a citation
      each: IVF+PGT cycle cost by region; approved gene-therapy list prices; a real
      editing-program cost basis; PMTCT program cost/infection-averted. Replaces the `reasoned`
      cost entries in `constants.yaml §8`.
- [ ] **5. Scale the disease library (Orphanet).** The catalogue in
      `core/denominator/library/diseases.yaml` is a hand-curated seed of the highest-burden serious
      conditions. `make ingest` pulls Orphanet prevalence + gene + inheritance products into
      `data/curated/orphanet_candidates.parquet` as *candidate* rows; a curator promotes vetted
      entries into the YAML (so an automated pull never silently moves headline numbers). This is
      how the library grows from ~50 seed diseases toward full coverage.
- [ ] **6. Decide two policy calls for the paper** (not data — your judgment):
      (a) is congenital deafness *in or out* of the S1 "editing-only" residual? (b) which
      attribution stance is the paper's headline — inclusive (matches current 8.0M) vs
      heritability-weighted (~4.7M)? Both are toggles already; the paper just needs to state which.

Everything below is the detailed spec for each item.

---

Tier-B (registration/manual query) and any Tier-A sources whose auto-pull failed. Drop
downloads into `core/data/raw/<source>/`; the matching ingest module transcribes them to
`core/data/curated/` and overwrites the PLACEHOLDER entries in `constants.yaml` /
`conditions.yaml`. **The pipeline runs without these** — they tighten provenance and swap
cited anchors for primary pulls.

Run `make ingest` first: it attempts every Tier-A source and prints which ones deferred here.

---

## Tier B — you download, we transcribe

### 1. GBD 2023 Results Tool (GHDx) — burden numbers with uncertainty
- **Portal:** https://vizhub.healthdata.org/gbd-results/ (free, non-commercial, registration required)
- **Exact query:**
  - Measures: Incidence, Deaths, DALYs (Number **and** Rate)
  - Causes: congenital birth defects (all level-3/4 sub-causes), haemoglobinopathies
    (thalassaemias, sickle cell), chromosomal (incl. Down syndrome), neural-tube defects,
    congenital heart anomalies; plus T2D, IHD, stroke, major depression, schizophrenia, asthma
    for the attribution layer
  - Locations: Global + 7 GBD super-regions + 204 countries
  - Ages: `<1 year` for birth incidence; `All ages` for burden
  - Sex: Both · Year: 2023 · Format: CSV
- **Save to:** `core/data/raw/gbd/gbd_2023_results.csv`
- **Feeds:** `burden.monogenic_serious_per_1000`, `burden.multifactorial_serious_per_1000`,
  `costs.daly_per_severe_monogenic_case`, and the region layer.

### 2. GBD 2023 location/cause hierarchy files
- **Portal:** GHDx record pages (prepackaged, direct download)
- **Save to:** `core/data/raw/gbd/hierarchies/`
- **Feeds:** `harmonize.py` GBD-loc ↔ ISO3 ↔ super-region crosswalk.

### 3. Modell Global Database (haemoglobinopathy affected births by country)
- Newest vintage beyond Modell & Darlison 2008. If not openly downloadable, we fall back to the
  transcribed 2008 tables (already in `constants.yaml`) and record the vintage.
- **Save to:** `core/data/raw/modell/`

### 4. OMIM gene–phenotype map (`genemap2.txt`)
- **Portal:** https://omim.org/downloads (free registered download)
- **Save to:** `core/data/raw/omim/genemap2.txt`
- **Feeds:** inheritance-mode curation for the S1 condition list (fallback: Orphanet annotations).

---

## Tier C — transcribed published tables (already in constants.yaml, listed for provenance)
- Modell & Darlison 2008 (Bull WHO) — haemoglobinopathy service indicators.
- Bittles & Black / consang.net — consanguinity prevalence by country (drives F).
- Cyprus/Sardinia/Greece thalassaemia + Denmark/Iceland/Netherlands trisomy-21 program outcomes.
- ESHRE PGT Consortium (PGT effectiveness); NURTURE / SMA NBS (newborn therapy).
- Cost anchors: Cousens et al. 2010; IVF+PGT cycle costs; gene-therapy list prices; PMTCT.
- S2 effect sizes: Ference et al. 2017 (PCSK9); CCR5-Δ32; APOE; Savulescu et al. 2025.

---

## Auto-pull status
`make ingest` targets these Tier-A sources directly (no manual step):
UN WPP 2024 births · WHO GHO (PMTCT, congenital mortality) · gnomAD v4.1 allele frequencies ·
World Bank income groups · UNAIDS vertical HIV. Any that fail print an exact request above.
