"""Multi-perspective valuation of funding opportunities.

A single "impact score" would quietly bury the most interesting thing about allocating
resources in genetic medicine: reasonable people rank the same opportunities differently
because they weight different *kinds* of value. A public-health funder optimising expected
cases averted and a family for whom no unaffected embryo can be selected are not disagreeing
about the arithmetic — they are weighting population scale against individual clinical need.

So this module does not produce one number. It scores every opportunity on several
**dimensions**, then applies several **perspectives** — each an explicit, stated weighting over
those dimensions — and reports the resulting rankings side by side, together with how much the
perspectives disagree about each opportunity.

Two honesty constraints govern the design:

1. **The perspectives are stipulated, not measured.** No survey has been run. Each profile is a
   declared normative position with a rationale attached, of the same status as the attribution
   stance or the severity threshold elsewhere in this project: a ``normative_choice``. They are
   named for the viewpoint they represent, not claimed as evidence about what any real group
   believes. A reader can reweight them freely.

2. **Comparing across markets requires commensuration.** The three markets are denominated in
   different units (affected births avoided, probability-weighted reproductive situations,
   diseases brought within reach). Placing them on one 0-100 scale is itself a normative act,
   flagged as such, and is why the raw per-market quantities remain visible everywhere.
"""
from __future__ import annotations

import math
from typing import Any

# ---------------------------------------------------------------------------------------------
# Dimensions of value. Each opportunity gets a 0-1 score on each; perspectives weight them.
# ---------------------------------------------------------------------------------------------

DIMENSIONS = {
    "population_impact": {
        "label": "Population impact",
        "definition": "How many outcomes per year the opportunity is expected to produce, "
                      "log-scaled so that programmes of very different size remain comparable.",
    },
    "cost_efficiency": {
        "label": "Cost efficiency",
        "definition": "Outcomes obtained per dollar, log-scaled. High means the same money "
                      "goes further.",
    },
    "individual_benefit": {
        "label": "Individual clinical benefit",
        "definition": "How much the opportunity matters to a particular affected family — "
                      "strongest where no alternative route exists for them at all, weaker "
                      "where the benefit is a diffuse population-level shift in risk.",
    },
    "equity": {
        "label": "Equity of reach",
        "definition": "Whether the opportunity reaches populations currently least served by "
                      "genetic medicine.",
    },
    "certainty": {
        "label": "Evidence certainty",
        "definition": "Strength of the underlying evidence and narrowness of the modelled "
                      "uncertainty. Research opportunities score low by construction.",
    },
    "immediacy": {
        "label": "Immediacy",
        "definition": "How soon the benefit would accrue. Implementation is immediate; research "
                      "benefits, if they arrive, are years to decades away.",
    },
}

GRADE_SCORE = {"High": 1.0, "Moderate": 0.55, "Low": 0.2}
# Uncertainty reads inversely: high uncertainty lowers certainty.
UNCERTAINTY_SCORE = {"Low": 1.0, "Moderate": 0.55, "High": 0.2}

# Individual clinical benefit by what the opportunity actually does for one family. The
# translational market scores highest here despite its small population impact — that asymmetry
# is the substantive claim this project makes about where germline editing is justified.
INDIVIDUAL_BENEFIT = {
    "translational": 0.95,   # for these families no alternative route exists
    "future": 0.30,          # speculative, and alternatives usually exist
    "NBS": 0.80,             # changes the clinical course of an already-born child
    "CS": 0.50,              # informs reproductive choice before conception
    "PND": 0.45,             # informs a reproductive decision during pregnancy
    "PGT": 0.65,             # lets an at-risk couple have an unaffected child
}

# ---------------------------------------------------------------------------------------------
# Perspectives. Each is a declared normative position — a weighting, plus why someone holding
# that position would weight things that way. Weights are normalised before use.
# ---------------------------------------------------------------------------------------------

