"""Invariants for the multifactorial intervention-viability model."""
from __future__ import annotations

import pytest

from denominator import multifactorial as mf


@pytest.fixture(scope="module")
def built():
    return mf.build_multifactorial()


def test_rrr_in_unit_interval(built):
    for d in built["diseases"]:
        for s in d["scenarios"].values():
            assert 0.0 <= s["selection"]["rrr"] <= 1.0
            assert 0.0 <= s["editing"]["rrr"] <= 1.0


def test_selection_improves_with_more_embryos():
    # more embryos → larger selection delta → larger RRR (holding disease fixed)
    d_small = mf.selection_delta(0.10, 5, 0.5)
    d_big = mf.selection_delta(0.10, 200, 0.5)
    assert d_big > d_small
    assert mf.liability_rrr(0.20, d_big) > mf.liability_rrr(0.20, d_small)


def test_editing_saturates_and_scales_with_editable_h2():
    # more editable heritability → larger editing delta
    assert mf.editing_delta(0.10, 10, 3.0) > mf.editing_delta(0.01, 10, 3.0)
    # near-zero editable h2 → near-zero delta regardless of edits
    assert mf.editing_delta(0.0, 20, 3.0) == 0.0


def test_frontier_moves_outward(built):
    # near-future selection viability >= present (more embryos never hurts)
    f = built["frontier"]
    assert f["near_future"]["selection_viable_or_marginal"] >= f["present"]["selection_viable_or_marginal"]


def test_massively_polygenic_editing_not_viable(built):
    scz = next(d for d in built["diseases"] if d["id"] == "schizophrenia")
    for s in scz["scenarios"].values():
        # editing a massively polygenic trait is never 'viable', even near-future
        assert s["editing"]["verdict"] != "viable"


def test_pleiotropy_blocks_editing_recommendation(built):
    alz = next(d for d in built["diseases"] if d["id"] == "alzheimers_disease")
    # APOE concentrates risk, but pleiotropy_caution must prevent a plain 'viable' verdict
    for s in alz["scenarios"].values():
        assert s["editing"]["verdict"] in {"not_viable", "not_recommended_pleiotropy", "marginal"}
