"""Why the analysis samples instead of multiplying central values through.

A reader can reasonably ask what the Monte-Carlo layer buys, given that every input already has
a curated central value. This module answers that empirically rather than rhetorically: it
re-runs the whole pipeline in point mode — every sampler collapsed to its central value — and
compares the result against the sampled medians.

Nothing here is reported as a finding of the paper. The point-mode figures are a diagnostic
showing where a straight calculation would and would not agree with the analysis, and every
number in the comparison is computed, never asserted.
"""
from __future__ import annotations

from typing import Any, Mapping

# Quantities the comparison reports, in reading order. Each is a dotted path into the results
# tree and a label; the point-mode value and the divergence are computed, not stored.
HEADLINE_PATHS: list[tuple[str, str, str]] = [
    ("births_per_year", "Annual global live births", "int"),
    ("residual.s1_total", "No unaffected embryo selectable (S1)", "int"),
    ("residual.s2.strict", "Complex-disease advantage — strict (S2)", "int"),
    ("residual.s2.permissive", "Complex-disease advantage — permissive (S2)", "int"),
    ("residual.uniquely_editable_total.strict", "Editing-relevant residual — strict", "int"),
    ("residual.uniquely_editable_share_of_serious.strict",
     "Editing-relevant share of serious disease — strict", "pct"),
    ("residual.addressable_share_of_serious.strict",
     "Addressable by existing tools — strict", "pct"),
]


def _dig(tree: Mapping, path: str) -> Any:
    node: Any = tree
    for key in path.split("."):
        if not isinstance(node, Mapping) or key not in node:
            return None
        node = node[key]
    return node


def _median(node: Any) -> float | None:
    if isinstance(node, Mapping) and "median" in node:
        return float(node["median"])
    return None


def _divergence(sampled: float, point: float) -> float | None:
    """Point value as a relative difference from the sampled median."""
    if sampled == 0:
        return None
    return (point - sampled) / abs(sampled)


def _spread(node: Mapping) -> float | None:
    """Ratio of the interval's upper bound to its lower bound — a scale-free width."""
    lo, hi = node.get("ci95", [None, None])
    if lo is None or hi is None or lo <= 0:
        return None
    return float(hi) / float(lo)


def build_uncertainty(sampled: Mapping, point: Mapping) -> dict[str, Any]:
    """Compare a sampled run against the same pipeline run in point mode."""
    headline: list[dict[str, Any]] = []
    for path, label, kind in HEADLINE_PATHS:
        s_node, p_node = _dig(sampled, path), _dig(point, path)
        s_med, p_med = _median(s_node), _median(p_node)
        if s_med is None or p_med is None:
            continue
        headline.append({
            "path": path,
            "label": label,
            "kind": kind,
            "sampled_median": s_med,
            "point_value": p_med,
            "divergence": _divergence(s_med, p_med),
            "ci95": list(s_node.get("ci95", [])),
            "spread": _spread(s_node),
        })

    # Per-condition S1: the place where the two calculations part company, and where the
    # interval is widest. Sorted by frequency so the relationship with rarity is legible.
    s_conds = _dig(sampled, "residual.s1_by_condition") or {}
    p_conds = _dig(point, "residual.s1_by_condition") or {}
    conditions: list[dict[str, Any]] = []
    for name, s_node in s_conds.items():
        s_med, p_med = _median(s_node), _median(p_conds.get(name))
        if s_med is None or p_med is None or s_med <= 0:
            continue
        conditions.append({
            "condition": name,
            "sampled_median": s_med,
            "point_value": p_med,
            "divergence": _divergence(s_med, p_med),
            "ci95": list(s_node.get("ci95", [])),
            "spread": _spread(s_node),
        })
    conditions.sort(key=lambda c: c["sampled_median"])

    spreads = [c for c in conditions if c["spread"] is not None]
    widest = max(spreads, key=lambda c: c["spread"], default=None)
    narrowest = min(spreads, key=lambda c: c["spread"], default=None)
    worst = max((h for h in headline if h["divergence"] is not None),
                key=lambda h: abs(h["divergence"]), default=None)
    closest = min((h for h in headline if h["divergence"] is not None),
                  key=lambda h: abs(h["divergence"]), default=None)

    return {
        "headline": headline,
        "conditions": conditions,
        "widest_condition": widest,
        "narrowest_condition": narrowest,
        "largest_divergence": worst,
        "smallest_divergence": closest,
        "n_conditions": len(conditions),
    }
