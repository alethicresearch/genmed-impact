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
RARE_YAML = config.PKG_DIR / "library" / "rare_orphanet.yaml"

# Reproductive tools that prevent an affected birth (NBS mitigates, it doesn't prevent).
REPRO_TOOLS = ["CS", "PGT", "PND"]

# ---------------------------------------------------------------------------------------------
# The paper's central move is to keep distinct things distinct. We classify each disease on TWO
# independent axes, and always by WHICH tool — never with a single conflated "status" bucket:
#
#   1. PREVENTION (before birth): can an affected birth be avoided, and by what reproductive tool?
#   2. TREATMENT (for a child born affected): what can medicine do, and to what END —
#      curative vs disease-modifying vs palliative? "Treatable" alone hides that difference.
#
# Germline editing is NOT on either axis. It is the residual: the cases the EXISTING stack
# (screening → PGT → prenatal diagnosis → post-birth therapy) reaches by neither prevention nor
# treatment. So "no existing option" never means "no genetic-medicine option" — editing is one,
# and it is exactly what that residual is about.

PREVENTION_ORDER = ["preventable", "detectable_only", "not_preventable"]
PREVENTION_LABEL = {
    "preventable": "Preventable before birth",
    "detectable_only": "Prenatally detectable only",
    "not_preventable": "Not preventable before birth",
}

# TREATMENT INTENT — the END a treatment serves for the born child. This is the distinction the
# paper insists on: a curative therapy, lifelong disease management, and palliation are worlds
# apart. Assigned from the treatment modality by default (MODALITY_DEFAULT_INTENT) unless a disease
# gives an explicit `treatment.intent`. NOTE: intent is a clinical judgment — the modality-derived
# defaults are a transparent first pass meant to be curated per disease.
TREATMENT_INTENT_ORDER = ["curative", "disease_modifying", "palliative", "none"]
TREATMENT_INTENT_LABEL = {
    "curative": "Curative",
    "disease_modifying": "Disease-modifying / management",
    "palliative": "Palliative / supportive only",
    "none": "No effective treatment",
}

# Existing post-birth (somatic) treatment modalities — the TYPE of treatment. Germline editing is
# deliberately NOT in this list: it is a categorically different intervention (the residual).
TREATMENT_ORDER = [
    "somatic_gene_cell_therapy", "enzyme_replacement", "pharmacologic", "transplant",
    "dietary", "cofactor", "surgical", "supportive", "none", "unknown",
]
TREATMENT_LABEL = {
    "somatic_gene_cell_therapy": "Somatic gene/cell therapy",
    "enzyme_replacement": "Enzyme replacement",
    "pharmacologic": "Pharmacologic (drug)",
    "transplant": "Transplant",
    "dietary": "Dietary/metabolic",
    "cofactor": "Cofactor/vitamin",
    "surgical": "Surgical",
    "supportive": "Supportive only",
    "none": "No disease-modifying treatment",
    "unknown": "Unclassified",
}
# Default treatment END for each modality (overridable per disease via treatment.intent).
MODALITY_DEFAULT_INTENT = {
    "somatic_gene_cell_therapy": "curative",
    "transplant": "curative",
    "enzyme_replacement": "disease_modifying",
    "pharmacologic": "disease_modifying",
    "dietary": "disease_modifying",
    "cofactor": "disease_modifying",
    "surgical": "disease_modifying",
    "supportive": "palliative",
    "none": "none",
    "unknown": "none",
}
# Modalities that meaningfully modify disease course (vs supportive/none).
DISEASE_MODIFYING = {
    "somatic_gene_cell_therapy", "enzyme_replacement", "pharmacologic", "transplant",
    "dietary", "cofactor", "surgical",
}


