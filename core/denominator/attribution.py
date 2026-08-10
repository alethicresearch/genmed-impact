"""RQ1 burden baseline with genetic attribution for the multifactorial bucket (§3.2).

Produces affected-births-per-year arrays for the monogenic and multifactorial classes under
each severity operationalization (def_a/b/c) and each attribution stance (inclusive /
heritability_weighted / exclusive). The attribution stance scales only the multifactorial
class and — as the spec warns — dominates the headline denominator.
"""
from __future__ import annotations

import numpy as np

from . import montecarlo as mc


def monogenic_births(births: np.ndarray, constants: dict, severity: str,
                     n: int, rng: np.random.Generator) -> np.ndarray:
    rate = mc.sample_positive(constants["burden"]["monogenic_serious_per_1000"][severity], n, rng)
    return births * rate / 1000.0


def multifactorial_births(births: np.ndarray, constants: dict, attribution: str,
                          n: int, rng: np.random.Generator) -> np.ndarray:
    rate = mc.sample_positive(constants["burden"]["multifactorial_serious_per_1000"], n, rng)
    g = mc.sample_proportion(constants["attribution"][attribution], n, rng)
    return births * rate / 1000.0 * g


def burden_grid(births: np.ndarray, constants: dict, severity_defs, attribution_stances,
                n: int, rng: np.random.Generator) -> dict:
    """Return nested dict of arrays: grid[severity][stance] = {mono, multi, total}."""
    grid: dict = {}
    for sev in severity_defs:
        mono = monogenic_births(births, constants, sev, n, rng)
        grid[sev] = {}
        for st in attribution_stances:
            multi = multifactorial_births(births, constants, st, n, rng)
            grid[sev][st] = {"mono": mono, "multi": multi, "total": mono + multi}
    return grid
