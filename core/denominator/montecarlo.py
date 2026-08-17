"""Monte-Carlo sampling utilities.

Every curated constant is a dict ``{value, low, high, ...}`` where ``low``/``high`` are
treated as ~95% plausibility bounds. Proportions (support [0,1]) are drawn from a Beta
matched by moments; positive rates/costs are drawn from a Lognormal with the stated value
as median. A constant with ``low == high == value`` collapses to a point mass.
"""
from __future__ import annotations

import contextlib
from typing import Iterator, Mapping

import numpy as np

Z95 = 1.959963984540054  # standard-normal 97.5th percentile

# When point mode is on, both samplers collapse to the curated central value. This exists so the
# pipeline can be re-run as a plain deterministic calculation and compared against the sampled
# result — it is a diagnostic, never the reported analysis. See uncertainty.py.
_POINT_MODE = False


@contextlib.contextmanager
def point_mode() -> Iterator[None]:
    """Run the enclosed block with every sampler collapsed to its central value."""
    global _POINT_MODE
    prior = _POINT_MODE
    _POINT_MODE = True
    try:
        yield
    finally:
        _POINT_MODE = prior


def in_point_mode() -> bool:
    return _POINT_MODE


def _bounds(param: Mapping) -> tuple[float, float, float]:
    v = float(param["value"])
    lo = float(param.get("low", v))
    hi = float(param.get("high", v))
    if lo > hi:
        lo, hi = hi, lo
    return v, lo, hi


def sample_proportion(param: Mapping, n: int, rng: np.random.Generator) -> np.ndarray:
    """Draw a proportion in [0, 1] from a moment-matched Beta.

    Mean is pinned to ``value``; standard deviation is inferred from the (low, high) span.
    """
    v, lo, hi = _bounds(param)
    v = min(max(v, 0.0), 1.0)
    if _POINT_MODE:
        return np.full(n, v)
    if hi <= lo or v <= 0.0 or v >= 1.0:
        return np.full(n, v)
    sd = (hi - lo) / (2 * Z95)
    max_sd = np.sqrt(v * (1 - v)) * 0.999
    sd = min(sd, max_sd)
    if sd <= 0:
        return np.full(n, v)
    # method of moments for Beta(a, b)
    common = v * (1 - v) / (sd * sd) - 1
    a = v * common
    b = (1 - v) * common
    if a <= 0 or b <= 0:
        return np.full(n, v)
    return rng.beta(a, b, size=n)


def sample_positive(param: Mapping, n: int, rng: np.random.Generator) -> np.ndarray:
    """Draw a positive quantity from a Lognormal with median ``value``."""
    v, lo, hi = _bounds(param)
    if _POINT_MODE:
        return np.full(n, max(v, 0.0))
    if v <= 0:
        return np.full(n, max(v, 0.0))
    if hi <= lo:
        return np.full(n, v)
    mu = np.log(v)
    lo = max(lo, 1e-12)
    sigma = (np.log(hi) - np.log(lo)) / (2 * Z95)
    if sigma <= 0:
        return np.full(n, v)
    return np.exp(rng.normal(mu, sigma, size=n))


def point(param: Mapping) -> float:
    return float(param["value"])


def summarize(arr: np.ndarray) -> dict:
    """Median + 95% credible interval + mean for an output array."""
    arr = np.asarray(arr, dtype=float)
    return {
        "median": float(np.median(arr)),
        "mean": float(np.mean(arr)),
        "ci95": [float(np.percentile(arr, 2.5)), float(np.percentile(arr, 97.5))],
    }
