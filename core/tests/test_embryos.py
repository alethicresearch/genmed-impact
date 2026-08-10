"""Invariants for the embryo-accounting layer."""
from __future__ import annotations

import pytest

from denominator import embryos, harmonize, library


@pytest.fixture(scope="module")
def constants():
    return harmonize.load_constants()


def test_selection_cost_rises_as_unaffected_fraction_falls():
    lbr = 0.45
    costs = [embryos.selection_cost(u, lbr)["affected_embryos_discarded_per_child"]
             for u in (0.75, 0.5, 0.25, 0.1, 0.02)]
    assert costs == sorted(costs)  # strictly increasing as u falls
    assert costs[0] < 0.5 and costs[-1] > 40


def test_editing_discards_no_embryos():
    assert embryos.editing_cost(0.45)["affected_embryos_discarded_per_child"] == 0.0


def test_recessive_cheaper_than_dominant(constants):
    rec = embryos.per_disease("autosomal_recessive", True, constants)
    dom = embryos.per_disease("autosomal_dominant", True, constants)
    assert (rec["selection"]["affected_embryos_discarded_per_child"]
            < dom["selection"]["affected_embryos_discarded_per_child"])


def test_build_embryos_curve_and_aggregate(constants):
    lib = library.build_library(constants)
    E = embryos.build_embryos(constants, lib["diseases"])
    # curve is monotone increasing in selection cost as u decreases
    disc = [row["selection_affected_discarded"] for row in E["curve"]]
    assert disc == sorted(disc)
    assert all(row["editing_affected_discarded"] == 0.0 for row in E["curve"])
    # aggregate: selection strategy discards embryos; editing discards none
    agg = E["aggregate"]
    assert agg["affected_embryos_discarded_selection_strategy"] > 0
    assert agg["affected_embryos_discarded_editing_strategy"] == 0.0


def test_every_disease_has_embryo_metric(constants):
    lib = library.build_library(constants)
    for d in lib["diseases"]:
        e = d["embryos"]
        assert e["selection"]["affected_embryos_discarded_per_child"] >= 0
        assert e["editing"]["affected_embryos_discarded_per_child"] == 0.0
