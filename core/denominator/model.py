"""RQ2 sequential preventability engine.

Tools compose in causal order CS -> PGT -> PND -> NBS, each acting on the residual of the
last:  remaining_after_t = remaining_before_t * (1 - prevent[c,t] * coverage[t,r,scen]).

Two outcome tracks are carried separately throughout:
  * averted_birth  — CS, PGT, PND only (NBS does not prevent an affected birth).
  * averted_burden — CS, PGT, PND (which avert a birth *and* its burden 1:1) plus NBS, which
                     mitigates the burden of births that still occur (scaled by the treatable
                     fraction of conditions with an effective early-life therapy).

All quantities are *fractions of the class's otherwise-affected births/burden*; multiply by
the class birth count to get absolute numbers. Vectorized over draws.
"""
from __future__ import annotations

import numpy as np

from . import config
from . import montecarlo as mc

BIRTH_TOOLS = ["CS", "PGT", "PND"]


def _coverage(constants: dict, scenario: str, tool: str, access_mult: np.ndarray,
              n: int, rng: np.random.Generator) -> np.ndarray:
    cov = mc.sample_proportion(constants["coverage"][scenario][tool], n, rng)
    return np.clip(cov * access_mult, 0.0, 1.0)


def waterfall(constants: dict, disease_class: str, scenario: str,
              access_mult: np.ndarray, n: int, rng: np.random.Generator,
              pnd_counts: bool = True) -> dict:
    """Compute the CS->PGT->PND->NBS cascade for one disease class + scenario.

    Returns fraction arrays: per-tool averted_birth, per-tool averted_burden, residual_birth,
    residual_burden.
    """
    prevent = constants["prevention_full_coverage"][disease_class]

    remaining_birth = np.ones(n)
    remaining_burden = np.ones(n)
    averted_birth = {}
    averted_burden = {}

    for tool in BIRTH_TOOLS:
        p = mc.sample_proportion(prevent[tool], n, rng)
        cov = _coverage(constants, scenario, tool, access_mult, n, rng)
        eff = p * cov
        if tool == "PND" and not pnd_counts:
            eff = np.zeros(n)
        a_birth = remaining_birth * eff
        remaining_birth = remaining_birth - a_birth
        # preventing a birth averts its burden 1:1
        a_burden = remaining_burden * eff
        remaining_burden = remaining_burden - a_burden
        averted_birth[tool] = a_birth
        averted_burden[tool] = a_burden

    # NBS: mitigates burden of the births that still occur; averts no births.
    nbs = prevent["NBS"]
    p_nbs = mc.sample_proportion(nbs, n, rng)
    cov_nbs = _coverage(constants, scenario, "NBS", access_mult, n, rng)
    treatable = nbs.get("treatable_fraction")
    tf = mc.sample_proportion(treatable, n, rng) if treatable is not None else np.ones(n)
    nbs_eff = p_nbs * cov_nbs * tf
    a_burden_nbs = remaining_burden * nbs_eff
    remaining_burden = remaining_burden - a_burden_nbs
    averted_birth["NBS"] = np.zeros(n)
    averted_burden["NBS"] = a_burden_nbs

    return {
        "averted_birth": averted_birth,
        "averted_burden": averted_burden,
        "residual_birth": remaining_birth,
        "residual_burden": remaining_burden,
        "total_averted_birth": np.ones(n) - remaining_birth,
        "total_averted_burden": np.ones(n) - remaining_burden,
    }


def program_anchor_full_coverage(constants: dict, disease_class: str, n: int,
                                 rng: np.random.Generator) -> np.ndarray:
    """Full-coverage (ideal) averted-birth fraction for a class — used to reproduce national
    program outcomes (thalassaemia ~90%, Down syndrome ~70%) in Phase-3 acceptance tests."""
    ones = np.ones(n)
    wf = waterfall(constants, disease_class, "ideal", ones, n, rng, pnd_counts=True)
    return wf["total_averted_birth"]
