# Methods — Global Genetic-Disease Burden × Genetic-Medicine Impact

_Auto-generated from the analysis pipeline · Monte-Carlo n=20,000 · pipeline commit `7ec6ac5` · model version 3.0._

This document describes every input, assumption, formula, and parameter behind the analysis. All headline figures below are regenerated from the pipeline; the full parameter provenance and disease catalogue are in the appendices. Contestable judgment calls are implemented as explicit parameters and reported across their range.

---
## 1. Overview and objects

The analysis is organized around a **library of serious genetic diseases**, each mapped to (a) the gene(s)/locus that cause it, (b) inheritance mode, (c) incidence at birth, and (d) which genetic-medicine interventions can address it. Aggregate burden and preventability are **derived bottom-up** by summing the library; a parametric **Monte-Carlo model** provides the calibrated top-down denominator with credible intervals and the editing-unique residual. Interventions considered:

- **CS** — preconception carrier screening (identifies at-risk couples)
- **PGT** — IVF + preimplantation genetic testing (embryo selection)
- **PND** — prenatal diagnosis (+ reproductive decision)
- **NBS** — newborn screening + early therapy (mitigates disease; does not prevent the birth)
- **Germline embryo editing**

## 2. Data sources

Provenance tiers: **A** = open programmatic pull (UN WPP births, WHO GHO, gnomAD v4.1, World Bank income groups, UNAIDS, Orphanet); **B** = registration/manual query (GBD 2023 Results Tool, OMIM); **C** = transcribed published tables (Modell & Darlison 2008 haemoglobinopathies; Bittles/consang.net consanguinity; national screening-program outcomes; ESHRE PGT; SMA NBS cohorts; cost analyses; PCSK9/CCR5/APOE effect sizes). Every constant carries `{value, low, high, source, doi, table_or_page, retrieved}`; unknowns are explicit free parameters, never guesses. The full sourced parameter list is Appendix A.

## 3. Denominator: annual births

Global annual live births are modelled as **135,016,418 (95% CrI 130,178,065–140,053,624)** (UN WPP 2024; the interval spans the WPP estimate and the ~140M figure used in the draft). Per-country births distribute to World Bank income groups and GBD super-regions via population-weighted birth shares.

## 4. Disease library

The curated catalogue contains **97 serious genetic diseases** across five categories (autosomal recessive, autosomal dominant, X-linked, chromosomal, multifactorial). Gene–disease relationships and inheritance modes are established facts (OMIM/Orphanet). Incidence is expressed per 100,000 live births with a `basis` flag (`cited` / `textbook_estimate` / `order_of_magnitude`); the Orphanet ingest scales the catalogue toward full coverage. Bottom-up affected births per disease = `births × incidence_per_100k / 100000`.

| Category | Affected births/yr (bottom-up) |
| --- | ---: |
| multifactorial | 2,308,500 |
| x_linked | 619,650 |
| monogenic_dominant | 1,987,200 |
| monogenic_recessive | 713,880 |
| chromosomal | 444,150 |
| **Catalogue total (lower bound)** | **6,073,380** |

The catalogue sum (6,073,380/yr) is a **lower bound** on the full denominator — it covers the highest-burden conditions and rises as the library grows. The calibrated top-down denominator (§5) is the reference total.

## 5. Burden baseline (top-down)

Serious genetic births/year are decomposed into severe **monogenic** disorders and serious **multifactorial** disorders. Two contestable choices are parameterized and reported across their range:

- **Severity threshold** — three operationalizations: `def_a` (GBD congenital tree + curated severe-monogenic list, narrow), `def_b` ("lethal or lifelong serious disability absent treatment", default), `def_c` (DALYs-per-case above threshold, broad).
- **Attribution stance** for multifactorial disease — `inclusive` (count all cases, g=1), `heritability_weighted` (g≈0.5), `exclusive` (high-penetrance familial subsets only, g≈0.1). This choice dominates the denominator and is foregrounded, not buried.

Under the default set (severity=`def_b`, attribution=`inclusive`):

