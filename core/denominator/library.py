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

from . import config

LIBRARY_YAML = config.PKG_DIR / "library" / "diseases.yaml"

# Reproductive tools that prevent an affected birth (NBS mitigates, it doesn't prevent).
REPRO_TOOLS = ["CS", "PGT", "PND"]


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
