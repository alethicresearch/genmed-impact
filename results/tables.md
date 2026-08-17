# denominator — regenerated tables

_Assumption set: severity=`def_b`, attribution=`inclusive`, scenario=`current`, PND-counts=`True` · Monte-Carlo n=10000 · pipeline commit `dc6cb18`._

## Table 1 — Serious genetic disease: burden and editing-relevant residual

| Category | Births / year | % of serious genetic disease | % of all births |
| --- | ---: | ---: | ---: |
| Severe monogenic disorders | 1,402,972 | 17.5% | 1.04% |
| Serious multifactorial / partly-genetic | 6,612,098 | 82.4% | 4.90% |
| All serious genetic disorders | 8,028,368 | 100% | 5.95% |
| S1 — no selectable unaffected embryo | 11,426 | 0.14% | 0.01% |
| S2 — potential complex-disease editing advantage (future-capacity scaling) | 126,333 | 1.57% | 0.09% |
| **Editing-relevant residual (future-capacity scaling)** | **138,864** | **1.73%** | **0.10%** |

_Not uniquely dependent on germline editing (1 − editing-relevant residual): **98.3%** (95% UI 96.9%–99.1%)._

## Table 2 — Serious genetic births/year across severity × attribution

| Severity | Attribution | Monogenic | Multifactorial | Total serious | % of births |
| --- | --- | ---: | ---: | ---: | ---: |
| def_a | inclusive | 1,078,817 | 6,616,224 | 7,704,222 | 5.71% |
| def_a | heritability_weighted | 1,078,817 | 3,302,390 | 4,399,113 | 3.26% |
| def_a | exclusive | 1,078,817 | 637,129 | 1,732,832 | 1.28% |
| def_b | inclusive | 1,402,972 | 6,612,098 | 8,028,368 | 5.94% |
| def_b | heritability_weighted | 1,402,972 | 3,280,021 | 4,698,074 | 3.48% |
| def_b | exclusive | 1,402,972 | 638,290 | 2,055,282 | 1.52% |
| def_c | inclusive | 1,621,403 | 6,627,178 | 8,256,192 | 6.11% |
| def_c | heritability_weighted | 1,621,403 | 3,280,891 | 4,913,427 | 3.65% |
| def_c | exclusive | 1,621,403 | 639,164 | 2,278,444 | 1.69% |

## Table 3 — S1 residual by condition (no selectable unaffected embryo)

| Condition | Births / year (median) | 95% UI |
| --- | ---: | ---: |
| Congenital sensorineural deafness (GJB2) | 12,320 | 4,914 – 30,387 |
| Sickle cell disease | 5,926 | 1,233 – 19,445 |
| Balanced translocations (no viable euploid) | 2,710 | 853 – 8,539 |
| Beta-thalassaemia | 1,172 | 171 – 5,406 |
| Cystic fibrosis | 398 | 33 – 2,154 |
| Spinal muscular atrophy (type I) | 3 | 0 – 67 |
| Huntington's disease | 1 | 0 – 3 |
| Tay-Sachs disease | 0 | 0 – 0 |
| **S1 total (incl. contested)** | **11,426** | 4,787 – 26,000 |
| _S1 excl. congenital deafness (contested)_ | _11,426_ | 4,787 – 26,000 |

_Congenital deafness (contested) contributes a median **12,320** (95% UI 4,914–30,387) of the S1 total. A 14,000/yr point estimate sits between the two variants._

## Table 3b — S1 residual by World Bank income group

| Income group | S1 incl. contested (median) | S1 excl. contested (median) |
| --- | ---: | ---: |
| High income | 1,779 | 896 |
| Upper-middle income | 7,903 | 3,661 |
| Lower-middle income | 14,703 | 6,274 |
| Low income | 5,249 | 2,195 |

_Per income group: region births × region-specific consanguinity F. Sum across regions need not equal the global-F headline because F and allele exposure differ by region; allele frequencies are still global pending an ancestry-weighted gnomAD pull._

## Table 4 — Global prevention waterfall, monogenic class (PND counted)

| Scenario | CS | PGT | PND | Total averted births | Residual births | Averted burden (incl. NBS) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| current | 9.6% | 4.6% | 20.2% | 35.9% | 64.1% | 38.6% |
| achievable_2035 | 46.4% | 14.6% | 16.8% | 79.6% | 20.4% | 81.6% |
| ideal | 84.8% | 14.1% | 0.6% | 99.7% | 0.3% | 99.8% |

## Table 1 — LaTeX

```latex
\begin{tabular}{lrrr}
\toprule
Category & Births/yr & \% serious & \% births \\
\midrule
Severe monogenic & 1,402,972 & 17.5% & 1.04% \\
Serious multifactorial & 6,612,098 & 82.4% & 4.90% \\
All serious genetic & 8,028,368 & 100\% & 5.95% \\
Uniquely editable (permissive) & 138,864 & 1.73% & 0.10% \\
\bottomrule
\end{tabular}
```
