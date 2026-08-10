// Shared plain-language glossary. Terms are surfaced inline via <Term> (hover
// definition) and rendered in full as a definition list at the bottom of Methods.
// One clear sentence each — written for a non-specialist reader.

export const GLOSSARY: Record<string, string> = {
  'carrier screening':
    'A test that tells prospective parents whether they carry a recessive disease gene that, if both carry it, could affect a child.',
  PGT: 'Preimplantation genetic testing — testing IVF embryos for a specific genetic condition before one is chosen for pregnancy.',
  'prenatal diagnosis':
    'Testing a pregnancy (e.g. by amniocentesis or CVS) to determine whether the fetus has a genetic condition.',
  'newborn screening':
    'A public-health blood test done shortly after birth to catch treatable conditions early, before symptoms appear.',
  'germline embryo editing':
    'Directly changing the DNA of an embryo so the change is heritable — as opposed to selecting among existing embryos.',
  'embryo selection':
    'Choosing which IVF embryo to transfer based on its genetics, rather than altering any embryo.',
  allele: 'One of the alternative versions of a gene that a person can carry at a given spot in their DNA.',
  recessive:
    'An inheritance pattern where a condition appears only when a person inherits two copies of the disease allele, one from each parent.',
  dominant:
    'An inheritance pattern where a single copy of the disease allele is enough to cause the condition.',
  'X-linked':
    'Caused by a gene on the X chromosome, so the condition affects males and females differently depending on their X copies.',
  penetrance:
    'The fraction of people carrying a disease genotype who actually develop the condition.',
  heritability:
    'The share of variation in a trait across a population that is explained by genetic differences rather than environment.',
  PRS: 'Polygenic risk score — a single number summing thousands of small genetic effects to estimate a person’s genetic risk for a common disease.',
  'polygenic risk score':
    'A single number summing thousands of small genetic effects to estimate a person’s genetic risk for a common disease.',
  'liability threshold':
    'A model in which everyone has an underlying continuous "risk load"; the disease appears once that load crosses a fixed threshold.',
  polygenicity:
    'How many genetic variants contribute to a trait — from a few large-effect genes (oligogenic) to thousands of tiny effects (massively polygenic).',
  'relative risk reduction':
    'The proportional drop in risk from an intervention — e.g. cutting risk from 10% to 7% is a 30% relative risk reduction.',
  RRR: 'Relative risk reduction — the proportional drop in risk, e.g. from 10% to 7% is a 30% RRR.',
  monogenic: 'A disease caused by a variant in a single gene, following a clear inheritance pattern.',
  multifactorial:
    'A disease driven by many genes together with environment, rather than by a single gene.',
  chromosomal:
    'Caused by an extra, missing, or rearranged chromosome (or large chromosome segment), not a single-gene change.',
  'attribution stance':
    'The chosen rule for how much of a multifactorial disease’s burden to count as "genetic" — a judgement call, not a measured fact.',
  'severity threshold':
    'The chosen cut-off for how serious a condition must be to be counted as "serious genetic disease" in the totals.',
  'uncertainty interval':
    'The 2.5th–97.5th percentile range obtained by propagating specified uncertainty through the Monte-Carlo model — not automatically a frequentist confidence interval or a Bayesian posterior credible interval.',
  'technical applicability':
    'A pathway could alter the relevant outcome in principle for a defined disease or population. This does not imply real-world access, uptake, affordability, effectiveness in practice, or ethical acceptability.',
  'actual access':
    'The proportion of eligible people who can realistically obtain and use an intervention in a health system. Technical applicability and actual access are analyzed separately.',
  'affected-birth avoidance':
    'Prevention of an affected birth through a reproductive pathway — the outcome modeled for carrier screening plus reproductive planning, PGT-M, and (only when followed by a decision not to continue an affected pregnancy) prenatal diagnosis.',
  'burden mitigation':
    'Reduction in morbidity, mortality, disability, or other disease consequences after an affected birth occurs. Newborn screening plus early treatment belongs on this track.',
  'editing-only prevention':
    'A modeled reproductive situation in which no unaffected embryo can be selected, so germline editing would provide a preventive route unavailable through embryo selection. This does not imply that no postnatal treatment exists.',
  'potential editing advantage':
    'A modeled situation in which germline editing might provide a medically meaningful benefit beyond selection, treatment, or other alternatives. This is not the same as being the only option.',
  'editing-relevant residual':
    'A summary quantity combining editing-only prevention with an exploratory complex-disease advantage term. Useful for comparing scale, but not a claim that the two components represent the same form of medical need.',
  'reproductive burden':
    'The physical, procedural, embryo-level, and pregnancy-related burdens associated with achieving a reproductive outcome, including IVF cycles, embryo creation and testing, genotype-based non-selection, and pregnancy decisions where relevant. Two interventions can achieve the same disease outcome while imposing very different reproductive burdens.',
  'regulatory arbitrage':
    'The movement of research toward jurisdictions with weaker or less settled oversight when credible pathways are unavailable elsewhere.',
  'ethical arbitrage':
    'Borrowing the moral urgency of a strongly justified use of a technology to support another application with a weaker benefit-to-risk case.',
  'present impact':
    'Medical benefit achievable with interventions available now, accounting separately for technical capability and real-world access.',
  'translational frontier':
    'Applications for which a developing technology may provide a medically distinct benefit sufficiently strong to justify further research, even before clinical readiness is established.',
  'future-capacity scenario':
    'A hypothetical technology configuration used to examine how intervention potential changes if capabilities such as embryo availability, causal inference, and multiplex editing improve. It is a boundary analysis, not a forecast.',
  'polygenic editing':
    'Germline editing of multiple variants intended to alter probabilistic risk for a complex trait or disease rather than correct one highly penetrant pathogenic variant.',
  'not uniquely dependent on germline editing':
    'The complement of the editing-relevant residual: cases for which the analysis does not identify a unique requirement for germline editing. This must not be read as a claim that the same share is preventable by existing medicine.',
  'S1 residual':
    'Internal label for the editing-only prevention population: monogenic cases where no unaffected embryo is available to select.',
  'S2 residual':
    'Internal label for the potential complex-disease editing advantage term — an advantage, not an editing-only population.',
  consanguinity:
    'Reproduction between close biological relatives, which raises the chance both parents carry the same recessive allele.',
  'assortative mating':
    'The tendency of people to pair with partners similar to themselves, which can concentrate genetic risk in offspring.',
  oligogenic:
    'Driven by a small number of genes each with a sizeable effect — the low-polygenicity end of the spectrum.',
  'effective loci':
    'A rough count of how many independent genetic locations meaningfully carry a trait’s heritable risk.',
  pleiotropy:
    'When one gene affects several unrelated traits, so editing it to reduce one risk may disturb others.',
};
