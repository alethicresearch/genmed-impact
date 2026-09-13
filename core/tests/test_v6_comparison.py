import math

import pytest

from denominator.v6_comparison import (
    build_v6_comparison,
    joint_acceptable_fraction,
    minimum_relative_post_correction_lbr,
    post_correction_acceptable_fraction,
    target_nonselection_ratio,
)


def test_target_nonselection_ratio_examples():
    assert target_nonselection_ratio(0.5) == pytest.approx(1.0)
    assert target_nonselection_ratio(0.2) == pytest.approx(4.0)
    assert target_nonselection_ratio(0.05) == pytest.approx(19.0)
    assert target_nonselection_ratio(0.02) == pytest.approx(49.0)


def test_multi_criterion_equal_independent_example():
    u = joint_acceptable_fraction([0.5] * 5)
    assert u == pytest.approx(1 / 32)
    assert target_nonselection_ratio(u) == pytest.approx(31.0)


def test_crossover_identity():
    q = post_correction_acceptable_fraction(0.2, 0.5)
    assert q == pytest.approx(0.6)
    assert minimum_relative_post_correction_lbr(0.2, 0.5) == pytest.approx(1 / 3)


def test_poulton_derived_pathway_metrics():
    out = build_v6_comparison()["realistic_ivf"]["single_centre_pgt_m_a"]
    d = out["derived"]
    assert d["biopsied_embryos_per_stimulated_cycle"] == pytest.approx(2344 / 572)
    assert d["live_birth_per_stimulated_cycle"] == pytest.approx(230 / 572)
    assert d["live_birth_per_transferred_embryo"] == pytest.approx(230 / 513)
    assert d["stimulated_cycles_per_live_birth"] == pytest.approx(572 / 230)
    assert d["biopsied_embryos_per_live_birth"] == pytest.approx(2344 / 230)


def test_disposition_is_not_inferred_as_complement():
    out = build_v6_comparison()["embryo_disposition"]["eshre_2019_2021"]
    assert out["cryopreserved_fraction"] == pytest.approx(1198 / 2576)
    assert "discard" in out["interpretation"]


def test_nonpromotable_boundaries_are_explicit():
    out = build_v6_comparison()
    assert out["gate2_tractability"]["status"] == "not_promotable_as_population_share"
    assert out["dollar_costs"]["status"] == "not_promotable"
