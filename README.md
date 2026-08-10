# Reframing Genetic Medicine in Terms of Impact

Sankalpa Ghose · D. A. Wallach · Peter Singer · Julian Savulescu

[Research page](https://alethicresearch.github.io/genmed-impact/) · [Paper — in preparation](#paper) · [Results & data](results/) · [Citation](#citation)

> **Work in progress.** The analysis and accompanying manuscript are under development. Numerical results, disease classifications, and figures may change before the analysis is frozen for submission.

## Why this project

Genetic medicine is often discussed through its most technologically spectacular possibilities. This project asks a different question: **where can genetic medicine produce the greatest present and prospective impact?**

The answer changes with both disease architecture and technological maturity. Established carrier screening, reproductive genetics, prenatal diagnosis, newborn screening, and treatment already have substantial potential but remain unevenly deployed. Germline editing may provide a distinct option in a much smaller set of severe monogenic reproductive situations where embryo selection cannot produce an unaffected embryo. Over a longer horizon, advances in causal genomics and multiplex editing could substantially expand the role of heritable intervention in common polygenic disease.

The project therefore separates **impact now**, the **translational frontier**, and **future impact**, and asks what each implies for research, implementation, ethics, and regulation. Impact is treated as multidimensional — population impact, individual clinical impact, technological maturity, distributional access, and **reproductive burden**, the route-dependent physical, procedural, and embryo-level burdens of achieving a reproductive outcome. Two interventions can achieve the same disease outcome while imposing very different reproductive burdens.

## The three horizons

### Impact now

Map serious genetic disease to existing genetic-medicine pathways and estimate the gap between technical capability and actual access.

### Translational frontier

Identify reproductive situations in which germline editing could supply a medically distinct or substantially less burdensome route — most clearly when no unaffected embryo can be selected, and more cautiously when selection remains possible but unusually burdensome.

### Future impact

Model how polygenic disease intervention changes as causal knowledge, embryo numbers, and multiplex-editing capacity increase.

Disease prevention, disease resistance, and enhancement are treated as **separate purposes** throughout: they may use similar molecular technologies, but their alternatives, expected benefits, and ethical questions differ, so each requires its own justification.

## What the study contains

1. **Disease burden and disease map** — population-level burden estimates alongside a structured catalogue of serious genetic conditions (331 in total: a 97-condition curated analytic core plus an Orphanet-derived rare-disease tier) linked to causal genes or loci, inheritance, incidence or prevalence, severity and onset, reproductive pathways, newborn screening, postnatal treatment and intent, and source provenance.
2. **Existing genetic medicine** — carrier screening + reproductive planning, IVF + PGT-M embryo selection, prenatal diagnosis + reproductive decision, newborn screening + early treatment, and postnatal therapies, with **affected-birth avoidance** and **burden mitigation** reported separately throughout. Prenatal diagnosis reduces affected births in the model only when followed by a reproductive decision not to continue an affected pregnancy; newborn screening prevents no births — it enables earlier treatment.
3. **Population model** — a bottom-up disease catalogue and a top-down population model built around an annual global birth cohort. For adult-onset and multifactorial disease this is an attribution framework: it does **not** mean every modeled case is clinically present at birth.
4. **Germline-editing frontier** — an explicit analysis of reproductive configurations in which no unaffected embryo can be selected (**editing-only prevention**), a selection-versus-correction analysis showing how reproductive burden changes as unaffected embryos become rare, exploratory complex-disease population scaling, and a disease-specific model of how the polygenic frontier changes with technical capacity.
5. **Ethical and policy analysis** — proportionality across severity, alternatives, incremental benefit, uncertainty, safety, intergenerational effects, and access, with prevention, resistance, and enhancement evaluated separately.

## Data sources

- **Population and disease burden:** GBD 2023, UN World Population Prospects 2024, WHO
- **Genetics and disease:** Orphanet, OMIM, gnomAD v4.1, disease-specific peer-reviewed literature
- **Access and geography:** World Bank income groups, UNAIDS, national screening and treatment programmes
- **Intervention evidence:** published carrier-screening, PGT, newborn-screening, treatment, genetic-architecture, and related clinical literature

Where direct empirical estimates are unavailable, the relevant quantity is represented explicitly as a modeling assumption, normative choice, or provisional parameter rather than being presented as observed data.

## Current results

Default analysis: main severity definition (`def_b`), broad multifactorial attribution, current coverage assumptions, prenatal diagnosis counted as reducing affected births when followed by pregnancy termination.

### Impact now

| Quantity | Estimate |
| --- | ---: |
| Annual global live births | 135.0M (95% UI 130.2–140.1M) |
| Serious monogenic disease | 1.405M (1.098–1.793M) |
| Serious multifactorial / partly genetic disease — broad attribution | 6.621M (5.393–8.126M) |
| Total under broad/default attribution | 8.042M (6.747–9.591M) |
| Monogenic affected births avoided — current modeled coverage | 35.8% |
| Monogenic affected births avoided — idealized full coverage | 99.7% |

The 35.8% → 99.7% comparison applies to **monogenic affected-birth avoidance under the specified reproductive model**. It is not a claim that 99.7% of all serious genetic disease is preventable.

### Translational frontier

| Quantity | Estimate |
| --- | ---: |
| Reproductive configurations in which no unaffected embryo can be selected | 11.3k/yr (4.9–26.1k) |

These cases define **editing-only prevention** in the model. They are a small population-level share but can carry a strong individual clinical justification because embryo selection cannot achieve the relevant preventive outcome. (Including congenital deafness — an ethically contested classification excluded by default — raises the estimate to ~24.9k/yr.)

#### Selection can become burdensome before it becomes impossible

PGT-M chooses among embryos; it does not alter them. If *u* is the expected fraction of embryos unaffected by a targeted genotype, the expected number of affected-genotype embryos not selected per unaffected embryo is **(1−u)/u**. The ratio is modest when unaffected embryos are common, rises rapidly as they become rare, and diverges when no unaffected embryo exists.

This does not establish that editing is preferable. Correction introduces its own risks and embryo attrition. The comparison is included because **reproductive burden is one dimension of impact**, and because it distinguishes ordinary PGT-M cases from cases in which selection is technically possible but unusually burdensome. See the research page's [Selection vs correction view](https://alethicresearch.github.io/genmed-impact/?tab=embryos) for the full analysis.

### Future polygenic frontier

In the disease-specific liability model, current-capacity assumptions produce little editing advantage across the modeled complex diseases. Under the hypothetical future high-capacity assumption set, a small number of more genetically concentrated diseases cross the prespecified modeled risk-reduction threshold, while highly polygenic traits remain much less tractable and pleiotropy remains an independent constraint.

| Exploratory population scaling | Estimate |
| --- | ---: |
| Current-evidence complex-disease scaling | ~1.3k/yr |
| Future-capacity exploratory scaling | ~127.2k/yr |

These population-scaled values are scenario assumptions applied to the multifactorial burden; they are **not direct sums of the disease-specific liability-threshold model**.

### Scenario synthesis

Combining editing-only prevention with the complex-disease scaling term gives an **editing-relevant residual** of ~14.2k/yr (0.18% of the modeled burden) under current-evidence scaling and ~139.6k/yr (1.74%) under future-capacity exploratory scaling. These combine different forms of medical value — an only-option reproductive configuration and a potential incremental advantage — and are reported for scale, not as the project's central conclusion. The complementary "not uniquely dependent on germline editing" shares describe these particular modeled scenarios; they are not a claim that the same proportion is preventable by present medicine, nor that editing's role is permanently confined to that share.

## Intellectual context

This project extends an earlier proportional pathway for human gene editing proposed by Savulescu and Singer, which distinguished catastrophic monogenic disease, severe monogenic disease, common disease, resistance, and enhancement as progressively different translational and ethical problems (Savulescu & Singer, *Bioethics* 2019, DOI [10.1111/bioe.12570](https://doi.org/10.1111/bioe.12570)).

It also engages more recent work on **heritable polygenic editing**, which argues that sufficiently accurate causal inference and multiplex editing could make substantial modification of common-disease risk technically relevant over coming decades (Visscher et al., *Nature* 2025, DOI [10.1038/s41586-024-08300-4](https://doi.org/10.1038/s41586-024-08300-4)).

The contribution here is to connect that forward-looking pathway to a quantitative map of **current disease burden, existing genetic medicine, access, and prospective editing impact**.

## Research page

The [interactive research page](https://alethicresearch.github.io/genmed-impact/) provides the main reader-facing presentation of the project:

- **Overview** — impact framework, three time horizons, and main findings
- **Disease burden** — how much disease is modeled and which diseases are represented
- **Existing medicine** — present intervention capability, outcomes, and access
- **Role of editing** — no-selectable-embryo cases, selection versus correction when unaffected embryos are rare, and the future polygenic frontier.
- **Ethics & policy** — proportionality, regulatory sequencing, resistance, enhancement, and exploratory costs
- **Methods & data** — model structure, uncertainty, sensitivity, evidence status, provenance, and reproducibility

## Reproducibility

The current committed analysis uses:

- **Model specification:** 3.0
- **Monte Carlo draws:** 20,000
- **Random seed:** 20260810

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
│   │   ├── multifactorial.py       # liability-threshold polygenic-frontier analysis
│   │   ├── embryos.py              # idealized embryo-selection comparison
│   │   ├── montecarlo.py           # uncertainty propagation
│   │   ├── sensitivity.py          # sensitivity analysis
│   │   ├── provenance.py           # epistemic-status annotation
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
- the broad multifactorial attribution is the uniquely correct definition of genetic disease;
- disease burden attributed to a birth cohort is necessarily present at birth;
- technical applicability implies real-world access, uptake, affordability, or equivalent outcomes;
- prenatal diagnosis itself prevents disease;
- newborn screening prevents affected births;
- current germline-editing technology is safe enough for clinical use;
- the future-capacity polygenic scenario is a forecast, or its figure a permanent upper limit;
- the quantitative model by itself determines an ethical or regulatory conclusion.

The exploratory cost-allocation analysis contains provisional inputs and is not currently treated as a paper-level result.

## Paper

The accompanying manuscript is in preparation:

**Reframing Genetic Medicine in Terms of Impact**

The paper and research page are being developed from the same analysis and terminology. A versioned archival release will be frozen for submission.

## License

- **Code:** Apache-2.0 — see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE)
- **Curated project data and generated results:** CC-BY-4.0 — see [`LICENSE-DATA.md`](LICENSE-DATA.md)
- **Third-party inputs:** remain under their respective licenses and are referenced rather than redistributed where required

## Citation

Machine-readable citation metadata is provided in [`CITATION.cff`](CITATION.cff). A tagged archival release is planned for manuscript submission.

```bibtex
@software{genmed_impact,
  title  = {Reframing Genetic Medicine in Terms of Impact},
  author = {Ghose, Sankalpa and Wallach, D. A. and Singer, Peter and Savulescu, Julian},
  year   = {2026},
  url    = {https://github.com/alethicresearch/genmed-impact},
  note   = {Code Apache-2.0; curated data CC-BY-4.0.}
}
```
