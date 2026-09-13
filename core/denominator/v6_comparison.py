"""Supplementary v6 analyses for selection, correction, IVF burden and embryo disposition.

These calculations support the Calculated Impact Framework without collapsing distinct
questions. They deliberately keep: (1) target-based embryo non-selection separate from final
embryo disposition; (2) observed PGT-M outcomes separate from hypothetical editing performance;
and (3) reproductive-yield crossover separate from clinical or ethical acceptability.

Dollar-cost comparisons are not generated here because the current germline-editing programme
cost anchor is explicitly provisional. Gate-2 tractability is also not converted to a population
share here because current ClinVar record counts measure reported allelic diversity rather than
patient-frequency weights.
"""
from __future__ import annotations

from typing import Any


POULTON_COHORT = {
    "source": "Poulton et al. 2025, J Assist Reprod Genet",
    "doi": "10.1007/s10815-025-03416-6",
    "stimulated_cycles": 572,
    "biopsied_embryos": 2344,
    "directly_suitable_embryos": 849,
    "not_suitable_embryos": 1219,
    "conditionally_suitable_embryos": 276,
    "cycles_with_at_least_one_suitable_embryo": 392,
    "cycles_with_at_least_one_transfer": 355,
    "transferred_embryos": 513,
    "embryo_transfer_cycles": 490,
    "live_births": 230,
}

POULTON_REVIEW = {
    "source": "Poulton et al. 2025, Am J Obstet Gynecol",
    "doi": "10.1016/j.ajog.2024.09.114",
    "studies": 51,
    "cycles": 5305,
    "embryo_transfers": 5229,
    "births": 1577,
    "birth_rate_per_cycle": 0.297,
    "birth_rate_per_cycle_ci95": [0.285, 0.310],
    "birth_rate_per_transfer": 0.217,
    "birth_rate_per_transfer_ci95": [0.208, 0.231],
    "with_pgt_a_birth_rate_per_cycle": 0.376,
    "with_pgt_a_birth_rate_per_cycle_ci95": [0.346, 0.408],
    "without_pgt_a_birth_rate_per_cycle": 0.281,
    "without_pgt_a_birth_rate_per_cycle_ci95": [0.266, 0.297],
}

ESHRE_DISPOSITION = {
    "source": "Spinella et al. 2026, Human Reproduction",
    "doi": "10.1093/humrep/deag081",
    "group": "combined PGT-M/PGT-SR with PGT-A; non-genetically-transferable for the PGT-M/PGT-SR target",
    "non_genetically_transferable_embryos": 2576,
    "cryopreserved": 1198,
    "subgroups": [
        {"pgt_a_result": "euploid", "n": 791, "cryopreserved": 460, "reported_fraction": 0.58},
        {"pgt_a_result": "mosaic", "n": 77, "cryopreserved": 54, "reported_fraction": 0.70},
        {"pgt_a_result": "aneuploid", "n": 800, "cryopreserved": 409, "reported_fraction": 0.51},
        {"pgt_a_result": "no PGT-A result", "n": 908, "cryopreserved": 275, "reported_fraction": 0.30},
    ],
}


def target_nonselection_ratio(u: float) -> float:
    """Embryos failing the target criterion per embryo satisfying it."""
    if not 0 < u <= 1:
        raise ValueError("u must be in (0, 1]")
    return (1.0 - u) / u


def joint_acceptable_fraction(probabilities: list[float]) -> float:
    """Joint acceptable fraction under the explicitly simplifying independence assumption."""
    out = 1.0
    for p in probabilities:
        if not 0 <= p <= 1:
            raise ValueError("criterion probabilities must be in [0, 1]")
        out *= p
    return out


def post_correction_acceptable_fraction(u: float, c: float) -> float:
    """q = u + (1-u)c, where c is successful target correction among initially unacceptable embryos."""
    if not 0 <= u <= 1 or not 0 <= c <= 1:
        raise ValueError("u and c must be in [0, 1]")
    return u + (1.0 - u) * c


def minimum_relative_post_correction_lbr(u: float, c: float) -> float:
    """Minimum r_e/r_s needed for correction to exceed selection on reproductive yield alone."""
    q = post_correction_acceptable_fraction(u, c)
    if q == 0:
        return float("inf")
    return u / q


