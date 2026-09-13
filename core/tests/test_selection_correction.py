"""Tests for the neutral Calculated Impact selection/correction layer."""
from __future__ import annotations

import pytest

from denominator import selection_correction as sc


def test_single_criterion_relation_matches_examples():
    assert sc.selection_metrics(0.5)["target_based_nonselection_per_acceptable_embryo"] == pytest.approx(1.0)
    assert sc.selection_metrics(0.2)["target_based_nonselection_per_acceptable_embryo"] == pytest.approx(4.0)
    assert sc.selection_metrics(0.05)["target_based_nonselection_per_acceptable_embryo"] == pytest.approx(19.0)
    assert sc.selection_metrics(0.02)["target_based_nonselection_per_acceptable_embryo"] == pytest.approx(49.0)


def test_zero_acceptable_fraction_is_explicitly_impossible():
    result = sc.selection_metrics(0.0, 0.45)
    assert result["selection_possible"] is False
    assert result["target_based_nonselection_per_acceptable_embryo"] is None
    assert result["tested_blastocysts_per_target_live_birth"] is None
    assert result["status"] == "selection_impossible_for_specified_target"


def test_live_birth_extension_is_dimensionally_explicit():
    result = sc.selection_metrics(0.5, 0.45)
    assert result["tested_blastocysts_per_target_live_birth"] == pytest.approx(1 / (0.5 * 0.45))
    assert result["target_based_nonselection_per_target_live_birth"] == pytest.approx(1 / 0.45)


def test_five_independent_half_probability_criteria_yield_31_to_1_burden():
    result = sc.multi_criterion_selection_metrics([0.5] * 5)
    assert result["joint_acceptable_fraction"] == pytest.approx(0.03125)
    assert result["target_based_nonselection_per_acceptable_embryo"] == pytest.approx(31.0)
    assert result["criteria_count"] == 5
    assert result["independence_assumed"] is True


def test_nonindependent_criteria_require_joint_model():
    with pytest.raises(ValueError, match="joint probability model"):
        sc.multi_criterion_selection_metrics([0.5, 0.5], assume_independence=False)


def test_correction_relation_does_not_assume_perfect_repair():
    result = sc.correction_metrics(0.1, 0.8)
    assert result["post_correction_target_acceptable_fraction"] == pytest.approx(0.82)
    assert result["fraction_remaining_target_unacceptable"] == pytest.approx(0.18)
    assert result["clinical_or_ethical_verdict"] if "clinical_or_ethical_verdict" in result else None is None


def test_hypothetical_low_u_case_crosses_reproductive_yield_only():
    result = sc.compare_selection_and_correction(
        unaffected_or_acceptable_fraction=0.1,
        selection_live_birth_rate=0.45,
        correction_success=0.8,
        edited_live_birth_rate=0.4,
    )
    assert result["selection_target_live_birth_yield_per_input_blastocyst"] == pytest.approx(0.045)
    assert result["correction_target_live_birth_yield_per_input_blastocyst"] == pytest.approx(0.328)
    assert result["correction_crosses_reproductive_yield_threshold"] is True
    assert result["comparison_scope"] == "reproductive_yield_only"
    assert result["clinical_or_ethical_verdict"] is None
    assert "heritable_safety" in result["not_included"]


def test_correction_can_fail_to_cross_yield_threshold():
    result = sc.compare_selection_and_correction(
        unaffected_or_acceptable_fraction=0.75,
        selection_live_birth_rate=0.55,
        correction_success=0.1,
        edited_live_birth_rate=0.35,
    )
    assert result["correction_crosses_reproductive_yield_threshold"] is False
    assert result["comparison"] == "selection_higher_simplified_reproductive_yield"


def test_u_zero_comparison_preserves_selection_impossibility():
    result = sc.compare_selection_and_correction(0.0, 0.45, 0.8, 0.4)
    assert result["selection"]["selection_possible"] is False
    assert result["correction_target_live_birth_yield_per_input_blastocyst"] == pytest.approx(0.32)
    assert result["comparison"] == "selection_impossible_correction_has_positive_target_yield"


def test_invalid_probabilities_are_rejected():
    with pytest.raises(ValueError):
        sc.selection_metrics(-0.1)
    with pytest.raises(ValueError):
        sc.selection_metrics(1.1)
    with pytest.raises(ValueError):
        sc.correction_metrics(0.5, 1.2)
    with pytest.raises(ValueError):
        sc.compare_selection_and_correction(0.5, 0.0, 0.8, 0.4)


def test_output_terminology_does_not_infer_disposition():
    result = sc.compare_selection_and_correction(0.5, 0.45, 0.5, 0.4)
    rendered_keys = " ".join(str(result).lower().split())
    assert "destroy" not in rendered_keys
    assert "discard" not in rendered_keys