def treatment_of(disease: dict) -> dict:
    """The type (modality) AND the end (intent) of the best existing treatment for the born child."""
    t = disease.get("treatment") or {}
    mod = t.get("modality", "unknown")
    if mod not in TREATMENT_LABEL:
        mod = "unknown"
    intent = t.get("intent")
    intent_curated = intent in TREATMENT_INTENT_LABEL
    if not intent_curated:
        intent = MODALITY_DEFAULT_INTENT.get(mod, "none")
    return {
        "modality": mod,
        "label": TREATMENT_LABEL[mod],
        "intent": intent,
        "intent_label": TREATMENT_INTENT_LABEL[intent],
        "intent_curated": intent_curated,   # False = derived from modality, pending clinical review
        "disease_modifying": intent in ("curative", "disease_modifying"),
        "note": t.get("note"),
    }


def compute_prevention(disease: dict) -> dict:
    """Prevention axis: can an affected birth be avoided before birth, and by WHICH tool?

    * preventable      = carrier screening or embryo selection (PGT) can yield an unaffected child
    * detectable_only  = prenatal diagnosis applies (informed reproductive choice) but not selection
    * not_preventable  = neither
    """
    cs = _tool_applicable(disease, "CS")
    pgt = _tool_applicable(disease, "PGT")
    pnd = _tool_applicable(disease, "PND")
    by = [t for t in ("CS", "PGT", "PND") if _tool_applicable(disease, t)]
    if cs or pgt:
        category = "preventable"
    elif pnd:
        category = "detectable_only"
    else:
        category = "not_preventable"
    return {
        "category": category,
        "label": PREVENTION_LABEL[category],
        "by": by,                       # which reproductive tools apply — the "by what"
        "avoidable": cs or pgt,
        "prenatal_detectable": pnd,
    }


def reach_of(prevention: dict, treatment: dict) -> dict:
    """Whether the EXISTING stack does anything, and if not, that this is editing's residual."""
    treated = treatment["intent"] != "none"
    addressable = prevention["avoidable"] or prevention["prenatal_detectable"] or treated
    return {
        "addressable_by_existing_tools": addressable,
        # No existing tool prevents, detects, or treats — this is where germline editing is the
        # only genetic-medicine option, NOT "no genetic-medicine option".
        "editing_relevant_residual": not addressable,
    }


