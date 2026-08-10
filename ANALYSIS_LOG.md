# ANALYSIS_LOG.md

Dated record of every contestable judgment call, its default, and the rationale. Each is
implemented as an explicit parameter (in `constants.yaml` / `conditions.yaml`) and reported
across its defensible range (see the app's Denominator and Sensitivity views).

---

## 2026-08-10 — Initial parameterization (spec v3.0)

### Denominator: annual global births
- **Default 135M** (interval 130–140M). WPP 2024 places world annual births near 134M and
  declining; the draft paper rounds to ~140M. Modelled as an interval so the choice does not
  silently move headline counts. `ingest/un_wpp.py` will replace this with a summed per-country
  pull when the WPP CSV is available.

### Severity threshold (§3.4.1) — 3 operationalizations
- **def_a** GBD congenital-birth-defects tree + curated severe-monogenic list (narrow): monogenic
  ~8/1000.
- **def_b (default)** "lethal or lifelong serious disability absent treatment": monogenic
  ~10.4/1000 → ~1.4M/yr at 135M births, matching the draft paper.
- **def_c** DALYs-per-case above threshold (broad): ~12/1000.
- Rationale: def_b is the operationalization the draft paper implicitly uses; def_a/def_c bound it.

### Attribution stance for multifactorial disease (§3.2) — dominates the denominator
- **inclusive (default)** g=1.0 → 6.6M multifactorial, matching the paper.
- **heritability_weighted** g≈0.5 → ~3.3M.
- **exclusive** g≈0.1 → ~0.64M (only high-penetrance familial subsets).
- Rationale: counting all multifactorial cases 1:1 as "genetic disease" is the most generous
  stance and is what produces the paper's 6.6M. Because total serious disease ranges 1.7M–8.3M
  across stances, this choice is foregrounded in every output, not buried (spec §3.2).

### S1 — "no selectable unaffected embryo" (§3.3, RQ3)
- **Included configurations:** recessive aa×aa couples; viable-homozygote dominant AA parent
  (Huntington); balanced-translocation carriers with no viable euploid embryo.
- **Excluded (documented):** standard both-heterozygous-dominant couples have ¼ unaffected
  embryos and are selection-addressable — excluded per spec.
- **locus_concordance (new parameter):** two affected partners produce all-affected embryos only
  if homozygous at the *same* locus. Congenital deafness is genetically heterogeneous (GJB2
  explains ~half of non-syndromic cases), so its assortative-mating contribution is scaled by
  locus_concordance≈0.45. Without this the deafness term roughly doubles.
- **Result vs the paper:** the first-principles S1 derivation gives a **median ≈ 25,000/yr
  (95% CrI ≈ 13,000–46,000)**, driven mainly by congenital deafness (assortative mating, full
  survival) and sickle cell disease (affected individuals reproduce). The draft paper's point
  estimate of **14,000 sits at the low end of this CrI**. The gap is a genuine, defensible
  finding: it is sensitive to (a) whether congenital deafness — which many in the Deaf community
  do not regard as a disease to prevent — is counted, and (b) survival-to-reproduction of
  affected individuals. Excluding deafness or taking lower survival brings S1 toward 14,000.
  We report the derived range rather than forcing the paper's number (spec §0).
- **Contested-condition toggle (added 2026-08-10, second pass):** congenital deafness is flagged
  `contested: true` and exposed as an explicit in/out toggle. **S1 incl. deafness ≈ 24,900
  (CrI 13k–46k); excl. deafness ≈ 11,400 (CrI 4.8k–26k)** — the paper's 14,000 sits *between*
  the two variants. The uniquely-editable share of serious disease barely moves (1.91% → 1.74%),
  so the headline is robust; only the S1 magnitude is sensitive. Surfaced as a tornado row and an
  app toggle.
- **Per-region S1 (added, second pass):** computed by World Bank income group as region births ×
  region-specific consanguinity F. Lower-middle-income settings dominate (~14,700 incl. deafness)
  via higher F and birth share; high-income ~1,800. Allele frequencies are still global pending an
  ancestry-weighted gnomAD pull, so the regional split reflects consanguinity + births, not yet
  ancestry-varying allele exposure. Regional sum need not equal the global-F headline.

### Penetrance floor for "fully penetrant" in S1 (§3.4.3)
- Encoded per condition (`penetrance` intervals), not a single global floor. Central values
  ≥0.95 for the curated set. A ≥0.99 floor can be applied by tightening the intervals.

### S2 — "editing-superior for complex disease" (§3.4.4)
- Parameterized as a fraction of multifactorial burden: **strict ≈ 0.0005** (near-zero — the
  honest answer that essentially no complex disease uniquely needs germline editing after netting
  out somatic/pharma/public-health alternatives) and **permissive ≈ 0.02** (≈132k, matching the
  paper). Rendered side by side; strict ≈ 0 is shown as an honest empty set, not hidden.

### Tool ordering & PND counting (§3.4.5)
- Order **CS→PGT→PND→NBS** (causal order); exposed as a parameter.
- **PND counts as prevention by default**, but is termination-dependent; every waterfall is
  computed with PND on **and** off, and the app exposes the toggle transparently.
- **NBS mitigates burden, not births:** tracked in `averted_burden` only, never `averted_birth`,
  and scaled by a treatable_fraction (≈0.25 of serious monogenic conditions have an effective
  early-life therapy).

### Coverage scenarios
- current / achievable_2035 / ideal, refined per income group by an access multiplier (<1 for
  LMICs), reflecting that ~94% of birth-defect births occur in LMICs (March of Dimes 2006).

### Costs & allocation (RQ5)
- `editing_program_per_birth_prevented` and `daly_per_severe_monogenic_case` are explicit
  PLACEHOLDER free parameters with wide intervals pending the GBD pull; flagged in `constants.yaml`.

### Uncertainty
- Monte-Carlo n=10,000 default (20,000 used for the committed export). Beta for proportions,
  lognormal for rates/costs. All ratios/shares computed per-draw so credible intervals are
  correct. Deterministic tornado over the judgment calls above (Sensitivity view).

### Multifactorial spectrum & intervention viability (added, later pass)
- Multifactorial disease is modelled as its own object along a **polygenicity spectrum**
  (oligogenic → intermediate → highly_polygenic → massively_polygenic), because the paper's Step 3
  turns on *where* a disease sits: intervention viability is not binary but a modeled quantity.
- **Liability-threshold model** (`multifactorial.py`): liability ~ N(0,1), affected if
  liability > T = Φ⁻¹(1−K). An intervention lowering expected liability by δ SDs changes risk from
  K to 1−Φ(T+δ); relative risk reduction (RRR) is read off that.
  - **Embryo selection (PGT-P):** δ = √(prs_r2 · sib_frac) · E|min of N|, where within-sibship PRS
    variance ≈ 0.5× population (additive polygenic) and E|min of N| is the Blom order-statistic.
    Selection power rises with the number of embryos N.
  - **Oligo-locus editing:** δ = √(editable_h2), where editable_h2 saturates in the number of edits
    (editable_h2 ≈ oligo_editable_h2 · (1 − e^(−n_edits/τ))). ~0 for massively polygenic traits.
- **Technology scenarios** move the frontier: present (N≈5 embryos, 1 edit) vs near-future
  (N≈200 via IVM/IVG, ~10 multiplex edits). Result: **editing viable for 0 diseases today, ~3
  near-future** (CAD, breast cancer, IBD — architecture-concentrated); massively polygenic traits
  (schizophrenia, MDD) never reach editing-viable; **pleiotropy_caution** overrides an otherwise-
  concentrated verdict (APOE/Alzheimer's, HLA/T1D) → "not_recommended_pleiotropy".
- **Honest caveats (surfaced in-app):** (a) selection RRR can look large for rare, highly-heritable
  traits — a property of the liability threshold, not an achievable population program; (b) genetic
  tractability ≠ clinical viability (safety, pleiotropy, effect realism are separate gates).
  Architecture values (h², K, PRS R², oligo-editable h²) are literature anchors with basis flags,
  to be refined by a systematic PGS-Catalog pull.

### Genetic-medicine index → categorical status (revised)
- First implemented a 0–100 weighted **Genetic Medicine Index** (weights over CS/PGT/PND/NBS).
  **Retired** after review: a weighted composite is opaque (readers must accept the weights),
  implies false precision, and does not map to the decision that matters. A "1 − Π(1−eff)"
  composition was also tried and rejected (it saturated at 100 for nearly all monogenic disease).
- **Final design:** each disease maps to one weight-free **status** derived directly from its
  intervention flags — *Preventable & treatable* / *Preventable* (unaffected child achievable via
  screening or selection) / *Treatable* (effective early therapy) / *Detectable only* (prenatal
  detection without selection) / *No current option*. The **distribution across statuses** — by
  disease count and by affected births — is the headline (≈96% of catalogue births sit in an
  addressable status). Fully derived from applicability, so any ingested disease is classified
  automatically; the classification scales with the library.
- Deliberate correction: the **editing-unique residual is not a disease status** — it is a sliver of
  couples *within* diseases (no selectable embryo), so it stays as the separate S1/S2 analysis, not
  a category in the per-disease index. Collapsing the two was part of what made the score muddled.
- Status measures *addressability*, independent of severity (kept as a separate axis).

### Resolved decisions & sourcing (2026-08-10, later pass)
- **Headline denominator (RQ1):** attribution = **inclusive** (8.0M), severity = **def_b** — retained
  as defaults. Rationale: being generous to the multifactorial count makes the "≈98% addressable by
  existing tools" conclusion *more* robust, and matches the draft's 8–9M. Other stances reported.
- **PND counts as prevention:** **yes** (default), with the with/without toggle retained.
- **Congenital deafness in S1:** **excluded** by default (headline S1 ≈ 11.3k, CrI 4.9–26k). A
  contested condition (not catastrophic; many do not regard it as a disease to prevent) and the
  single largest S1 swing; excluding it is the conservative, defensible choice. Toggle retained;
  including it ≈doubles S1 but moves the editable share only ~1.74% → ~1.91%.
- **Labels (app):** the two "addressable" figures renamed to distinguish the bottom-up catalogue
  **addressable-status** share (≈96%) from the top-down **not-editing-dependent** share (≈98%);
  "No current option" → **"No genetic-medicine option"** (accurate for e.g. surgically-treated
  pyloric stenosis).
- **Cost/consanguinity sourcing:** gene-therapy prices cited to Zolgensma/Casgevy/Hemgenix/Lenmeldy
  2024 list prices (range $2.1–4.25M); PMTCT cost/infection-averted added ($150–300 simple regimen
  to $4–23k Option B+); consanguinity F cited to Bittles & Black 2010 / consang.net (≈10% global;
  20–50% MENA/South Asia). Multifactorial architecture values kept as literature anchors
  (Khera 2018 CAD PRS; PGC3 schizophrenia; Mavaddat 2019 breast-cancer PRS) pending a systematic
  PGS-Catalog pull.

### GBD 2023 integration (real pull received)
- The GBD 2023 Results export (Global, 2023; Incidence/Prevalence/Deaths/DALYs) is parsed by
  `ingest/gbd.py` → `data/curated/gbd_2023.parquet`. Values folded in (all now `basis: cited`, GBD):
  sickle cell disorders 432/100k, congenital heart anomalies 988/100k (birth prevalence ~1/100),
  neural tube defects 97/100k, orofacial clefts 145/100k, **Down syndrome 48/100k** (GBD <1yr
  incidence — reflects live births *after* prenatal screening; natural rate ~1/700, so this is a
  deliberate, honest correction downward). `daly_per_severe_monogenic_case` re-anchored to GBD
  (congenital DALYs 54.8M / 7.07M incident cases ≈ 7.7/case; severe subset higher → central 20);
  placeholder flag removed. Top-down `multifactorial_serious_per_1000` kept at 49 (GBD congenital
  birth prevalence ~42, incidence ~57 bracket it) to preserve the calibrated headline.
- Effect: bottom-up catalogue total 6.07M → **6.49M/yr**; cited-incidence share ~14% → **39%**.
  Top-down headline unchanged (8.0M serious, 98.3% not editing-dependent) — GBD improved the
  library and provenance without destabilizing the calibrated denominator. GBD does not enumerate
  individual monogenic diseases (CF/SMA/DMD/…); those remain Orphanet/curation-sourced.

### Known deviations from the draft paper (surfaced, not hidden)
1. S1 median ≈25k vs paper's 14k (see above).
2. Births default 135M vs paper's 140M (interval covers both).
3. Otherwise headline figures reproduce: serious ≈8.0M, monogenic ≈1.4M, multifactorial ≈6.6M,
   uniquely editable ≈153k (permissive), addressable ≈98.1%.

### Precision / scientific-language pass (2026-08-10, reviewer round 2)
No headline numbers changed. The pass corrected places where site language claimed more than
the model establishes, and moved semantics into the pipeline where the frontend had been
inferring them:
- **Editing-only vs editing-advantage separated.** S1 is now publicly "editing-only
  prevention: no unaffected embryo can be selected" — the only construct allowed to be called
  an "only option." S2 is "potential editing advantage in complex disease" (strict =
  current-evidence case, permissive = optimistic scenario, explicitly not a forecast). The sum
  is the "editing-relevant residual," always shown with its two components; it is never called
  "editing-only" or "uniquely editable" in user-facing copy. Internal names (S1/S2,
  strict/permissive, `uniquely_editable_*` JSON keys) are unchanged — this is a semantic
  relabeling, not an output redefinition.
- **Prevention full-coverage remainder ≠ editing's domain.** The waterfall's dashed line is
  now "remaining after full modeled coverage"; whether editing can address any of it is
  explicitly deferred to the residual analysis.
- **Denominator toggle honesty.** The page now states that burden totals respond to the
  severity/attribution toggles while editing-residual figures are computed once at default
  assumptions ("watch every number move" removed). Attribution options relabeled Broad /
  Heritability-weighted / Narrow genetic attribution (the `exclusive` stance is a ~10%
  familial subset, not zero).
- **Terminology.** Public-facing "95% CrI"/"credible interval" → "95% uncertainty interval,"
  with Methods stating the intervals are propagated input uncertainty, not Bayesian
  posteriors (JSON key `ci95` unchanged). "Viable" → "meets model threshold" (earlier pass).
- **Deafness default.** The contested congenital-deafness toggle now defaults to EXCLUDED,
  matching the paper headline, and is labeled a normative classification decision.
- **Epistemic status is pipeline data.** Every provenance leaf now carries
  `epistemic_status ∈ {cited, derived, modeling_assumption, normative_choice, provisional}`,
  assigned in `core/denominator/provenance.py` (explicit YAML override wins); the app reads
  the field instead of inferring badges. `core/tests/test_provenance.py` enforces completeness
  and adds a copy-semantics regression net over the app source (no "95% CrI", no "editing's
  domain", no "editing-only total", deafness default, no hard-coded draw count).
- **Hedged causal claims.** Spectacle/regulation language now says visible failures "can
  strengthen pressure for" prohibition and "risk diverting attention," under
  Interpretation/Policy labels; the regulatory sequence states it ranks justification and does
  not override independent safety gates (accuracy, mosaicism, off-target effects,
  developmental safety, consent, intergenerational follow-up).
- **Embryo trade-off.** Per-child (1−u)/u analysis is primary; the aggregate annual count is
  demoted to "illustrative population scaling — not an estimate of actual annual embryo
  disposition" (no IVF uptake, cycles, attrition, cryopreservation, or disposition modeled);
  editing's zero is "0 disease-genotype exclusions by construction," not an empirical count.
- **Beyond page.** Resistance: alternatives exist, but no claim that they beat an edit on
  reach/cost/risk without analysis; enhancement benefits may be absolute or positional; "no
  denominator" corrected to "the inherited-disease denominator does not transfer directly."

## 2026-08-11 — Impact-framing synchronization

The paper was retitled **"Reframing Genetic Medicine in Terms of Impact"** (no subtitle) and
reorganized around three time horizons — impact now, the translational frontier, and future
impact. This pass synchronizes the repository (research page, README, metadata, generated
methods, tests) with that framing. **No quantitative model logic or numerical outputs
changed**; internal identifiers (S1/S2, strict/permissive, `uniquely_editable_*`) are
unchanged for compatibility.

- **Combined residual demoted, not deleted.** The combined S1 + S2 quantities (~14k / ~0.18%
  and ~140k / ~1.7%) are retained as *scale summaries* in a collapsed "For scale" section of
  the Overview, explicitly marked as not the central conclusion. The central results are now
  reported separately by horizon.
- **S1 reinterpreted for the public copy** as the *near-term translational population*:
  monogenic cases where no unaffected embryo can be selected, so germline editing would
  provide a preventive route unavailable through embryo selection (~11.3k births/year at
  default assumptions).
- **S2 renamed publicly** to the *current-evidence* (strict) and *future-capacity*
  (permissive) **exploratory population-scaling scenarios**. Neither is called "optimistic"
  or an "upper bound" in public copy; the permissive scenario is a boundary analysis of what
  changes if technical capacity improves, not a forecast. Public copy also states the scaled
  figures are not the direct sum of the disease-specific liability-threshold analysis.
- **The liability-threshold model separately examines the frontier.** The per-disease
  analysis (current-capacity vs future high-capacity assumption sets) is the substantive
  examination of how the polygenic editing frontier could move; verdict bands are reported as
  modeled risk-reduction ranges plus a pleiotropy caution.
- **Present non-viability ≠ permanent low future impact.** Polygenic editing is framed as a
  developing frontier: not clinically ready under current-capacity assumptions, with the
  future-capacity assumption set mapping how the frontier could move — without claiming
  clinical readiness or attaching dates.
- **Three horizons reported separately** everywhere results are summarized (Overview
  findings, README, methods.md): present impact of existing genetic medicine (with the
  capability-vs-access gap), the near-term editing-only translational population, and the
  polygenic-architecture / future-capacity analysis.
- Affiliation "Alethic Research" removed from README, CITATION.cff, and .zenodo.json;
  citation metadata retitled. Tests extended to lock the new title, the absence of the old
  title in public files, the absence of a public "optimistic scenario" label, and the
  demotion of the combined residual out of the primary Overview findings.

## 2026-08-11 — Reproductive-burden addendum (expanded manuscript v2)

The expanded manuscript adds one dimension to the impact framework and restores several
compressed arguments. Implemented as an additive delta — no model logic or numbers changed.

- **Reproductive burden is part of the impact framework**, not a side ethical issue: the
  physical, procedural, embryo-level, and pregnancy-related burdens of achieving a
  reproductive outcome. Two interventions can achieve the same disease outcome with very
  different reproductive burdens. Defined on the Overview, in the glossary, and in Methods.
- **Selection-versus-correction is a continuum, not a binary.** Broad framings now read
  "where existing reproductive options fail *or become unusually burdensome*." Category 1
  (no unaffected embryo → selection biologically impossible) remains the strongest near-term
  case; Category 2 (unaffected embryos rare → selection possible but requiring many embryos
  or repeated IVF cycles) grounds the "poor selection prospects" regulatory category. Poor
  selection does not automatically justify editing — it changes the proportionality
  comparison.
- **The (1−u)/u analysis is a real Methods result** ("Embryo selection versus correction
  accounting", methods.md §12), linked from the no-selectable-embryo page. Terminology:
  "affected-genotype embryos not selected for transfer," never "embryos destroyed" —
  disposition is not modeled. Blastocyst-level figures stay secondary and illustrative.
- **IVM/IVG strengthens both sides**: larger embryo sets make selection substantially more
  powerful (while increasing embryo creation, testing, and non-selection); multiplex editing
  moves a different constraint. Stated on both the polygenic-frontier and
  selection-vs-editing pages.
- **Pathway moral non-equivalence** (Ethics & policy): quantitative comparability does not
  imply moral equivalence; the coverage-scenario percentages are not rankings of moral
  desirability.
- **Selection-First and Somatic-First** added as rebuttable presumptions, not prohibitions.
- **Spectacle, regulatory arbitrage, and ethical arbitrage** treated as three related but
  distinct problems; ethical arbitrage = borrowing the moral urgency of a strongly justified
  use for a weaker application.
- **Investment horizons**: screening infrastructure buys present health-system capacity;
  editing research buys knowledge and future option value — kept in the exploratory cost
  section, not promoted to the main argument.
- **Content-invariant test added**: nineteen core argument concepts must each have a
  deliberate home in the research artifact (app source + README) so UI simplification can
  relocate but never silently drop them.
