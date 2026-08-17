# Reframing Genetic Medicine in Terms of Impact

[Research page](https://alethicresearch.github.io/genmed-impact/) · [Paper — in preparation](#paper) · [Results & data](results/) · [Open questions](REVIEW_TRACKER.md) · [Citation](#citation)

> **Work in progress.** The analysis and accompanying manuscript are under development. Numerical results, disease classifications, and figures may change before the analysis is frozen for submission.
>
> Every item still awaiting an author decision, a source, or an expert check is tracked in **[`REVIEW_TRACKER.md`](REVIEW_TRACKER.md)**.

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

   Every condition is classified on **two independent axes** rather than a single preventable/treatable label:

   - **Prevention** — `preventable` / `detectable_only` / `not_preventable`, always recorded together with *by which tool* (carrier screening, PGT-M, prenatal diagnosis, newborn screening).
   - **Treatment intent** — `curative` / `disease_modifying` / `palliative` / `none`, because the difference between cure, disease management, and palliation is a difference in kind.

   A condition therefore never carries a status like "no genetic-medicine option". It is either **addressable by existing tools** or part of the **editing-relevant residual** — a distinction between the established genetic-medicine stack and germline editing that the single-axis framing collapses.
3. **Population model** — a bottom-up disease catalogue and a top-down population model built around an annual global birth cohort. For adult-onset and multifactorial disease this is an attribution framework: it does **not** mean every modeled case is clinically present at birth.
4. **Germline-editing frontier** — an explicit analysis of reproductive configurations in which no unaffected embryo can be selected (**editing-only prevention**), a selection-versus-correction analysis showing how reproductive burden changes as unaffected embryos become rare, exploratory complex-disease population scaling, and a disease-specific model of how the polygenic frontier changes with technical capacity.
5. **Which editing technology** — the editing platforms are not interchangeable, so the analysis separates them. Gene *addition* (AAV/lentiviral delivery of a working copy, as in Zolgensma or Lenmeldy) does not edit the genome at all; nucleases, base editors and prime editors do, and each can make only certain molecular changes. Conditions are assigned a dominant **variant class** (transition SNV, transversion SNV, small indel, large deletion, repeat expansion, chromosomal structural), and a capability matrix maps classes to platforms. A **four-gate ladder** then separates what is quantified from what is not: (1) selection fails → (2) a correction route exists → (3) it works in an embryo → (4) it is safe enough. Only gates 1 and 2 are quantified; gates 3 and 4 are left open by construction, because the published evidence does not support an efficiency or off-target number here.
6. **Ethical and policy analysis** — proportionality across severity, alternatives, incremental benefit, uncertainty, safety, intergenerational effects, and access, with prevention, resistance, and enhancement evaluated separately.
7. **Impact funding** — a costed opportunity market that turns the analysis into fundable options across the three horizons, using an explicit accounting identity (expected impact = affected population × gap × coverage change × effectiveness × attribution). Opportunities are scored under **five declared normative positions** across six value dimensions, so disagreement between positions is reported as a result rather than averaged away. A **predicted-versus-realized** view holds modelled effectiveness against cited long-running programme outcomes and defines a forward outcome ledger.

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
| Serious monogenic disease | 1.403M (1.091–1.797M) |
| Serious multifactorial / partly genetic disease — broad attribution | 6.612M (5.404–8.153M) |
| Total under broad/default attribution | 8.028M (6.757–9.599M) |
| Monogenic affected births avoided — current modeled coverage | 35.8% |
| Monogenic affected births avoided — idealized full coverage | 99.7% |

The 35.8% → 99.7% comparison applies to **monogenic affected-birth avoidance under the specified reproductive model**. It is not a claim that 99.7% of all serious genetic disease is preventable.

### Translational frontier

| Quantity | Estimate |
| --- | ---: |
| Reproductive configurations in which no unaffected embryo can be selected | 11.4k/yr (4.8–26.0k) |

These cases define **editing-only prevention** in the model. They are a small population-level share but can carry a strong individual clinical justification because embryo selection cannot achieve the relevant preventive outcome. (Including congenital deafness — an ethically contested classification excluded by default — raises the estimate to ~23.7k/yr.)

#### Failing selection is not the same as having a correction route

Applying the variant-class capability matrix to the curated conditions that make up this residual (~10.2k/yr of it) gives:

| Gate 2 — is there any molecular route to correct the variant? | Births/yr | Share |
| --- | ---: | ---: |
| A mature platform could make the change (base editing) | ~1.2k | 11% |
| Only prime editing could make the change | ~6.3k | 62% |
| No current platform can restore the sequence | ~2.7k | 27% |

Two consequences are worth stating plainly. **Sickle cell disease** — the single largest contributor and the canonical "point mutation" — is a *transversion*, which standard base editors cannot perform; it needs prime editing. **Balanced translocations** have no sequence to correct at all. The whole base-editable bucket currently rests on beta-thalassaemia, on a medium-confidence, allelically heterogeneous assignment ([`REVIEW_TRACKER.md`](REVIEW_TRACKER.md) B3).

Gates 3 (does it work in an embryo?) and 4 (is it safe enough?) are **not quantified**. The analysis states which molecular change would be required, not how often making it would succeed.

#### Selection can become burdensome before it becomes impossible

PGT-M chooses among embryos; it does not alter them. If *u* is the expected fraction of embryos unaffected by a targeted genotype, the expected number of affected-genotype embryos not selected per unaffected embryo is **(1−u)/u**. The ratio is modest when unaffected embryos are common, rises rapidly as they become rare, and diverges when no unaffected embryo exists.

This does not establish that editing is preferable. Correction introduces its own risks and embryo attrition. The comparison is included because **reproductive burden is one dimension of impact**, and because it distinguishes ordinary PGT-M cases from cases in which selection is technically possible but unusually burdensome. See the research page's [Selection vs correction view](https://alethicresearch.github.io/genmed-impact/?tab=embryos) for the full analysis.

### Future polygenic frontier

In the disease-specific liability model, current-capacity assumptions produce little editing advantage across the modeled complex diseases. Under the hypothetical future high-capacity assumption set, a small number of more genetically concentrated diseases cross the prespecified modeled risk-reduction threshold, while highly polygenic traits remain much less tractable and pleiotropy remains an independent constraint.

| Exploratory population scaling | Estimate |
| --- | ---: |
| Current-evidence complex-disease scaling | ~1.3k/yr |
| Future-capacity exploratory scaling | ~126.3k/yr |

These population-scaled values are scenario assumptions applied to the multifactorial burden; they are **not direct sums of the disease-specific liability-threshold model**.

### Scenario synthesis

Combining editing-only prevention with the complex-disease scaling term gives an **editing-relevant residual** of ~14.3k/yr (0.18% of the modeled burden) under current-evidence scaling and ~138.9k/yr (1.73%) under future-capacity exploratory scaling. These combine different forms of medical value — an only-option reproductive configuration and a potential incremental advantage — and are reported for scale, not as the project's central conclusion. The complementary "not uniquely dependent on germline editing" shares describe these particular modeled scenarios; they are not a claim that the same proportion is preventable by present medicine, nor that editing's role is permanently confined to that share.

### Impact funding

Opportunities are costed in three markets — **impact now** (deploying existing tools), **translational** (research that would change what is possible), and **future** (long-horizon capability). Two accounting rules matter for reading them:

- **Population-wide screening is shared infrastructure.** A national carrier-screening programme is aggregated once per (region, tool) rather than billed in full to each condition it happens to cover; otherwise unrelated diseases return identical, meaningless asks.
- **Impacts are never summed.** The same affected birth can be avoided by more than one programme, so market totals deliberately omit a summed impact and carry an explicit non-additivity flag.

Rankings are reported per normative position rather than pooled, together with the opportunities on which the positions **most disagree** and those they **most agree** on. The forward outcome ledger is empty by design — no simulated project results are included.

## Intellectual context

This project extends an earlier proportional pathway for human gene editing proposed by Savulescu and Singer, which distinguished catastrophic monogenic disease, severe monogenic disease, common disease, resistance, and enhancement as progressively different translational and ethical problems (Savulescu & Singer, *Bioethics* 2019, DOI [10.1111/bioe.12570](https://doi.org/10.1111/bioe.12570)).

It also engages more recent work on **heritable polygenic editing**, which argues that sufficiently accurate causal inference and multiplex editing could make substantial modification of common-disease risk technically relevant over coming decades (Visscher et al., *Nature* 2025, DOI [10.1038/s41586-024-08300-4](https://doi.org/10.1038/s41586-024-08300-4)).

The contribution here is to connect that forward-looking pathway to a quantitative map of **current disease burden, existing genetic medicine, access, and prospective editing impact**.

## Research page

The [interactive research page](https://alethicresearch.github.io/genmed-impact/) provides the main reader-facing presentation of the project:

- **Overview** — impact framework, three time horizons, and main findings
- **Disease burden** — *Burden estimate* (how much disease is modeled) and *Disease catalogue* (which conditions, on both classification axes, across the core and rare tiers)
- **Existing medicine** — *Impact now*: present intervention capability, outcomes, and access
- **Role of editing** — *When selection is not enough*, *Selection vs correction*, *Which technology?* (variant classes, platforms, and the four-gate ladder), and *Polygenic frontier*
- **Ethics & policy** — *Policy implications*, *Resistance & enhancement* (explored separately from disease prevention), and *Exploratory costs*
- **Impact funding** — *Opportunities* (the costed impact market), *Whose values?* (scoring under five declared normative positions, with adjustable weights and an optional elicitation response), and *Predicted vs realized* (modelled effectiveness against cited programme outcomes)
- **Methods & data** — model structure, uncertainty, sensitivity, evidence status, provenance, and reproducibility

Navigation is two-layer — section, then view — and the reading state is serialized into the URL, so any view can be linked directly from the manuscript.

## Reproducibility

The current committed analysis uses:

- **Model specification:** 3.0
- **Monte Carlo draws:** 10,000 (the pipeline default; `make verify` re-runs the same seed at 20,000 as a stability check)
- **Random seed:** 20260810

All downstream quantities are computed on the *same* draw set, and ratios are formed per draw, so credible intervals on shares are correct rather than reconstructed from marginal medians.

The pipeline also re-runs itself in **point mode** — every sampler collapsed to its curated central value — and exports the comparison to `app/public/data/uncertainty.json`. This is a diagnostic, never a reported result. It shows where a straight calculation would agree with the analysis and where it would not:

| Quantity | Sampled median | Central values multiplied through | Difference |
| --- | ---: | ---: | ---: |
| Annual global live births | 135,030,856 | 135,000,000 | 0% |
| No unaffected embryo selectable (S1) | 11,426 | 11,403 | −0.2% |
| **Complex-disease advantage — strict (S2)** | **1,305** | **3,308** | **+153%** |
| Editing-relevant share of serious disease | 0.18% | 0.18% | +2.8% |

The top line is insensitive to the choice; S2 strict is not, because its distribution spans 1–17,854 and the median of a product is not the product of the medians. Uncertainty width also concentrates in the rarest conditions — the S1 interval spans ~6× for congenital deafness (12,320/yr) against ~11,000× for spinal muscular atrophy (2.6/yr). Aggregate conclusions are therefore robust while individual rare-disease rows should be read as orders of magnitude.

On the research page, an **Add uncertainty** checkbox controls whether intervals are displayed. It is presentational only — the same median is shown either way, so there is never a second set of numbers on the page.

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

### Deployment

The research page is a fully static build with no backend. [`netlify.toml`](netlify.toml) is the current deployment configuration (base `app`, `npm ci && npm run build`, publish `dist`); a GitHub Pages workflow is also still live. Which of the two becomes canonical is an open decision ([`REVIEW_TRACKER.md`](REVIEW_TRACKER.md) A9).

The optional elicitation response on *Whose values?* is collected through Netlify Forms — a build-time-detected HTML form and a URL-encoded POST, so it adds no runtime dependency and no third-party script. Responses are opt-in and preceded by a consent notice; institutional review has not been obtained (A8).

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
│   │   ├── editing_tech.py         # variant classes, platform capability, four-gate ladder
│   │   ├── multifactorial.py       # liability-threshold polygenic-frontier analysis
│   │   ├── embryos.py              # idealized embryo-selection comparison
│   │   ├── opportunities.py        # costed impact market across the three horizons
│   │   ├── perspectives.py         # value dimensions × declared normative positions
│   │   ├── retroactive.py          # predicted-vs-realized validation and outcome ledger
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
├── ANALYSIS_LOG.md                  # analysis decisions and revision history
├── REVIEW_TRACKER.md                # open decisions, curation checks, data to source
├── DATA_NEEDED.md                   # parameter-level sourcing requests
├── CITATION.cff
├── LICENSE
├── LICENSE-DATA.md
├── netlify.toml                     # research-page deployment
└── Makefile
```

## Key outputs

- [`results/paper_numbers.json`](results/paper_numbers.json) — paper-facing quantitative estimates and 95% model uncertainty intervals
- [`results/tables.md`](results/tables.md) — generated analysis tables
- [`results/methods.md`](results/methods.md) — generated methods, assumptions, formulas, and provenance
- [`app/public/data/`](app/public/data/) — JSON used by the research page
- [`ANALYSIS_LOG.md`](ANALYSIS_LOG.md) — analysis decisions and revision history
- [`REVIEW_TRACKER.md`](REVIEW_TRACKER.md) — every open author decision, curation check, and unsourced parameter
- [`DATA_NEEDED.md`](DATA_NEEDED.md) — the specific sources and queries that would close those gaps

## Evidentiary status and provenance

Quantitative inputs are classified by evidentiary status:

- **Cited data** — taken from an identified empirical source
- **Derived** — calculated from other model inputs
- **Modeling assumption** — an explicit assumption used where direct measurement is unavailable or insufficient
- **Normative choice** — a value-sensitive classification or modeling decision
- **Provisional** — an input awaiting stronger empirical support

Source records can include the central value, uncertainty range, source, DOI, table/page, retrieval date, and evidentiary status. The Methods & data view exposes these records directly.

The current parameter set is **20 cited · 41 modeling assumption · 6 derived · 3 normative choice · 1 provisional**. That mix is a finding about the state of the evidence, not a defect to be hidden: the quantities that are hardest to source — editing efficiency in embryos, mosaicism, off-target burden — are precisely the ones that would close gates 3 and 4. They are **absent by design** rather than filled with plausible numbers, and the test suite enforces this (`test_no_efficiency_or_safety_numbers_are_asserted`).

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
- the quantitative model by itself determines an ethical or regulatory conclusion;
- a molecular correction route implies that editing would work, or would be safe;
- the funding-market impact estimates can be added together;
- the five normative positions are survey results — they are stipulated, cited positions, not measured opinion.

The exploratory cost-allocation analysis contains provisional inputs and is not currently treated as a paper-level result. The full list of limitations the write-up must state is section D of [`REVIEW_TRACKER.md`](REVIEW_TRACKER.md).

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
  author = {{Authors to be listed at manuscript submission}},
  year   = {2026},
  url    = {https://github.com/alethicresearch/genmed-impact},
  note   = {Code Apache-2.0; curated data CC-BY-4.0.}
}
```
