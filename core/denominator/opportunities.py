"""Impact-funding opportunities derived from the disease and intervention model.

The rest of this project asks *where genetic medicine could have the greatest impact*. This
module turns that map into a set of concrete, costed **funding opportunities** so the question
becomes: *given a fixed budget, where should the next dollar go?*

Opportunities are grouped into three markets that mirror the project's three horizons:

``impact_now``
    Close a known implementation/access gap with tools that already work. Impact is an
    expected number of affected births avoided (or cases detected early) per year.

``translational``
    Fund research milestones for the reproductive situations in which embryo selection
    cannot produce an unaffected embryo. Impact is probability-weighted and future-dated.

``future``
    Fund research that would expand what heritable intervention can reach in common
    polygenic disease. Impact is highly uncertain and explicitly scenario-based.

Every implementation opportunity follows the same accounting identity::

    expected impact = N x G x dC x E x A

    N   relevant population (annual births in the region)
    G   disease frequency in that population (incidence per birth)
    dC  incremental coverage the project would create
    E   effectiveness of the intervention at preventing/mitigating, given coverage
    A   attributable fraction of the change credited to the project

Cost is computed over the population that must be *served* (everyone screened), not over the
affected cases found, which is why cost-per-case is much larger than a unit screening price.

Research probabilities in the translational and future markets are **modeling assumptions**,
not forecasts. They are labelled as such and are meant to be varied, not believed.
"""
from __future__ import annotations

from typing import Any

from . import harmonize

# Attributable fraction credited to a funded project. Implementation programmes are credited
# in full for the coverage they create; research programmes carry their own probability terms.
ATTRIBUTABLE_FRACTION_IMPLEMENTATION = 1.0

# Which income groups carry an implementation gap worth putting on the market. High income is
# excluded: its modelled coverage is already at or near the achievable standard.
GAP_REGIONS = ["Upper-middle income", "Lower-middle income", "Low income"]

# Equity weighting shown on the card (not folded into the impact number).
EQUITY_BY_REGION = {
    "Low income": "High",
    "Lower-middle income": "High",
    "Upper-middle income": "Moderate",
    "High income": "Low",
}

# How each tool is delivered: which population pays the unit cost, and how the opportunity
# reads to a funder.
TOOL_META = {
    "CS": {
        "short": "Carrier screening",
        "name": "Carrier screening + reproductive planning",
        "cost_key": "carrier_screening_per_couple",
        "served": "couples screened",
        "outcome": "affected births avoided",
    },
    "PGT": {
        "short": "IVF + PGT-M access",
        "name": "IVF + PGT-M embryo selection",
        "cost_key": "ivf_pgt_cycle",
        "served": "at-risk couples supported through IVF+PGT",
        "outcome": "affected births avoided",
    },
    "PND": {
        "short": "Prenatal diagnosis",
        "name": "Prenatal diagnosis + reproductive decision",
        "cost_key": "prenatal_screen_per_pregnancy",
        "served": "pregnancies screened",
        "outcome": "affected births avoided",
    },
    "NBS": {
        "short": "Newborn screening",
        "name": "Newborn screening + early treatment",
        "cost_key": "newborn_screen_per_infant",
        "served": "infants screened",
        "outcome": "affected infants treated early",
    },
}

MAX_IMPLEMENTATION_OPPORTUNITIES = 36


def _v(node: Any, default: float = 0.0) -> float:
    """Point value of a {value, low, high} constant node."""
    if isinstance(node, dict):
        return float(node.get("value", default))
    try:
        return float(node)
    except (TypeError, ValueError):
        return default


def _lo_hi(node: Any) -> tuple[float, float]:
    if isinstance(node, dict):
        v = float(node.get("value", 0.0))
        return float(node.get("low", v)), float(node.get("high", v))
    v = _v(node)
    return v, v


def _uncertainty_band(low: float, high: float, mid: float) -> str:
    """Qualitative uncertainty from the spread of the driving inputs."""
    if mid <= 0:
        return "High"
    ratio = (high - low) / mid
    if ratio < 0.6:
        return "Low"
    if ratio < 1.5:
        return "Moderate"
    return "High"


def _evidence_grade(incidence_basis: str, effectiveness_node: Any) -> str:
    """Evidence quality: strongest when both the burden and the effect size are cited."""
    eff_cited = isinstance(effectiveness_node, dict) and bool(effectiveness_node.get("doi")) \
        and effectiveness_node.get("doi") not in ("n/a", "")
    inc_cited = incidence_basis == "cited"
    if inc_cited and eff_cited:
        return "High"
    if inc_cited or eff_cited:
        return "Moderate"
    return "Low"


