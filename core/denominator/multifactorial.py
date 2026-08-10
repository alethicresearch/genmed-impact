"""Multifactorial intervention-viability model (liability-threshold).

For each common complex disease, computes how much an intervention could reduce risk:
  * embryo SELECTION (PGT-P): pick the lowest-liability of N sibling embryos on a PRS that
    explains ``prs_r2`` of liability variance.
  * oligo-locus EDITING: edit the few large-effect editable loci carrying ``oligo_editable_h2``
    of liability variance (saturating in the number of edits).

Both reduce expected liability by δ standard deviations; on the liability-threshold model risk
falls from K to 1−Φ(T+δ) where T=Φ⁻¹(1−K). Viability is read off the resulting relative risk
reduction (RRR) against thresholds. Everything is computed per TECHNOLOGY SCENARIO (present vs
near-future), so the viability frontier visibly "ranges ahead" as embryo numbers and edit
multiplexing grow. Deterministic central estimates; architecture uncertainty is documented in
the source YAML and surfaced as intervals there.
"""
from __future__ import annotations

import math
from typing import Any

from scipy.stats import norm

from . import config

MULTI_YAML = config.PKG_DIR / "library" / "multifactorial.yaml"


def _v(node) -> float:
    """Central value of a {value,...} node, or a bare number."""
    if isinstance(node, dict):
        return float(node["value"])
    return float(node)


def expected_extreme_order_stat(n: int) -> float:
    """E[|min|] of n i.i.d. standard normals (Blom approximation). Positive magnitude."""
    n = max(int(n), 1)
    if n == 1:
        return 0.0
    return float(norm.ppf((n - 0.375) / (n + 0.25)))


def liability_rrr(prevalence: float, delta: float) -> float:
    """Relative risk reduction when expected liability drops by ``delta`` SDs."""
    K = min(max(prevalence, 1e-6), 0.999)
    T = norm.ppf(1.0 - K)
    new_risk = 1.0 - norm.cdf(T + max(delta, 0.0))
    return float(max(0.0, 1.0 - new_risk / K))


def selection_delta(prs_r2: float, n_embryos: int, sib_frac: float) -> float:
    """Liability reduction (SDs) from selecting the lowest-risk of n sibling embryos."""
    within_sib_var = max(prs_r2, 0.0) * sib_frac
    return math.sqrt(within_sib_var) * expected_extreme_order_stat(n_embryos)


def editing_delta(oligo_editable_h2: float, n_edits: int, saturation: float) -> float:
    """Liability reduction (SDs) from editing the top large-effect loci (saturating)."""
    realizable = max(oligo_editable_h2, 0.0) * (1.0 - math.exp(-max(n_edits, 0) / saturation))
    return math.sqrt(realizable)


def _verdict(rrr: float, viable: float, marginal: float) -> str:
    if rrr >= viable:
        return "viable"
    if rrr >= marginal:
        return "marginal"
    return "not_viable"


def load_multifactorial() -> dict:
    import yaml

    with open(MULTI_YAML, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def build_multifactorial() -> dict[str, Any]:
    m = load_multifactorial()
    sib_frac = _v(m["sibling_variance_fraction"])
    saturation = _v(m["edit_saturation_loci"])
    v_thr = _v(m["viability_thresholds"]["viable"])
    m_thr = _v(m["viability_thresholds"]["marginal"])
    scenarios = m["tech_scenarios"]

    diseases_out: list[dict] = []
    for d in m["diseases"]:
        K = _v(d["lifetime_prevalence"])
        prs_r2 = _v(d["prs_r2"])
        oligo = _v(d["oligo_editable_h2"])
        pleiotropy = bool(d.get("pleiotropy_caution", False))

        per_scenario: dict[str, Any] = {}
        for skey, s in scenarios.items():
            n_emb = int(_v(s["n_embryos"]))
            n_edit = int(_v(s["n_edits"]))
            d_sel = selection_delta(prs_r2, n_emb, sib_frac)
            d_edit = editing_delta(oligo, n_edit, saturation)
            rrr_sel = liability_rrr(K, d_sel)
            rrr_edit = liability_rrr(K, d_edit)
            edit_verdict = _verdict(rrr_edit, v_thr, m_thr)
            if pleiotropy and edit_verdict != "not_viable":
                edit_verdict = "not_recommended_pleiotropy"
            per_scenario[skey] = {
                "label": s["label"],
                "n_embryos": n_emb,
                "n_edits": n_edit,
                "selection": {"delta": d_sel, "rrr": rrr_sel, "verdict": _verdict(rrr_sel, v_thr, m_thr)},
                "editing": {"delta": d_edit, "rrr": rrr_edit, "verdict": edit_verdict},
            }

        diseases_out.append({
            "id": d["id"],
            "name": d["name"],
            "polygenicity_class": d["polygenicity_class"],
            "heritability": _v(d["heritability"]),
            "lifetime_prevalence": K,
            "prs_r2": prs_r2,
            "oligo_editable_h2": oligo,
            "effective_loci": d.get("effective_loci"),
            "pleiotropy_caution": pleiotropy,
            "notes": d.get("notes"),
            "sources": {
                "heritability": (d["heritability"].get("source") if isinstance(d["heritability"], dict) else None),
                "prs_r2": (d["prs_r2"].get("source") if isinstance(d["prs_r2"], dict) else None),
                "oligo_editable_h2": (d["oligo_editable_h2"].get("source") if isinstance(d["oligo_editable_h2"], dict) else None),
            },
            "scenarios": per_scenario,
        })

    # order by polygenicity (oligogenic → massively polygenic), then by editability
    order = {"oligogenic": 0, "intermediate": 1, "highly_polygenic": 2, "massively_polygenic": 3}
    diseases_out.sort(key=lambda x: (order.get(x["polygenicity_class"], 9), -x["oligo_editable_h2"]))

    def _count(scenario, tool, verdicts):
        return sum(1 for d in diseases_out if d["scenarios"][scenario][tool]["verdict"] in verdicts)

    frontier = {
        scen: {
            "selection_viable": _count(scen, "selection", {"viable"}),
            "selection_viable_or_marginal": _count(scen, "selection", {"viable", "marginal"}),
            "editing_viable": _count(scen, "editing", {"viable"}),
        }
        for scen in scenarios
    }

    return {
        "meta": m.get("meta", {}),
        "n_diseases": len(diseases_out),
        "tech_scenarios": {k: {"label": v["label"]} for k, v in scenarios.items()},
        "viability_thresholds": {"viable": v_thr, "marginal": m_thr},
        "diseases": diseases_out,
        "frontier": frontier,
        "note": (
            "Intervention viability along the polygenicity spectrum, computed on the "
            "liability-threshold model. Selection power grows with embryo number; editing power "
            "depends on how concentrated risk is in editable large-effect loci. The frontier moves "
            "outward from present to near-future tech — but architecture caps editing for "
            "massively polygenic traits regardless of tech, and pleiotropy blocks otherwise-"
            "concentrated targets (e.g. APOE)."
        ),
    }
