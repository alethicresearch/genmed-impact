# Review tracker

Everything across the analysis that needs a **human decision**, a **source**, or a **check**
before the work is frozen for submission. This is the single list — if something here is
unresolved, it is unresolved in the paper too.

Counts below are generated from the current pipeline output, so they move as the analysis
changes. Regenerate context with `make run`; the epistemic breakdown is visible in the app under
**Methods & data**.

**Status key:** ☐ open · ◐ in progress · ☑ resolved

---

## A. Decisions only the authors can make

These are normative or editorial calls. The model exposes each as a toggle or a stated stance
rather than resolving it, so nothing here is blocked on more data.

| # | Decision | Current default | Why it matters | Status |
|---|---|---|---|---|
| A1 | **Attribution stance** — how much multifactorial disease counts as genetically attributable | `inclusive` (broad) | Largest single swing on the denominator: 8.0M vs ~4.7M serious births/yr. Three stances are implemented and cited as `normative_choice`. | ☐ |
| A2 | **Severity threshold** — what counts as "serious" | `def_b` (main) | Moves the denominator and therefore every share derived from it. Narrow/main/broad all implemented. | ☐ |
| A3 | **Congenital deafness in or out of S1** | **Excluded** from headline | The single largest S1 contributor when included (~12.3k/yr vs ~10.5k headline). Contested as a disease target; toggle exists in the app. | ☐ |
| A4 | **Prenatal diagnosis counted as preventing an affected birth** | Counted (`pnd_counts: true`) | Ethically loaded: the modelled prevention only occurs via a decision to end an affected pregnancy. Toggle exists and is labelled explicitly. | ☐ |
| A5 | **Strict vs permissive editing residual as the headline** | Both shown | Strict ≈0.2% vs permissive ≈1.7% of serious disease. Presenting both is currently deliberate; the paper must still say which it leads with. | ☐ |
| A6 | **Does gate 2 flow through to the headline S1 figure?** | No — shown as a breakdown | Would qualify "≈10.5k/yr where selection fails" to "of which ~7.7k have any correction route". More defensible, but changes a figure the manuscript already uses. | ☐ |
| A7 | **Author list, affiliations, ORCIDs** | Placeholder | `CITATION.cff`, `.zenodo.json`, README and app BibTeX all carry "Authors to be listed at manuscript submission". | ☐ |
| A8 | **Ethics / IRB review for the elicitation** | Not obtained | Role-tagged allocations from professional groups, potentially reported in aggregate. Plausibly human-subjects research. Consent notice is written; institutional review is not. | ☐ |
| A9 | **Retire GitHub Pages or keep as mirror** | Both live | `deploy-pages.yml` still deploys; Netlify config added. Two deployments currently coexist. | ☐ |

---

## B. Curation to verify

Assignments made by us that a domain expert should confirm. None is a data-availability problem;
all are judgement calls already written down and reviewable.

| # | Item | Scale | Status |
|---|---|---|---|
| B1 | **Treatment intent (curative / disease-modifying / palliative)** — currently **0 of 97** core diseases have a curated intent; all are defaulted from treatment modality | 97 diseases | ☐ |
| B2 | **Variant-class assignments** for the editing gate ladder — 3 of 8 are **medium confidence**: beta-thalassaemia, Tay-Sachs, GJB2 deafness | 8 conditions | ☐ |
| B3 | **Beta-thalassaemia is load-bearing** — it is currently the *entire* base-editable bucket in gate 2, on a medium-confidence, allelically heterogeneous call | 1 condition | ☐ |
| B4 | **Rare-tier intervention rules** — 234 Orphanet conditions get interventions by rule (CS for recessive/X-linked; PGT+PND for any monogenic with a gene; NBS never credited), not per-disease curation | 234 diseases | ☐ |
| B5 | **Severity and onset fields** across the core catalogue have not been independently reviewed | 97 diseases | ☐ |
| B6 | **Perspective weight vectors** — five positions are grounded in named ethical traditions with citations, but the numeric weights are our operationalisation, not published values | 5 profiles | ☐ |
| B7 | **Research success probabilities** in the translational and future funding markets are stipulated assumptions, not forecasts | 8 programmes | ☐ |

---

## C. Data to source

Parameters currently standing on reasoning rather than a citation. Full detail and the exact
queries are in [`DATA_NEEDED.md`](DATA_NEEDED.md); this is the summary.

**Current epistemic mix across the parameter set:** 20 cited · 41 modelling assumption ·
6 derived · 3 normative choice · **1 provisional**.

| # | Item | Where | Status |
|---|---|---|---|
| C1 | **Editing-programme cost basis** — the only parameter flagged `provisional` | `costs/editing_program_per_birth_prevented` | ☐ |
| C2 | **Coverage parameters** — current / achievable-2035 / ideal for all four tools are reasoned, not measured | `coverage/*` (12 params) | ☐ |
| C3 | **Unit costs** — carrier screening, IVF+PGT, prenatal screen, newborn screen | `costs/*` (4 params) | ☐ |
| C4 | **Regional access multipliers and consanguinity F** by income group | `regions/income_groups/*` | ☐ |
| C5 | **Editing efficiency by platform** (base, prime) — needed to close gate 3 | not present; absent by design | ☐ |
| C6 | **Embryo-specific outcomes** — mosaicism, on-target deletions, chromosome loss | not present; absent by design | ☐ |
| C7 | **Off-target burden by platform** — needed to close gate 4 | not present; absent by design | ☐ |
| C8 | **Per-condition allele spectra** — would turn each dominant variant class into a weighted split | not present | ☐ |
| C9 | **S2 fraction** — the complex-disease editing advantage rests on one scalar | `s2/fraction_of_multifactorial` | ☐ |
| C10 | **Incidence for 64 of 97 core diseases** still on textbook estimate (52) or order-of-magnitude (12); 43% of catalogue burden rests on cited incidence | `library/diseases.yaml` | ☐ |

---

## D. Known limitations to state in the paper

Not defects — properties of the analysis that the write-up should acknowledge explicitly.

| # | Limitation | Status |
|---|---|---|
| D1 | The bottom-up catalogue is a **lower bound**; it under-covers the rare monogenic tail and climbs toward the top-down total as it grows | ☐ |
| D2 | Funding-market opportunities **overlap** — the same affected birth can be avoided by more than one programme, so impacts are never summed | ☐ |
| D3 | The **forward outcome ledger is empty**; retrospective validation rests on only two long-running programmes | ☐ |
| D4 | Gates 3 and 4 of the editing ladder are **open by construction**; the analysis says which molecular change is needed, not how often it would succeed | ☐ |
| D5 | Commensurating three funding markets onto one 0–100 scale is itself a **normative act** | ☐ |
| D6 | The population model is an **attribution framework** for adult-onset and multifactorial disease — it does not claim every modelled case is clinically present at birth | ☐ |
| D7 | Published programme reductions used for validation reflect decades of sustained delivery in high-prevalence populations, so they are an **optimistic comparator** for a new programme | ☐ |

---

## How to use this

1. Work top-down: **A** blocks the paper's claims, **B** blocks their credibility, **C** tightens
   them, **D** is write-up discipline.
2. When an item resolves, mark it ☑ and record where the decision is documented —
   `ANALYSIS_LOG.md` for analytic calls, the manuscript for editorial ones.
3. Re-run `make run && make test` after any change to A or B; several items move headline
   figures, and the test suite guards the invariants that must survive.
