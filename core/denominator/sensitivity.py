"""RQ6 deterministic tornado analysis.

Holds every constant at its central value and swings one judgment-call / parameter across its
plausible range, recording the effect on a headline metric (default: the uniquely-editable
share of serious genetic disease). Categorical judgment calls (severity def, attribution
stance, S2 criteria, PND counting) are swung across their discrete options.
"""
from __future__ import annotations

import numpy as np

from . import attribution, model, montecarlo as mc, residual


def _point_editable_share(constants, conditions, *, severity, attribution_stance,
                          s2_criteria, include_contested=True, births_val=None):
    """Single deterministic evaluation of the uniquely-editable share of serious disease."""
    n = 4000  # average out S1 MC noise so the tornado bars are stable
    rng = np.random.default_rng(0)
    if births_val is None:
        births_val = constants["births"]["global_per_year"]["value"]
    births = np.full(n, births_val, dtype=float)

    # central-value burden (use .value directly, no sampling variance)
    mono = births * constants["burden"]["monogenic_serious_per_1000"][severity]["value"] / 1000.0
    multi = (births * constants["burden"]["multifactorial_serious_per_1000"]["value"] / 1000.0
             * constants["attribution"][attribution_stance]["value"])
    total = mono + multi

    s1, _ = residual.s1_total(births, conditions, n, rng, include_contested=include_contested)
    s2 = multi * constants["s2"]["fraction_of_multifactorial"][s2_criteria]["value"]
    editable = s1 + s2
    return float(np.median(editable / total))


def tornado(constants: dict, conditions: dict) -> list[dict]:
    base = _point_editable_share(constants, conditions, severity="def_b",
                                 attribution_stance="inclusive", s2_criteria="permissive")
    rows: list[dict] = []

    # categorical swings
    sev_vals = {s: _point_editable_share(constants, conditions, severity=s,
                                         attribution_stance="inclusive", s2_criteria="permissive")
                for s in ("def_a", "def_b", "def_c")}
    rows.append({"parameter": "Severity definition", "low": min(sev_vals.values()),
                 "high": max(sev_vals.values()), "base": base,
                 "detail": "def_a (narrow) / def_b / def_c (broad)"})

    att_vals = {a: _point_editable_share(constants, conditions, severity="def_b",
                                         attribution_stance=a, s2_criteria="permissive")
                for a in ("inclusive", "heritability_weighted", "exclusive")}
    rows.append({"parameter": "Attribution stance", "low": min(att_vals.values()),
                 "high": max(att_vals.values()), "base": base,
                 "detail": "inclusive / heritability-weighted / exclusive"})

    s2_vals = {c: _point_editable_share(constants, conditions, severity="def_b",
                                        attribution_stance="inclusive", s2_criteria=c)
               for c in ("strict", "permissive")}
    rows.append({"parameter": "S2 criteria (complex-disease editing)", "low": min(s2_vals.values()),
                 "high": max(s2_vals.values()), "base": base, "detail": "strict / permissive"})

    contested_in = _point_editable_share(constants, conditions, severity="def_b",
                                         attribution_stance="inclusive", s2_criteria="permissive",
                                         include_contested=True)
    contested_out = _point_editable_share(constants, conditions, severity="def_b",
                                          attribution_stance="inclusive", s2_criteria="permissive",
                                          include_contested=False)
    rows.append({"parameter": "Congenital deafness in/out of S1",
                 "low": min(contested_in, contested_out), "high": max(contested_in, contested_out),
                 "base": base, "detail": "contested condition included vs excluded"})

    # continuous swings: re-evaluate editable share with a single constant at low/high
    import copy

    def swing(path, label):
        lo_c = copy.deepcopy(constants)
        hi_c = copy.deepcopy(constants)
        node = constants
        for k in path[:-1]:
            node = node[k]
        leaf = node[path[-1]]
        lo_node, hi_node = lo_c, hi_c
        for k in path[:-1]:
            lo_node, hi_node = lo_node[k], hi_node[k]
        lo_node[path[-1]] = {**leaf, "value": leaf["low"]}
        hi_node[path[-1]] = {**leaf, "value": leaf["high"]}
        lo = _point_editable_share(lo_c, conditions, severity="def_b",
                                   attribution_stance="inclusive", s2_criteria="permissive")
        hi = _point_editable_share(hi_c, conditions, severity="def_b",
                                   attribution_stance="inclusive", s2_criteria="permissive")
        rows.append({"parameter": label, "low": min(lo, hi), "high": max(lo, hi),
                     "base": base, "detail": f"{leaf['low']} - {leaf['high']}"})

    swing(["burden", "multifactorial_serious_per_1000"], "Multifactorial rate /1000")
    swing(["s2", "fraction_of_multifactorial", "permissive"], "S2 permissive fraction")

    # rank by absolute swing
    rows.sort(key=lambda r: abs(r["high"] - r["low"]), reverse=True)
    return rows
