"""Neutral selection-versus-correction calculations for the Calculated Impact Framework.

This module is intentionally narrower than a clinical IVF model. It makes a small set of
reproductive quantities explicit without inferring embryo disposition, germline-editing safety,
or an ethical verdict.

Terminology
-----------
``u``
    Fraction of embryos acceptable with respect to the target genetic criterion/criteria.
``r_s``
    Live-birth probability conditional on transfer of an embryo acceptable under selection.
``c``
    Probability that an embryo otherwise unacceptable for the target genotype becomes
    acceptable *with respect to that target* after a correction attempt. This is not a claim
    about overall embryo-editing safety or clinical readiness.
``r_e``
    Live-birth probability conditional on an embryo being acceptable after the correction
    pathway. Any value supplied here is an explicit scenario input unless independently
    evidence-backed.

Important boundaries
--------------------
* An embryo that is not selected for transfer is not assumed to be destroyed or discarded.
  Cryopreservation, later use, donation, research use and discard are distinct disposition
  categories and require separate data.
* A favorable reproductive-yield crossover does not imply that correction is clinically or
  ethically preferable. Mosaicism, unintended changes, developmental effects, heritable risk,
  resources, access and other consequences remain separate dimensions.
* ``u == 0`` is represented explicitly as selection impossible for the specified target. We do
  not clamp it to a small positive value and thereby manufacture a finite selection burden.
"""
from __future__ import annotations

from math import prod
from typing import Iterable


def _probability(name: str, value: float) -> float:
    """Validate and normalize a probability-like input."""
    value = float(value)
    if not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be between 0 and 1 inclusive; got {value}")
    return value


def _positive_probability(name: str, value: float) -> float:
    """Validate a probability that must be strictly positive."""
    value = _probability(name, value)
    if value == 0.0:
        raise ValueError(f"{name} must be > 0 when a live-birth yield is requested")
    return value


def selection_metrics(
    unaffected_or_acceptable_fraction: float,
    selection_live_birth_rate: float | None = None,
) -> dict:
    """Calculate selection burden for one target criterion or a precomputed joint criterion.

    The deterministic relation ``(1-u)/u`` reports genotype/criterion-based non-selection per
    acceptable embryo. If ``selection_live_birth_rate`` is provided, the function also reports
    a simplified expected number of tested blastocysts and target-based non-selections per
    target live birth.

    The live-birth extension is deliberately a simplified scenario calculation. A realistic
    clinical pathway additionally requires age-specific oocyte yield, fertilization,
    blastulation, euploidy/testability, transfer strategy, attrition and repeated retrievals.
    """
    u = _probability("unaffected_or_acceptable_fraction", unaffected_or_acceptable_fraction)
    r_s = (
        None
        if selection_live_birth_rate is None
        else _positive_probability("selection_live_birth_rate", selection_live_birth_rate)
    )

    if u == 0.0:
        return {
            "acceptable_fraction": 0.0,
            "selection_possible": False,
            "target_based_nonselection_per_acceptable_embryo": None,
            "selection_live_birth_rate": r_s,
            "tested_blastocysts_per_target_live_birth": None,
            "target_based_nonselection_per_target_live_birth": None,
            "status": "selection_impossible_for_specified_target",
        }

    nonselection_per_acceptable = (1.0 - u) / u
    result = {
        "acceptable_fraction": u,
        "selection_possible": True,
        "target_based_nonselection_per_acceptable_embryo": nonselection_per_acceptable,
        "selection_live_birth_rate": r_s,
        "tested_blastocysts_per_target_live_birth": None,
        "target_based_nonselection_per_target_live_birth": None,
        "status": "deterministic_selection_relation",
    }

    if r_s is not None:
        result.update(
            {
                "tested_blastocysts_per_target_live_birth": 1.0 / (u * r_s),
                "target_based_nonselection_per_target_live_birth": (1.0 - u) / (u * r_s),
                "status": "simplified_reproductive_yield_scenario",
            }
        )

    return result