| Quantity | Median (95% CrI) |
| --- | ---: |
| Monogenic serious births/yr | 1,404,840 (95% CrI 1,097,734–1,793,182) |
| Multifactorial serious births/yr | 6,620,881 (95% CrI 5,393,430–8,126,234) |
| **All serious genetic births/yr** | **8,042,019 (95% CrI 6,747,369–9,591,263)** |
| Share of all births | 5.96% (95% CrI 5.01–7.08%) |

The full severity × attribution grid (nine combinations) is emitted to `paper_numbers.json` and shown in the app's Denominator view.

## 6. Genetic-medicine status

Every disease is placed in one **status** derived directly from its intervention flags — no weights, no composite score:

- **Preventable & treatable** — an unaffected child is achievable (screening/selection) *and* effective early therapy exists
- **Preventable** — an unaffected child is achievable, but no cure
- **Treatable** — effective early therapy exists, but hard to prevent
- **Detectable only** — prenatal detection without selection
- **No current option**

The distribution across statuses — by disease count and by affected births — is the headline picture of what existing genetic medicine can already do. "Addressable by existing tools" is everything but the empty status.

| Status | Diseases | Affected births/yr |
| --- | ---: | ---: |
| Preventable & treatable | 29 | 994,140 |
| Preventable | 59 | 2,770,740 |
| Treatable | 3 | 1,350,000 |
| Detectable only | 5 | 688,500 |
| No genetic-medicine option | 1 | 270,000 |
| **Addressable by existing tools** |  | **5,803,380 (96%)** |

The editing-unique residual (§8) is deliberately *not* a status here: it is a sliver of couples *within* diseases (no selectable embryo), not a class of diseases.

## 7. Preventability engine (sequential)

Tools compose in causal order **CS → PGT → PND → NBS**, each acting on the residual of the last:

```
remaining_after_t = remaining_before_t × (1 − prevent[c,t] × coverage[t,region,scenario])
```

Two outcome tracks are carried separately: **averted_birth** (CS, PGT, PND only) and **averted_burden** (adds NBS, which mitigates the burden of births that still occur, scaled by the treatable fraction). Full-coverage preventable fractions `prevent[c,t]` are anchored to national program outcomes (thalassaemia ~90%, Down syndrome ~70%); coverage scenarios are `current` / `achievable_2035` / `ideal`, refined per income group by an access multiplier (<1 for LMICs, reflecting that ~94% of birth-defect births occur in LMICs). PND counting is termination-dependent and reported with the toggle on and off.

## 8. Editing-unique residual (S1 + S2)

**S1 — no selectable unaffected embryo.** The only monogenic configuration where embryo selection cannot help: recessive affected × affected (aa × aa) couples, or a viable homozygous-dominant (AA) parent. Per condition, from allele frequency q, penetrance, survival-to-reproduction s, assortative-mating α, locus-concordance ℓ, and consanguinity F:

```
P_aa      = q² + F·q·(1−q)
P_aa_repro = P_aa · s · penetrance
α_eff     = α · ℓ                          (partner affected AND at the same locus)
P_couple  = P_aa_repro · (α_eff + (1−α_eff)·P_aa_repro)      # recessive
births_S1 = births × Σ_conditions P_couple  + structural-variant term
```

