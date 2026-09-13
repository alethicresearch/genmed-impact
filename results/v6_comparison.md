# v6 calculated-impact supplementary analyses

This file is the human-readable companion to `results/v6_comparison.json`. It separates results that are ready for manuscript use from analyses that remain exploratory or incomplete.

## Promotable: realistic PGT-M pathway

Poulton et al. (2025, *J Assist Reprod Genet*, doi:10.1007/s10815-025-03416-6) reported 572 PGT-M/A stimulated cycles, 2,344 biopsied embryos, 513 transferred embryos and 230 live births. The observed pathway corresponds to 4.10 biopsied embryos per stimulated cycle, a 40.2% live-birth rate per stimulated cycle, 44.8% per transferred embryo, 2.49 stimulated cycles per live birth and 10.19 biopsied embryos per live birth. These are observed aggregate ratios in one Australian cohort, not universal clinical constants.

A systematic review of 51 studies (Poulton et al. 2025, *Am J Obstet Gynecol*, doi:10.1016/j.ajog.2024.09.114) found a 29.7% birth rate per stimulated cycle overall, 37.6% in studies with concurrent PGT-A and 28.1% without PGT-A. These provide a broader sensitivity range. The v6 analysis therefore does not use one universal IVF success rate.

## Promotable: selection burden

For a single target criterion with acceptable-embryo fraction `u`, the expected number of embryos failing that target per acceptable embryo is `(1-u)/u`. This is target-based non-selection, not final embryo disposition. At `u=0.50`, `0.20`, `0.05` and `0.02`, the ratios are 1, 4, 19 and 49 respectively.

For multiple independent criteria, `u = Π p_i`. In the special equal-and-independent case the ratio is `p^-n - 1`; with `p=0.5`, 1, 2, 5 and 10 criteria correspond to 1, 3, 31 and 1,023 non-selections per embryo satisfying all criteria. These are mathematical illustrations, not a claim that real human traits are independent.

## Promotable as sensitivity analysis: selection–correction crossover

Let `c` be the probability that an initially unacceptable embryo is successfully corrected with respect to the target. Then `q = u + (1-u)c`. If `r_s` is live-birth probability after transfer of a selection-acceptable embryo and `r_e` is the analogous probability after the correction pathway, correction exceeds selection on reproductive yield alone when `q*r_e > u*r_s`, or equivalently when `r_e/r_s > u/q`.

The generated matrix in `v6_comparison.json` reports this threshold over `u` and `c`. It is deliberately not a clinical-readiness or ethical threshold: it omits editing failure modes beyond `c`, mosaicism, off-target effects, developmental consequences, heritable uncertainty and resource/access considerations.

## Promotable: embryo disposition is distinct from non-selection

Spinella et al. (2026, *Human Reproduction*, doi:10.1093/humrep/deag081) reported 2,576 embryos that were non-genetically-transferable for the PGT-M/PGT-SR target in combined PGT-M/SR + PGT-A analyses. Of these, 1,198 (46%) remained cryopreserved. This directly demonstrates why genotype-based non-selection must not be equated with embryo destruction or discard. Final disposition is a separate empirical outcome.

## Not yet promotable: Gate-2 population share

The current editing-technology output yields a 73.4% correction-route share when condition medians are summed. This is not promoted as a manuscript population percentage because the canonical S1 headline is the median of the joint Monte Carlo distribution rather than the sum of condition medians. In addition, ClinVar record counts measure reported allelic diversity, not patient-frequency weights. A per-draw tractability aggregation and population-weighted allele spectrum are still required.

## Not yet promotable: dollar costs

The existing germline-editing programme cost constant is explicitly marked `placeholder: true`, and several implementation unit-cost anchors are reasoned rather than primary-source estimates. Dollar cost-effectiveness comparisons therefore remain exploratory. Procedure, embryo, cycle and transfer quantities can be reported as resource consequences without creating false monetary precision.
