"""Parameterized IVF pathway expectations for selection-burden analysis.

The purpose of this module is to replace a single universal "blastocysts per cycle" assumption
with an inspectable stage model. It contains no clinical defaults: every parameter must be
supplied by the caller and can later be bound to age-stratified registry/literature evidence.

The calculations are expectations, not a patient-level prognosis. They assume multiplicative
stage fractions and do not model discrete cycle cancellation, correlations among stages,
transfer order, cumulative frozen transfers, or patient heterogeneity. A later Monte Carlo layer
can propagate distributions through the same contract.
"""
from __future__ import annotations


def _fraction(name: str, value: float, *, positive: bool = False) -> float:
    value = float(value)
    if not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be between 0 and 1 inclusive; got {value}")
    if positive and value == 0.0:
        raise ValueError(f"{name} must be > 0")
    return value


def expected_selection_pathway(
    *,
    oocytes_retrieved_per_cycle: float,
    mature_oocyte_fraction: float,
    fertilization_fraction: float,
    blastocyst_fraction: float,
    testable_fraction: float,
    pre_target_transfer_eligible_fraction: float,
    target_acceptable_fraction: float,
    live_birth_rate_per_acceptable_transfer: float,
) -> dict:
    """Return expectation-level pathway counts for a selection strategy.

    ``pre_target_transfer_eligible_fraction`` is intentionally generic. It can represent the
    fraction remaining after non-target criteria such as embryo quality or, in an explicitly
    PGT-A-inclusive scenario, euploidy. Keeping it separate prevents the model from assuming
    that PGT-M necessarily entails PGT-A.

    ``target_acceptable_fraction`` is the fraction satisfying the genetic criterion under study
    among blastocysts that have passed the preceding stages. The calculation assumes that the
    supplied stage fractions can be multiplied for the scenario being modeled.
    """
    oocytes = float(oocytes_retrieved_per_cycle)
    if oocytes <= 0.0:
        raise ValueError("oocytes_retrieved_per_cycle must be > 0")

    mature = _fraction("mature_oocyte_fraction", mature_oocyte_fraction)
    fertilized = _fraction("fertilization_fraction", fertilization_fraction)
    blast = _fraction("blastocyst_fraction", blastocyst_fraction)
    testable = _fraction("testable_fraction", testable_fraction)
    pre_target = _fraction(
        "pre_target_transfer_eligible_fraction", pre_target_transfer_eligible_fraction
    )
    u = _fraction("target_acceptable_fraction", target_acceptable_fraction)
    lbr = _fraction(
        "live_birth_rate_per_acceptable_transfer",
        live_birth_rate_per_acceptable_transfer,
        positive=True,
    )

    mature_oocytes = oocytes * mature
    fertilized_oocytes = mature_oocytes * fertilized
    blastocysts = fertilized_oocytes * blast
    testable_blastocysts = blastocysts * testable
    pre_target_eligible = testable_blastocysts * pre_target
    target_acceptable = pre_target_eligible * u
    target_based_nonselected = pre_target_eligible * (1.0 - u)
    target_live_births = target_acceptable * lbr

    if target_live_births == 0.0:
        cycles_per_live_birth = None
        oocytes_per_live_birth = None
        blastocysts_per_live_birth = None
        nonselected_per_live_birth = None
        status = "selection_impossible_or_zero_expected_target_yield"
    else:
        cycles_per_live_birth = 1.0 / target_live_births
        oocytes_per_live_birth = oocytes * cycles_per_live_birth
        blastocysts_per_live_birth = blastocysts * cycles_per_live_birth
        nonselected_per_live_birth = target_based_nonselected * cycles_per_live_birth
        status = "expectation_level_selection_pathway"

    return {
        "inputs": {
            "oocytes_retrieved_per_cycle": oocytes,
            "mature_oocyte_fraction": mature,
            "fertilization_fraction": fertilized,
            "blastocyst_fraction": blast,
            "testable_fraction": testable,
            "pre_target_transfer_eligible_fraction": pre_target,
            "target_acceptable_fraction": u,
            "live_birth_rate_per_acceptable_transfer": lbr,
        },
        "per_retrieval_cycle": {
            "mature_oocytes": mature_oocytes,
            "fertilized_oocytes": fertilized_oocytes,
            "blastocysts_created": blastocysts,
            "testable_blastocysts": testable_blastocysts,
            "pre_target_transfer_eligible_blastocysts": pre_target_eligible,
            "target_acceptable_blastocysts": target_acceptable,
            "target_based_nonselected_blastocysts": target_based_nonselected,
            "expected_target_live_births": target_live_births,
        },
        "per_target_live_birth": {
            "retrieval_cycles": cycles_per_live_birth,
            "oocytes_retrieved": oocytes_per_live_birth,
            "blastocysts_created": blastocysts_per_live_birth,
            "target_based_nonselected_blastocysts": nonselected_per_live_birth,
        },
        "selection_possible_for_specified_target": u > 0.0,
        "status": status,
        "assumption_scope": "multiplicative_expectation_model",
        "not_modeled": [
            "patient_level_variance",
            "stage_correlations",
            "cycle_cancellation",
            "transfer_order",
            "cumulative_frozen_transfer_strategy",
            "embryo_disposition",
            "patient_burden_weights",
            "normative_weighting",
        ],
    }