PERSPECTIVES = {
    "population_health": {
        "label": "Population health",
        "tradition": "Aggregative consequentialism / cost-effectiveness analysis",
        "stance": "Maximise expected cases averted per dollar across the whole birth cohort.",
        "rationale": "The standard public-health objective: the strongest claim on shared "
                     "resources is the one that prevents the most disease overall.",
        "citations": [
            "Murray CJL, Lopez AD. The Global Burden of Disease. Harvard/WHO, 1996 — the "
            "summary-measure tradition that makes aggregate health comparable across causes.",
            "WHO-CHOICE. Cost-effectiveness thresholds and generalised cost-effectiveness "
            "analysis for health-sector priority setting.",
        ],
        "weights": {
            "population_impact": 0.30, "cost_efficiency": 0.30, "individual_benefit": 0.05,
            "equity": 0.15, "certainty": 0.15, "immediacy": 0.05,
        },
    },
    "clinical_family": {
        "label": "Clinical & family",
        "tradition": "Rule of rescue / reproductive autonomy",
        "stance": "Weight the strength of the clinical case for the individual patient or family.",
        "rationale": "A family for whom no unaffected embryo can be selected has an urgent "
                     "claim that does not diminish because the population it belongs to is small.",
        "citations": [
            "Jonsen AR. Bentham in a box: technology assessment and health care allocation. "
            "Law, Medicine & Health Care, 1986 — the 'rule of rescue': identified individuals "
            "in peril exert a moral claim that aggregate calculation understates.",
            "Robertson JA. Children of Choice: Freedom and the New Reproductive Technologies. "
            "Princeton, 1994 — procreative liberty as the frame for reproductive decisions.",
        ],
        "weights": {
            "population_impact": 0.05, "cost_efficiency": 0.05, "individual_benefit": 0.50,
            "equity": 0.10, "certainty": 0.15, "immediacy": 0.15,
        },
    },
    "equity_first": {
        "label": "Equity first",
        "tradition": "Prioritarianism / fair equality of opportunity",
        "stance": "Prioritise reaching populations that existing genetic medicine does not serve.",
        "rationale": "Most serious genetic disease occurs where access is weakest; an "
                     "intervention that only reaches well-served populations widens the gap.",
        "citations": [
            "Parfit D. Equality and Priority. Ratio, 1997 — benefits matter more the worse off "
            "the recipient is.",
            "Daniels N. Just Health: Meeting Health Needs Fairly. Cambridge, 2008 — health "
            "institutions as protectors of fair equality of opportunity.",
            "WHO. Making Fair Choices on the Path to Universal Health Coverage. 2014 — explicit "
            "priority to the worse-off in coverage decisions.",
        ],
        "weights": {
            "population_impact": 0.15, "cost_efficiency": 0.15, "individual_benefit": 0.10,
            "equity": 0.45, "certainty": 0.10, "immediacy": 0.05,
        },
    },
    "evidence_first": {
        "label": "Evidence first",
        "tradition": "Evidence-based medicine / precautionary governance",
        "stance": "Fund what is demonstrably effective; discount speculative benefit heavily.",
        "rationale": "The evaluator's position: expected value computed from weak evidence is "
                     "not a reason to move money, and probability-weighted futures are cheap to assert.",
        "citations": [
            "Guyatt GH et al. GRADE: an emerging consensus on rating quality of evidence and "
            "strength of recommendations. BMJ, 2008.",
            "National Academies of Sciences, Engineering, and Medicine. Human Genome Editing: "
            "Science, Ethics, and Governance. 2017.",
            "WHO. Human genome editing: a framework for governance. 2021.",
        ],
        "weights": {
            "population_impact": 0.20, "cost_efficiency": 0.20, "individual_benefit": 0.05,
            "equity": 0.05, "certainty": 0.40, "immediacy": 0.10,
        },
    },
    "translational_research": {
        "label": "Translational research",
        "tradition": "Staged ethical pathway / option value",
        "stance": "Fund the work that creates options which do not currently exist.",
        "rationale": "Implementation can only deploy what has already been developed; someone "
                     "has to accept high uncertainty to expand the set of available routes.",
        "citations": [
            "Savulescu J, Singer P. An ethical pathway for gene editing. Bioethics, 2019. "
            "doi:10.1111/bioe.12570 — a staged progression in which the strongest disease cases "
            "justify carefully governed first steps.",
            "Savulescu J. Procreative beneficence: why we should select the best children. "
            "Bioethics, 2001.",
        ],
        "weights": {
            "population_impact": 0.10, "cost_efficiency": 0.05, "individual_benefit": 0.35,
            "equity": 0.05, "certainty": 0.05, "immediacy": 0.40,
        },
    },
}
# `immediacy` is inverted for the translational-research perspective: that viewpoint explicitly
# values work whose payoff is distant. Handled in _score() rather than by a negative weight.
INVERTS_IMMEDIACY = {"translational_research"}


def _log_norm(values: list[float]) -> list[float]:
    """Log-scale then min-max to 0-1, so orders-of-magnitude differences stay comparable."""
    logs = [math.log10(max(v, 1e-9)) for v in values]
    lo, hi = min(logs), max(logs)
    if hi - lo < 1e-9:
        return [0.5 for _ in logs]
    return [(x - lo) / (hi - lo) for x in logs]


def _immediacy(o: dict) -> float:
    if o["market"] == "impact_now":
        return 1.0
    horizon = float(o.get("horizon_years") or 12)
    # 5 years -> ~0.6, 15 years -> ~0.1
    return max(0.05, min(1.0, 1.2 - 0.075 * horizon))


def _individual_benefit(o: dict) -> float:
    if o["market"] in INDIVIDUAL_BENEFIT:
        return INDIVIDUAL_BENEFIT[o["market"]]
    return INDIVIDUAL_BENEFIT.get(o.get("tool", ""), 0.5)