def _implementation_opportunities(constants: dict, diseases: list[dict]) -> list[dict]:
    """Implementation opportunities: shared screening programmes, plus targeted programmes.

    Population-wide screening (carrier, prenatal, newborn) is **shared infrastructure**: one
    panel serves every condition it covers. Costing a whole birth cohort against a single
    disease would both overstate cost-per-case and double-count the same programme across
    diseases, so these are modelled once per (region, tool) and their impact is summed over
    every catalogue condition the tool addresses.

    Targeted single-condition programmes are modelled separately, and only where a real
    disease-specific programme exists with its own cited cost anchor (haemoglobinopathies).
    """
    births_global = _v(constants["births"]["global_per_year"])
    coverage = constants["coverage"]
    full_cov = constants["prevention_full_coverage"]
    costs = constants["costs"]

    out: list[dict] = []
    # Only the curated core drives these: the rare tier's interventions are rule-assigned.
    core = [d for d in diseases if d.get("tier", "core") == "core"]

    # ---- 1. Shared screening programmes, one per (region, tool) -----------------------------
    for region in GAP_REGIONS:
        grp = harmonize.INCOME_GROUPS[region]
        region_births = births_global * _v(grp["birth_share"])
        access_mult = _v(grp["access_multiplier"])

        for tool, meta in TOOL_META.items():
            current = _v(coverage["current"][tool]) * access_mult
            target = _v(coverage["achievable_2035"][tool])
            delta_c = target - current
            if delta_c <= 0.02:
                continue

            impact = impact_lo = impact_hi = 0.0
            at_risk_couples = 0.0
            contributors: list[dict] = []
            any_cited = False
            eff_node_any = None

            for d in core:
                if not d["interventions"].get(tool, {}).get("applicable"):
                    continue
                cls = "multifactorial" if d["category"] == "multifactorial" else "monogenic"
                eff_node = full_cov.get(cls, {}).get(tool)
                effectiveness = _v(eff_node)
                if effectiveness <= 0:
                    continue
                eff_node_any = eff_node_any or eff_node
                eff_lo, eff_hi = _lo_hi(eff_node)

                affected_region = region_births * (d["incidence_per_100k"] / 100_000.0)
                d_impact = affected_region * delta_c * effectiveness
                impact += d_impact
                impact_lo += affected_region * delta_c * eff_lo
                impact_hi += affected_region * delta_c * eff_hi
                if d.get("incidence_basis") == "cited":
                    any_cited = True
                # At-risk couples per affected birth: ~4 for a recessive cross, 2 for dominant.
                at_risk_couples += affected_region * (
                    2.0 if d["category"] == "monogenic_dominant" else 4.0)
                contributors.append({
                    "disease": d["name"],
                    "disease_id": d["id"],
                    "impact_per_year": d_impact,
                })

            if impact <= 0 or not contributors:
                continue

            # Population that must be served to create the coverage gain.
            if tool == "PGT":
                served = at_risk_couples * delta_c   # only known at-risk couples do IVF+PGT
            else:
                served = region_births * delta_c     # whole cohort screened
            unit_cost = _v(costs[meta["cost_key"]])
            funding = served * unit_cost
            if funding <= 0:
                continue

            impact *= ATTRIBUTABLE_FRACTION_IMPLEMENTATION
            contributors.sort(key=lambda c: -c["impact_per_year"])

            out.append({
                "id": f"now::programme::{region.replace(' ', '_').lower()}::{tool}",
                "market": "impact_now",
                "kind": "shared_programme",
                "title": f"{meta['short']} — {region}",
                "region": region,
                "tool": tool,
                "intervention": meta["name"],
                "outcome_unit": meta["outcome"],
                "served_unit": meta["served"],
                "n_conditions_covered": len(contributors),
                "top_conditions": contributors[:5],
                "current_coverage": current,
                "target_coverage": target,
                "coverage_gain": delta_c,
                "attributable_fraction": ATTRIBUTABLE_FRACTION_IMPLEMENTATION,
                "people_served": served,
                "unit_cost": unit_cost,
                "funding_requested": funding,
                "expected_impact_per_year": impact,
                "expected_impact_low": impact_lo,
                "expected_impact_high": impact_hi,
                "cost_per_outcome": funding / impact if impact > 0 else None,
                "evidence": _evidence_grade("cited" if any_cited else "", eff_node_any),
                "uncertainty": _uncertainty_band(impact_lo, impact_hi, impact),
                "equity": EQUITY_BY_REGION[region],
                "effectiveness_source": (eff_node_any or {}).get("source")
                if isinstance(eff_node_any, dict) else None,
                "assumptions": [
                    "One programme serves every catalogue condition the panel covers; impact "
                    f"is summed across {len(contributors)} conditions rather than billed to one.",
                    "Coverage rises from the region's modelled current reach to the "
                    "achievable-2035 standard for this tool.",
                    "Impact scales linearly with the funded share of the gap.",
                ],
            })

    # ---- 2. Targeted haemoglobinopathy programmes (own cited cost anchor) --------------------
    hb_cost_node = costs.get("haemoglobinopathy_program_per_birth_prevented")
    hb_cost = _v(hb_cost_node)
    hb_ids = {"sickle_cell_disease", "beta_thalassaemia"}
    if hb_cost > 0:
        for d in core:
            if d["id"] not in hb_ids:
                continue
            for region in GAP_REGIONS:
                grp = harmonize.INCOME_GROUPS[region]
                region_births = births_global * _v(grp["birth_share"])
                access_mult = _v(grp["access_multiplier"])
                affected_region = region_births * (d["incidence_per_100k"] / 100_000.0)
                if affected_region < 200:
                    continue
                # National haemoglobinopathy programmes couple carrier screening with prenatal
                # diagnosis; use the carrier-screening coverage gap as the programme's reach.
                current = _v(coverage["current"]["CS"]) * access_mult
                target = _v(coverage["achievable_2035"]["CS"])
                delta_c = target - current
                if delta_c <= 0.02:
                    continue
                eff_node = full_cov["monogenic"]["CS"]
                effectiveness = _v(eff_node)
                eff_lo, eff_hi = _lo_hi(eff_node)
                impact = affected_region * delta_c * effectiveness
                if impact <= 0:
                    continue
                funding = impact * hb_cost   # cited cost per birth prevented
                out.append({
                    "id": f"now::targeted::{d['id']}::{region.replace(' ', '_').lower()}",
                    "market": "impact_now",
                    "kind": "targeted_programme",
                    "title": f"{d['name']} — national programme, {region}",
                    "disease_id": d["id"],
                    "disease": d["name"],
                    "region": region,
                    "tool": "CS",
                    "intervention": "Haemoglobinopathy programme (carrier screening + prenatal diagnosis)",
                    "outcome_unit": "affected births avoided",
                    "affected_births_region_per_year": affected_region,
                    "current_coverage": current,
                    "target_coverage": target,
                    "coverage_gain": delta_c,
                    "attributable_fraction": ATTRIBUTABLE_FRACTION_IMPLEMENTATION,
                    "unit_cost": hb_cost,
                    "funding_requested": funding,
                    "expected_impact_per_year": impact,
                    "expected_impact_low": affected_region * delta_c * eff_lo,
                    "expected_impact_high": affected_region * delta_c * eff_hi,
                    "cost_per_outcome": hb_cost,
                    "evidence": _evidence_grade(d.get("incidence_basis", ""), hb_cost_node),
                    "uncertainty": _uncertainty_band(
                        affected_region * delta_c * eff_lo,
                        affected_region * delta_c * eff_hi, impact),
                    "equity": EQUITY_BY_REGION[region],
                    "incidence_basis": d.get("incidence_basis"),
                    "incidence_source": d.get("incidence_source"),
                    "effectiveness_source": (hb_cost_node or {}).get("source")
                    if isinstance(hb_cost_node, dict) else None,
                    "overlaps_with": f"Carrier screening — {region}",
                    "assumptions": [
                        "Costed from the observed cost per affected birth prevented in national "
                        "haemoglobinopathy programmes, rather than from a unit screening price.",
                        "This condition is also covered by the broad carrier-screening programme "
                        "for the same region — the two overlap and should not be funded as if "
                        "they were independent.",
                        "Impact scales linearly with the funded share of the gap.",
                    ],
                })

    out.sort(key=lambda o: -o["expected_impact_per_year"])
    return out[:MAX_IMPLEMENTATION_OPPORTUNITIES]


