"""Tests for the expectation-level IVF pathway model."""
from __future__ import annotations

import pytest

from denominator import ivf_pathway


def _scenario(**overrides):
    values = {
        "oocytes_retrieved_per_cycle": 10.0,
        "mature_oocyte_fraction": 0.8,
        "fertilization_fraction": 0.75,
        "blastocyst_fraction": 0.5,
        "testable_fraction": 0.95,
        "pre_target_transfer_eligible_fraction": 0.6,
        "target_acceptable_fraction": 0.5,
        "live_birth_rate_per_acceptable_transfer": 0.5,
    }
    values.update(overrides)
    return ivf_pathway.expected_selection_pathway(**values)


def test_pathway_multiplies_declared_stages():
    result = _scenario()
    per_cycle = result["per_retrieval_cycle"]
    assert per_cycle["mature_oocytes"] == pytest.approx(8.0)
    assert per_cycle["fertilized_oocytes"] == pytest.approx(6.0)
    assert per_cycle["blastocysts_created"] == pytest.approx(3.0)
    assert per_cycle["testable_blastocysts"] == pytest.approx(2.85)
    assert per_cycle["pre_target_transfer_eligible_blastocysts"] == pytest.approx(1.71)
    assert per_cycle["target_acceptable_blastocysts"] == pytest.approx(0.855)
    assert per_cycle["expected_target_live_births"] == pytest.approx(0.4275)


def test_lower_target_fraction_increases_retrieval_burden():
    easy = _scenario(target_acceptable_fraction=0.75)
    hard = _scenario(target_acceptable_fraction=0.10)
    assert (
        hard["per_target_live_birth"]["retrieval_cycles"]
        > easy["per_target_live_birth"]["retrieval_cycles"]
    )
    assert (
        hard["per_target_live_birth"]["target_based_nonselected_blastocysts"]
        > easy["per_target_live_birth"]["target_based_nonselected_blastocysts"]
    )


def test_target_zero_is_reported_as_impossible_not_clamped():
    result = _scenario(target_acceptable_fraction=0.0)
    assert result["selection_possible_for_specified_target"] is False
    assert result["per_target_live_birth"]["retrieval_cycles"] is None
    assert result["status"] == "selection_impossible_or_zero_expected_target_yield"


def test_pre_target_eligibility_is_separate_from_target_genotype():
    result = _scenario(pre_target_transfer_eligible_fraction=1.0, target_acceptable_fraction=0.5)
    assert result["inputs"]["pre_target_transfer_eligible_fraction"] == 1.0
    assert result["inputs"]["target_acceptable_fraction"] == 0.5
    assert result["assumption_scope"] == "multiplicative_expectation_model"


def test_disposition_is_not_inferred():
    result = _scenario()
    assert "embryo_disposition" in result["not_modeled"]
    rendered = " ".join(str(result).lower().split())
    assert "destroy" not in rendered
    assert "discard" not in rendered


def test_invalid_inputs_rejected():
    with pytest.raises(ValueError):
        _scenario(oocytes_retrieved_per_cycle=0)
    with pytest.raises(ValueError):
        _scenario(blastocyst_fraction=1.2)
    with pytest.raises(ValueError):
        _scenario(live_birth_rate_per_acceptable_transfer=0)
