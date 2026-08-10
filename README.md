# Genetic Disease and What Medicine Can Do

**Defining the medical role of human germline embryo editing relative to existing genetic medicine**

Sankalpa Ghose · D. A. Wallach · Peter Singer · Julian Savulescu

[Research page](https://alethicresearch.github.io/genmed-impact/) · [Paper — in preparation](#paper) · [Results & data](results/) · [Citation](#citation)

> **Work in progress.** The analysis and accompanying manuscript are under development. Numerical results, disease classifications, and figures may change before the analysis is frozen for submission.

## Research question

**Where does germline embryo editing add medical value that existing genetic medicine cannot?**

Debate over human germline genome editing is often framed as a question about the technology itself: whether heritable editing should be prohibited, permitted, or developed to prevent genetic disease. This project starts with a prior empirical question. Which serious genetic diseases can already be prevented, detected, or treated using existing medicine, and which leave a residual need that germline editing could uniquely or substantially address?

To investigate that question, we combine a structured disease-by-intervention catalogue with global disease-burden evidence and a population model. The analysis maps serious genetic conditions to their genetic basis, inheritance, frequency, reproductive options, screening pathways, and postnatal treatments; models how access changes population-level outcomes; and then estimates the narrower situations in which germline embryo editing might add a distinct medical benefit.

The empirical analysis is kept separate from the ethical and policy argument. A model result can identify the size of a population or the effect of an assumption; it does not by itself determine whether an intervention should be developed, offered, or permitted.

## What the study contains

### 1. Disease map

The project maintains a structured catalogue of serious genetic conditions linked to:

- causal genes or loci;
- inheritance pattern;
- incidence or prevalence;
- disease severity and onset;
- reproductive pathways;
- newborn screening;
- available postnatal treatment and treatment intent; and
- source provenance.

The current catalogue contains **331 conditions** in total. A **97-condition curated analytic core** supports the bottom-up burden analysis; an Orphanet-derived rare-disease tier broadens disease coverage and is progressively reviewed.

### 2. Existing genetic medicine

The analysis distinguishes interventions by the outcome they can achieve:

- **Carrier screening + reproductive planning**
- **IVF + PGT-M embryo selection**
- **Prenatal diagnosis + reproductive decision**
- **Newborn screening + early treatment**
- **Postnatal treatment**, including pharmacological, surgical, transplant, dietary, enzyme-replacement, somatic gene/cell, and supportive approaches where applicable

Two outcomes are reported separately throughout:

- **Affected-birth avoidance** — prevention of an affected birth through a reproductive pathway.
- **Burden mitigation** — reduction in morbidity, mortality, disability, or other disease consequences after an affected birth.

Prenatal diagnosis reduces affected births in the model only when it is followed by a reproductive decision not to continue an affected pregnancy. Newborn screening does not prevent an affected birth; it can enable earlier treatment.

### 3. Population model

Two complementary analyses run in parallel:

- a **bottom-up disease catalogue**, which sums disease-level burden and intervention applicability; and
- a **top-down population model**, which estimates the broader global burden of serious monogenic and multifactorial disease and propagates uncertainty in the underlying inputs.

The main population model is built around an annual global birth cohort. For adult-onset and multifactorial disease, this is an attribution framework: it does **not** mean that every modeled case is clinically present at birth.

### 4. Where germline editing could add value

The analysis separates two conceptually different quantities:

**Editing-only prevention**  
A reproductive configuration in which no unaffected embryo can be selected, so germline editing would provide a preventive route unavailable through embryo selection.

**Potential complex-disease editing advantage**  
A modeled situation in which editing might provide additional risk reduction beyond selection, treatment, or prevention for a complex disease. This is not an editing-only population and is substantially more uncertain.

Together these define an **editing-relevant residual**, but the two components are always reported separately because their evidentiary status differs.

### 5. Ethical and policy analysis

The project then asks what, if anything, should follow from the empirical results. The normative analysis considers severity, availability of alternatives, incremental medical benefit, uncertainty, safety, intergenerational effects, access, and the distinction between disease prevention, resistance to common risks, and enhancement.

## Data sources

The analysis draws on multiple source families, including:

- **Population and disease burden:** GBD 2023, UN World Population Prospects 2024, WHO
- **Genetics and disease:** Orphanet, OMIM, gnomAD v4.1, disease-specific peer-reviewed literature
- **Access and geography:** World Bank income groups, UNAIDS, national screening and treatment programmes
- **Intervention evidence:** published carrier-screening, PGT, newborn-screening, treatment, genetic-architecture, and related clinical literature

Where direct empirical estimates are unavailable, the relevant quantity is represented explicitly as a modeling assumption, normative choice, or provisional parameter rather than being presented as observed data.

## Headline results

The table below reports the current default analysis: main severity definition (`def_b`), inclusive multifactorial attribution, current coverage assumptions, and prenatal diagnosis counted as reducing affected births when followed by pregnancy termination.

| Quantity | Current estimate | Interpretation |
|---|---:|---|
| Annual global live births | **135.0M** (95% UI 130.2–140.1M) | Population denominator |
| Serious monogenic disease | **1.405M** (1.098–1.793M) | Cases attributed to an annual birth cohort |
| Serious multifactorial / partly genetic disease | **6.621M** (5.393–8.126M) | Inclusive genetic-attribution scenario |
| **Total modeled serious genetic disease** | **8.042M** (6.747–9.591M) | 5.96% of annual births under the default attribution |
| Editing-only prevention | **11.3k/yr** (4.9–26.1k) | ~0.14% of modeled serious disease |
| Potential complex-disease editing advantage — current evidence | **1.3k/yr** (approximately 0–18.0k) | ~0.02%; highly uncertain |
| **Combined editing-relevant residual — current evidence** | **14.2k/yr** (5.8–34.7k) | **0.18%** |
| Potential complex-disease editing advantage — optimistic modeled scenario | **127.2k/yr** (57.4–243.6k) | Modeled possibility, not a forecast |
| **Combined editing-relevant residual — optimistic scenario** | **139.6k/yr** (68.8–257.5k) | **1.74%** |

Under the current-evidence scenario, approximately **99.82%** of the modeled serious-disease burden is **not uniquely dependent on germline editing**. Under the optimistic complex-disease scenario, that figure is approximately **98.26%**.

This is **not** equivalent to saying that 98–100% of serious genetic disease is preventable by existing medicine. Existing interventions differ in what they accomplish, many people do not currently have access to them, and postnatal treatment is not the same outcome as preventing an affected birth.

### Congenital deafness sensitivity

The primary editing-only estimate excludes congenital sensorineural deafness as a condition that should necessarily be classified for prevention. Including it raises the modeled editing-only population from approximately **11.3k to 24.9k births per year**. This is treated as a **normative classification choice**, not as ordinary epidemiological uncertainty.

## How the analysis works

The project uses one six-step framework:

1. **Define the burden** — estimate serious monogenic and multifactorial disease under explicit severity and attribution choices.
2. **Build the disease map** — link diseases to genes, inheritance, frequency, and interventions.
3. **Map intervention outcomes** — distinguish affected-birth avoidance from postnatal burden mitigation.
4. **Model access** — distinguish technical applicability from actual access under alternative coverage scenarios.
5. **Identify the editing-relevant residual** — keep editing-only prevention separate from potential complex-disease editing advantage.
6. **Interpret the implications** — examine research priorities and ethical/regulatory consequences separately from the quantitative results.

Uncertainty is propagated through the quantitative model rather than treated as a final step.

## Research page

The [interactive research page](https://alethicresearch.github.io/genmed-impact/) provides the main reader-facing presentation of the project.

It is organized into six sections:

- **Overview** — research question, study design, and headline findings
- **Disease map** — burden estimates, attribution/severity sensitivity, and the disease catalogue
- **Existing options** — reproductive and postnatal pathways under different access scenarios
- **Where editing adds value** — editing-only prevention and the separate complex-disease analysis
- **Ethics & policy** — normative interpretation, embryo trade-offs, resistance, enhancement, and exploratory analyses
- **Methods & data** — model structure, evidentiary status of inputs, sensitivity analysis, sources, glossary, and reproducibility information

The research page is intended to make the data, assumptions, uncertainty, and alternative scenarios directly inspectable.

## Reproducibility

The current committed analysis uses:

- **Model specification:** 3.0
- **Monte Carlo draws:** 20,000
- **Random seed:** 20260810
- **Pipeline commit stamped in the current data:** `4e98e2d`

Run the analysis locally with:

```bash
make install
make run
make test
```

To reproduce the complete default pipeline:

```bash
make repro
```

Optional data-refresh steps:

```bash
make ingest
make orphanet-sync
```

Build the research page with:

```bash
make app-install
make app-build
```

Exact Python dependencies used by the analysis are in [`core/requirements.txt`](core/requirements.txt). Each exported run records its model version, random seed, draw count, and pipeline commit in [`app/public/data/meta.json`](app/public/data/meta.json).

## Repository structure

```text
genmed-impact/
├── core/
│   ├── denominator/
│   │   ├── constants.yaml          # model inputs and parameter ranges
│   │   ├── conditions.yaml         # editing-only prevention condition inputs
│   │   ├── library/
│   │   │   ├── diseases.yaml       # curated analytic core
│   │   │   ├── rare_orphanet.yaml  # Orphanet-derived rare-disease tier
│   │   │   └── multifactorial.yaml # complex-disease architecture inputs
│   │   ├── ingest/                 # source-specific ingestion
│   │   ├── library.py              # bottom-up disease aggregation
│   │   ├── attribution.py          # severity × genetic-attribution burden grid
│   │   ├── model.py                # existing-intervention model
│   │   ├── residual.py             # editing-only and complex-disease residuals
│   │   ├── multifactorial.py       # liability-threshold exploratory analysis
│   │   ├── embryos.py              # idealized embryo-selection comparison
│   │   ├── montecarlo.py           # uncertainty propagation
│   │   ├── sensitivity.py          # sensitivity analysis
│   │   ├── methods.py              # generated methods
│   │   ├── run.py                  # pipeline orchestration
│   │   └── export.py               # research-page and paper outputs
│   ├── data/
│   └── tests/
├── app/                             # React/Vite research page
│   └── public/data/                 # pipeline-generated JSON
├── results/
│   ├── paper_numbers.json           # canonical paper-facing estimates
│   ├── tables.md                    # generated result tables
│   └── methods.md                   # generated methods and provenance
├── ANALYSIS_LOG.md
├── CITATION.cff
├── LICENSE
├── LICENSE-DATA.md
└── Makefile
```

## Key outputs

- [`results/paper_numbers.json`](results/paper_numbers.json) — paper-facing quantitative estimates and 95% model uncertainty intervals
- [`results/tables.md`](results/tables.md) — generated analysis tables
- [`results/methods.md`](results/methods.md) — generated methods, assumptions, formulas, and provenance
- [`app/public/data/`](app/public/data/) — JSON used by the research page
- [`ANALYSIS_LOG.md`](ANALYSIS_LOG.md) — analysis decisions and revision history

## Evidentiary status and provenance

Quantitative inputs are classified by evidentiary status:

- **Cited data** — taken from an identified empirical source
- **Derived** — calculated from other model inputs
- **Modeling assumption** — an explicit assumption used where direct measurement is unavailable or insufficient
- **Normative choice** — a value-sensitive classification or modeling decision
- **Provisional** — an input awaiting stronger empirical support

Source records can include the central value, uncertainty range, source, DOI, table/page, retrieval date, and evidentiary status. The Methods & data view exposes these records directly.

## Important limitations

This analysis should not be read as claiming that:

- the disease catalogue is exhaustive;
- the inclusive multifactorial attribution is the uniquely correct definition of genetic disease;
- disease burden attributed to a birth cohort is necessarily present at birth;
- technical applicability implies real-world access, uptake, affordability, or equivalent outcomes;
- prenatal diagnosis itself prevents disease;
- newborn screening prevents affected births;
- the current germline-editing technology is safe enough for clinical use;
- the optimistic complex-disease scenario is a forecast; or
- the quantitative model by itself determines an ethical or regulatory conclusion.

The exploratory cost-allocation analysis contains provisional inputs and is not currently treated as a paper-level result.

## Paper

The accompanying manuscript is in preparation:

**Genetic Disease and What Medicine Can Do: Defining the Medical Role of Germline Embryo Editing**

The paper and research page are being developed from the same analysis and terminology. A versioned archival release will be frozen for submission.

## License

- **Code:** Apache-2.0 — see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE)
- **Curated project data and generated results:** CC-BY-4.0 — see [`LICENSE-DATA.md`](LICENSE-DATA.md)
- **Third-party inputs:** remain under their respective licenses and are referenced rather than redistributed where required

## Citation

Machine-readable citation metadata is provided in [`CITATION.cff`](CITATION.cff). A tagged archival release is planned for manuscript submission.

```bibtex
@software{genmed_impact,
  title  = {Genetic Disease and What Medicine Can Do:
            a genetic-disease {\texttimes} genetic-medicine impact library
            and reproducible burden pipeline},
  author = {Ghose, Sankalpa and Wallach, D. A. and Singer, Peter and Savulescu, Julian},
  year   = {2026},
  url    = {https://github.com/alethicresearch/genmed-impact},
  note   = {Code Apache-2.0; curated data CC-BY-4.0.}
}
```
