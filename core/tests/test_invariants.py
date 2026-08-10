"""Pipeline invariants (spec §4 tests block).

Run: cd core && python -m pytest -q
"""
from __future__ import annotations

import numpy as np
import pytest

from denominator import (attribution, config, harmonize, model, montecarlo as mc, residual)


@pytest.fixture(scope="module")
def constants():
    return harmonize.load_constants()


@pytest.fixture(scope="module")
def conditions():
    return harmonize.load_conditions()


@pytest.fixture(scope="module")
def rng():
    return np.random.default_rng(1)


N = 3000


# --- sampling ---------------------------------------------------------------------------
def test_proportion_draws_in_unit_interval(rng):
    a = mc.sample_proportion({"value": 0.7, "low": 0.4, "high": 0.9}, N, rng)
    assert a.min() >= 0.0 and a.max() <= 1.0
    assert 0.6 < np.median(a) < 0.8


def test_positive_draws_positive(rng):
    a = mc.sample_positive({"value": 100.0, "low": 50.0, "high": 200.0}, N, rng)
    assert (a > 0).all()
    assert 80 < np.median(a) < 125


# --- burden -----------------------------------------------------------------------------
def test_attribution_monotone(constants, rng):
    births = np.full(N, 135e6)
    incl = attribution.multifactorial_births(births, constants, "inclusive", N, rng)
    herit = attribution.multifactorial_births(births, constants, "heritability_weighted", N, rng)
    excl = attribution.multifactorial_births(births, constants, "exclusive", N, rng)
    assert np.median(incl) > np.median(herit) > np.median(excl)


# --- prevention engine ------------------------------------------------------------------
@pytest.mark.parametrize("cls", ["monogenic", "multifactorial"])
@pytest.mark.parametrize("scen", config.SCENARIOS)
def test_shares_partition(constants, rng, cls, scen):
    access = np.ones(N)
    wf = model.waterfall(constants, cls, scen, access, N, rng)
    # averted-birth fractions + residual must partition [0,1]
    total_averted = sum(wf["averted_birth"][t] for t in config.TOOLS)
    recon = total_averted + wf["residual_birth"]
    assert np.allclose(recon, 1.0, atol=1e-9)
    assert (wf["residual_birth"] >= -1e-9).all() and (wf["residual_birth"] <= 1 + 1e-9).all()
    for t in config.TOOLS:
        assert (wf["averted_birth"][t] >= -1e-9).all()


def test_nbs_averts_no_births_but_averts_burden(constants, rng):
    access = np.ones(N)
    wf = model.waterfall(constants, "monogenic", "ideal", access, N, rng)
    assert np.allclose(wf["averted_birth"]["NBS"], 0.0)
    # burden averted should exceed birth averted because NBS mitigates residual burden
    assert np.median(wf["total_averted_burden"]) >= np.median(wf["total_averted_birth"]) - 1e-9


def test_coverage_monotone(constants, rng):
    access = np.ones(N)
    cur = model.waterfall(constants, "monogenic", "current", access, N, rng)
    ach = model.waterfall(constants, "monogenic", "achievable_2035", access, N, rng)
    ide = model.waterfall(constants, "monogenic", "ideal", access, N, rng)
    assert (np.median(cur["total_averted_birth"])
            < np.median(ach["total_averted_birth"])
            < np.median(ide["total_averted_birth"]))


def test_pnd_toggle_reduces_averted(constants, rng):
    access = np.ones(N)
    on = model.waterfall(constants, "monogenic", "achievable_2035", access, N, rng, pnd_counts=True)
    off = model.waterfall(constants, "monogenic", "achievable_2035", access, N, rng, pnd_counts=False)
    assert np.median(on["total_averted_birth"]) > np.median(off["total_averted_birth"])


# --- residual ---------------------------------------------------------------------------
def test_residual_subset_of_burden(constants, conditions, rng):
    births = np.full(N, 135e6)
    multi = attribution.multifactorial_births(births, constants, "inclusive", N, rng)
    mono = attribution.monogenic_births(births, constants, "def_b", N, rng)
    total = mono + multi
    s1, _ = residual.s1_total(births, conditions, N, rng)
    s2 = residual.s2_total(multi, constants, "permissive", N, rng)
    editable = s1 + s2
    # residual must be a subset of the serious-disease denominator
    assert (editable <= total).all()
    assert np.median(editable / total) < 0.05  # headline: a small residual


def test_s1_lethal_conditions_contribute_near_zero(conditions, rng):
    births = np.full(N, 135e6)
    by = residual.s1_by_condition(births, conditions, N, rng)
    # Tay-Sachs (infantile lethal, survival_to_repro ~0) must contribute ~0 via aa×aa
    assert np.median(by["Tay-Sachs disease"]) < 5


def test_s2_strict_le_permissive(constants, rng):
    births = np.full(N, 135e6)
    multi = attribution.multifactorial_births(births, constants, "inclusive", N, rng)
    strict = residual.s2_total(multi, constants, "strict", N, rng)
    perm = residual.s2_total(multi, constants, "permissive", N, rng)
    assert np.median(strict) < np.median(perm)


# --- program-anchor reproduction (Phase-3 acceptance) -----------------------------------
def test_thalassaemia_anchor_reproduced(constants, rng):
    """Full-coverage monogenic averted-birth fraction should reproduce national thalassaemia
    program outcomes (~90%, tolerance to the cited interval)."""
    frac = model.program_anchor_full_coverage(constants, "monogenic", 4000, rng)
    anchor = constants["program_anchors"]["thalassaemia_major_reduction"]
    assert anchor["low"] <= np.median(frac) <= 1.0
    assert np.median(frac) >= 0.85  # within tolerance of the ~0.90 anchor
