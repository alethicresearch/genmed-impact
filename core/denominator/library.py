"""Genetic disease × intervention library — loader and bottom-up aggregation.

Loads the curated catalogue (library/diseases.yaml), computes affected-births/year per disease
from incidence × global births, and rolls up burden and intervention-addressability from the
BOTTOM UP. This is the project's core object; the parametric Monte-Carlo model provides the
uncertainty envelope, while the library provides the disease-level structure and provenance.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from . import config, embryos

LIBRARY_YAML = config.PKG_DIR / "library" / "diseases.yaml"

# Reproductive tools that prevent an affected birth (NBS mitigates, it doesn't prevent).
REPRO_TOOLS = ["CS", "PGT", "PND"]

# Genetic-medicine status: one legible, weight-free category per disease, derived directly from
# which interventions apply. Ordered best-available first for display.
STATUS_ORDER = ["preventable_treatable", "preventable", "treatable", "detectable_only", "none"]
STATUS_LABEL = {
    "preventable_treatable": "Preventable & treatable",
    "preventable": "Preventable",
    "treatable": "Treatable",
    "detectable_only": "Detectable only",
    "none": "No genetic-medicine option",
}


def compute_status(disease: dict) -> dict:
    """Categorical genetic-medicine status from the four intervention flags (no weights).

    * can_select = carrier screening or embryo selection applies → an unaffected child is achievable
    * treatable  = newborn screening + effective early therapy applies → a healthy born child
    * detectable = prenatal diagnosis applies (detect + reproductive decision), even without selection
    """
    can_select = _tool_applicable(disease, "CS") or _tool_applicable(disease, "PGT")
    treatable = _tool_applicable(disease, "NBS")
    detectable = _tool_applicable(disease, "PND")

    if can_select and treatable:
        status = "preventable_treatable"
    elif can_select:
        status = "preventable"
    elif treatable:
        status = "treatable"
    elif detectable:
        status = "detectable_only"
    else:
        status = "none"
    return {
        "status": status,
        "label": STATUS_LABEL[status],
        "preventable": can_select,
        "treatable": treatable,
        "prenatal_detectable": detectable,
        "addressable": status != "none",  # addressable by some existing tool
    }


def load_library() -> dict:
    with open(LIBRARY_YAML, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def _tool_applicable(disease: dict, tool: str) -> bool:
    iv = (disease.get("interventions") or {}).get(tool) or {}
    return bool(iv.get("applicable", False))


def build_library(constants: dict) -> dict[str, Any]:
    lib = load_library()
    births = float(constants["births"]["global_per_year"]["value"])
    diseases_out: list[dict] = []

    for d in lib["diseases"]:
        inc = d["incidence_per_100k"]
        per100k = float(inc["value"])
        affected = births * per100k / 100_000.0
        addressable_repro = any(_tool_applicable(d, t) for t in REPRO_TOOLS)
        nbs = _tool_applicable(d, "NBS")
        diseases_out.append({
            "id": d["id"],
            "name": d["name"],
            "category": d["category"],
            "genes": d.get("genes", []),
            "inheritance": d.get("inheritance"),
            "omim": d.get("omim", ""),
            "orphanet": d.get("orphanet", ""),
            "severity": d.get("severity"),
            "onset": d.get("onset"),
            "incidence_per_100k": per100k,
            "incidence_basis": inc.get("basis"),
            "incidence_source": inc.get("source"),
            "incidence_doi": inc.get("doi"),
            "affected_births_per_year": affected,
            "interventions": {
                t: {
                    "applicable": _tool_applicable(d, t),
                    "note": ((d.get("interventions") or {}).get(t) or {}).get("note"),
                }
                for t in ["CS", "PGT", "PND", "NBS"]
            },
            "addressable_by_reproductive_tool": addressable_repro,
            "nbs_mitigable": nbs,
            "editing_unique": bool(d.get("editing_unique", False)),
            "editing_note": d.get("editing_note"),
            "notes": d.get("notes"),
            "status": compute_status(d),
            "embryos": embryos.per_disease(
                d.get("inheritance", "autosomal_recessive"),
                _tool_applicable(d, "PGT"), constants),
        })

    diseases_out.sort(key=lambda x: -x["affected_births_per_year"])

    # ---- roll-ups (bottom-up point sums) ----
    total = sum(x["affected_births_per_year"] for x in diseases_out)

    def _sum_where(pred) -> float:
        return sum(x["affected_births_per_year"] for x in diseases_out if pred(x))

    by_category: dict[str, float] = {}
    for x in diseases_out:
        by_category[x["category"]] = by_category.get(x["category"], 0.0) + x["affected_births_per_year"]
    by_severity: dict[str, float] = {}
    for x in diseases_out:
        by_severity[x["severity"]] = by_severity.get(x["severity"], 0.0) + x["affected_births_per_year"]

    addressable = _sum_where(lambda x: x["addressable_by_reproductive_tool"])
    nbs_mitigable = _sum_where(lambda x: x["nbs_mitigable"])
    editing_unique = _sum_where(lambda x: x["editing_unique"])
    cited = _sum_where(lambda x: x["incidence_basis"] == "cited")

    per_tool_births = {
        t: _sum_where(lambda x, t=t: x["interventions"][t]["applicable"])
        for t in ["CS", "PGT", "PND", "NBS"]
    }

    # Genetic-medicine status distribution (the headline split, weight-free)
    status_distribution = {
        s: {
            "label": STATUS_LABEL[s],
            "n_diseases": sum(1 for x in diseases_out if x["status"]["status"] == s),
            "births": _sum_where(lambda x, s=s: x["status"]["status"] == s),
        }
        for s in STATUS_ORDER
    }
    addressable_births = _sum_where(lambda x: x["status"]["addressable"])
    status_summary = {
        "order": STATUS_ORDER,
        "distribution": status_distribution,
        "addressable_by_existing_tools_births": addressable_births,
        "addressable_by_existing_tools_share": (addressable_births / total) if total else 0.0,
        "definition": (
            "Each disease is placed in one status from its intervention flags (no weights): "
            "Preventable & treatable, Preventable (an unaffected child achievable via screening/"
            "selection), Treatable (effective early therapy), Detectable only (prenatal detection "
            "without selection), or No current option. The distribution across statuses — by disease "
            "count and by affected births — is the headline picture of what existing genetic "
            "medicine can already do."
        ),
    }

    rollup = {
        "n_diseases": len(diseases_out),
        "total_affected_births_per_year": total,
        "by_category": by_category,
        "by_severity": by_severity,
        "births_addressable_by_reproductive_tool": addressable,
        "share_addressable_by_reproductive_tool": (addressable / total) if total else 0.0,
        "births_nbs_mitigable": nbs_mitigable,
        "births_editing_unique": editing_unique,
        "per_tool_addressable_births": per_tool_births,
        "genetic_medicine_status": status_summary,
        "cited_incidence_share": (cited / total) if total else 0.0,
        "note": (
            "Bottom-up point sums over the curated catalogue. Coverage is partial (a seed catalogue "
            "of the highest-burden serious conditions), so totals are a LOWER BOUND on the full "
            "genetic-disease denominator and will rise as the Orphanet/GBD ingest expands the library. "
            "The parametric Monte-Carlo model provides the calibrated top-down denominator with "
            "credible intervals."
        ),
    }

    return {
        "meta": lib.get("meta", {}),
        "categories": lib.get("categories", {}),
        "diseases": diseases_out,
        "rollup": rollup,
    }
