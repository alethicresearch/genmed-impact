# Repo handoff — manuscript ↔ analysis

This file is the working contract between the manuscript/normative side and the analysis/research-page side. Its purpose is to keep the paper, calculations, public research page, and private Normative Explorer synchronized without allowing any one surface to redefine the project by accident.

## Read first

1. **`DIRECTION.md`** — canonical intellectual direction and anti-drift contract. If this file or an implementation detail conflicts with `DIRECTION.md`, surface the conflict rather than silently changing the thesis.
2. **`results/paper_numbers.json`** — canonical quantitative surface for manuscript numbers.
3. **`REVIEW_TRACKER.md`** — unresolved author, evidence, and limitation items.
4. **`ANALYSIS_LOG.md`** — analytic decisions and changes.

## 1. Ownership

| Manuscript / normative side | Analysis / research-page side | Shared — coordinate |
|---|---|---|
| manuscript argument, prose, citations | `core/**` pipeline, constants, tests | `DIRECTION.md` |
| section structure and normative interpretation | generated `results/**` outputs | `REVIEW_TRACKER.md` |
| decisions about what calculations belong in the paper | generated `app/public/data/**` | `ANALYSIS_LOG.md` |
| paper-facing figure/table architecture | `app/**` public research page | terminology, benchmark questions, new analysis specifications |

The private companion repository `alethicresearch/gen-med-normativeimpactexplorer` owns the scenario-level Explorer and benchmark development. It consumes reviewed snapshots from this repository. If an Explorer-derived quantity becomes manuscript-relevant, reproduce/promote it here before citing it.

## 2. Never retype a manuscript number

Every quantitative value intended for the manuscript must come from **`results/paper_numbers.json`**. Do not quote a number from a chat, screenshot, README paragraph, or Explorer display when a canonical key exists.

If a new analysis matters to the paper, first expose it through the analysis pipeline and promote the result into `paper_numbers.json` with provenance and tests.

`app/public/data/*.json` may contain richer research-page detail, but it is not the manuscript citation surface unless the relevant quantity has been promoted.

## 3. Generated files

The following are generated and must not be hand-edited:

- `results/paper_numbers.json`
- generated tables/methods outputs under `results/**`
- `app/public/data/*.json`
- generated revision documents under `results/**`

The authors' actual working manuscript is external to this repository. Editing a generated DOCX does not change the source analysis or the author-controlled manuscript.

## 4. Conceptual vocabulary that must not drift

The project now uses the **Calculated Impact Framework**. The controlling sequence is:

**medical problem → numerator → denominator → comparator/alternative → incremental consequences → uncertainty → normative implication**

Preserve these distinctions:

- **Population impact ≠ individual clinical justification.** A small population share can coexist with a very strong individual indication.
- **Existing genetic medicine is not one intervention.** Carrier screening, PGT-M, prenatal diagnosis, newborn screening, somatic treatment, and conventional prevention are medically and ethically non-equivalent.
- **Affected-birth avoidance ≠ burden mitigation.** Prenatal diagnosis reduces affected births only through a reproductive decision; newborn screening prevents no births and may mitigate burden through earlier treatment.
- **Editing-relevant incremental domain** means the modeled population for which germline editing supplies distinctive incremental value under a stated scenario.
- **Outside the modeled editing-relevant domain** is the preferred reader-facing complement. Do **not** describe that complement as all currently selectable, currently preventable, or addressable by existing methods.
- Legacy internal keys such as `addressable_share_of_serious__*` may remain temporarily for compatibility, but their names must not dictate manuscript or UI interpretation.
- **No selectable unaffected embryo** is a reproductive configuration, not proof of technical editability or clinical readiness.
- **Selection is a comparator with consequences.** It can become burdensome before becoming impossible; embryo creation, testing, genotype-based non-selection, retrievals, transfers, cost, and access may all matter.
- **Genotype-based non-selection is not synonymous with embryo destruction.** Final disposition is a separate empirical and normative variable.
- **Correction has independent gates.** Molecular tractability, embryo performance, mosaicism/unintended effects, developmental loss, and heritable safety must not be inferred from reproductive need.
- **Current-evidence and future-capacity scenarios are different scenarios, not a confidence range.** Future polygenic capability is not a present clinical fact.
- **Prevention, resistance, risk reduction, and enhancement remain distinct purposes.**
- **Research justification can precede clinical justification.**
- **No single ethical score.** Calculations expose the quantities on which ethical arguments depend; they do not automatically resolve those arguments.

## 5. Required specification for new analyses

Before adding a new calculation to the paper, page, or Explorer, record:

**Question / numerator / denominator / comparator / assumptions / uncertainty / normative relevance / status**

If one element is unresolved, mark it unresolved. Do not let prose or interface labels silently supply the missing premise.

High-priority work under the current direction includes:

- ClinVar-derived allele spectra and platform tractability for the no-selection population;
- realistic IVF/retrieval/blastocyst/euploidy/transfer distributions;
- selection scaling across realistic inheritance and multiple-criterion configurations;
- correction-crossover sensitivity surfaces;
- resource/cost crossover;
- future movement of both selection capacity (including IVM/IVG) and correction capacity (including multiplex editing);
- uncertainty and evidence-quality representation for each of the above.

## 6. Claims requiring special care

- The no-selectable-unaffected-embryo estimate and the technically tractable subset are **not the same number**.
- Molecular correction being conceivable does not populate embryo-performance or safety gates.
- Contested normative classifications such as deafness must remain separately reportable.
- Strict current-evidence and permissive future-capacity estimates must be named as scenarios.
- Broad multifactorial denominators and adult-onset disease examples require denominator caveats; do not imply the entire burden is literally present at birth.
- Rare-condition estimates can carry very wide propagated uncertainty.
- Funding/program impacts that overlap must not be summed as though mutually exclusive.
- AlphaGenome/Atlas improves interpretation; it does not by itself establish trait-level causal effect sizes, embryo editability, or clinical correction performance.

## 7. Public research page contract

The research page is the interactive exposition of the project-level analysis. It should **mirror the settled manuscript argument rather than independently redefine it**.

The intended reader sequence is:

**Why calculate impact? → How large is the genetic-disease problem? → What can genetic medicine already do? → Where does editing change the medical outcome? → When does selection itself become burdensome? → How might both frontiers move? → What ethical and policy questions follow?**

Do not redesign the public narrative around a new chart, UI feature, or preliminary analysis until the paper-facing meaning is settled.

## 8. Verification before push

```bash
make run
make test
make app-build
```

If an invariant test fails because a new claim conflicts with the project's evidentiary discipline, fix the claim or explicitly revise the contract; do not weaken the test merely to make a build pass.