# ---------------------------------------------------------------------------------------------
# Research markets. Programme costs and success probabilities are explicit assumptions.
# ---------------------------------------------------------------------------------------------

TRANSLATIONAL_PROGRAMMES = [
    {
        "key": "correction_safety",
        "title": "Preclinical safety package for single-gene correction",
        "detail": "Off-target, mosaicism and long-term-safety evidence sufficient to support a "
                  "first tightly governed clinical protocol in catastrophic monogenic disease.",
        "funding_requested": 120_000_000,
        "p_technical": 0.55,
        "p_translation": 0.35,
        "share_of_residual": 0.60,
        "horizon_years": 10,
    },
    {
        "key": "embryo_models",
        "title": "Non-clinical embryo models for correction research",
        "detail": "Model systems that let correction efficiency and off-target effects be "
                  "measured without creating clinical embryos.",
        "funding_requested": 45_000_000,
        "p_technical": 0.70,
        "p_translation": 0.30,
        "share_of_residual": 0.45,
        "horizon_years": 8,
    },
    {
        "key": "delivery_efficiency",
        "title": "Higher-fidelity editing chemistry and delivery",
        "detail": "Editing approaches with high on-target conversion at the single-cell stage, "
                  "the rate-limiting step for any heritable correction.",
        "funding_requested": 80_000_000,
        "p_technical": 0.50,
        "p_translation": 0.40,
        "share_of_residual": 0.75,
        "horizon_years": 12,
    },
    {
        "key": "registry",
        "title": "International registry and long-term follow-up infrastructure",
        "detail": "Shared outcome reporting for any approved heritable intervention — the "
                  "precondition for evaluating whether early cases actually benefit.",
        "funding_requested": 25_000_000,
        "p_technical": 0.85,
        "p_translation": 0.50,
        "share_of_residual": 0.30,
        "horizon_years": 6,
    },
]

