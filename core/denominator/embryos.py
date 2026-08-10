"""Embryo accounting — embryos created and (disease-caused) destroyed per unaffected child.

Embryo SELECTION (PGT) achieves an unaffected child by creating several embryos and not
transferring the affected ones. If a fraction ``u`` of a couple's embryos are unaffected, the
disease-caused embryos discarded per unaffected child is (1−u)/u, and the tested blastocysts
created per unaffected live birth is ~1/(u · LBR). Both diverge as u→0 — exactly the S1
"no selectable unaffected embryo" case, where selection is impossible and editing is the only
option. Editing instead repairs the affected embryo, so it discards ZERO embryos for disease
reasons and needs no selection overhead (~1/LBR embryos, like ordinary IVF).

This module makes the embryo cost an explicit, tracked outcome — a normative axis on which
editing can be preferable to the selection stack for some conditions.
"""
from __future__ import annotations

from typing import Any

# Library inheritance label -> unaffected_embryo_fraction key in constants.
INHERITANCE_KEY = {
    "autosomal_recessive": "autosomal_recessive",
    "autosomal_dominant": "autosomal_dominant",
    "x_linked_recessive": "x_linked_recessive",
    "x_linked_dominant": "x_linked_dominant",
    "chromosomal": "chromosomal",
    "multifactorial": "multifactorial",
}


def _u_for(inheritance: str, constants: dict) -> dict:
    key = INHERITANCE_KEY.get(inheritance, "autosomal_recessive")
    return constants["embryo_accounting"]["unaffected_embryo_fraction"][key]


def selection_cost(u: float, lbr: float) -> dict:
    """Embryo cost of achieving one unaffected child by SELECTION at unaffected-fraction u."""
    u = min(max(u, 1e-6), 0.999)
    return {
        "affected_embryos_discarded_per_child": (1.0 - u) / u,
        "blastocysts_created_per_child": 1.0 / (u * lbr),
    }


def editing_cost(lbr: float) -> dict:
    """Embryo cost of achieving one unaffected child by EDITING (repair, no disease-discard)."""
    return {
        "affected_embryos_discarded_per_child": 0.0,
        "blastocysts_created_per_child": 1.0 / lbr,
    }


def per_disease(inheritance: str, pgt_applicable: bool, constants: dict) -> dict:
    """Embryo metrics for one disease's selection pathway (vs the editing counterfactual)."""
    lbr = float(constants["embryo_accounting"]["live_birth_rate_per_transfer"]["value"])
    up = _u_for(inheritance, constants)
    u = float(up["value"])
    sel = selection_cost(u, lbr)
    edit = editing_cost(lbr)
    return {
        "applicable": bool(pgt_applicable),
        "unaffected_embryo_fraction": u,
        "selection": sel,
        "editing": edit,
        # what selection costs that editing avoids, for this disease:
        "excess_embryos_discarded_vs_editing": sel["affected_embryos_discarded_per_child"],
    }


def build_embryos(constants: dict, library_diseases: list[dict]) -> dict[str, Any]:
    ea = constants["embryo_accounting"]
    lbr = float(ea["live_birth_rate_per_transfer"]["value"])

    # Selection-vs-editing curve as the unaffected fraction u falls toward the S1 limit.
    grid = [0.75, 0.60, 0.50, 0.40, 0.30, 0.20, 0.10, 0.05, 0.02]
    curve = [
        {
            "u": u,
            "selection_affected_discarded": selection_cost(u, lbr)["affected_embryos_discarded_per_child"],
            "selection_blastocysts": selection_cost(u, lbr)["blastocysts_created_per_child"],
            "editing_affected_discarded": 0.0,
            "editing_blastocysts": editing_cost(lbr)["blastocysts_created_per_child"],
        }
        for u in grid
    ]

    # Per-inheritance summary.
    per_inheritance = {}
    for key, up in ea["unaffected_embryo_fraction"].items():
        u = float(up["value"])
        per_inheritance[key] = {
            "unaffected_embryo_fraction": u,
            "affected_embryos_discarded_per_child": selection_cost(u, lbr)["affected_embryos_discarded_per_child"],
            "note": up.get("note"),
        }

    # Illustrative aggregate: if every PGT-addressable affected birth in the catalogue were averted
    # by SELECTION, how many affected embryos would be discarded per year — vs ~0 under editing.
    disc_selection = 0.0
    births_via_pgt = 0.0
    for d in library_diseases:
        if not (d.get("interventions", {}).get("PGT", {}) or {}).get("applicable"):
            continue
        u = float(_u_for(d.get("inheritance", "autosomal_recessive"), constants)["value"])
        births = float(d["affected_births_per_year"])
        births_via_pgt += births
        disc_selection += births * selection_cost(u, lbr)["affected_embryos_discarded_per_child"]

    aggregate = {
        "pgt_addressable_affected_births_per_year": births_via_pgt,
        "affected_embryos_discarded_selection_strategy": disc_selection,
        "affected_embryos_discarded_editing_strategy": 0.0,
        "note": (
            "Illustrative upper-bound contrast: if every PGT-addressable affected birth in the "
            "catalogue were averted by embryo SELECTION, roughly this many affected embryos would not "
            "be selected for transfer per year (each unaffected child implies (1−u)/u affected "
            "embryos set aside). Under an idealized EDITING strategy that figure is ~0 (the corrected "
            "embryo remains a transfer candidate). Real programs use a mix and coverage is far below "
            "100%, so treat this as a scale contrast, not a forecast. PND (prenatal diagnosis) is a "
            "separate moral category — termination of an affected fetus, not embryo non-selection — "
            "and is tracked separately in the prevention model."
        ),
    }

    return {
        "params": {
            "blastocysts_per_ivf_cycle": float(ea["blastocysts_per_ivf_cycle"]["value"]),
            "live_birth_rate_per_transfer": lbr,
        },
        "per_inheritance": per_inheritance,
        "curve": curve,
        "aggregate": aggregate,
        "note": (
            "Embryo cost is an explicit outcome tracked across the analysis. Selection sets aside "
            "(1−u)/u affected embryos per unaffected child (not selected for transfer) and diverges "
            "as u→0 — the case where no unaffected embryo exists; idealized correction sets aside "
            "none, though editing failure, mosaicism, and safety-related loss are not modeled. This "
            "is the basis on which editing can be preferable to selection for conditions with few "
            "unaffected embryos."
        ),
    }
