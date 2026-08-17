"""Invariants for the point-mode comparison.

The comparison exists to show why sampling is not decoration. These tests pin the properties
that make it honest: point mode must be a genuine collapse to the curated central values, it
must never leak into the reported analysis, and its figures must be computed rather than typed.
"""
from __future__ import annotations

import re
from pathlib import Path

import numpy as np
import pytest

from denominator import montecarlo as mc, run as runmod, uncertainty

PARAM = {"value": 0.4, "low": 0.1, "high": 0.8}


def test_point_mode_collapses_both_samplers():
    rng = np.random.default_rng(0)
    with mc.point_mode():
        prop = mc.sample_proportion(PARAM, 32, rng)
        pos = mc.sample_positive({"value": 5.0, "low": 1.0, "high": 20.0}, 32, rng)
    assert np.all(prop == 0.4)
    assert np.all(pos == 5.0)


def test_point_mode_does_not_leak():
    """A sampled run after a point-mode block must still be stochastic."""
    rng = np.random.default_rng(0)
    with mc.point_mode():
        mc.sample_proportion(PARAM, 8, rng)
    assert not mc.in_point_mode()
    assert np.std(mc.sample_proportion(PARAM, 512, rng)) > 0


def test_point_mode_restores_on_exception():
    with pytest.raises(RuntimeError):
        with mc.point_mode():
            raise RuntimeError("boom")
    assert not mc.in_point_mode()


@pytest.fixture(scope="module")
def built():
    return runmod.run(n=400)["uncertainty"]


def test_comparison_is_present_and_computed(built):
    assert built["headline"], "no headline comparison was produced"
    for row in built["headline"]:
        assert row["sampled_median"] is not None and row["point_value"] is not None
        if row["divergence"] is not None:
            expected = (row["point_value"] - row["sampled_median"]) / abs(row["sampled_median"])
            assert row["divergence"] == pytest.approx(expected, rel=1e-9)


def test_births_barely_move_but_a_skewed_quantity_does(built):
    """The whole point: agreement on the top line, divergence where the skew lives."""
    by_path = {r["path"]: r for r in built["headline"]}
    assert abs(by_path["births_per_year"]["divergence"]) < 0.01
    assert abs(by_path["residual.s2.strict"]["divergence"]) > 0.5


def test_interval_width_concentrates_in_the_rare_conditions(built):
    """Reported as a finding on the page, so it must hold in the data."""
    conds = built["conditions"]
    assert len(conds) >= 4
    assert conds == sorted(conds, key=lambda c: c["sampled_median"])
    rarest_half = [c["spread"] for c in conds[: len(conds) // 2] if c["spread"]]
    commonest_half = [c["spread"] for c in conds[len(conds) // 2:] if c["spread"]]
    assert max(commonest_half) < max(rarest_half), (
        "the widest interval should sit among the rarer conditions")


def test_point_values_are_never_exported_as_results():
    """Point mode is a diagnostic. It must not appear in the paper-facing numbers."""
    flat = Path(__file__).resolve().parents[2] / "results" / "paper_numbers.json"
    if flat.exists():
        assert "point_value" not in flat.read_text()


def test_no_divergence_figures_are_hard_coded_in_the_app():
    """The comparison must be read from the pipeline output, not typed into a view."""
    src = Path(__file__).resolve().parents[2] / "app" / "src"
    banned = re.compile(r"(divergence|point_value|spread)\s*[:=]\s*[0-9]")
    for path in src.rglob("*.tsx"):
        assert banned.search(path.read_text()) is None, f"a comparison figure is literal in {path.name}"