FUTURE_PROGRAMMES = [
    {
        "key": "causal_variants",
        "title": "Causal-variant discovery for common disease",
        "detail": "Moving from association to causation at scale — the binding constraint on "
                  "any polygenic intervention.",
        "funding_requested": 200_000_000,
        "p_technical": 0.45,
        "p_translation": 0.25,
        "horizon_years": 15,
    },
    {
        "key": "pleiotropy",
        "title": "Pleiotropy and trade-off mapping",
        "detail": "Systematic measurement of what else a candidate locus does before anyone "
                  "proposes editing it.",
        "funding_requested": 90_000_000,
        "p_technical": 0.60,
        "p_translation": 0.30,
        "horizon_years": 12,
    },
    {
        "key": "multiplex",
        "title": "Multiplex editing capacity",
        "detail": "Making many simultaneous edits accurately — the technical ceiling on how "
                  "far polygenic risk could be shifted at all.",
        "funding_requested": 150_000_000,
        "p_technical": 0.35,
        "p_translation": 0.20,
        "horizon_years": 15,
    },
    {
        "key": "prediction_equity",
        "title": "Cross-ancestry polygenic prediction",
        "detail": "Prediction that transfers across ancestries; without it any polygenic "
                  "benefit accrues unequally by construction.",
        "funding_requested": 60_000_000,
        "p_technical": 0.65,
        "p_translation": 0.35,
        "horizon_years": 10,
    },
]


def _research_opportunities(residual: dict, multifactorial: dict) -> list[dict]:
    """Translational and future-market opportunities, probability-weighted."""
    out: list[dict] = []

    # Addressable burden for the translational market: the reproductive configurations in
    # which no unaffected embryo can be selected (editing-only prevention).
    s1 = residual.get("s1_total", {})
    s1_median = float(s1.get("median", 0.0)) if isinstance(s1, dict) else 0.0

    for p in TRANSLATIONAL_PROGRAMMES:
        addressable = s1_median * p["share_of_residual"]
        ev = p["p_technical"] * p["p_translation"] * addressable
        out.append({
            "id": f"trans::{p['key']}",
            "market": "translational",
            "title": p["title"],
            "detail": p["detail"],
            "funding_requested": float(p["funding_requested"]),
            "p_technical": p["p_technical"],
            "p_translation": p["p_translation"],
            "addressable_burden_per_year": addressable,
            "expected_impact_per_year": ev,
            "outcome_unit": "reproductive situations/yr eventually served, probability-weighted",
            "cost_per_outcome": (p["funding_requested"] / ev) if ev > 0 else None,
            "horizon_years": p["horizon_years"],
            "evidence": "Low",
            "uncertainty": "High",
            "equity": "Moderate",
            "assumptions": [
                f"Probability of technical success {p['p_technical']:.0%} and of translation to "
                f"an approved option {p['p_translation']:.0%} — modelling assumptions, not forecasts.",
                f"The programme is relevant to {p['share_of_residual']:.0%} of the modelled "
                "no-selectable-embryo population.",
                "Impact is future-dated and does not accrue within the funding period.",
            ],
        })

    # Future market: scale is set by the modelled polygenic frontier rather than a birth count,
    # so impact is expressed as a share of the multifactorial burden the frontier could reach.
    n_mf = int(multifactorial.get("n_diseases", 0) or 0)
    frontier = multifactorial.get("frontier", {}) or {}
    near = frontier.get("near_future", {}) or {}
    n_near_viable = int(near.get("editing_viable", 0) or 0)

    for p in FUTURE_PROGRAMMES:
        ev_conditions = p["p_technical"] * p["p_translation"] * max(n_near_viable, 1)
        out.append({
            "id": f"future::{p['key']}",
            "market": "future",
            "title": p["title"],
            "detail": p["detail"],
            "funding_requested": float(p["funding_requested"]),
            "p_technical": p["p_technical"],
            "p_translation": p["p_translation"],
            "expected_impact_per_year": ev_conditions,
            "outcome_unit": "modelled common diseases brought within reach, probability-weighted",
            "cost_per_outcome": (p["funding_requested"] / ev_conditions) if ev_conditions > 0 else None,
            "horizon_years": p["horizon_years"],
            "evidence": "Low",
            "uncertainty": "High",
            "equity": "High" if p["key"] == "prediction_equity" else "Moderate",
            "assumptions": [
                f"Probability of technical success {p['p_technical']:.0%} and of translation "
                f"{p['p_translation']:.0%} — modelling assumptions, not forecasts.",
                f"Scale is anchored on the {n_near_viable} of {n_mf} modelled common diseases that "
                "meet the editing threshold under the near-future capacity scenario, which is an "
                "assumption set rather than a prediction.",
                "Benefits, if any, arrive beyond the modelled horizon.",
            ],
        })

    return out


