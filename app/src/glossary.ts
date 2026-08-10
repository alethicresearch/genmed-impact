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
  'credible interval':
    'A Bayesian range (here 95%) that the true value is expected to fall within given the model and its inputs.',
  'S1 residual':
    'Monogenic cases where no unaffected embryo is available to select, so germline editing would be the only preventive option.',
  'S2 residual':
    'Complex-disease cases that could be reached only by germline editing, not by any existing screening or selection tool.',
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
