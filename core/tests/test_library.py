"""Invariants for the genetic-disease × intervention library."""
from __future__ import annotations

import pytest

from denominator import harmonize, library

CATEGORIES = {"monogenic_recessive", "monogenic_dominant", "x_linked", "chromosomal", "multifactorial"}
TOOLS = {"CS", "PGT", "PND", "NBS"}


@pytest.fixture(scope="module")
def built():
    return library.build_library(harmonize.load_constants())


def test_library_nonempty(built):
    assert built["rollup"]["n_diseases"] >= 7
    assert len(built["diseases"]) == built["rollup"]["n_diseases"]


SINGLE_GENE = {"monogenic_recessive", "monogenic_dominant", "x_linked"}


def test_every_disease_has_inheritance_and_category(built):
    for d in built["diseases"]:
        assert d["inheritance"], f"{d['id']} missing inheritance"
        assert d["category"] in CATEGORIES, f"{d['id']} bad category {d['category']}"


def test_single_gene_diseases_name_a_gene(built):
    # Chromosomal (whole-chromosome) and multifactorial (many loci) legitimately have no
    # single causal gene; single-gene categories must name at least one.
    for d in built["diseases"]:
        if d["category"] in SINGLE_GENE:
            assert d["genes"], f"{d['id']} ({d['category']}) missing gene"


def test_intervention_shape(built):
    for d in built["diseases"]:
        assert set(d["interventions"].keys()) == TOOLS
        for t in TOOLS:
            assert isinstance(d["interventions"][t]["applicable"], bool)


def test_affected_births_positive(built):
    for d in built["diseases"]:
        assert d["affected_births_per_year"] > 0
    assert built["rollup"]["total_affected_births_per_year"] > 0


def test_ids_unique(built):
    ids = [d["id"] for d in built["diseases"]]
    assert len(ids) == len(set(ids))


def test_gmi_in_range_and_discriminates(built):
    idx = [d["gmi"]["index"] for d in built["diseases"]]
    assert all(0 <= i <= 100 for i in idx)
    # a useful index must actually spread diseases out, not collapse to one value
    assert max(idx) - min(idx) >= 30
    for d in built["diseases"]:
        g = d["gmi"]
        # prevent_score and treat_score are 0-1 weight sums that partition addressed_fraction
        assert abs(g["prevent_score"] + g["treat_score"] - g["addressed_fraction"]) < 1e-6


def test_gmi_treatment_beats_prevention_only():
    from denominator import harmonize
    C = harmonize.load_constants()
    treatable = {"category": "monogenic_recessive",
                 "interventions": {t: {"applicable": True} for t in ["CS", "PGT", "PND", "NBS"]}}
    prevent_only = {"category": "monogenic_recessive",
                    "interventions": {**{t: {"applicable": True} for t in ["CS", "PGT", "PND"]},
                                      "NBS": {"applicable": False}}}
    assert library.compute_gmi(treatable, C)["index"] > library.compute_gmi(prevent_only, C)["index"]


def test_rollup_shares_in_unit_interval(built):
    r = built["rollup"]
    assert 0.0 <= r["share_addressable_by_reproductive_tool"] <= 1.0
    assert 0.0 <= r["cited_incidence_share"] <= 1.0
    assert r["births_editing_unique"] <= r["total_affected_births_per_year"] + 1e-6
    # category sums reconcile to the total
    assert abs(sum(r["by_category"].values()) - r["total_affected_births_per_year"]) < 1.0