def build_opportunities(constants: dict, library: dict, residual: dict,
                        multifactorial: dict) -> dict[str, Any]:
    """Assemble the three impact-funding markets."""
    impl = _implementation_opportunities(constants, library["diseases"])
    research = _research_opportunities(residual, multifactorial)
    opportunities = impl + research

    # NOTE: opportunity impacts are deliberately NOT summed into a market total. The programmes
    # overlap — the same affected birth can be avoided by carrier screening, embryo selection or
    # prenatal diagnosis — so adding them would multiply-count the same cases. Only the funding
    # asks are additive.
    def _market(key: str, label: str, question: str, items: list[dict], unit: str) -> dict:
        best = min((o for o in items if o.get("cost_per_outcome")),
                   key=lambda o: o["cost_per_outcome"], default=None)
        return {
            "label": label,
            "question": question,
            "n": len(items),
            "funding_requested": sum(o["funding_requested"] for o in items),
            "outcome_unit": unit,
            "best_cost_per_outcome": best["cost_per_outcome"] if best else None,
            "best_cost_per_outcome_title": best["title"] if best else None,
            "impacts_are_additive": False,
        }

    trans = [o for o in research if o["market"] == "translational"]
    fut = [o for o in research if o["market"] == "future"]
    markets = {
        "impact_now": _market(
            "impact_now", "Impact now",
            "Which projects most efficiently close known gaps between what genetic medicine can "
            "already do and who actually receives it?",
            impl, "affected births avoided or infants treated early, per year"),
        "translational": _market(
            "translational", "Translational R&D",
            "Which research would most raise the chance that a safe option exists for families "
            "who cannot select an unaffected embryo?",
            trans, "probability-weighted reproductive situations served per year"),
        "future": _market(
            "future", "Future research",
            "Which research would most expand what heritable intervention could reach in common "
            "polygenic disease?",
            fut, "probability-weighted common diseases brought within reach"),
    }

    return {
        "meta": {
            "default_pool_usd": 250_000_000,
            "identity": "expected impact = N x G x dC x E x A",
            "note": (
                "Opportunities are derived from the disease catalogue, the coverage and "
                "effectiveness parameters, and the cost anchors used elsewhere in this project. "
                "They are illustrative allocation objects for studying how people value "
                "different kinds of genetic-medicine impact — not solicitations, and not "
                "endorsements of any named programme. Impact in the two research markets is "
                "probability-weighted using explicit modelling assumptions."
            ),
            "caveats": [
                "Opportunities overlap. The same affected birth can be avoided by carrier "
                "screening, embryo selection or prenatal diagnosis, so impacts must not be "
                "added together — only the funding asks are additive.",
                "Impact is assumed to scale linearly with the funded share of an opportunity.",
                "Cost anchors for editing programmes remain provisional (see DATA_NEEDED.md).",
                "Research success probabilities are assumptions, not forecasts.",
                "The three markets are not denominated in the same units and should not be "
                "summed into a single impact number.",
            ],
        },
        "markets": markets,
        "opportunities": opportunities,
    }
