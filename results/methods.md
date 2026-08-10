# Methods — Global Genetic-Disease Burden × Genetic-Medicine Impact

_Auto-generated from the analysis pipeline · Monte-Carlo n=20,000 · pipeline commit `455809b` · model version 3.0._

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
| multifactorial | 2,551,500 |
| monogenic_recessive | 996,030 |
| x_linked | 627,656 |
| monogenic_dominant | 1,989,940 |
| chromosomal | 332,370 |
| **Catalogue total (lower bound)** | **6,497,496** |

The catalogue sum (6,497,496/yr) is a **lower bound** on the full denominator — it covers the highest-burden conditions and rises as the library grows. The calibrated top-down denominator (§5) is the reference total.

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
| Preventable & treatable | 29 | 1,282,270 |
| Preventable | 59 | 2,663,726 |
| Treatable | 3 | 1,603,800 |
| Detectable only | 5 | 677,700 |
| No genetic-medicine option | 1 | 270,000 |
| **Addressable by existing tools** |  | **6,227,496 (96%)** |

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

## 12. Embryo accounting (created / destroyed)

Embryo **selection** (PGT) achieves an unaffected child by creating several embryos and not transferring the affected ones — an intrinsic embryo-loss cost that **editing** (repair one embryo, discard none for disease reasons) does not carry. If a fraction *u* of a couple's embryos are unaffected, the disease-caused embryos discarded per unaffected child under selection is **(1−u)/u**, which diverges as *u*→0 — exactly the S1 "no selectable unaffected embryo" case, where selection is impossible and editing is the only option.

```
Selection: affected embryos discarded / child = (1 − u) / u ;  blastocysts / child ≈ 1/(u·LBR)
Editing:   affected embryos discarded / child = 0            ;  blastocysts / child ≈ 1/LBR
```

| Inheritance (typical at-risk couple) | Unaffected fraction u | Affected embryos discarded / child (selection) |
| --- | ---: | ---: |
| autosomal_recessive | 0.75 | 0.33 |
| autosomal_dominant | 0.50 | 1.00 |
| x_linked_recessive | 0.75 | 0.33 |
| x_linked_dominant | 0.50 | 1.00 |
| chromosomal | 0.45 | 1.22 |
| multifactorial | 0.50 | 1.00 |

**Scale contrast (illustrative):** if every PGT-addressable affected birth in the catalogue (~5,866,536/yr) were averted by *selection*, on the order of **4,022,474 affected embryos would be discarded per year**, versus **~0 under an editing strategy**. This is the normative axis on which editing can be preferable to the selection stack for conditions with few unaffected embryos. (Prenatal diagnosis is a separate moral category — termination of an affected fetus, not embryo discard — and is tracked separately.)

## 13. Uncertainty and sensitivity

All quantities are propagated through a Monte-Carlo of **n=20,000 draws** (Beta for proportions matched by moments; Lognormal for rates and costs with the stated value as median and low/high as ~95% bounds). Ratios and shares are computed per draw, so credible intervals are correct. A deterministic **tornado** swings each judgment call across its range; the parameters that move the uniquely-editable share most, in order:

| Parameter | Editable share range |
| --- | ---: |
| S2 permissive fraction | 0.97% – 3.20% |
| S2 criteria (complex-disease editing) | 0.35% – 1.96% |
| Congenital deafness in/out of S1 | 1.79% – 1.96% |
| Severity definition | 1.91% – 2.04% |
| Attribution stance | 1.84% – 1.96% |
| Multifactorial rate /1000 | 1.95% – 1.96% |

## 14. Key assumptions and judgment calls

Each is an explicit parameter with a documented default (see `ANALYSIS_LOG.md` for dated rationale): severity threshold (§5); attribution stance (§5); penetrance floor for S1; S2 strict vs permissive criteria; tool ordering and whether PND counts as prevention; inclusion of congenital deafness in S1; GMI capability weights (§6); multifactorial technology scenarios and pleiotropy blocks (§9); editing-program cost (§11).

## 15. Limitations

- The disease library is a curated seed of the highest-burden conditions; bottom-up totals are a lower bound until the Orphanet/GBD ingest expands it.
- Several incidence and cost values are `textbook_estimate`/`order_of_magnitude` anchors pending the GBD 2023 and PGS-Catalog pulls; these are flagged in Appendix A.
- S1 allele frequencies are global/ancestry-averaged pending the gnomAD ancestry-weighted pull; regional S1 uses region-specific consanguinity but global allele exposure.
- Multifactorial architecture parameters (h², PRS R², oligo-editable h²) are literature anchors; the viability model estimates genetic tractability, not clinical or ethical permissibility.

## 16. Reproducibility

`make install && make run && make test` regenerates every figure, this document, `results/paper_numbers.json`, and `results/tables.md` from the raw constants and library. `make ingest` pulls the Tier-A sources (see `DATA_NEEDED.md`). The webapp (`make app-build`) is a static, URL-shareable view of the same emitted data.

## Appendix A — Full parameter provenance