Standard both-heterozygous couples (¼ unaffected embryos) are selection-addressable and excluded. Result: **S1 ≈ 11,320 (95% CrI 4,852–26,109)** including congenital deafness; **11,320** excluding it (deafness is flagged contested — many in the Deaf community do not regard it as a disease to prevent — and toggled explicitly; the draft paper's 14,000 sits between the two).

**S2 — editing-superior complex disease.** The multifactorial share for which a single/oligo-locus edit would uniquely benefit after netting out somatic, pharmacological, and public-health alternatives, under strict vs permissive criteria: strict ≈ 1,320/yr, permissive ≈ 127,166/yr.

**Uniquely editable total (permissive): 139,586 (95% CrI 68,828–257,513)** — **1.74% (95% CrI 0.87–3.10%)** of serious genetic disease; the complement, **98.26% (95% CrI 96.90–99.13%)**, is not uniquely reliant on editing.

## 9. Multifactorial intervention viability (liability-threshold)

Multifactorial disease is modelled along a **polygenicity spectrum** (oligogenic → massively polygenic). On the liability-threshold model, liability ~ N(0,1) and a person is affected when liability exceeds T = Φ⁻¹(1−K) for lifetime prevalence K. An intervention that lowers expected liability by δ standard deviations changes risk from K to 1−Φ(T+δ); relative risk reduction RRR = 1 − (1−Φ(T+δ))/K.

```
Embryo selection : δ = √(prs_r2 · sib_frac) · E|min of N embryos|      (Blom order statistic)
Oligo-locus edit : δ = √( oligo_editable_h2 · (1 − e^(−n_edits/τ)) )
```

Selection power grows with embryo number N; editing power depends on how concentrated risk is in editable large-effect loci (≈0 for massively polygenic traits). Two technology scenarios move the frontier: **present** (N≈5 embryos, 1 edit) and **near-future** (N≈200 via IVM/IVG, ~10 multiplex edits). A `pleiotropy_caution` flag overrides an otherwise-concentrated editing verdict (e.g. APOE, HLA).

Frontier (10 common complex diseases): **editing viable for 0 disease(s) today → 3 near-future**; selection viable-or-marginal for 10 → 10. Massively polygenic traits (schizophrenia, major depression) never reach editing-viability regardless of technology.

_Caveats (stated in-app): selection RRR can look large for rare, highly-heritable traits — a property of the liability threshold, not an achievable program; genetic tractability is necessary but not sufficient for clinical viability (safety, pleiotropy, effect realism are separate gates)._

## 10. Resistance analysis

**HIV:** 129,826 vertical infections/yr (UNAIDS); residual after PMTCT (effectiveness × coverage) ≈ 24,842/yr — the only window in which CCR5 germline resistance could uniquely matter. **Cardiovascular:** statins + somatic PCSK9 inhibition deliver comparable benefit cheaply; unique germline benefit is small and not reduced to a single count. **Neurodegeneration:** APOE developmental pleiotropy — no safe, clearly causal embryo-level target; reported as **not computable** rather than forcing a number.

## 11. Allocation

Cost per affected birth prevented: **screening program $11,913** vs **editing program $504,530**. Cost per DALY averted is derived from DALYs-per-case (pending the GBD pull). Budget scenarios ($1B/$5B/$10B per year) translate these into births prevented under each strategy; screening dominates editing by ~1–2 orders of magnitude. Cost anchors: Cousens et al. 2010 (haemoglobinopathy programs), IVF+PGT cycle costs, gene-therapy list prices, PMTCT program costs; the editing-program overhead is a wide-interval free parameter.

## 12. Uncertainty and sensitivity

All quantities are propagated through a Monte-Carlo of **n=20,000 draws** (Beta for proportions matched by moments; Lognormal for rates and costs with the stated value as median and low/high as ~95% bounds). Ratios and shares are computed per draw, so credible intervals are correct. A deterministic **tornado** swings each judgment call across its range; the parameters that move the uniquely-editable share most, in order:

| Parameter | Editable share range |
| --- | ---: |
| S2 permissive fraction | 0.97% – 3.20% |
| S2 criteria (complex-disease editing) | 0.35% – 1.96% |
| Congenital deafness in/out of S1 | 1.79% – 1.96% |
| Severity definition | 1.91% – 2.04% |
| Attribution stance | 1.84% – 1.96% |
| Multifactorial rate /1000 | 1.95% – 1.96% |

## 13. Key assumptions and judgment calls

Each is an explicit parameter with a documented default (see `ANALYSIS_LOG.md` for dated rationale): severity threshold (§5); attribution stance (§5); penetrance floor for S1; S2 strict vs permissive criteria; tool ordering and whether PND counts as prevention; inclusion of congenital deafness in S1; GMI capability weights (§6); multifactorial technology scenarios and pleiotropy blocks (§9); editing-program cost (§11).

## 14. Limitations

- The disease library is a curated seed of the highest-burden conditions; bottom-up totals are a lower bound until the Orphanet/GBD ingest expands it.
- Several incidence and cost values are `textbook_estimate`/`order_of_magnitude` anchors pending the GBD 2023 and PGS-Catalog pulls; these are flagged in Appendix A.
- S1 allele frequencies are global/ancestry-averaged pending the gnomAD ancestry-weighted pull; regional S1 uses region-specific consanguinity but global allele exposure.
- Multifactorial architecture parameters (h², PRS R², oligo-editable h²) are literature anchors; the viability model estimates genetic tractability, not clinical or ethical permissibility.

## 15. Reproducibility

`make install && make run && make test` regenerates every figure, this document, `results/paper_numbers.json`, and `results/tables.md` from the raw constants and library. `make ingest` pulls the Tier-A sources (see `DATA_NEEDED.md`). The webapp (`make app-build`) is a static, URL-shareable view of the same emitted data.

## Appendix A — Full parameter provenance

| Parameter | Value | Low | High | Source | DOI / page |
| --- | ---: | ---: | ---: | --- | --- |
| `births.global_per_year` | 135000000 | 130000000 | 140000000 | UN World Population Prospects 2024 (annual live births, world, 2023) | https://population.un.org/wpp/ |
| `burden.monogenic_serious_per_1000` |  |  |  | Modell & Darlison 2008; March of Dimes Global Report on Birth Defects  | 10.2471/BLT.06.036673 |
| `burden.multifactorial_serious_per_1000` | 49.0 | 40.0 | 60.0 | March of Dimes Global Report on Birth Defects 2006; WHO Congenital ano | https://www.who.int/news-room/fact-sheet |
| `attribution.inclusive` | 1.0 | 1.0 | 1.0 |  |  |
| `attribution.heritability_weighted` | 0.5 | 0.35 | 0.65 | Twin/heritability estimates for congenital anomalies (broad-sense h^2  | reasoned central estimate; see ANALYSIS_ |
| `attribution.exclusive` | 0.1 | 0.05 | 0.18 |  |  |
| `prevention_full_coverage.monogenic.CS` | 0.85 | 0.6 | 0.95 | Cyprus/Sardinia/Greece thalassaemia premarital+carrier programs | 10.2471/BLT.06.036673 |
| `prevention_full_coverage.monogenic.PGT` | 0.95 | 0.85 | 0.99 | ESHRE PGT Consortium data collections | 10.1093/humrep/deq231 |
| `prevention_full_coverage.monogenic.PND` | 0.7 | 0.4 | 0.9 | Denmark/Iceland/Netherlands trisomy-21 screening outcomes | Wald 2018; national screening registries |
| `prevention_full_coverage.monogenic.NBS` | 0.55 | 0.3 | 0.8 | SMA presymptomatic treatment (NURTURE); metabolic NBS ICERs | Kirby & Browne 2021; NURTURE cohort |
| `prevention_full_coverage.multifactorial.CS` | 0.05 | 0.01 | 0.12 | limited monogenic subsets within multifactorial bucket | reasoned |
| `prevention_full_coverage.multifactorial.PGT` | 0.05 | 0.01 | 0.12 | PGT-A/-M applicable to small share | reasoned |
| `prevention_full_coverage.multifactorial.PND` | 0.45 | 0.25 | 0.65 | prenatal detection of major structural anomalies (CHD, NTD) | reasoned |
| `prevention_full_coverage.multifactorial.NBS` | 0.15 | 0.05 | 0.3 | limited treatable multifactorial subset | reasoned |
| `coverage.current.CS` | 0.12 | 0.05 | 0.25 |  |  |
| `coverage.current.PGT` | 0.06 | 0.02 | 0.15 |  |  |
| `coverage.current.PND` | 0.35 | 0.2 | 0.55 |  |  |
| `coverage.current.NBS` | 0.3 | 0.15 | 0.5 |  |  |
| `coverage.achievable_2035.CS` | 0.55 | 0.35 | 0.75 |  |  |
| `coverage.achievable_2035.PGT` | 0.3 | 0.15 | 0.5 |  |  |
| `coverage.achievable_2035.PND` | 0.65 | 0.45 | 0.85 |  |  |
| `coverage.achievable_2035.NBS` | 0.7 | 0.5 | 0.9 |  |  |
| `coverage.ideal.CS` | 0.98 | 0.95 | 1.0 |  |  |
| `coverage.ideal.PGT` | 0.98 | 0.95 | 1.0 |  |  |
| `coverage.ideal.PND` | 0.98 | 0.95 | 1.0 |  |  |
| `coverage.ideal.NBS` | 0.98 | 0.95 | 1.0 |  |  |
| `s2` |  |  |  | Ference et al. 2017 (PCSK9); Savulescu et al. 2025 (heritable polygeni | 10.1038/s41586-024-08300-4 |
| `resistance.hiv_vertical_infections_per_year` | 130000 | 110000 | 160000 | UNAIDS AIDSinfo 2023 (new vertical HIV infections) | https://www.unaids.org/en/resources/fact |
| `resistance.pmtct_effectiveness` | 0.98 | 0.9 | 0.99 | WHO PMTCT (mother-to-child transmission prevention) where implemented | WHO 2022 PMTCT guidance |
| `resistance.pmtct_coverage_global` | 0.82 | 0.7 | 0.9 | UNAIDS PMTCT coverage estimate | https://www.unaids.org/en/resources/fact |
| `costs.carrier_screening_per_couple` | 200 | 60 | 500 | expanded carrier-screening panel list prices (high-throughput) | reasoned from commercial panel pricing |
| `costs.ivf_pgt_cycle` | 15000 | 6000 | 25000 | IVF + PGT-M cycle cost, region-dependent | reasoned; ESHRE cost surveys |
| `costs.prenatal_screen_per_pregnancy` | 120 | 40 | 300 | cfDNA/NIPT + confirmatory dx program cost | reasoned |
| `costs.newborn_screen_per_infant` | 25 | 8 | 60 | NBS panel cost per infant (excl. treatment) | reasoned; Kirby & Browne 2021 |
| `costs.haemoglobinopathy_program_per_birth_prevented` | 12000 | 4000 | 30000 | Cousens et al. 2010 β-thalassaemia carrier-screening cost-effectivenes | 10.1038/ejhg.2010.90 |
| `costs.gene_therapy_list_price` | 2500000 | 2100000 | 4250000 | Approved one-time gene-therapy US list prices: Zolgensma ~$2.1M (SMA), | manufacturer list prices 2019-2024 (Nova |
| `costs.pmtct_cost_per_infection_averted` | 2000 | 200 | 15000 | PMTCT cost-effectiveness: single-dose nevirapine ~$150-300/infection a | 10.2471/BLT.13.123646 |
| `costs.editing_program_per_birth_prevented` | 500000 | 150000 | 2000000 | reasoned germline-editing program overhead (IVF+PGT base + editing + o | wide interval; see ANALYSIS_LOG §costs |
| `costs.daly_per_severe_monogenic_case` | 30 | 15 | 55 | GBD-style DALYs per severe early-onset monogenic case (undiscounted) | reasoned pending GBD 2023 pull (DATA_NEE |
| `program_anchors.thalassaemia_major_reduction` | 0.9 | 0.7 | 0.95 | Cyprus/Sardinia/Greece national thalassaemia programs | 10.2471/BLT.06.036673 |
| `program_anchors.down_syndrome_reduction_nordic` | 0.7 | 0.55 | 0.85 | Denmark/Iceland/Netherlands prenatal screening outcomes | Wald 2018 |

## Appendix B — Disease catalogue

| Disease | Gene(s) | Inheritance | Severity | Births/yr | Status | Incidence basis |
| --- | --- | --- | --- | ---: | --- | --- |
| Congenital heart disease (multifactorial) | — | multifactorial | severe | 1,080,000 | Treatable | textbook_estimate |
| G6PD deficiency | G6PD | x_linked_recessive | moderate | 540,000 | Preventable & treatable | order_of_magnitude |
| Familial hypercholesterolaemia | LDLR, APOB, PCSK9 | autosomal_dominant | serious | 540,000 | Preventable | textbook_estimate |
| Lynch syndrome | MLH1, MSH2 | autosomal_dominant | serious | 405,000 | Preventable | textbook_estimate |
| Hereditary breast and ovarian cancer (BRCA1/2) | BRCA1, BRCA2 | autosomal_dominant | serious | 337,500 | Preventable | textbook_estimate |
| Sickle cell disease | HBB | autosomal_recessive | severe | 297,000 | Preventable & treatable | cited |
| Hypertrophic cardiomyopathy | MYBPC3, MYH7 | autosomal_dominant | serious | 270,000 | Preventable | textbook_estimate |
| Hypospadias | — | multifactorial | moderate | 270,000 | Detectable only | textbook_estimate |
| Infantile hypertrophic pyloric stenosis | — | multifactorial | moderate | 270,000 | No genetic-medicine option | textbook_estimate |
| Down syndrome (trisomy 21) | — | chromosomal | severe | 189,000 | Preventable | cited |
| Orofacial clefts (cleft lip/palate) | — | multifactorial | moderate | 189,000 | Detectable only | textbook_estimate |
| Alpha-thalassaemia | HBA1, HBA2 | autosomal_recessive | severe | 135,000 | Preventable | cited |
| Autosomal dominant polycystic kidney disease | PKD1, PKD2 | autosomal_dominant | serious | 135,000 | Preventable | textbook_estimate |
| Neural tube defects | MTHFR | multifactorial | severe | 135,000 | Detectable only | textbook_estimate |
| Clubfoot (talipes equinovarus) | — | multifactorial | moderate | 135,000 | Treatable | textbook_estimate |
| Developmental dysplasia of the hip | — | multifactorial | moderate | 135,000 | Treatable | textbook_estimate |
| Beta-thalassaemia | HBB | autosomal_recessive | severe | 108,000 | Preventable | cited |
| Klinefelter syndrome (47,XXY) | — | chromosomal | moderate | 101,250 | Preventable | textbook_estimate |
| Long QT syndrome | KCNQ1, KCNH2, SCN5A | autosomal_dominant | serious | 67,500 | Preventable | textbook_estimate |
| Hereditary spherocytosis | ANK1 | autosomal_dominant | moderate | 67,500 | Preventable | textbook_estimate |
| Congenital diaphragmatic hernia | — | multifactorial | severe | 54,000 | Detectable only | textbook_estimate |
| Neurofibromatosis type 1 | NF1 | autosomal_dominant | serious | 44,550 | Preventable | textbook_estimate |
| Gastroschisis | — | multifactorial | serious | 40,500 | Detectable only | textbook_estimate |
| Cystic fibrosis | CFTR | autosomal_recessive | severe | 33,750 | Preventable & treatable | textbook_estimate |
| 22q11.2 deletion syndrome (DiGeorge) | TBX1 | chromosomal | serious | 33,750 | Preventable | textbook_estimate |
| Congenital sensorineural deafness (GJB2/DFNB1) | GJB2 | autosomal_recessive | moderate | 27,000 | Preventable & treatable | textbook_estimate |
| Fragile X syndrome | FMR1 | x_linked_dominant | serious | 27,000 | Preventable | textbook_estimate |
| Marfan syndrome | FBN1 | autosomal_dominant | serious | 27,000 | Preventable | textbook_estimate |
| Edwards syndrome (trisomy 18) | — | chromosomal | catastrophic | 27,000 | Preventable | textbook_estimate |
| Turner syndrome (45,X) | — | chromosomal | serious | 27,000 | Preventable | textbook_estimate |
| Tuberous sclerosis complex | TSC1, TSC2 | autosomal_dominant | serious | 20,250 | Preventable | textbook_estimate |
| Myotonic dystrophy type 1 | DMPK | autosomal_dominant | serious | 16,200 | Preventable | textbook_estimate |
| 1p36 deletion syndrome | — | chromosomal | severe | 16,200 | Preventable | textbook_estimate |
| Spinal muscular atrophy | SMN1 | autosomal_recessive | catastrophic | 13,500 | Preventable & treatable | textbook_estimate |
| Duchenne muscular dystrophy | DMD | x_linked_recessive | severe | 13,500 | Preventable & treatable | textbook_estimate |
| Haemophilia A | F8 | x_linked_recessive | serious | 13,500 | Preventable | textbook_estimate |
| Familial adenomatous polyposis | APC | autosomal_dominant | severe | 13,500 | Preventable | textbook_estimate |
| Williams syndrome | ELN | chromosomal | serious | 13,500 | Preventable | textbook_estimate |
| Phenylketonuria (PKU) | PAH | autosomal_recessive | serious | 10,800 | Preventable & treatable | textbook_estimate |
| Patau syndrome (trisomy 13) | — | chromosomal | catastrophic | 10,800 | Preventable | textbook_estimate |
| Medium-chain acyl-CoA dehydrogenase deficiency (MCAD) | ACADM | autosomal_recessive | serious | 9,450 | Preventable & treatable | textbook_estimate |
| Congenital adrenal hyperplasia (21-hydroxylase) | CYP21A2 | autosomal_recessive | serious | 9,450 | Preventable & treatable | textbook_estimate |
| Huntington disease | HTT | autosomal_dominant | severe | 9,450 | Preventable | textbook_estimate |
| Primary ciliary dyskinesia | DNAH5 | autosomal_recessive | serious | 9,450 | Preventable | textbook_estimate |
| Pendred syndrome | SLC26A4 | autosomal_recessive | moderate | 9,450 | Preventable | textbook_estimate |
| Osteogenesis imperfecta | COL1A1, COL1A2 | autosomal_dominant | serious | 9,450 | Preventable | textbook_estimate |
| Prader-Willi syndrome | — | chromosomal | serious | 9,450 | Preventable | textbook_estimate |
| Angelman syndrome | UBE3A | chromosomal | severe | 9,450 | Preventable | textbook_estimate |
| Retinoblastoma (heritable) | RB1 | autosomal_dominant | severe | 6,750 | Preventable | textbook_estimate |
| Li-Fraumeni syndrome | TP53 | autosomal_dominant | severe | 6,750 | Preventable | order_of_magnitude |
| Rett syndrome | MECP2 | x_linked_dominant | severe | 6,750 | Preventable | textbook_estimate |
| Achondroplasia | FGFR3 | autosomal_dominant | moderate | 5,400 | Preventable | textbook_estimate |
| Usher syndrome | MYO7A, USH2A | autosomal_recessive | serious | 5,400 | Preventable | textbook_estimate |
| Wilson disease | ATP7B | autosomal_recessive | serious | 4,050 | Preventable & treatable | textbook_estimate |
| X-linked adrenoleukodystrophy | ABCD1 | x_linked_recessive | severe | 4,050 | Preventable & treatable | textbook_estimate |
| Von Hippel-Lindau disease | VHL | autosomal_dominant | serious | 4,050 | Preventable | textbook_estimate |
| Cri-du-chat syndrome (5p deletion) | — | chromosomal | severe | 4,050 | Preventable | textbook_estimate |
| Pompe disease (GSD II) | GAA | autosomal_recessive | severe | 3,375 | Preventable & treatable | textbook_estimate |
| Gaucher disease | GBA | autosomal_recessive | serious | 2,700 | Preventable & treatable | textbook_estimate |
| Friedreich ataxia | FXN | autosomal_recessive | severe | 2,700 | Preventable | textbook_estimate |
| Classic galactosemia | GALT | autosomal_recessive | serious | 2,700 | Preventable & treatable | textbook_estimate |
| Haemophilia B | F9 | x_linked_recessive | serious | 2,700 | Preventable | textbook_estimate |
| Fabry disease | GLA | x_linked_recessive | serious | 2,700 | Preventable & treatable | textbook_estimate |
| Methylmalonic acidemia | MMUT | autosomal_recessive | severe | 2,700 | Preventable & treatable | textbook_estimate |
| Zellweger syndrome (peroxisome biogenesis disorder) | PEX1 | autosomal_recessive | catastrophic | 2,700 | Preventable | textbook_estimate |
| Alport syndrome (X-linked) | COL4A5 | x_linked_dominant | serious | 2,700 | Preventable | textbook_estimate |
| Wolf-Hirschhorn syndrome (4p deletion) | — | chromosomal | severe | 2,700 | Preventable | textbook_estimate |
| Biotinidase deficiency | BTD | autosomal_recessive | serious | 2,295 | Preventable & treatable | textbook_estimate |
| Metachromatic leukodystrophy | ARSA | autosomal_recessive | severe | 2,025 | Preventable & treatable | textbook_estimate |
| Mucopolysaccharidosis III (Sanfilippo) | SGSH | autosomal_recessive | severe | 2,025 | Preventable | textbook_estimate |
| Ornithine transcarbamylase deficiency | OTC | x_linked_recessive | severe | 2,025 | Preventable & treatable | textbook_estimate |
| Mucopolysaccharidosis I (Hurler) | IDUA | autosomal_recessive | severe | 1,350 | Preventable & treatable | textbook_estimate |
| Krabbe disease | GALC | autosomal_recessive | catastrophic | 1,350 | Preventable & treatable | textbook_estimate |
| Batten disease (juvenile neuronal ceroid lipofuscinosis, CLN3) | CLN3 | autosomal_recessive | catastrophic | 1,350 | Preventable | order_of_magnitude |
| Tyrosinemia type I | FAH | autosomal_recessive | severe | 1,350 | Preventable & treatable | textbook_estimate |
| Propionic acidemia | PCCA, PCCB | autosomal_recessive | severe | 1,350 | Preventable & treatable | textbook_estimate |
| Glutaric aciduria type I | GCDH | autosomal_recessive | severe | 1,350 | Preventable & treatable | textbook_estimate |
| Glycogen storage disease type I (von Gierke) | G6PC1 | autosomal_recessive | serious | 1,350 | Preventable | textbook_estimate |
| Ataxia-telangiectasia | ATM | autosomal_recessive | severe | 1,350 | Preventable | textbook_estimate |
| Congenital nephrotic syndrome (Finnish type) | NPHS1 | autosomal_recessive | severe | 1,350 | Preventable | order_of_magnitude |
| Vascular Ehlers-Danlos syndrome (type IV) | COL3A1 | autosomal_dominant | severe | 1,350 | Preventable | order_of_magnitude |
| X-linked severe combined immunodeficiency | IL2RG | x_linked_recessive | catastrophic | 1,350 | Preventable & treatable | textbook_estimate |
| Choroideremia | CHM | x_linked_recessive | serious | 1,350 | Preventable | order_of_magnitude |
| Isovaleric acidemia | IVD | autosomal_recessive | serious | 945 | Preventable & treatable | textbook_estimate |
| Bardet-Biedl syndrome | BBS1 | autosomal_recessive | serious | 945 | Preventable | order_of_magnitude |
| Maple syrup urine disease | BCKDHA, BCKDHB, DBT | autosomal_recessive | severe | 675 | Preventable & treatable | textbook_estimate |
| Hunter syndrome (MPS II) | IDS | x_linked_recessive | severe | 675 | Preventable & treatable | textbook_estimate |
| Mucopolysaccharidosis IV (Morquio) | GALNS | autosomal_recessive | severe | 675 | Preventable | textbook_estimate |
| Homocystinuria (CBS deficiency) | CBS | autosomal_recessive | serious | 675 | Preventable & treatable | textbook_estimate |
| Fanconi anaemia | FANCA | autosomal_recessive | severe | 675 | Preventable | order_of_magnitude |
| Wiskott-Aldrich syndrome | WAS | x_linked_recessive | severe | 675 | Preventable | textbook_estimate |
| Menkes disease | ATP7A | x_linked_recessive | catastrophic | 675 | Preventable | order_of_magnitude |
| Tay-Sachs disease | HEXA | autosomal_recessive | catastrophic | 540 | Preventable | textbook_estimate |
| Sandhoff disease | HEXB | autosomal_recessive | catastrophic | 405 | Preventable | order_of_magnitude |
| Canavan disease | ASPA | autosomal_recessive | catastrophic | 270 | Preventable | order_of_magnitude |
| Niemann-Pick disease type A | SMPD1 | autosomal_recessive | catastrophic | 270 | Preventable | order_of_magnitude |
| Bloom syndrome | BLM | autosomal_recessive | severe | 135 | Preventable | order_of_magnitude |
