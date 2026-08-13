"""Invariants for the impact-funding opportunity markets."""
from __future__ import annotations

import pytest

from denominator import harmonize, library, multifactorial, opportunities

MARKETS = {"impact_now", "translational", "future"}


@pytest.fixture(scope="module")
def built():
    constants = harmonize.load_constants()
    lib = library.build_library(constants)
    mf = multifactorial.build_multifactorial()
    # A minimal residual stand-in keeps this test independent of the Monte-Carlo run.
    residual = {"s1_total": {"median": 11_320.0, "ci95": [4_852.0, 26_109.0]}}
    return opportunities.build_opportunities(constants, lib, residual, mf)


def test_all_three_markets_are_populated(built):
    assert set(built["markets"]) == MARKETS
    for key in MARKETS:
        assert built["markets"][key]["n"] > 0, f"{key} market is empty"


def test_every_opportunity_has_a_costed_impact(built):
    for o in built["opportunities"]:
        assert o["market"] in MARKETS
        assert o["funding_requested"] > 0, f"{o['id']} has no funding ask"
        assert o["expected_impact_per_year"] > 0, f"{o['id']} has no expected impact"
        assert o["cost_per_outcome"] > 0
        # cost_per_outcome must be consistent with the ask and the impact
        assert o["cost_per_outcome"] == pytest.approx(
            o["funding_requested"] / o["expected_impact_per_year"], rel=1e-6)


def test_every_opportunity_states_its_assumptions(built):
    for o in built["opportunities"]:
        assert o["assumptions"], f"{o['id']} states no assumptions"
        assert o["evidence"] in {"High", "Moderate", "Low"}
        assert o["uncertainty"] in {"High", "Moderate", "Low"}


def test_ids_unique(built):
    ids = [o["id"] for o in built["opportunities"]]
    assert len(ids) == len(set(ids))


def test_shared_programmes_are_not_billed_to_one_disease(built):
    """A cohort-wide screening panel must aggregate over the conditions it covers.

    Billing a whole birth cohort against a single disease would overstate cost-per-case and
    double-count the same programme across diseases — the bug this guards against.
    """
    shared = [o for o in built["opportunities"] if o.get("kind") == "shared_programme"]
    assert shared, "expected shared screening programmes"
    for o in shared:
        assert o["n_conditions_covered"] > 1
        assert o["top_conditions"]


def test_research_markets_expose_their_probabilities(built):
    research = [o for o in built["opportunities"]
                if o["market"] in {"translational", "future"}]
    assert research
    for o in research:
        assert 0 < o["p_technical"] <= 1
        assert 0 < o["p_translation"] <= 1
        # probability-weighted impact must not exceed the unweighted addressable burden
        if "addressable_burden_per_year" in o:
            assert o["expected_impact_per_year"] <= o["addressable_burden_per_year"] + 1e-9


def test_market_impacts_are_flagged_non_additive(built):
    """Overlapping opportunities must never be presented as a summable total."""
    for key in MARKETS:
        m = built["markets"][key]
        assert m["impacts_are_additive"] is False
        assert "expected_impact_per_year" not in m, (
            f"{key} exposes a summed impact; overlapping programmes must not be added")


def test_coverage_gain_is_real_and_bounded(built):
    impl = [o for o in built["opportunities"] if o["market"] == "impact_now"]
    for o in impl:
        assert 0 < o["coverage_gain"] <= 1
        assert o["target_coverage"] > o["current_coverage"]
        assert 0 <= o["current_coverage"] <= 1