def multi_criterion_selection_metrics(
    criterion_probabilities: Iterable[float],
    selection_live_birth_rate: float | None = None,
    *,
    assume_independence: bool = True,
) -> dict:
    """Calculate the joint acceptable fraction for multiple selection criteria.

    Under the explicitly declared independence model, ``u = Π p_i``. This should not be used
    for linked loci, correlated traits or other dependent criteria without a model for their
    joint distribution. The equal-probability special case implies burden ``p^-n - 1``, which is
    exponential in criterion count; the general single-criterion relation itself is not.
    """
    probabilities = [
        _probability(f"criterion_probabilities[{i}]", value)
        for i, value in enumerate(criterion_probabilities)
    ]
    if not probabilities:
        raise ValueError("criterion_probabilities must contain at least one value")
    if not assume_independence:
        raise ValueError(
            "A joint probability model is required when selection criteria are not assumed independent"
        )

    joint_u = prod(probabilities)
    result = selection_metrics(joint_u, selection_live_birth_rate)
    result.update(
        {
            "criterion_probabilities": probabilities,
            "criteria_count": len(probabilities),
            "joint_acceptable_fraction": joint_u,
            "independence_assumed": True,
        }
    )
    return result


def correction_metrics(
    unaffected_or_acceptable_fraction: float,
    correction_success: float,
    edited_live_birth_rate: float | None = None,
) -> dict:
    """Calculate a simplified target-genotype correction scenario.

    ``q = u + (1-u)c`` is the fraction expected to satisfy the target genetic criterion after
    a correction attempt, assuming embryos already acceptable for the target remain acceptable.
    The function does *not* assume that correction is safe, complete, mosaicism-free or
    clinically ready. Those dimensions must be represented separately.
    """
    u = _probability("unaffected_or_acceptable_fraction", unaffected_or_acceptable_fraction)
    c = _probability("correction_success", correction_success)
    q = u + (1.0 - u) * c

    result = {
        "baseline_acceptable_fraction": u,
        "correction_success": c,
        "post_correction_target_acceptable_fraction": q,
        "fraction_requiring_target_correction": 1.0 - u,
        "fraction_remaining_target_unacceptable": (1.0 - u) * (1.0 - c),
        "edited_live_birth_rate": None,
        "target_live_birth_yield_per_input_blastocyst": None,
        "tested_blastocysts_per_target_live_birth": None,
        "status": "target_correction_relation_only",
    }

    if edited_live_birth_rate is not None:
        r_e = _positive_probability("edited_live_birth_rate", edited_live_birth_rate)
        yield_per_input = q * r_e
        result.update(
            {
                "edited_live_birth_rate": r_e,
                "target_live_birth_yield_per_input_blastocyst": yield_per_input,
                "tested_blastocysts_per_target_live_birth": (
                    None if yield_per_input == 0.0 else 1.0 / yield_per_input
                ),
                "status": "simplified_correction_yield_scenario",
            }
        )

    return result


def compare_selection_and_correction(
    unaffected_or_acceptable_fraction: float,
    selection_live_birth_rate: float,
    correction_success: float,
    edited_live_birth_rate: float,
) -> dict:
    """Compare simplified reproductive yield under selection and correction.

    The crossover is defined only on reproductive yield:

        correction yield > selection yield
        q * r_e > u * r_s

    It is *not* a clinical recommendation or ethical verdict. The returned object states this
    explicitly so downstream interfaces cannot safely present the boolean without its scope.
    """
    u = _probability("unaffected_or_acceptable_fraction", unaffected_or_acceptable_fraction)
    r_s = _positive_probability("selection_live_birth_rate", selection_live_birth_rate)
    c = _probability("correction_success", correction_success)
    r_e = _positive_probability("edited_live_birth_rate", edited_live_birth_rate)

    selection = selection_metrics(u, r_s)
    correction = correction_metrics(u, c, r_e)

    selection_yield = u * r_s
    correction_yield = correction["post_correction_target_acceptable_fraction"] * r_e

    if u == 0.0:
        crossover = correction_yield > 0.0
        comparison = (
            "selection_impossible_correction_has_positive_target_yield"
            if crossover
            else "neither_path_has_positive_target_yield"
        )
    elif correction_yield > selection_yield:
        crossover = True
        comparison = "correction_higher_simplified_reproductive_yield"
    elif correction_yield < selection_yield:
        crossover = False
        comparison = "selection_higher_simplified_reproductive_yield"
    else:
        crossover = False
        comparison = "equal_simplified_reproductive_yield"

    return {
        "selection": selection,
        "correction": correction,
        "selection_target_live_birth_yield_per_input_blastocyst": selection_yield,
        "correction_target_live_birth_yield_per_input_blastocyst": correction_yield,
        "correction_crosses_reproductive_yield_threshold": crossover,
        "comparison": comparison,
        "comparison_scope": "reproductive_yield_only",
        "clinical_or_ethical_verdict": None,
        "not_included": [
            "mosaicism",
            "unintended_edits",
            "developmental_effects",
            "heritable_safety",
            "full_ivf_pathway",
            "embryo_disposition",
            "resource_cost",
            "access",
            "normative_weighting",
        ],
    }