| Parameter | Value | Low | High | Source | DOI / page |
| --- | ---: | ---: | ---: | --- | --- |
| `births.global_per_year` | 135000000 | 130000000 | 140000000 | UN World Population Prospects 2024 (annual live births, world, 2023) | https://population.un.org/wpp/ |
| `burden.monogenic_serious_per_1000` |  |  |  | Modell & Darlison 2008; March of Dimes Global Report on Birth Defects  | 10.2471/BLT.06.036673 |
| `burden.multifactorial_serious_per_1000` | 49.0 | 40.0 | 60.0 | GBD 2023 (Congenital birth defects: <1yr birth prevalence ~42/1000, in | https://vizhub.healthdata.org/gbd-result |
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
| `costs.daly_per_severe_monogenic_case` | 20 | 8 | 40 | GBD 2023: congenital birth defects DALYs (54.8M) / <1yr incident cases | https://vizhub.healthdata.org/gbd-result |
| `embryo_accounting.blastocysts_per_ivf_cycle` | 5.0 | 3.0 | 10.0 | usable blastocysts per stimulated IVF cycle (age-dependent) | ESHRE/SART ART registries |
| `embryo_accounting.live_birth_rate_per_transfer` | 0.45 | 0.3 | 0.6 | live-birth rate per single euploid/unaffected blastocyst transfer | SART/ESHRE single-embryo-transfer outcom |
| `embryo_accounting.unaffected_embryo_fraction.autosomal_recessive` | 0.75 | 0.7 | 0.78 |  |  |
| `embryo_accounting.unaffected_embryo_fraction.autosomal_dominant` | 0.5 | 0.45 | 0.55 |  |  |
| `embryo_accounting.unaffected_embryo_fraction.x_linked_recessive` | 0.75 | 0.6 | 0.8 |  |  |
| `embryo_accounting.unaffected_embryo_fraction.x_linked_dominant` | 0.5 | 0.4 | 0.55 |  |  |
| `embryo_accounting.unaffected_embryo_fraction.chromosomal` | 0.45 | 0.2 | 0.7 |  |  |
| `embryo_accounting.unaffected_embryo_fraction.multifactorial` | 0.5 | 0.3 | 0.7 |  |  |
| `program_anchors.thalassaemia_major_reduction` | 0.9 | 0.7 | 0.95 | Cyprus/Sardinia/Greece national thalassaemia programs | 10.2471/BLT.06.036673 |
| `program_anchors.down_syndrome_reduction_nordic` | 0.7 | 0.55 | 0.85 | Denmark/Iceland/Netherlands prenatal screening outcomes | Wald 2018 |

## Appendix B — Disease catalogue

| Disease | Gene(s) | Inheritance | Severity | Births/yr | Status | Incidence basis |
| --- | --- | --- | --- | ---: | --- | --- |
| Congenital heart disease (multifactorial) | — | multifactorial | severe | 1,333,800 | Treatable | cited |
| Sickle cell disease | HBB | autosomal_recessive | severe | 583,200 | Preventable & treatable | cited |
| G6PD deficiency | G6PD | x_linked_recessive | moderate | 540,000 | Preventable & treatable | order_of_magnitude |
| Familial hypercholesterolaemia | LDLR, APOB, PCSK9 | autosomal_dominant | serious | 540,000 | Preventable | textbook_estimate |
| Lynch syndrome | MLH1, MSH2 | autosomal_dominant | serious | 405,000 | Preventable | textbook_estimate |
| Bowen-Conradi syndrome | EMG1 | autosomal_recessive | serious | 379,350 | Preventable | cited |
| Hemoglobin Bart's fetalis syndrome | HBA1, HBA2 | autosomal_recessive | serious | 371,250 | Preventable | cited |
| Hereditary breast and ovarian cancer (BRCA1/2) | BRCA1, BRCA2 | autosomal_dominant | serious | 337,500 | Preventable | textbook_estimate |
| Hypertrophic cardiomyopathy | MYBPC3, MYH7 | autosomal_dominant | serious | 270,000 | Preventable | textbook_estimate |
| Hypospadias | — | multifactorial | moderate | 270,000 | Detectable only | textbook_estimate |
| Infantile hypertrophic pyloric stenosis | — | multifactorial | moderate | 270,000 | No genetic-medicine option | textbook_estimate |
| Amish nemaline myopathy | TNNT1 | autosomal_recessive | serious | 270,000 | Preventable | cited |
| Amish lethal microcephaly | SLC25A19 | autosomal_recessive | serious | 270,000 | Preventable | cited |
| Orofacial clefts (cleft lip/palate) | — | multifactorial | moderate | 195,750 | Detectable only | cited |
| Alpha-thalassaemia | HBA1, HBA2 | autosomal_recessive | severe | 135,000 | Preventable | cited |
| Autosomal dominant polycystic kidney disease | PKD1, PKD2 | autosomal_dominant | serious | 135,000 | Preventable | textbook_estimate |
| Clubfoot (talipes equinovarus) | — | multifactorial | moderate | 135,000 | Treatable | textbook_estimate |
| Developmental dysplasia of the hip | — | multifactorial | moderate | 135,000 | Treatable | textbook_estimate |
| Neural tube defects | MTHFR | multifactorial | severe | 130,950 | Detectable only | cited |
| Beta-thalassaemia | HBB | autosomal_recessive | severe | 108,000 | Preventable | cited |
| Klinefelter syndrome (47,XXY) | — | chromosomal | moderate | 101,250 | Preventable | textbook_estimate |
| Noonan syndrome | BRAF, CBL, KRAS, LZTR1, MRAS, NRAS | autosomal_dominant | serious | 94,500 | Preventable | cited |
| Autosomal recessive spastic ataxia of Charlevoix-Saguenay | SACS | autosomal_recessive | serious | 69,876 | Preventable | cited |
| Long QT syndrome | KCNQ1, KCNH2, SCN5A | autosomal_dominant | serious | 67,500 | Preventable | textbook_estimate |
| Hereditary spherocytosis | ANK1 | autosomal_dominant | moderate | 67,500 | Preventable | textbook_estimate |
| Renal agenesis, unilateral | BMP4, DSTYK, FRAS1, FREM1, FREM2, GREB1L | autosomal_dominant | serious | 67,500 | Preventable | cited |
| Down syndrome (trisomy 21) | — | chromosomal | severe | 64,800 | Preventable | cited |
| Postaxial polydactyly type B | GLI1, GLI3 | autosomal_dominant | serious | 58,725 | Preventable | cited |
| 22q11.2 deletion syndrome (DiGeorge) | TBX1 | chromosomal | serious | 50,625 | Preventable | cited |
| Tetralogy of Fallot | CITED2, FLT4, GATA4, GATA5, GATA6, GDF1 | autosomal_dominant | serious | 45,900 | Preventable | cited |
| Neurofibromatosis type 1 | NF1 | autosomal_dominant | serious | 44,955 | Preventable | cited |
| Gastroschisis | — | multifactorial | serious | 40,500 | Detectable only | textbook_estimate |
| Congenital diaphragmatic hernia | — | multifactorial | severe | 40,500 | Detectable only | cited |
| Cystic fibrosis | CFTR | autosomal_recessive | severe | 33,750 | Preventable & treatable | textbook_estimate |
| Unilateral multicystic dysplastic kidney | HNF1B | autosomal_dominant | serious | 31,320 | Preventable | cited |
| Non-syndromic sagittal craniosynostosis | ALX4, TWIST1 | autosomal_dominant | serious | 27,945 | Preventable | cited |
| Congenital sensorineural deafness (GJB2/DFNB1) | GJB2 | autosomal_recessive | moderate | 27,000 | Preventable & treatable | textbook_estimate |
| Fragile X syndrome | FMR1 | x_linked_dominant | serious | 27,000 | Preventable | textbook_estimate |
| Marfan syndrome | FBN1 | autosomal_dominant | serious | 27,000 | Preventable | textbook_estimate |
| Turner syndrome (45,X) | — | chromosomal | serious | 27,000 | Preventable | textbook_estimate |
| Stüve-Wiedemann syndrome | LIFR | autosomal_recessive | serious | 27,000 | Preventable | cited |
| Non-syndromic posterior hypospadias | AR, MAMLD1 | x_linked_recessive | serious | 25,988 | Preventable | cited |
| Isolated colobomatous microphthalmia | ABCB6, ALDH1A3, GDF3, GDF6, OTX2, PORCN | autosomal_dominant | serious | 25,650 | Preventable | cited |
| Familial dysautonomia | ELP1 | autosomal_recessive | serious | 24,975 | Preventable | cited |
| Alpha-1-antitrypsin deficiency | SERPINA1 | autosomal_recessive | serious | 22,950 | Preventable | cited |
| Edwards syndrome (trisomy 18) | — | chromosomal | catastrophic | 22,545 | Preventable | cited |
| Right isomerism | GDF1 | autosomal_recessive | serious | 22,504 | Preventable | cited |
| Postaxial polydactyly type A | CIBAR1, GLI1, GLI3, IQCE, KIAA0825, ZNF141 | autosomal_recessive | serious | 21,195 | Preventable | cited |
| Microtia | HOXA2 | autosomal_dominant | serious | 20,925 | Preventable | cited |
| Tuberous sclerosis complex | TSC1, TSC2 | autosomal_dominant | serious | 20,250 | Preventable | textbook_estimate |
| Hirschsprung disease | ABCD1, ATP7A, ECE1, EDN3, EDNRB, ERBB2 | autosomal_dominant | serious | 20,250 | Preventable | cited |
| Self-limited infantile epilepsy | KCNQ2, KCNQ3, PRRT2, SCN2A, SCN8A | autosomal_dominant | serious | 19,170 | Preventable | cited |
| Myotonic dystrophy type 1 | DMPK | autosomal_dominant | serious | 16,200 | Preventable | textbook_estimate |
| 1p36 deletion syndrome | — | chromosomal | severe | 16,200 | Preventable | textbook_estimate |
| Haemophilia A | F8 | x_linked_recessive | serious | 15,188 | Preventable | cited |
| Hereditary persistence of fetal hemoglobin-sickle cell disease syndrome | BCL11A, HBB, HBG1, HBG2, KLF1 | autosomal_recessive | serious | 14,310 | Preventable | cited |
| Spinal muscular atrophy | SMN1 | autosomal_recessive | catastrophic | 13,500 | Preventable & treatable | textbook_estimate |
| Familial adenomatous polyposis | APC | autosomal_dominant | severe | 13,500 | Preventable | textbook_estimate |
| Williams syndrome | ELN | chromosomal | serious | 13,500 | Preventable | textbook_estimate |
| Nephroblastoma | BRCA2, CTR9, DIS3L2, GPC3, H19, POU6F2 | autosomal_dominant | serious | 13,500 | Preventable | cited |
| Aplasia cutis congenita | BMS1, DLL4, ITGB4, PLEC, UBA2 | autosomal_dominant | serious | 13,500 | Preventable | cited |
| McKusick-Kaufman syndrome | MKKS | autosomal_recessive | serious | 13,500 | Preventable | cited |
| Septo-optic dysplasia spectrum | ARNT2, FGFR1, HESX1, OTX2, PROKR2, SOX2 | autosomal_dominant | serious | 13,500 | Preventable | cited |
| Duchenne muscular dystrophy | DMD | x_linked_recessive | severe | 13,365 | Preventable & treatable | cited |
| Hemoglobin H disease | HBA1, HBA2 | autosomal_recessive | serious | 11,745 | Preventable | cited |
| Early-onset generalized limb-onset dystonia | EIF2AK2, SHQ1, TOR1A | autosomal_dominant | serious | 11,205 | Preventable | cited |
| Patau syndrome (trisomy 13) | — | chromosomal | catastrophic | 10,800 | Preventable | textbook_estimate |
| Isolated Pierre Robin sequence | SOX9 | autosomal_dominant | serious | 10,800 | Preventable | cited |
| Glycogen storage disease due to glucose-6-phosphatase deficiency type Ib | SLC37A4 | autosomal_recessive | serious | 10,800 | Preventable | cited |
| X-linked adrenal hypoplasia congenita | NR0B1 | x_linked_recessive | serious | 10,800 | Preventable | cited |
| Classic congenital adrenal hyperplasia due to 21-hydroxylase deficiency, salt wasting form | CYP21A2 | autosomal_recessive | serious | 10,125 | Preventable | cited |
| Cystathioninuria | CTH | autosomal_recessive | serious | 9,585 | Preventable | cited |
| Sotos syndrome | APC2, NSD1 | autosomal_dominant | serious | 9,585 | Preventable | cited |
| Medium-chain acyl-CoA dehydrogenase deficiency (MCAD) | ACADM | autosomal_recessive | serious | 9,450 | Preventable & treatable | textbook_estimate |
| Congenital adrenal hyperplasia (21-hydroxylase) | CYP21A2 | autosomal_recessive | serious | 9,450 | Preventable & treatable | cited |
| Huntington disease | HTT | autosomal_dominant | severe | 9,450 | Preventable | textbook_estimate |
| Primary ciliary dyskinesia | DNAH5 | autosomal_recessive | serious | 9,450 | Preventable | textbook_estimate |
| Pendred syndrome | SLC26A4 | autosomal_recessive | moderate | 9,450 | Preventable | textbook_estimate |
| Osteogenesis imperfecta | COL1A1, COL1A2 | autosomal_dominant | serious | 9,450 | Preventable | textbook_estimate |
| Prader-Willi syndrome | — | chromosomal | serious | 9,450 | Preventable | textbook_estimate |
| Angelman syndrome | UBE3A | chromosomal | severe | 9,450 | Preventable | textbook_estimate |
| Fryns syndrome | PIGN | autosomal_recessive | serious | 9,450 | Preventable | cited |
| Non-syndromic metopic craniosynostosis | FGFR1, FREM1 | autosomal_dominant | serious | 9,045 | Preventable | cited |
| Iminoglycinuria | SLC36A2, SLC6A18, SLC6A19, SLC6A20 | autosomal_recessive | serious | 9,004 | Preventable | cited |
| Fabry disease | GLA | x_linked_recessive | serious | 8,991 | Preventable & treatable | cited |
| CHARGE syndrome | CHD7, SEMA3E | autosomal_dominant | serious | 8,775 | Preventable | cited |
| Phenylketonuria (PKU) | PAH | autosomal_recessive | serious | 8,640 | Preventable & treatable | cited |
| Retinoblastoma (heritable) | RB1 | autosomal_dominant | severe | 8,100 | Preventable | cited |
| Isolated split hand-split foot malformation | BTRC, DLX5, DLX6, EPS15L1, FBXW4, SEM1 | autosomal_dominant | serious | 7,290 | Preventable | cited |
| Gorlin syndrome | PTCH1, PTCH2, SUFU | autosomal_dominant | serious | 7,155 | Preventable | cited |
| Short rib-polydactyly syndrome, Verma-Naumoff type | DYNC2H1, DYNC2I1, DYNC2I2, IFT80, WDR35 | autosomal_recessive | serious | 7,020 | Preventable | cited |
| Osteogenesis imperfecta type 1 | COL1A1, COL1A2, MBTPS2, P4HB, SEC24D | autosomal_dominant | serious | 6,966 | Preventable | cited |
| Li-Fraumeni syndrome | TP53 | autosomal_dominant | severe | 6,750 | Preventable | order_of_magnitude |
| Rett syndrome | MECP2 | x_linked_dominant | severe | 6,750 | Preventable | textbook_estimate |
| Progressive myoclonic epilepsy type 1 | CSTB, PRICKLE1, SCARB2 | autosomal_recessive | serious | 6,750 | Preventable | cited |
| Hereditary fructose intolerance | ALDOB | autosomal_recessive | serious | 6,750 | Preventable | cited |
| Autosomal recessive polycystic kidney disease | DZIP1L, PKHD1 | autosomal_recessive | serious | 6,750 | Preventable | cited |
| Isolated hemihyperplasia | H19, IGF2, KCNQ1OT1 | autosomal_dominant | serious | 6,750 | Preventable | cited |
| Hydrolethalus | HYLS1, KIF7 | autosomal_recessive | serious | 6,750 | Preventable | cited |
| Achondroplasia | FGFR3 | autosomal_dominant | moderate | 6,386 | Preventable | cited |
| Cartilage-hair hypoplasia | RMRP | autosomal_recessive | serious | 5,859 | Preventable | cited |
| Neurogenic arthrogryposis multiplex congenita | COL25A1, ERGIC1, SCYL2 | autosomal_recessive | serious | 5,805 | Preventable | cited |
| Posterior urethral valve | BNC2 | autosomal_recessive | serious | 5,569 | Preventable | cited |
| Usher syndrome | MYO7A, USH2A | autosomal_recessive | serious | 5,400 | Preventable | textbook_estimate |
| Meckel syndrome | B9D1, B9D2, CC2D2A, CEP290, CSPP1, MKS1 | autosomal_recessive | serious | 5,400 | Preventable | cited |
| Supravalvular aortic stenosis | ELN | autosomal_dominant | serious | 5,400 | Preventable | cited |
| Lethal congenital contracture syndrome type 1 | GLE1 | autosomal_recessive | serious | 5,346 | Preventable | cited |
| Hartnup disease | CLTRN, SLC6A19 | autosomal_recessive | serious | 5,198 | Preventable | cited |
| Smith-Lemli-Opitz syndrome | DHCR7 | autosomal_recessive | serious | 4,995 | Preventable | cited |
| Hemoglobin C disease | HBB | autosomal_recessive | serious | 4,928 | Preventable | cited |
| Ebstein malformation of the tricuspid valve | MYH7 | autosomal_dominant | serious | 4,725 | Preventable | cited |
| Muenke syndrome | FGFR3 | autosomal_dominant | serious | 4,496 | Preventable | cited |
| Dravet syndrome | GABRA1, GABRG2, PCDH19, SCN1A, SCN1B, SCN2A | autosomal_dominant | serious | 4,455 | Preventable | cited |
| Systemic primary carnitine deficiency | SLC22A5 | autosomal_recessive | serious | 4,320 | Preventable | cited |
| Very long chain acyl-CoA dehydrogenase deficiency | ACADVL | autosomal_recessive | serious | 4,320 | Preventable | cited |
| Hypochondroplasia | FGFR3 | autosomal_dominant | serious | 4,090 | Preventable | cited |
| X-linked adrenoleukodystrophy | ABCD1 | x_linked_recessive | severe | 4,050 | Preventable & treatable | textbook_estimate |
| Von Hippel-Lindau disease | VHL | autosomal_dominant | serious | 4,050 | Preventable | textbook_estimate |
| Cri-du-chat syndrome (5p deletion) | — | chromosomal | severe | 4,050 | Preventable | textbook_estimate |
| Full NF2-related schwannomatosis | NF2 | autosomal_dominant | serious | 4,050 | Preventable | cited |
| Saethre-Chotzen syndrome | FGFR2, FGFR3, TWIST1 | autosomal_dominant | serious | 4,050 | Preventable | cited |
| Classic galactosemia | GALT | autosomal_recessive | serious | 4,050 | Preventable | cited |
| Milroy disease | FLT4 | autosomal_dominant | serious | 4,050 | Preventable | cited |
| Situs inversus totalis | ANKS3, CFAP52, CFAP53, CIROP, CITED2, DNAH9 | autosomal_dominant | serious | 4,050 | Preventable | cited |
| Glycogen storage disease due to acid maltase deficiency, infantile onset | GAA | autosomal_recessive | serious | 4,050 | Preventable | cited |
| Congenital muscular dystrophy, Fukuyama type | FKTN | autosomal_recessive | serious | 3,780 | Preventable | cited |
| Leigh syndrome | IARS2 | autosomal_recessive | serious | 3,780 | Preventable | cited |
| Dicarboxylic aminoaciduria | SLC1A1 | autosomal_recessive | serious | 3,726 | Preventable | cited |
| Histidinemia | HAL | autosomal_recessive | serious | 3,645 | Preventable | cited |
| Becker muscular dystrophy | DMD | x_linked_recessive | serious | 3,645 | Preventable | cited |
| 3-methylcrotonyl-CoA carboxylase deficiency | MCCC1, MCCC2 | autosomal_recessive | serious | 3,578 | Preventable | cited |
| Pompe disease (GSD II) | GAA | autosomal_recessive | severe | 3,375 | Preventable & treatable | textbook_estimate |
| Leber congenital amaurosis | AIPL1, ALMS1, CABP4, CEP290, CRB1, CRX | autosomal_dominant | serious | 3,375 | Preventable | cited |
| 46,XX ovotesticular difference of sex development | NR5A1, SOX9, SRY | autosomal_dominant | serious | 3,375 | Preventable | cited |
| Marden-Walker syndrome | PIEZO2 | autosomal_recessive | serious | 3,375 | Preventable | cited |
| Cholesteryl ester storage disease | LIPA | autosomal_recessive | serious | 3,375 | Preventable | cited |
| Isolated radial hemimelia | LMBR1, SHH | x_linked_recessive | serious | 3,375 | Preventable | cited |
| Gaucher disease type 1 | GBA1, SCARB2 | autosomal_recessive | serious | 3,348 | Preventable | cited |
| Resistance to thyroid hormone due to a mutation in thyroid hormone receptor beta | THRB | autosomal_recessive | serious | 3,334 | Preventable | cited |
| Glycogen storage disease due to liver glycogen phosphorylase deficiency | PYGL | autosomal_recessive | serious | 3,105 | Preventable | cited |
| Wilson disease | ATP7B | autosomal_recessive | serious | 3,038 | Preventable & treatable | cited |
| Peutz-Jeghers syndrome | STK11 | autosomal_dominant | serious | 2,970 | Preventable | cited |
| Congenital glaucoma | CYP1B1, LTBP2, MYOC, TEK | autosomal_dominant | serious | 2,970 | Preventable | cited |
| Legius syndrome | SPRED1 | autosomal_dominant | serious | 2,970 | Preventable | cited |
| Moebius syndrome | PLXND1, REV3L | autosomal_dominant | serious | 2,862 | Preventable | cited |
| Hydranencephaly | NDE1 | autosomal_recessive | serious | 2,835 | Preventable | cited |
| Congenital-onset Steinert myotonic dystrophy | DMPK | autosomal_dominant | serious | 2,835 | Preventable | cited |
| Friedreich ataxia | FXN | autosomal_recessive | severe | 2,700 | Preventable | textbook_estimate |
| Classic galactosemia | GALT | autosomal_recessive | serious | 2,700 | Preventable & treatable | textbook_estimate |
| Methylmalonic acidemia | MMUT | autosomal_recessive | severe | 2,700 | Preventable & treatable | textbook_estimate |
| Zellweger syndrome (peroxisome biogenesis disorder) | PEX1 | autosomal_recessive | catastrophic | 2,700 | Preventable | textbook_estimate |
| Alport syndrome (X-linked) | COL4A5 | x_linked_dominant | serious | 2,700 | Preventable | textbook_estimate |
| Wolf-Hirschhorn syndrome (4p deletion) | — | chromosomal | severe | 2,700 | Preventable | textbook_estimate |
| Familial hemophagocytic lymphohistiocytosis | PRF1, STX11, STXBP2, UNC13D | autosomal_recessive | serious | 2,700 | Preventable | cited |
| Sarcosinemia | SARDH | autosomal_recessive | serious | 2,700 | Preventable | cited |
| Short chain acyl-CoA dehydrogenase deficiency | ACADS | autosomal_recessive | serious | 2,700 | Preventable | cited |
| GRACILE syndrome | BCS1L | autosomal_recessive | serious | 2,700 | Preventable | cited |
| Proximal spinal muscular atrophy type 2 | NAIP, SMN1, SMN2 | autosomal_recessive | serious | 2,700 | Preventable | cited |
| Campomelic dysplasia | SOX9 | autosomal_dominant | serious | 2,531 | Preventable | cited |
| Ornithine transcarbamylase deficiency | OTC | x_linked_recessive | severe | 2,390 | Preventable & treatable | cited |
| Glycogen storage disease due to acid maltase deficiency, late-onset | GAA | autosomal_recessive | serious | 2,362 | Preventable | cited |
| PMM2-CDG | PMM2 | autosomal_recessive | serious | 2,336 | Preventable | cited |
| Lysinuric protein intolerance | SLC7A7 | autosomal_recessive | serious | 2,295 | Preventable | cited |
| Renal agenesis, bilateral | FGF20, GFRA1, GREB1L, ITGA8, RET, WNT9B | autosomal_recessive | serious | 2,295 | Preventable | cited |
| Hydrocephalus with stenosis of the aqueduct of Sylvius | L1CAM | x_linked_recessive | serious | 2,295 | Preventable | cited |
| Haemophilia B | F9 | x_linked_recessive | serious | 2,254 | Preventable | cited |
| Isolated Joubert syndrome | AHI1, ARL13B, ARL3, ARMC9, B9D1, B9D2 | autosomal_recessive | serious | 2,250 | Preventable | cited |
| Walker-Warburg syndrome | B3GALNT2, B4GAT1, COL4A1, CRPPA, DAG1, FKRP | autosomal_recessive | serious | 2,228 | Preventable | cited |
| Biotinidase deficiency | BTD | autosomal_recessive | serious | 2,160 | Preventable & treatable | cited |
| Kennedy disease | AR | x_linked_recessive | serious | 2,160 | Preventable | cited |
| Salla disease | SLC17A5 | autosomal_recessive | serious | 2,146 | Preventable | cited |
| Renal pseudohypoaldosteronism type 1 | NR3C2 | autosomal_dominant | serious | 2,038 | Preventable | cited |
| Metachromatic leukodystrophy | ARSA | autosomal_recessive | severe | 2,025 | Preventable & treatable | textbook_estimate |
| Best vitelliform macular dystrophy | BEST1 | autosomal_dominant | serious | 2,025 | Preventable | cited |
| Mucopolysaccharidosis III (Sanfilippo) | SGSH | autosomal_recessive | severe | 1,890 | Preventable | cited |
| Jeune syndrome | CEP120, DYNC2H1, DYNC2I1, DYNC2I2, DYNC2LI1, IFT140 | autosomal_recessive | serious | 1,890 | Preventable | cited |
| Osteogenesis imperfecta type 4 | COL1A1, COL1A2, CRTAP, FKBP10, MBTPS2, PPIB | autosomal_dominant | serious | 1,822 | Preventable | cited |
| Gaucher disease | GBA | autosomal_recessive | serious | 1,755 | Preventable & treatable | cited |
| Van der Woude syndrome | GRHL3, IRF6 | autosomal_dominant | serious | 1,755 | Preventable | cited |
| Cornelia de Lange syndrome | BRD4, HDAC8, MAU2, NIPBL, RAD21, SMC1A | autosomal_dominant | serious | 1,674 | Preventable | cited |
| Neonatal adrenoleukodystrophy | PEX1, PEX10, PEX11B, PEX12, PEX13, PEX14 | autosomal_recessive | serious | 1,620 | Preventable | cited |
| Congenital alveolar capillary dysplasia | FOXF1 | autosomal_dominant | serious | 1,620 | Preventable | cited |
| Kabuki syndrome | KDM6A, KMT2D | autosomal_dominant | serious | 1,566 | Preventable | cited |
| EEC syndrome | TP63 | autosomal_dominant | serious | 1,498 | Preventable | cited |
| Apert syndrome | FGFR2 | autosomal_dominant | serious | 1,485 | Preventable | cited |
| Ellis-Van Creveld syndrome | DYNC2LI1, EVC, EVC2, GLI1, PRKACA, PRKACB | autosomal_recessive | serious | 1,485 | Preventable | cited |
| Mucopolysaccharidosis I (Hurler) | IDUA | autosomal_recessive | severe | 1,350 | Preventable & treatable | textbook_estimate |
| Canavan disease | ASPA | autosomal_recessive | catastrophic | 1,350 | Preventable | cited |
| Batten disease (juvenile neuronal ceroid lipofuscinosis, CLN3) | CLN3 | autosomal_recessive | catastrophic | 1,350 | Preventable | order_of_magnitude |
| Propionic acidemia | PCCA, PCCB | autosomal_recessive | severe | 1,350 | Preventable & treatable | textbook_estimate |
| Glutaric aciduria type I | GCDH | autosomal_recessive | severe | 1,350 | Preventable & treatable | cited |
| Glycogen storage disease type I (von Gierke) | G6PC1 | autosomal_recessive | serious | 1,350 | Preventable | cited |
| Ataxia-telangiectasia | ATM | autosomal_recessive | severe | 1,350 | Preventable | textbook_estimate |
| Congenital nephrotic syndrome (Finnish type) | NPHS1 | autosomal_recessive | severe | 1,350 | Preventable | order_of_magnitude |
| Vascular Ehlers-Danlos syndrome (type IV) | COL3A1 | autosomal_dominant | severe | 1,350 | Preventable | order_of_magnitude |
| X-linked severe combined immunodeficiency | IL2RG | x_linked_recessive | catastrophic | 1,350 | Preventable & treatable | textbook_estimate |
| Choroideremia | CHM | x_linked_recessive | serious | 1,350 | Preventable | order_of_magnitude |
| Long chain 3-hydroxyacyl-CoA dehydrogenase deficiency | HADHA | autosomal_recessive | serious | 1,350 | Preventable | cited |
| Blue cone monochromatism | OPN1LW, OPN1MW | x_linked_recessive | serious | 1,350 | Preventable | cited |
| Bifunctional enzyme deficiency | EHHADH, HSD17B4 | autosomal_recessive | serious | 1,350 | Preventable | cited |
| Glycogen storage disease due to glycogen debranching enzyme deficiency | AGL | autosomal_recessive | serious | 1,350 | Preventable | cited |
| X-linked centronuclear myopathy | MTM1 | x_linked_recessive | serious | 1,350 | Preventable | cited |
| Nijmegen breakage syndrome | NBN | autosomal_recessive | serious | 1,350 | Preventable | cited |
| Kyphoscoliotic Ehlers-Danlos syndrome due to lysyl hydroxylase 1 deficiency | PLOD1 | autosomal_recessive | serious | 1,350 | Preventable | cited |
| Early infantile developmental and epileptic encephalopathy | ARX, CACNA1E, CASK, CDKL5, DMXL2, GNAO1 | autosomal_dominant | serious | 1,350 | Preventable | cited |
| Mayer-Rokitansky-Küster-Hauser syndrome type 2 | HNF1B, WNT4 | autosomal_dominant | serious | 1,350 | Preventable | cited |
| Glycogen storage disease due to glucose-6-phosphatase deficiency type Ia | G6PC1 | autosomal_recessive | serious | 1,350 | Preventable | cited |
| Primary hyperoxaluria type 1 | AGXT | autosomal_recessive | serious | 1,350 | Preventable | cited |
| Spondyloepiphyseal dysplasia congenita | COL2A1 | autosomal_dominant | serious | 1,350 | Preventable | cited |
| X-linked Emery-Dreifuss muscular dystrophy | EMD, FHL1 | x_linked_recessive | serious | 1,350 | Preventable | cited |
| Glycogen storage disease due to liver phosphorylase kinase deficiency | PHKA2, PHKG2 | autosomal_recessive | serious | 1,350 | Preventable | cited |
| Alternating hemiplegia of childhood | ATP1A2, ATP1A3, CACNA1A, MT-TL2, RHOBTB2, SCN2A | autosomal_dominant | serious | 1,269 | Preventable | cited |
| Tyrosinemia type I | FAH | autosomal_recessive | severe | 1,215 | Preventable & treatable | cited |
| Crouzon syndrome | FGFR2 | autosomal_dominant | serious | 1,215 | Preventable | cited |
| Osteogenesis imperfecta type 3 | BMP1, COL1A1, COL1A2, CREB3L1, CRTAP, FKBP10 | autosomal_dominant | serious | 1,202 | Preventable | cited |
| 3-hydroxy-3-methylglutaric aciduria | HMGCL | autosomal_recessive | serious | 1,080 | Preventable | cited |
| X-linked hypohidrotic ectodermal dysplasia | EDA, EDA2R | x_linked_recessive | serious | 1,012 | Preventable | cited |
| Autosomal recessive malignant osteopetrosis | CLCN7, OSTM1, SNX10, TCIRG1, TNFSF11 | autosomal_recessive | serious | 1,012 | Preventable | cited |
| Congenital adrenal hyperplasia due to 11-beta-hydroxylase deficiency | CYP11B1 | autosomal_recessive | serious | 1,012 | Preventable | cited |
| Congenital adrenal hyperplasia due to cytochrome P450 oxidoreductase deficiency | POR | autosomal_recessive | serious | 1,012 | Preventable | cited |
| Beta-ketothiolase deficiency | ACAT1 | autosomal_recessive | serious | 972 | Preventable | cited |
| Krabbe disease | GALC | autosomal_recessive | catastrophic | 945 | Preventable & treatable | cited |
| Isovaleric acidemia | IVD | autosomal_recessive | serious | 945 | Preventable & treatable | textbook_estimate |
| Bardet-Biedl syndrome | BBS1 | autosomal_recessive | serious | 945 | Preventable | order_of_magnitude |
| Holt-Oram syndrome | TBX5 | autosomal_dominant | serious | 945 | Preventable | cited |
| Alpers-Huttenlocher syndrome | POLG | autosomal_recessive | serious | 945 | Preventable | cited |
| Beta-thalassemia major | HBB | autosomal_recessive | serious | 945 | Preventable | cited |
| Hunter syndrome (MPS II) | IDS | x_linked_recessive | severe | 918 | Preventable & treatable | cited |
| 46,XY difference of sex development due to 17-beta-hydroxysteroid dehydrogenase 3 deficiency | HSD17B3 | autosomal_recessive | serious | 918 | Preventable | cited |
| Maple syrup urine disease | BCKDHA, BCKDHB, DBT | autosomal_recessive | severe | 904 | Preventable & treatable | cited |
| Diamond-Blackfan anemia | ADA2, GATA1, HEATR3, RPL11, RPL15, RPL18 | autosomal_dominant | serious | 904 | Preventable | cited |
| Fructose-1,6-bisphosphatase deficiency | FBP1 | autosomal_recessive | serious | 904 | Preventable | cited |
| Infantile myofibromatosis | NOTCH3, PDGFRB | autosomal_dominant | serious | 904 | Preventable | cited |
| Proximal spinal muscular atrophy type 3 | NAIP, SMN1, SMN2 | autosomal_recessive | serious | 894 | Preventable | cited |
| Larsen syndrome | FLNB | autosomal_dominant | serious | 878 | Preventable | cited |
| Orofaciodigital syndrome type 1 | OFD1 | x_linked_dominant | serious | 878 | Preventable | cited |
| Treacher-Collins syndrome | POLR1B, POLR1C, POLR1D, TCOF1 | autosomal_dominant | serious | 850 | Preventable | cited |
| Incontinentia pigmenti | IKBKG | x_linked_dominant | serious | 837 | Preventable | cited |
| Sjögren-Larsson syndrome | ALDH3A2 | autosomal_recessive | serious | 810 | Preventable | cited |
| Fetal akinesia deformation sequence | DOK7, GLDN, KIF21A, MAGEL2, MUSK, MYOD1 | autosomal_recessive | serious | 810 | Preventable | cited |
| Isolated Klippel-Feil syndrome | GDF3, GDF6, MEOX1 | autosomal_dominant | serious | 810 | Preventable | cited |
| Generalized pseudohypoaldosteronism type 1 | SCNN1A, SCNN1B, SCNN1G | autosomal_recessive | serious | 810 | Preventable | cited |
| X-linked recessive ocular albinism | AP3D1, GPR143 | x_linked_recessive | serious | 783 | Preventable | cited |
| Mucopolysaccharidosis IV (Morquio) | GALNS | autosomal_recessive | severe | 675 | Preventable | textbook_estimate |
| Fanconi anaemia | FANCA | autosomal_recessive | severe | 675 | Preventable | order_of_magnitude |
| Wiskott-Aldrich syndrome | WAS | x_linked_recessive | severe | 675 | Preventable | textbook_estimate |
| Menkes disease | ATP7A | x_linked_recessive | catastrophic | 675 | Preventable | order_of_magnitude |
| Netherton syndrome | SPINK5 | autosomal_recessive | serious | 675 | Preventable | cited |
| Congenital central hypoventilation syndrome | BDNF, EDN3, GDNF, LBX1, MYO1H, PHOX2B | autosomal_dominant | serious | 675 | Preventable | cited |
| Shwachman-Diamond syndrome | DNAJC21, EFL1, SBDS | autosomal_recessive | serious | 675 | Preventable | cited |
| Aarskog-Scott syndrome | FGD1 | autosomal_dominant | serious | 675 | Preventable | cited |
| Thrombocytopenia-absent radius syndrome | RBM8A | autosomal_recessive | serious | 675 | Preventable | cited |
| Holocarboxylase synthetase deficiency | HLCS | autosomal_recessive | serious | 675 | Preventable | cited |
| Congenital tufting enteropathy | EPCAM | autosomal_recessive | serious | 675 | Preventable | cited |
| Congenital dyserythropoietic anemia type I | CDAN1, CDIN1 | autosomal_recessive | serious | 675 | Preventable | cited |
| Argininosuccinic aciduria | ASL | autosomal_recessive | serious | 621 | Preventable | cited |
| Chronic granulomatous disease | CYBA, CYBB, CYBC1, NCF1, NCF2, NCF4 | autosomal_recessive | serious | 621 | Preventable | cited |
| Arginine vasopressin resistance | AQP2, AVPR2 | autosomal_dominant | serious | 594 | Preventable | cited |
| Lesch-Nyhan syndrome | HPRT1 | x_linked_recessive | serious | 580 | Preventable | cited |
| Townes-Brocks syndrome | DACT1, SALL1 | autosomal_dominant | serious | 567 | Preventable | cited |
| Sanfilippo syndrome type B | NAGLU | autosomal_recessive | serious | 567 | Preventable | cited |
| Isolated acheiropodia | LMBR1 | autosomal_recessive | serious | 540 | Preventable | cited |
| Cleidocranial dysplasia | RUNX2 | autosomal_dominant | serious | 540 | Preventable | cited |
| Johanson-Blizzard syndrome | UBR1 | autosomal_recessive | serious | 540 | Preventable | cited |
| Chronic visceral acid sphingomyelinase deficiency | SMPD1 | autosomal_recessive | serious | 540 | Preventable | cited |
| Mucopolysaccharidosis type 2, severe form | IDS | x_linked_recessive | serious | 540 | Preventable | cited |
| Epilepsy of infancy with migrating focal seizures | KCNQ2, KCNT1, PIGA, PLCB1, SCN1A, SCN2A | autosomal_dominant | serious | 540 | Preventable | cited |
| Isolated permanent neonatal diabetes mellitus | ABCC8, GCK, INS, KCNJ11, PDX1, STAT3 | autosomal_dominant | serious | 513 | Preventable | cited |
| Mucolipidosis type II | GNPTAB | autosomal_recessive | serious | 459 | Preventable | cited |
| Sandhoff disease | HEXB | autosomal_recessive | catastrophic | 405 | Preventable | order_of_magnitude |
| Homocystinuria (CBS deficiency) | CBS | autosomal_recessive | serious | 405 | Preventable & treatable | cited |
| Carnitine palmitoyl transferase 1A deficiency | CPT1A | autosomal_recessive | serious | 405 | Preventable | cited |
| Nager syndrome | SF3B4 | autosomal_dominant | serious | 405 | Preventable | cited |
| T-B-NK- severe combined immunodeficiency due to adenosine deaminase deficiency | ADA | autosomal_recessive | serious | 405 | Preventable | cited |
| Mitochondrial neurogastrointestinal encephalomyopathy | LIG3, POLG, RRM2B, TYMP | autosomal_recessive | serious | 405 | Preventable | cited |
| Kearns-Sayre syndrome | MT-ATP8, MT-TL1, RRM2B | autosomal_recessive | serious | 405 | Preventable | cited |
| Diastrophic dysplasia | SLC26A2 | autosomal_recessive | serious | 405 | Preventable | cited |
| Fanconi-Bickel syndrome | SLC2A2 | autosomal_recessive | serious | 405 | Preventable | cited |
| Autosomal recessive generalized dystrophic epidermolysis bullosa, severe form | COL7A1, MMP1 | autosomal_recessive | serious | 405 | Preventable | cited |
| Transient neonatal diabetes mellitus | ABCC8, HYMAI, KCNJ11, PLAGL1, ZFP57 | autosomal_dominant | serious | 405 | Preventable | cited |
| Barth syndrome | TAFAZZIN | x_linked_recessive | serious | 392 | Preventable | cited |
| Tay-Sachs disease | HEXA | autosomal_recessive | catastrophic | 378 | Preventable | cited |
| X-linked agammaglobulinemia | BTK | x_linked_recessive | serious | 351 | Preventable | cited |
| X-linked dominant chondrodysplasia punctata | EBP | x_linked_dominant | serious | 338 | Preventable | cited |
| Mucopolysaccharidosis type 7 | GUSB | autosomal_recessive | serious | 324 | Preventable | cited |
| Hurler-Scheie syndrome | IDUA | autosomal_recessive | serious | 324 | Preventable | cited |
| Xeroderma pigmentosum | DDB2, ERCC2, ERCC3, ERCC4, ERCC5, XPA | autosomal_recessive | serious | 310 | Preventable | cited |
| Glucose-galactose malabsorption | SLC5A1 | autosomal_recessive | serious | 297 | Preventable | cited |
| Sanfilippo syndrome type C | HGSNAT | autosomal_recessive | serious | 284 | Preventable | cited |
| CDKL5-deficiency disorder | CDKL5 | x_linked_dominant | serious | 284 | Preventable | cited |
| Niemann-Pick disease type A | SMPD1 | autosomal_recessive | catastrophic | 270 | Preventable | order_of_magnitude |
| Acrodermatitis enteropathica | SLC39A4 | autosomal_recessive | serious | 270 | Preventable | cited |
| Aspartylglucosaminuria | AGA | autosomal_recessive | serious | 270 | Preventable | cited |
| Seckel syndrome | ATR, ATRIP, CENPE, CEP152, CEP295, CEP63 | autosomal_recessive | serious | 270 | Preventable | cited |
| WAGR syndrome | BDNF, PAX6, WT1 | autosomal_dominant | serious | 270 | Preventable | cited |
| Fraser syndrome | FRAS1, FREM2, GRIP1 | autosomal_recessive | serious | 270 | Preventable | cited |
| Nail-patella syndrome | LMX1B | autosomal_dominant | serious | 270 | Preventable | cited |
| Metatropic dysplasia | TRPV4 | autosomal_dominant | serious | 270 | Preventable | cited |
| Pyridoxine-dependent-developmental and epileptic encephalopathy | ALDH7A1, PLPBP | autosomal_recessive | serious | 270 | Preventable | cited |
| Scheie syndrome | IDUA | autosomal_recessive | serious | 270 | Preventable | cited |
| Hypohidrotic ectodermal dysplasia with immunodeficiency | IKBKG, NFKBIA | autosomal_dominant | serious | 270 | Preventable | cited |
| Carbamoyl-phosphate synthetase 1 deficiency | CPS1 | autosomal_recessive | serious | 256 | Preventable | cited |
| Wolman disease | LIPA | autosomal_recessive | serious | 256 | Preventable | cited |
| Severe generalized junctional epidermolysis bullosa | LAMA3, LAMB3, LAMC2 | autosomal_recessive | serious | 230 | Preventable | cited |
| Severe hereditary thrombophilia due to congenital protein C deficiency | PROC | autosomal_dominant | serious | 216 | Preventable | cited |
| Alkaptonuria | HGD | autosomal_recessive | serious | 202 | Preventable | cited |
| Bartsocas-Papas syndrome | RIPK4 | autosomal_recessive | serious | 202 | Preventable | cited |
| T-B+NK+ severe combined immunodeficiency due to IL-7Ralpha deficiency | IL7R | autosomal_recessive | serious | 202 | Preventable | cited |
| Beta-mannosidosis | MANBA | autosomal_recessive | serious | 189 | Preventable | cited |
| Galactosialidosis | CTSA | autosomal_recessive | serious | 189 | Preventable | cited |
| Free sialic acid storage disease, infantile form | SLC17A5 | autosomal_recessive | serious | 189 | Preventable | cited |
| Trichothiodystrophy | AARS1, CARS1, DBR1, ERCC2, ERCC3, GTF2E2 | autosomal_recessive | serious | 162 | Preventable | cited |
| Bloom syndrome | BLM | autosomal_recessive | severe | 135 | Preventable | order_of_magnitude |
| Fucosidosis | FUCA1 | autosomal_recessive | serious | 135 | Preventable | cited |
| Mucolipidosis type IV | MCOLN1 | autosomal_recessive | serious | 135 | Preventable | cited |
| Sanfilippo syndrome type D | GNS | autosomal_recessive | serious | 135 | Preventable | cited |
| Trichohepatoenteric syndrome | SKIC2, SKIC3 | autosomal_recessive | serious | 135 | Preventable | cited |
| Crouzon syndrome-acanthosis nigricans syndrome | FGFR3 | autosomal_dominant | serious | 135 | Preventable | cited |
| Isolated tibial hemimelia | GLI3 | autosomal_dominant | serious | 135 | Preventable | cited |
| Fibrodysplasia ossificans progressiva | ACVR1 | autosomal_dominant | serious | 117 | Preventable | cited |
| 6-pyruvoyl-tetrahydropterin synthase deficiency | PTS | autosomal_recessive | serious | 115 | Preventable | cited |
| Prolidase deficiency | PEPD | autosomal_recessive | serious | 108 | Preventable | cited |
| Neonatal acute respiratory distress syndrome due to SP-B deficiency | SFTPB | autosomal_recessive | serious | 90 | Preventable | cited |
| Blau syndrome | NOD2 | autosomal_dominant | serious | 81 | Preventable | cited |
| Danon disease | LAMP2 | x_linked_dominant | serious | 68 | Preventable | cited |
| Von Willebrand disease type 3 | VWF | autosomal_recessive | serious | 59 | Preventable | cited |
| Argininemia | ARG1 | autosomal_recessive | serious | 54 | Preventable | cited |
| Hutchinson-Gilford progeria syndrome | LMNA, ZMPSTE24 | autosomal_dominant | serious | 34 | Preventable | cited |
| WHIM syndrome | CXCR4 | autosomal_dominant | serious | 31 | Preventable | cited |
| 15q13.3 microdeletion syndrome | CHRNA7 | autosomal_dominant | serious | 24 | Preventable | cited |
| Mucopolysaccharidosis type 4B | GLB1 | autosomal_recessive | serious | 5 | Preventable | cited |