def build_v6_comparison() -> dict[str, Any]:
    cohort = dict(POULTON_COHORT)
    cohort["derived"] = {
        "biopsied_embryos_per_stimulated_cycle": cohort["biopsied_embryos"] / cohort["stimulated_cycles"],
        "directly_suitable_fraction_of_biopsied": cohort["directly_suitable_embryos"] / cohort["biopsied_embryos"],
        "not_suitable_fraction_of_biopsied": cohort["not_suitable_embryos"] / cohort["biopsied_embryos"],
        "conditionally_suitable_fraction_of_biopsied": cohort["conditionally_suitable_embryos"] / cohort["biopsied_embryos"],
        "cycles_with_at_least_one_suitable_embryo_fraction": cohort["cycles_with_at_least_one_suitable_embryo"] / cohort["stimulated_cycles"],
        "cycles_with_at_least_one_transfer_fraction": cohort["cycles_with_at_least_one_transfer"] / cohort["stimulated_cycles"],
        "live_birth_per_transferred_embryo": cohort["live_births"] / cohort["transferred_embryos"],
        "live_birth_per_stimulated_cycle": cohort["live_births"] / cohort["stimulated_cycles"],
        "stimulated_cycles_per_live_birth": cohort["stimulated_cycles"] / cohort["live_births"],
        "biopsied_embryos_per_live_birth": cohort["biopsied_embryos"] / cohort["live_births"],
        "transferred_embryos_per_live_birth": cohort["transferred_embryos"] / cohort["live_births"],
    }

    review = dict(POULTON_REVIEW)
    review["derived"] = {
        "cycles_per_birth_overall": 1.0 / review["birth_rate_per_cycle"],
        "cycles_per_birth_with_pgt_a": 1.0 / review["with_pgt_a_birth_rate_per_cycle"],
        "cycles_per_birth_without_pgt_a": 1.0 / review["without_pgt_a_birth_rate_per_cycle"],
    }

    u_grid = [0.75, 0.50, 0.20, 0.10, 0.05, 0.02]
    selection = [
        {"u": u, "target_based_nonselections_per_acceptable_embryo": target_nonselection_ratio(u)}
        for u in u_grid
    ]
    multi = []
    for n in [1, 2, 5, 10]:
        u = joint_acceptable_fraction([0.5] * n)
        multi.append({
            "n_criteria": n,
            "p_each": 0.5,
            "joint_acceptable_fraction": u,
            "nonselections_per_acceptable_embryo": target_nonselection_ratio(u),
        })

    crossover = []
    for u in u_grid:
        for c in [0.25, 0.50, 0.75, 0.90, 1.00]:
            q = post_correction_acceptable_fraction(u, c)
            crossover.append({
                "u": u,
                "correction_success_c": c,
                "post_correction_acceptable_fraction_q": q,
                "minimum_re_over_rs_for_yield_crossover": minimum_relative_post_correction_lbr(u, c),
            })

    disposition = dict(ESHRE_DISPOSITION)
    disposition["cryopreserved_fraction"] = disposition["cryopreserved"] / disposition["non_genetically_transferable_embryos"]
    disposition["interpretation"] = (
        "Genotype-based non-selection is not equivalent to embryo destruction or discard; "
        "final disposition is a separate observed outcome."
    )

    return {
        "meta": {
            "status": "supplementary v6 calculated-impact analysis",
            "version": "1.0",
            "promotion_rule": "Only outputs labeled promotable may be used as manuscript results; scenario grids are comparative boundaries, not clinical predictions.",
        },
        "realistic_ivf": {
            "status": "promotable",
            "single_centre_pgt_m_a": cohort,
            "systematic_review_pgt_m": review,
            "interpretation": "Use empirical scenarios and sensitivity bounds rather than one universal IVF success constant.",
        },
        "selection_burden": {
            "status": "promotable",
            "single_criterion": selection,
            "multi_criterion_equal_independent_examples": multi,
            "interpretation": "Non-selection counts failure of the target criterion only; it is not final embryo disposition.",
        },
        "selection_correction_crossover": {
            "status": "promotable_as_sensitivity_analysis",
            "formula": "q=u+(1-u)c; crossover when q*r_e > u*r_s",
            "grid": crossover,
            "interpretation": "The threshold concerns reproductive yield only and excludes editing safety, developmental and intergenerational risk.",
        },
        "embryo_disposition": {"status": "promotable", "eshre_2019_2021": disposition},
        "gate2_tractability": {
            "status": "not_promotable_as_population_share",
            "reason": "Current Gate-2 summary aggregates condition medians and ClinVar record counts are not patient-frequency weights. Per-draw tractability aggregation and population-weighted allele spectra are required for a population-share claim.",
        },
        "dollar_costs": {
            "status": "not_promotable",
            "reason": "The germline-editing programme cost anchor is explicitly provisional and several implementation unit costs remain reasoned rather than primary-source anchored.",
            "resource_analysis_status": "Promote procedure/embryo/transfer quantities; retain dollar costs as exploratory only.",
        },
    }
