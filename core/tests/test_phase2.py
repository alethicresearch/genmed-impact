"""Invariants for multi-perspective valuation and realized-impact accounting."""
from __future__ import annotations

import pytest

from denominator import (harmonize, library, multifactorial, opportunities, perspectives,
                         retroactive)


@pytest.fixture(scope="module")
def constants():
    return harmonize.load_constants()


@pytest.fixture(scope="module")
def opps(constants):
    lib = library.build_library(constants)
    mf = multifactorial.build_multifactorial()
    residual = {"s1_total": {"median": 11_320.0, "ci95": [4_852.0, 26_109.0]}}
    return opportunities.build_opportunities(constants, lib, residual, mf)["opportunities"]


@pytest.fixture(scope="module")
def persp(opps):
    return perspectives.build_perspectives(opps)


# ---- perspectives ---------------------------------------------------------------------------

def test_every_opportunity_scored_under_every_perspective(persp, opps):
    assert len(persp["scored"]) == len(opps)
    for s in persp["scored"]:
        assert set(s["scores"]) == set(persp["perspectives"])
        for v in s["scores"].values():
            assert 0.0 <= v <= 100.0


def test_dimension_scores_are_bounded(persp):
    for s in persp["scored"]:
        assert set(s["dimensions"]) == set(persp["dimensions"])
        for v in s["dimensions"].values():
            assert 0.0 <= v <= 1.0


def test_rankings_are_complete_permutations(persp, opps):
    ids = {o["id"] for o in opps}
    for key, order in persp["rankings"].items():
        assert set(order) == ids, f"{key} ranking is not a permutation of the opportunities"
        assert len(order) == len(set(order))


def test_perspectives_are_declared_normative_not_measured(persp):
    """No survey exists; the profiles must present as stated positions with reasoning."""
    assert persp["meta"]["epistemic_status"] == "normative_choice"
    for key, p in persp["perspectives"].items():
        assert p["stance"] and p["rationale"], f"{key} lacks a stated stance/rationale"
        assert p["weights"], f"{key} has no weights"


def test_perspectives_actually_disagree(persp):
    """If every perspective ranked things identically the whole exercise would be pointless."""
    orders = [tuple(v) for v in persp["rankings"].values()]
    assert len(set(orders)) > 1, "all perspectives produced the same ranking"
    assert max(s["disagreement"] for s in persp["scored"]) > 5.0


def test_translational_research_favours_research_over_implementation(persp):
    """The perspective that values distant, option-creating work should say so."""
    top_id = persp["rankings"]["translational_research"][0]
    top = next(s for s in persp["scored"] if s["id"] == top_id)
    assert top["market"] in {"translational", "future"}


def test_population_health_favours_implementation(persp):
    top_id = persp["rankings"]["population_health"][0]
    top = next(s for s in persp["scored"] if s["id"] == top_id)
    assert top["market"] == "impact_now"


def test_contested_list_is_ordered_by_disagreement(persp):
    spreads = [c["disagreement"] for c in persp["most_contested"]]
    assert spreads == sorted(spreads, reverse=True)


# ---- retroactive ----------------------------------------------------------------------------

def test_validation_uses_real_cited_programmes(constants):
    r = retroactive.build_retroactive(constants)
    assert r["validation"], "expected retrospective validation cases"
    for v in r["validation"]:
        assert v["source"], f"{v['key']} has no source"
        assert v["observed_reduction"] > 0
        assert v["modelled_effectiveness"] > 0
        assert v["observed_over_modelled"] == pytest.approx(
            v["observed_reduction"] / v["modelled_effectiveness"], rel=1e-9)


def test_forward_ledger_is_empty_and_says_so(constants):
    """No outcome may be simulated: a fabricated result would read as evidence."""
    r = retroactive.build_retroactive(constants)
    assert r["ledger"] == []
    assert r["meta"]["n_ledger_entries"] == 0
    assert any("empty" in c.lower() for c in r["meta"]["caveats"])


def test_ledger_schema_defines_the_full_loop(constants):
    r = retroactive.build_retroactive(constants)
    schema = r["ledger_schema"]
    assert {"committed", "reported", "derived"} <= set(schema)
    derived = {f["field"] for f in schema["derived"]}
    assert "delivery_ratio" in derived
    assert "realized_cost_per_outcome" in derived
    assert r["retroactive_rules"]


def test_positions_are_grounded_in_named_traditions(persp):
    """Each position must name a real ethical tradition and cite representative work."""
    for key, p in persp["perspectives"].items():
        assert p["tradition"], f"{key} names no ethical tradition"
        assert p["citations"], f"{key} cites nothing"
        for c in p["citations"]:
            assert len(c) > 30, f"{key} has a stub citation: {c!r}"


def test_weights_are_declared_as_our_operationalisation(persp):
    """The cited authors did not publish weight vectors; the site must not imply they did."""
    blob = " ".join(persp["meta"]["caveats"]).lower()
    assert "operationalisation" in blob or "operationalization" in blob
    assert "did not publish" in blob or "not published" in blob or "none of the cited" in blob