def load_library() -> dict:
    """Load the curated core catalogue plus, if present, the auto-generated rare Orphanet tier.

    Every disease is tagged with ``tier`` ("core" for the hand-curated high-burden catalogue,
    "rare" for the segmented Orphanet long tail). The rare tier completes the catalogue for
    disease-count questions without moving the burden-weighted headline, which is computed over
    the core tier alone (see build_library).
    """
    with open(LIBRARY_YAML, "r", encoding="utf-8") as fh:
        lib = yaml.safe_load(fh)
    for d in lib["diseases"]:
        d.setdefault("tier", "core")
        d.setdefault("confidence", "curated")

    if RARE_YAML.exists():
        with open(RARE_YAML, "r", encoding="utf-8") as fh:
            rare = yaml.safe_load(fh) or {}
        for d in rare.get("diseases", []):
            d.setdefault("tier", "rare")
            d.setdefault("confidence", "automated")
        lib["diseases"] = lib["diseases"] + rare.get("diseases", [])
        lib["rare_meta"] = rare.get("meta", {})
    return lib


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
        prevention = compute_prevention(d)
        treatment = treatment_of(d)
        reach = reach_of(prevention, treatment)
        diseases_out.append({
            "id": d["id"],
            "name": d["name"],
            "tier": d.get("tier", "core"),
            "confidence": d.get("confidence", "curated"),
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
            "prevention": prevention,
            "treatment": treatment,
            "reach": reach,
            "embryos": embryos.per_disease(
                d.get("inheritance", "autosomal_recessive"),
                _tool_applicable(d, "PGT"), constants),
        })

    diseases_out.sort(key=lambda x: -x["affected_births_per_year"])

    # ---- roll-ups (bottom-up point sums) ----
    # The headline is computed over the CURATED CORE tier only, so the burden-weighted numbers
    # stay stable and high-confidence. The auto-generated rare Orphanet tier completes the
    # catalogue for disease-count questions and is summarised separately in `tiers` below.
    core_out = [x for x in diseases_out if x["tier"] == "core"]
    rare_out = [x for x in diseases_out if x["tier"] == "rare"]
    total = sum(x["affected_births_per_year"] for x in core_out)

    def _sum_where(pred) -> float:
        return sum(x["affected_births_per_year"] for x in core_out if pred(x))

    by_category: dict[str, float] = {}
    for x in core_out:
        by_category[x["category"]] = by_category.get(x["category"], 0.0) + x["affected_births_per_year"]
    by_severity: dict[str, float] = {}
    for x in core_out:
        by_severity[x["severity"]] = by_severity.get(x["severity"], 0.0) + x["affected_births_per_year"]

    nbs_mitigable = _sum_where(lambda x: x["nbs_mitigable"])
    editing_unique = _sum_where(lambda x: x["editing_unique"])
    cited = _sum_where(lambda x: x["incidence_basis"] == "cited")

    per_tool_births = {
        t: _sum_where(lambda x, t=t: x["interventions"][t]["applicable"])
        for t in ["CS", "PGT", "PND", "NBS"]
    }

    # AXIS 1 — Prevention (before birth), by which reproductive tool applies.
    prevention_distribution = {
        c: {
            "label": PREVENTION_LABEL[c],
            "n_diseases": sum(1 for x in core_out if x["prevention"]["category"] == c),
            "births": _sum_where(lambda x, c=c: x["prevention"]["category"] == c),
        }
        for c in PREVENTION_ORDER
    }
    preventable_births = _sum_where(lambda x: x["prevention"]["avoidable"])
    prevention_summary = {
        "order": PREVENTION_ORDER,
        "distribution": prevention_distribution,
        "preventable_births": preventable_births,
        "preventable_share": (preventable_births / total) if total else 0.0,
        "per_tool_births": {t: per_tool_births[t] for t in ("CS", "PGT", "PND")},
        "definition": (
            "Can an affected birth be avoided before birth, and by which tool? Preventable = carrier "
            "screening or embryo selection (PGT) can yield an unaffected child; detectable-only = "
            "prenatal diagnosis applies without selection; not preventable = neither."
        ),
    }

    # AXIS 2a — Treatment INTENT (the end it serves): curative vs disease-modifying vs palliative.
    intent_distribution = {
        i: {
            "label": TREATMENT_INTENT_LABEL[i],
            "n_diseases": sum(1 for x in core_out if x["treatment"]["intent"] == i),
            "births": _sum_where(lambda x, i=i: x["treatment"]["intent"] == i),
        }
        for i in TREATMENT_INTENT_ORDER
    }
    n_intent_curated = sum(1 for x in core_out if x["treatment"]["intent_curated"])
    treatment_intent_summary = {
        "order": TREATMENT_INTENT_ORDER,
        "distribution": intent_distribution,
        "n_curated": n_intent_curated,
        "definition": (
            "For a child born affected, what is the END of the best existing treatment — a cure, "
            "lifelong disease management, or palliation? Curative eliminates the disease; "
            "disease-modifying alters its course but needs ongoing care; palliative relieves "
            "symptoms only. Intent is assigned from the treatment type by default and curated per "
            "disease where reviewed."
        ),
    }

    # AXIS 2b — Treatment TYPE (modality). Editing kept separate.
    treatment_distribution = {
        m: {
            "label": TREATMENT_LABEL[m],
            "disease_modifying": m in DISEASE_MODIFYING,
            "n_diseases": sum(1 for x in core_out if x["treatment"]["modality"] == m),
            "births": _sum_where(lambda x, m=m: x["treatment"]["modality"] == m),
        }
        for m in TREATMENT_ORDER
    }
    treatment_summary = {
        "order": TREATMENT_ORDER,
        "distribution": {m: v for m, v in treatment_distribution.items() if v["n_diseases"] > 0},
        "note": (
            "The TYPE of existing post-birth treatment. Germline editing is not a modality here — it "
            "is a categorically different intervention, tracked as the editing residual."
        ),
    }

    # Reach: addressable by SOME existing tool vs the editing-relevant residual (never "no option").
    addressable_births = _sum_where(lambda x: x["reach"]["addressable_by_existing_tools"])
    editing_relevant_births = _sum_where(lambda x: x["reach"]["editing_relevant_residual"])
    reach_summary = {
        "addressable_by_existing_tools_births": addressable_births,
        "addressable_by_existing_tools_share": (addressable_births / total) if total else 0.0,
        "editing_relevant_residual_births": editing_relevant_births,
        "definition": (
            "A disease is addressable by the EXISTING stack if it is preventable, prenatally "
            "detectable, or treatable (any intent) after birth. The remainder is not 'no "
            "genetic-medicine option' — it is exactly where germline editing is the only option."
        ),
    }

    def _tier_summary(subset: list[dict]) -> dict:
        b = sum(x["affected_births_per_year"] for x in subset)
        cited_b = sum(x["affected_births_per_year"] for x in subset if x["incidence_basis"] == "cited")
        n_cited = sum(1 for x in subset if x["incidence_basis"] == "cited")
        prevention_counts = {c: sum(1 for x in subset if x["prevention"]["category"] == c)
                             for c in PREVENTION_ORDER}
        intent_counts = {i: sum(1 for x in subset if x["treatment"]["intent"] == i)
                         for i in TREATMENT_INTENT_ORDER}
        addressable_n = sum(1 for x in subset if x["reach"]["addressable_by_existing_tools"])
        return {
            "n_diseases": len(subset),
            "affected_births_per_year": b,
            "n_cited_incidence": n_cited,
            "cited_incidence_share_by_count": (n_cited / len(subset)) if subset else 0.0,
            "cited_incidence_share_by_births": (cited_b / b) if b else 0.0,
            "prevention_counts": prevention_counts,
            "treatment_intent_counts": intent_counts,
            "n_addressable_by_existing_tools": addressable_n,
        }

    repro_addressable = _sum_where(lambda x: x["addressable_by_reproductive_tool"])

    tiers = {
        "core": _tier_summary(core_out),
        "rare": _tier_summary(rare_out),
        "all": _tier_summary(diseases_out),
        "note": (
            "The headline rollup (total, the two axes, by_category, treatment modalities) is over "
            "the CURATED CORE tier — the ~97 highest-burden conditions that drive the global "
            "numbers. The RARE tier is the Orphanet-derived long tail: individually rare, "
            "collectively a catalogue-completing set, assigned interventions by transparent rule "
            "(carrier screening for recessive/X-linked; PGT & prenatal diagnosis for any monogenic "
            "with a known gene; newborn treatment left uncredited pending curation). It is shown "
            "segmented so it completes the disease count without inflating the burden headline."
        ),
    }

    rollup = {
        "n_diseases": len(core_out),
        "n_diseases_all": len(diseases_out),
        "tiers": tiers,
        "total_affected_births_per_year": total,
        "by_category": by_category,
        "by_severity": by_severity,
        "births_addressable_by_reproductive_tool": repro_addressable,
        "share_addressable_by_reproductive_tool": (repro_addressable / total) if total else 0.0,
        "births_nbs_mitigable": nbs_mitigable,
        "births_editing_unique": editing_unique,
        "per_tool_addressable_births": per_tool_births,
        "prevention": prevention_summary,
        "treatment_intent": treatment_intent_summary,
        "treatment_modalities": treatment_summary,
        "reach": reach_summary,
        "cited_incidence_share": (cited / total) if total else 0.0,
        "note": (
            "Bottom-up point sums over the curated CORE tier (the highest-burden serious "
            f"conditions). The catalogue also carries {len(rare_out)} rare Orphanet-derived "
            "conditions (see rollup.tiers) that complete the disease count without inflating this "
            "burden headline. The core total is a LOWER BOUND on the full genetic-disease "
            "denominator; the parametric Monte-Carlo model provides the calibrated top-down "
            "denominator with credible intervals."
        ),
    }

    return {
        "meta": lib.get("meta", {}),
        "categories": lib.get("categories", {}),
        "diseases": diseases_out,
        "rollup": rollup,
    }
