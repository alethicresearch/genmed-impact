"""Realized impact: retrospective validation, and the forward predicted-vs-delivered ledger.

A funding market that only ever states *predicted* impact cannot learn. The loop only closes
when a funded project reports what actually happened and the prediction is scored against it.

This module supplies two halves of that loop, and is careful about which is which.

**Retrospective validation (has real data).** Several national programmes have already run for
decades and their outcomes are published. This project already cites two of them as anchors —
the Cyprus/Sardinia/Greece thalassaemia programmes and Nordic prenatal screening. Those are
observed reductions, not projections, so the model's assumed effectiveness can be checked
against them directly. That is a genuine, if small, calibration test.

**Forward ledger (has no data yet).** For opportunities funded through this market, the
mechanism is defined here — what a project commits to, what it must report, how delivery is
scored, and how a retroactive reward pool would be split by demonstrated rather than promised
impact. It ships with **zero entries**. Nothing is simulated, because a fabricated outcome
would be worse than an empty ledger: it would look like evidence.
"""
from __future__ import annotations

from typing import Any

# Which modelled effectiveness parameter each historical programme is evidence about.
VALIDATION_CASES = [
    {
        "key": "thalassaemia",
        "programme": "National thalassaemia programmes (Cyprus, Sardinia, Greece)",
        "what_ran": "Population carrier screening with counselling and prenatal diagnosis, "
                    "sustained over decades in high-prevalence populations.",
        "anchor_key": "thalassaemia_major_reduction",
        "model_param": ("prevention_full_coverage", "monogenic", "CS"),
        "model_param_label": "Assumed carrier-screening effectiveness at full coverage (monogenic)",
        "outcome_label": "Observed reduction in thalassaemia major births",
    },
    {
        "key": "down_syndrome",
        "programme": "Nordic prenatal screening (Denmark, Iceland, Netherlands)",
        "what_ran": "Universal offer of prenatal screening with diagnostic confirmation and "
                    "non-directive counselling.",
        "anchor_key": "down_syndrome_reduction_nordic",
        "model_param": ("prevention_full_coverage", "monogenic", "PND"),
        "model_param_label": "Assumed prenatal-diagnosis effectiveness at full coverage",
        "outcome_label": "Observed reduction in Down syndrome births",
    },
]


def _node(constants: dict, path: tuple) -> dict:
    node: Any = constants
    for k in path:
        node = node.get(k, {}) if isinstance(node, dict) else {}
    return node if isinstance(node, dict) else {}


def _v(node: Any, default: float = 0.0) -> float:
    if isinstance(node, dict):
        return float(node.get("value", default))
    try:
        return float(node)
    except (TypeError, ValueError):
        return default


def _build_validation(constants: dict) -> list[dict]:
    """Model assumption vs the observed outcome of a programme that actually ran."""
    anchors = constants.get("program_anchors", {})
    out: list[dict] = []
    for case in VALIDATION_CASES:
        anchor = anchors.get(case["anchor_key"])
        if not isinstance(anchor, dict):
            continue
        param = _node(constants, case["model_param"])
        modelled = _v(param)
        observed = _v(anchor)
        if modelled <= 0 or observed <= 0:
            continue
        out.append({
            "key": case["key"],
            "programme": case["programme"],
            "what_ran": case["what_ran"],
            "model_param_label": case["model_param_label"],
            "modelled_effectiveness": modelled,
            "modelled_low": float(param.get("low", modelled)),
            "modelled_high": float(param.get("high", modelled)),
            "outcome_label": case["outcome_label"],
            "observed_reduction": observed,
            "observed_low": float(anchor.get("low", observed)),
            "observed_high": float(anchor.get("high", observed)),
            # Ratio > 1 means the programme outperformed the modelled assumption.
            "observed_over_modelled": observed / modelled,
            "within_modelled_interval": (
                float(param.get("low", modelled)) <= observed <= float(param.get("high", modelled))
            ),
            "source": anchor.get("source"),
            "doi": anchor.get("doi"),
            "citation": anchor.get("table_or_page"),
        })
    return out


# The forward mechanism. Definitions only — no entries, because no project has reported yet.
LEDGER_SCHEMA = {
    "committed": [
        {"field": "opportunity_id", "meaning": "Which modelled opportunity the project addresses."},
        {"field": "funder_commitment_usd", "meaning": "Money committed at the time of funding."},
        {"field": "predicted_impact_per_year", "meaning": "What the model predicted that money would buy."},
        {"field": "predicted_coverage_gain", "meaning": "The coverage increase the project committed to."},
        {"field": "reporting_period_years", "meaning": "When the project must report outcomes."},
    ],
    "reported": [
        {"field": "realized_coverage_gain", "meaning": "Coverage actually achieved, independently verifiable."},
        {"field": "people_actually_served", "meaning": "Screened, tested or treated — a counted quantity."},
        {"field": "cases_identified", "meaning": "Affected cases actually detected."},
        {"field": "outcomes_delivered", "meaning": "Births avoided or children treated early, by the market's own unit."},
        {"field": "evidence_url", "meaning": "Where the reported figures can be checked."},
    ],
    "derived": [
        {"field": "delivery_ratio", "meaning": "outcomes_delivered / predicted_impact_per_year — above 1 means the project beat its prediction."},
        {"field": "realized_cost_per_outcome", "meaning": "funder_commitment_usd / outcomes_delivered."},
        {"field": "model_error", "meaning": "How far the model's prediction was from what happened, fed back into the parameters it came from."},
    ],
}

RETROACTIVE_RULES = [
    "A retroactive pool is set aside and awarded only after outcomes are reported and checked, "
    "so payment tracks demonstrated impact rather than a persuasive proposal.",
    "Each project's share of the pool is proportional to its verified outcomes, valued in that "
    "market's own unit — the three markets are rewarded from separate pools because their units "
    "are not interchangeable.",
    "Reporting an outcome below the prediction is not penalised beyond the smaller share it "
    "earns. Penalising shortfalls harder would simply select for projects that under-promise.",
    "Every reported figure needs an independently checkable source; unverifiable reports earn "
    "nothing, which is what keeps the ledger worth reading.",
    "Prediction errors are fed back into the parameter they came from, so the model that "
    "generated the opportunity is corrected by what actually happened.",
]


def build_retroactive(constants: dict) -> dict[str, Any]:
    """Retrospective validation plus the (currently empty) forward ledger."""
    validation = _build_validation(constants)
    return {
        "meta": {
            "note_kind": "mechanism_definition",
            "n_ledger_entries": 0,
            "caveats": [
                "The forward ledger is empty. No project has been funded or reported through "
                "this market, and no outcome has been simulated to fill the gap.",
                "Retrospective validation rests on two long-running programmes. Two cases can "
                "show whether an assumption is in the right range; they cannot validate the "
                "model as a whole.",
                "Published programme reductions reflect decades of sustained delivery in "
                "high-prevalence populations, so they are an optimistic comparator for a new "
                "programme starting from low coverage.",
            ],
        },
        "validation": validation,
        "ledger_schema": LEDGER_SCHEMA,
        "retroactive_rules": RETROACTIVE_RULES,
        "ledger": [],
    }