def score_dimensions(opportunities: list[dict]) -> dict[str, dict[str, float]]:
    """0-1 score per dimension for every opportunity, normalised across the whole set."""
    impacts = _log_norm([o["expected_impact_per_year"] for o in opportunities])
    # Outcomes per dollar — the inverse of cost per outcome.
    efficiency = _log_norm([1.0 / max(o["cost_per_outcome"], 1e-9) for o in opportunities])

    out: dict[str, dict[str, float]] = {}
    for i, o in enumerate(opportunities):
        certainty = 0.5 * GRADE_SCORE.get(o["evidence"], 0.2) + \
                    0.5 * UNCERTAINTY_SCORE.get(o["uncertainty"], 0.2)
        out[o["id"]] = {
            "population_impact": impacts[i],
            "cost_efficiency": efficiency[i],
            "individual_benefit": _individual_benefit(o),
            "equity": GRADE_SCORE.get(o["equity"], 0.2),
            "certainty": certainty,
            "immediacy": _immediacy(o),
        }
    return out


def _score(dims: dict[str, float], perspective_key: str, weights: dict[str, float]) -> float:
    total_w = sum(weights.values()) or 1.0
    s = 0.0
    for d, w in weights.items():
        x = dims[d]
        if d == "immediacy" and perspective_key in INVERTS_IMMEDIACY:
            x = 1.0 - x   # this viewpoint values distant payoffs
        s += w * x
    return 100.0 * s / total_w


def build_perspectives(opportunities: list[dict]) -> dict[str, Any]:
    """Score, rank and compare opportunities under each declared perspective."""
    dims = score_dimensions(opportunities)

    scored: list[dict] = []
    for o in opportunities:
        d = dims[o["id"]]
        by_persp = {k: _score(d, k, p["weights"]) for k, p in PERSPECTIVES.items()}
        vals = list(by_persp.values())
        spread = max(vals) - min(vals)
        top = max(by_persp, key=lambda k: by_persp[k])
        bottom = min(by_persp, key=lambda k: by_persp[k])
        scored.append({
            "id": o["id"],
            "title": o["title"],
            "market": o["market"],
            "dimensions": d,
            "scores": by_persp,
            "mean_score": sum(vals) / len(vals),
            "disagreement": spread,
            "most_favoured_by": top,
            "least_favoured_by": bottom,
        })

    # Per-perspective ranking (1 = that perspective's top pick).
    rankings: dict[str, list[str]] = {}
    for key in PERSPECTIVES:
        ordered = sorted(scored, key=lambda s: -s["scores"][key])
        rankings[key] = [s["id"] for s in ordered]
        for rank, s in enumerate(ordered, start=1):
            s.setdefault("ranks", {})[key] = rank

    # Rank volatility: how far an opportunity moves depending on whose values are applied.
    for s in scored:
        rs = list(s["ranks"].values())
        s["rank_spread"] = max(rs) - min(rs)
        s["best_rank"] = min(rs)
        s["worst_rank"] = max(rs)

    contested = sorted(scored, key=lambda s: -s["disagreement"])[:6]
    consensus = sorted(scored, key=lambda s: s["disagreement"])[:6]

    return {
        "meta": {
            "epistemic_status": "normative_choice",
            "n_perspectives": len(PERSPECTIVES),
            "n_opportunities": len(scored),
            "caveats": [
                "Each position names an ethical tradition that is genuinely argued for in the "
                "literature, with representative citations. The numeric weights, however, are "
                "our operationalisation of that position for this exercise — none of the cited "
                "authors published a weight vector, and they should not be read as endorsing one.",
                "These are stipulated positions, not survey results. No group has been asked "
                "what it believes; each profile can be reweighted, and readers are invited to "
                "set their own weights rather than accept these.",
                "Scoring opportunities from different markets on one 0-100 scale requires "
                "commensurating units that are not naturally comparable. That commensuration is "
                "itself a normative choice, which is why the underlying quantities stay visible.",
                "A high score means an opportunity ranks well under that perspective's weights — "
                "not that it is objectively better.",
            ],
        },
        "dimensions": DIMENSIONS,
        "perspectives": {
            k: {"label": p["label"], "tradition": p["tradition"], "stance": p["stance"],
                "rationale": p["rationale"], "citations": p["citations"],
                "weights": p["weights"], "inverts_immediacy": k in INVERTS_IMMEDIACY}
            for k, p in PERSPECTIVES.items()
        },
        "scored": scored,
        "rankings": rankings,
        "most_contested": [{"id": s["id"], "title": s["title"], "market": s["market"],
                            "disagreement": s["disagreement"],
                            "most_favoured_by": s["most_favoured_by"],
                            "least_favoured_by": s["least_favoured_by"],
                            "best_rank": s["best_rank"], "worst_rank": s["worst_rank"]}
                           for s in contested],
        "most_agreed": [{"id": s["id"], "title": s["title"], "market": s["market"],
                         "disagreement": s["disagreement"]}
                        for s in consensus],
    }
