# Project direction — Calculated Impact Framework

**Status:** canonical working direction for the paper, analysis, research page, Normative Explorer, and benchmark programme.

## North star

**Genetic editing should be evaluated as one component of genetic medicine by calculating the medical impact it can uniquely or incrementally achieve, relative to other available and prospective interventions, and by using those calculated consequences to make ethical disagreement more precise.**

The project is not organized around a conclusion that germline editing is either small or important, permissible or impermissible. It asks a prior question: **what can each intervention actually achieve, for whom, at what scale, compared with what alternative, and with what medical, reproductive, technical, resource, access, and ethical consequences?**

The governing sequence is:

**medical problem → numerator → denominator → comparator/alternative → incremental consequences → uncertainty → normative implication**

The broader argumentative movement is:

**spectacle → calculation → comparison → normative evaluation → proportional research and policy**

## What the calculations must preserve

1. **Absolute and relative impact both matter.** A population of ~11,400 births per year can be small relative to global genetic-disease burden and still contain individuals for whom editing could have unusually high marginal clinical value.
2. **Population impact and individual justification are different questions.** Neither substitutes for the other.
3. **The denominator matters.** Claims about editing must be understood within the much larger field of genetic medicine: causal genomic understanding, screening, reproductive medicine, diagnosis, somatic treatment, conventional prevention and therapy, and the infrastructure required to deliver them.
4. **Existing medicine is not one intervention.** PGT-M, prenatal diagnosis, newborn screening, treatment, and population prevention are medically and ethically non-equivalent and must not be collapsed into “addressable by current methods.”
5. **The complement of the editing-relevant domain is not equivalent to “currently selectable” or “currently preventable.”** It is the portion of modeled burden outside the scenario in which germline editing has been assigned distinctive incremental value.
6. **Selection is a comparator with consequences, not a costless baseline.** As the acceptable-embryo fraction falls, selection can require increasing numbers of embryos, retrievals, tests, and transfers. Under multiple independent selection criteria, the acceptable fraction can fall multiplicatively.
7. **Correction has separate burdens.** Editing success, mosaicism, unintended changes, developmental loss, post-edit viability, and heritable uncertainty remain independent considerations even when correction improves reproductive yield.
8. **No selectable unaffected embryo is the clearest present reproductive case for taking correction seriously.** Molecular tractability, embryo performance, and clinical safety remain separate gates and must not be inferred from reproductive need alone.
9. **Current impact does not define the future limit.** Causal genomics, multiplex editing, IVM/IVG, and other technologies can move both the correction and selection frontiers.
10. **Research justification can precede clinical justification.** A reason to develop or study a capability is not equivalent to a reason to use it clinically now.
11. **Prevention, resistance, risk reduction, and enhancement remain distinct.** Ethical urgency must not be borrowed from severe-disease indications to justify weaker applications without separate argument.
12. **The framework does not produce one moral score.** It exposes the quantities on which different ethical arguments depend.

## Calculated impact dimensions

The project should increasingly make the following dimensions explicit rather than leaving them in prose:

- **Population medical impact:** how many people or births are affected, absolutely and relative to an appropriate denominator.
- **Incremental medical impact:** what outcome the intervention adds beyond the best available comparator.
- **Individual clinical impact:** the magnitude and probability of benefit for an eligible family or patient.
- **Reproductive impact:** retrievals, embryos created, embryos satisfying or failing target criteria, transfers, live-birth yield, and disposition where evidence supports it.
- **Technical and safety impact:** tractability, editing performance, mosaicism, unintended effects, developmental loss, and intergenerational uncertainty.
- **Resource impact:** cost, laboratory capacity, procedures, specialist infrastructure, and opportunity cost.
- **Access impact:** the difference between theoretical applicability and realistic coverage, uptake, affordability, and reach.
- **Future impact:** how the comparison changes as causal knowledge, embryo supply, editing capacity, and safety improve.
- **Uncertainty:** intervals, sensitivity, evidence quality, and assumptions sufficient to show how strongly any conclusion can be asserted.

These dimensions may support different normative conclusions. They are not to be summed into a single ethical score unless a future analysis explicitly stipulates and defends a normative aggregation rule.

## Empirical → normative contract

A normative statement in this project should be traceable to at least one of:

1. a calculated quantity;
2. an explicitly supplied normative premise; or
3. a cited ethical, clinical, or policy principle.

The calculation does not determine the ethical answer. Its role is to make clear **what the ethical disagreement is actually about** and how strongly the relevant empirical considerations apply.

## Required template for new analyses

Before a new analysis enters the paper, research page, Explorer, or benchmark suite, record:

**Question / numerator / denominator / comparator / assumptions / uncertainty / normative relevance / status**

If one of these cannot yet be specified, mark it as unresolved rather than allowing interface language or prose to imply more than the analysis establishes.

## Artifact boundaries

- **Paper:** presents the framework, decisive calculations, and the ethical implications those calculations expose. It must stand on its own without the application.
- **Public research page (`genmed-impact`):** interactive exposition and inspection of the project-level analysis. It should mirror the settled paper argument rather than independently redefine it.
- **Normative Explorer:** executable scenario-level implementation of the framework. Deterministic calculations precede generated explanations; the model may explain a frozen calculation object but must not silently recompute it.
- **Benchmark programme:** tests reproducibility, explanation quality, sensitivity, representation effects, and expert/model disagreement. Benchmark cases are not moral answer keys.
- **Analysis pipeline:** remains the empirical source of truth for manuscript-relevant numbers. Explorer outputs become citable paper claims only after promotion to the canonical analysis outputs.

## Anti-drift tests

A revision is drifting if it does any of the following:

- makes “editing is a small niche” or “editing is transformative” the thesis;
- treats a low population percentage as evidence that the affected lives matter less;
- treats strong individual justification as evidence of large population impact;
- says or implies that the non-editing complement is all currently preventable or selectable;
- treats selection as ethically or medically costless because it technically exists;
- treats a favorable correction crossover as proof that editing is clinically or ethically preferable overall;
- uses future polygenic capability as though it were a present clinical fact;
- lets the Explorer, benchmark, or research page redefine the paper’s argument because a new feature or number is available;
- lets an LLM perform deterministic arithmetic or obscure provenance;
- deletes a unique argument merely to simplify presentation.

## Development order

**Direction → manuscript architecture → required analyses → audited manuscript → abstract/conclusion → public research page → Explorer maturation → benchmark/validation → submission compression.**

The application and analysis can develop in parallel, but the paper’s argument remains the controlling intellectual structure until a deliberate revision of this document is approved.