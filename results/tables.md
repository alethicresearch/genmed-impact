# denominator — regenerated tables

_Assumption set: severity=`def_b`, attribution=`inclusive`, scenario=`current`, PND-counts=`True` · Monte-Carlo n=20000 · pipeline commit `4e98e2d`._

## Table 1 — Serious genetic disease: burden and uniquely editable residual

| Category | Births / year | % of serious genetic disease | % of all births |
| --- | ---: | ---: | ---: |
| Severe monogenic disorders | 1,404,840 | 17.5% | 1.04% |
| Serious multifactorial / partly-genetic | 6,620,881 | 82.3% | 4.90% |
| All serious genetic disorders | 8,042,019 | 100% | 5.96% |
| S1 — no selectable unaffected embryo | 11,320 | 0.14% | 0.01% |
| S2 — editing-superior complex disease (permissive) | 127,166 | 1.58% | 0.09% |
| **Total uniquely embryo-editable (permissive)** | **139,586** | **1.74%** | **0.10%** |

_Addressable by existing tools (1 − uniquely editable): **98.3%** (95% CrI 96.9%–99.1%)._

## Table 2 — Serious genetic births/year across severity × attribution

| Severity | Attribution | Monogenic | Multifactorial | Total serious | % of births |
| --- | --- | ---: | ---: | ---: | ---: |
| def_a | inclusive | 1,079,714 | 6,614,857 | 7,705,263 | 5.71% |
| def_a | heritability_weighted | 1,079,714 | 3,292,519 | 4,388,385 | 3.25% |
| def_a | exclusive | 1,079,714 | 639,131 | 1,733,334 | 1.28% |
| def_b | inclusive | 1,404,840 | 6,620,881 | 8,042,019 | 5.96% |
| def_b | heritability_weighted | 1,404,840 | 3,292,701 | 4,713,148 | 3.49% |
| def_b | exclusive | 1,404,840 | 640,012 | 2,059,736 | 1.53% |
| def_c | inclusive | 1,621,454 | 6,617,666 | 8,257,706 | 6.12% |
| def_c | heritability_weighted | 1,621,454 | 3,287,856 | 4,928,844 | 3.65% |
| def_c | exclusive | 1,621,454 | 639,913 | 2,276,598 | 1.68% |

## Table 3 — S1 residual by condition (no selectable unaffected embryo)

| Condition | Births / year (median) | 95% CrI |
| --- | ---: | ---: |
| Congenital sensorineural deafness (GJB2) | 12,377 | 4,858 – 30,060 |
| Sickle cell disease | 5,845 | 1,200 – 19,837 |
| Balanced translocations (no viable euploid) | 2,682 | 854 – 8,357 |
| Beta-thalassaemia | 1,171 | 166 – 5,508 |
| Cystic fibrosis | 402 | 32 – 2,210 |
| Spinal muscular atrophy (type I) | 3 | 0 – 71 |
| Huntington's disease | 1 | 0 – 3 |
| Tay-Sachs disease | 0 | 0 – 0 |
| **S1 total (incl. contested)** | **11,320** | 4,852 – 26,109 |
| _S1 excl. congenital deafness (contested)_ | _11,320_ | 4,852 – 26,109 |

_Congenital deafness (contested) contributes a median **12,377** (95% CrI 4,858–30,060) of the S1 total. The draft paper's 14,000 sits between the two variants._

## Table 3b — S1 residual by World Bank income group

| Income group | S1 incl. contested (median) | S1 excl. contested (median) |
| --- | ---: | ---: |
| High income | 1,784 | 893 |
| Upper-middle income | 7,883 | 3,646 |
| Lower-middle income | 14,690 | 6,361 |
| Low income | 5,230 | 2,208 |

_Per income group: region births × region-specific consanguinity F. Sum across regions need not equal the global-F headline because F and allele exposure differ by region; allele frequencies are still global pending an ancestry-weighted gnomAD pull._

## Table 4 — Global prevention waterfall, monogenic class (PND counted)

| Scenario | CS | PGT | PND | Total averted births | Residual births | Averted burden (incl. NBS) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| current | 9.5% | 4.7% | 20.2% | 35.8% | 64.2% | 38.4% |
| achievable_2035 | 46.7% | 14.5% | 16.8% | 79.8% | 20.2% | 81.7% |
| ideal | 84.6% | 14.2% | 0.6% | 99.7% | 0.3% | 99.8% |

## Table 1 — LaTeX

```latex
\begin{tabular}{lrrr}
\toprule
Category & Births/yr & \% serious & \% births \\
\midrule
Severe monogenic & 1,404,840 & 17.5% & 1.04% \\
Serious multifactorial & 6,620,881 & 82.3% & 4.90% \\
All serious genetic & 8,042,019 & 100\% & 5.96% \\
Uniquely editable (permissive) & 139,586 & 1.74% & 0.10% \\
\bottomrule
\end{tabular}
```
