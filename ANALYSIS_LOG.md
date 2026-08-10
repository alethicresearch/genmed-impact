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

### Genetic Medicine Index (GMI) — added
- Every catalogue disease maps to a single 0–100 **Genetic Medicine Index**: a weighted sum over
  four capabilities (carrier screening, embryo selection, prenatal diagnosis, newborn screening +
  early therapy), each counted where it applies to that disease. Weights
  (`genetic_medicine_index_weights` in constants.yaml, default CS .20 / PGT .25 / PND .20 / NBS .35)
  are an explicit judgment call — **treatment is weighted highest** because a healthy living child is
  a fuller genetic-medicine outcome than avoidance of an affected birth. Adjustable; sums to 1.
- Chosen over a "1 − Π(1−effectiveness)" composition, which saturated (almost every monogenic
  disease → 100) and so failed as an index. The weighted form discriminates: treatable disease 100,
  preventable-only catastrophic (e.g. Tay-Sachs, DMD) 65, de-novo chromosomal (Down) 45,
  multifactorial-congenital (PND only) 20. It is fully derived from catalogue applicability, so any
  ingested disease is scored automatically — the index scales with the library.
- GMI measures *addressability by existing genetic medicine*, deliberately independent of severity
  (a catastrophic disease can be highly addressable). Severity stays a separate axis.

### Known deviations from the draft paper (surfaced, not hidden)
1. S1 median ≈25k vs paper's 14k (see above).
2. Births default 135M vs paper's 140M (interval covers both).
3. Otherwise headline figures reproduce: serious ≈8.0M, monogenic ≈1.4M, multifactorial ≈6.6M,
   uniquely editable ≈153k (permissive), addressable ≈98.1%.
