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

### Known deviations from the draft paper (surfaced, not hidden)
1. S1 median ≈25k vs paper's 14k (see above).
2. Births default 135M vs paper's 140M (interval covers both).
3. Otherwise headline figures reproduce: serious ≈8.0M, monogenic ≈1.4M, multifactorial ≈6.6M,
   uniquely editable ≈153k (permissive), addressable ≈98.1%.
