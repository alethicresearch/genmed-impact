"""Editing technologies, variant classes, and what can actually be corrected.

Elsewhere this project treats "editing" as one capability. That is too coarse to support the
argument it is asked to carry. Whether a heritable correction is even conceivable for a given
family depends on **what kind of variant** they carry and **which platform** could address it —
and for several of the conditions where embryo selection cannot help, no current platform offers
a correction route at all.

The analysis is organised as a ladder of four gates. All four must hold before editing helps a
particular family; each is a separate question, and only the first two are currently quantifiable::

    Gate 1  Selection cannot help          -> the S1 population (computed in residual.py)
    Gate 2  The variant has a correction route  -> variant class x platform (this module)
    Gate 3  That platform works in an embryo    -> not established for any platform
    Gate 4  It is safe enough to use            -> mosaicism / off-target, unquantified here

Keeping the gates separate is the point. Collapsing them produces the familiar and misleading
claim that editing "could" serve everyone selection cannot, which is true only if gates 2-4 are
assumed away.

Two things this module deliberately does NOT do:

* It records **no efficiency numbers** — editing rates, mosaicism frequencies, off-target
  burdens. Those require sourcing that has not been done (see DATA_NEEDED.md), and inventing
  them would put fabricated precision underneath a headline figure.
* It does not claim a platform is clinically usable in embryos. Gate 2 asks only whether a
  platform exists that can, in principle, make the required molecular change.
"""
from __future__ import annotations

from typing import Any

# ---------------------------------------------------------------------------------------------
# Platforms. "Gene addition" is included precisely because it is NOT editing: it supplies a
# working copy without altering the endogenous sequence, and conflating the two is the most
# common category error in this area.
# ---------------------------------------------------------------------------------------------

PLATFORMS = {
    "gene_addition": {
        "label": "Gene addition",
        "edits_genome": False,
        "mechanism": "Deliver a functional copy of the gene (AAV, lentiviral) without changing "
                     "the endogenous sequence.",
        "examples": "Zolgensma (AAV9, SMA); Lenmeldy (lentiviral, MLD); Luxturna (AAV, RPE65)",
        "maturity": "approved",
        "germline_status": "not applicable — an added copy is not a heritable correction of the "
                           "causal variant",
    },
    "nuclease": {
        "label": "Nuclease editing (CRISPR-Cas9)",
        "edits_genome": True,
        "mechanism": "Cut the DNA and let the cell repair it. Reliable for disrupting a sequence; "
                     "precise correction requires a repair template and is inefficient.",
        "examples": "Casgevy — note this DISRUPTS a BCL11A enhancer to raise fetal haemoglobin; "
                    "it does not correct the sickle variant",
        "maturity": "approved (ex vivo, somatic)",
        "germline_status": "double-strand breaks in embryos are associated with mosaicism, large "
                           "on-target deletions and chromosome loss",
    },
    "base_editor": {
        "label": "Base editing",
        "edits_genome": True,
        "mechanism": "Chemically convert one base pair to another without cutting both strands. "
                     "Performs transitions only: C·G→T·A and A·T→G·C.",
        "examples": "Cytosine and adenine base editors (Komor 2016; Gaudelli 2017)",
        "maturity": "clinical trials (somatic)",
        "germline_status": "no established embryo application",
    },
    "prime_editor": {
        "label": "Prime editing",
        "edits_genome": True,
        "mechanism": "Write a new sequence from an attached template. In principle handles all "
                     "twelve substitutions plus small insertions and deletions.",
        "examples": "Prime editing (Anzalone 2019)",
        "maturity": "early clinical / preclinical",
        "germline_status": "no established embryo application",
    },
    "epigenetic": {
        "label": "Epigenetic editing",
        "edits_genome": False,
        "mechanism": "Change gene expression without altering sequence. Not a correction, and "
                     "heritability across generations is not established.",
        "examples": "dCas9-based repressors/activators",
        "maturity": "preclinical",
        "germline_status": "not a sequence correction",
    },
}

# ---------------------------------------------------------------------------------------------
# Variant classes — the molecular change that would have to be undone.
# ---------------------------------------------------------------------------------------------

VARIANT_CLASSES = {
    "transition_snv": {
        "label": "Point mutation (transition)",
        "detail": "A single base swapped within the purines or within the pyrimidines "
                  "(C↔T, A↔G). The class base editors were built for.",
    },
    "transversion_snv": {
        "label": "Point mutation (transversion)",
        "detail": "A single base swapped between a purine and a pyrimidine (e.g. A→T). Standard "
                  "base editors cannot make this change.",
    },
    "small_indel": {
        "label": "Small insertion or deletion",
        "detail": "A few bases added or lost. Requires writing sequence back, not swapping a base.",
    },
    "large_deletion": {
        "label": "Large deletion or duplication",
        "detail": "Whole exons or genes lost or duplicated. There is no established route to "
                  "restore the missing sequence.",
    },
    "repeat_expansion": {
        "label": "Repeat expansion",
        "detail": "A short sequence repeated far too many times. Contracting a repeat is not an "
                  "established capability.",
    },
    "chromosomal_structural": {
        "label": "Chromosomal rearrangement",
        "detail": "Whole segments of chromosomes joined or reordered. Not a sequence variant at "
                  "all — there is nothing to rewrite, the chromosomes themselves are rearranged.",
    },
    "other": {"label": "Other / mixed", "detail": "Heterogeneous or not characterised here."},
}

# Which platform can, IN PRINCIPLE, make the molecular change a class requires. This is a
# structural statement about mechanism, not a claim about efficiency, safety or embryo use.
CAPABILITY: dict[str, list[str]] = {
    "transition_snv": ["base_editor", "prime_editor"],
    "transversion_snv": ["prime_editor"],          # standard base editors do transitions only
    "small_indel": ["prime_editor"],
    "large_deletion": [],                           # no correction route; addition may substitute
    "repeat_expansion": [],                         # contraction not established
    "chromosomal_structural": [],                   # not a sequence-correction problem
    "other": [],
}

# Tractability of a condition, derived from its dominant variant class.
TRACTABILITY_ORDER = ["base_editable", "prime_only", "no_current_route"]
TRACTABILITY_LABEL = {
    "base_editable": "A mature platform could make the change",
    "prime_only": "Only prime editing could make the change",
    "no_current_route": "No current platform can restore the sequence",
}


def tractability_of(variant_class: str) -> str:
    platforms = CAPABILITY.get(variant_class, [])
    if not platforms:
        return "no_current_route"
    if "base_editor" in platforms:
        return "base_editable"
    return "prime_only"


# ---------------------------------------------------------------------------------------------
# The S1 conditions, by the molecular change a correction would have to make.
#
# These are curated assignments of the DOMINANT variant class. Every one of these genes is
# allelically heterogeneous to some degree, so a single class is an approximation; the
# `heterogeneous` flag and note say where that matters most. Confidence is recorded per entry so
# a reviewer can see which are settled genetics and which need checking.
# ---------------------------------------------------------------------------------------------

CONDITION_VARIANTS = {
    "Sickle cell disease": {
        "dominant_variant_class": "transversion_snv",
        "confidence": "high",
        "heterogeneous": False,
        "explanation": "HbS is a single substitution, GAG→GTG (Glu6Val) — an A·T→T·A transversion. It is "
                "the textbook point mutation, yet standard base editors perform transitions, so "
                "they cannot revert it. Casgevy does not correct it either: it disrupts a BCL11A "
                "enhancer to raise fetal haemoglobin, which is mitigation rather than correction.",
        "citation": "Ingram 1957 (HbS substitution); Frangoul et al. 2021 (exagamglogene, BCL11A)",
    },
    "Beta-thalassaemia": {
        "dominant_variant_class": "transition_snv",
        "confidence": "medium",
        "heterogeneous": True,
        "explanation": "Several hundred HBB alleles are known. Many common ones are point mutations, a "
                "substantial share of them transitions (e.g. IVS-I-110 G>A), but others are small "
                "indels. The share that is base-editable is population-specific and is "
                "approximated here rather than measured.",
        "citation": "HbVar database; Modell & Darlison 2008",
    },
    "Cystic fibrosis": {
        "dominant_variant_class": "small_indel",
        "confidence": "high",
        "heterogeneous": True,
        "explanation": "F508del, a three-base deletion, is the most common CFTR allele worldwide. Losing "
                "bases means sequence has to be written back, which is prime-editing territory. "
                "Other alleles are point mutations, so a minority would be base-editable.",
        "citation": "CFTR2 database; Bobadilla et al. 2002",
    },
    "Congenital sensorineural deafness (GJB2)": {
        "dominant_variant_class": "small_indel",
        "confidence": "medium",
        "heterogeneous": True,
        "explanation": "35delG, a single-base deletion, predominates in European-ancestry populations; "
                "235delC predominates in East Asia. Both are deletions rather than substitutions. "
                "This condition is also contested as a target and is excluded from the headline.",
        "citation": "Snoeckx et al. 2005 (GJB2 genotype-phenotype)",
    },
    "Spinal muscular atrophy (type I)": {
        "dominant_variant_class": "large_deletion",
        "confidence": "high",
        "heterogeneous": False,
        "explanation": "Around 95% of cases are homozygous loss of SMN1 exon 7. There is no established "
                "way to restore a deleted gene, which is exactly why the approved therapies are "
                "gene ADDITION (Zolgensma) and splice modulation of the SMN2 backup copy "
                "(nusinersen) rather than correction. A clear case where addition works and "
                "editing does not.",
        "citation": "Lefebvre et al. 1995 (SMN1); Mendell et al. 2017 (onasemnogene)",
    },
    "Tay-Sachs disease": {
        "dominant_variant_class": "small_indel",
        "confidence": "medium",
        "heterogeneous": True,
        "explanation": "The most common Ashkenazi founder allele, 1278insTATC, is a four-base insertion; "
                "a splice-site variant and a point mutation make up most of the remainder. "
                "Founder-population structure means the dominant class is ancestry-dependent.",
        "citation": "Myerowitz & Costigan 1988; Kaback & Desnick, GeneReviews",
    },
    "Balanced translocations (no viable euploid)": {
        "dominant_variant_class": "chromosomal_structural",
        "confidence": "high",
        "heterogeneous": True,
        "explanation": "Carriers whose chromosome rearrangement leaves no viable euploid embryo. This "
                "is the clearest case of a condition outside editing's reach: there is no "
                "variant to correct, because whole chromosome segments are in the wrong place. "
                "It is nonetheless one of the largest contributors to the population where "
                "selection fails, which is why the distinction matters.",
        "citation": "Scriven et al., translocation PGT outcomes; Zhang et al., carrier segregation",
    },
    "Huntington's disease": {
        "dominant_variant_class": "repeat_expansion",
        "confidence": "high",
        "heterogeneous": False,
        "explanation": "An expanded CAG repeat in HTT. Contracting a repeat is not an established "
                "capability for any platform, which is why therapeutic work targets lowering "
                "huntingtin expression rather than correcting the allele.",
        "citation": "MacDonald et al. 1993 (HTT CAG expansion)",
    },
}

# The gates, in order. Only the first two carry numbers.
GATES = [
    {
        "key": "selection_fails",
        "label": "Selection cannot help",
        "question": "Is there any embryo this couple could select that would be unaffected?",
        "status": "quantified",
        "detail": "The S1 population: couples for whom no unaffected embryo exists. This is the "
                  "only gate where editing has a distinctive claim in the first place.",
    },
    {
        "key": "correction_route",
        "label": "The variant has a correction route",
        "question": "Does any platform exist that could make this molecular change at all?",
        "status": "quantified",
        "detail": "Determined by the class of variant. Restoring a large deletion or contracting "
                  "a repeat expansion is not something any current platform can do.",
    },
    {
        "key": "works_in_embryo",
        "label": "The platform works in an embryo",
        "question": "Has that platform been shown to work safely in a human embryo?",
        "status": "not_established",
        "detail": "Editing a single-cell embryo is not the same problem as editing cells in a "
                  "dish. Nuclease approaches carry documented mosaicism and chromosome-loss "
                  "risks; base and prime editing have no established embryo application.",
    },
    {
        "key": "safe_enough",
        "label": "It is safe enough to use",
        "question": "Are off-target and mosaicism risks low enough to justify use?",
        "status": "unquantified",
        "detail": "Requires efficiency and safety data this project has not sourced. Left "
                  "explicitly unquantified rather than assigned a placeholder.",
    },
]


def build_editing_tech(residual: dict) -> dict[str, Any]:
    """Apply the gate ladder to the S1 population, condition by condition."""
    by_cond = residual.get("s1_by_condition", {}) or {}
    contested = set(residual.get("contested_conditions", []) or [])

    conditions: list[dict] = []
    for name, stat in by_cond.items():
        info = CONDITION_VARIANTS.get(name)
        median = float(stat.get("median", 0.0)) if isinstance(stat, dict) else 0.0
        vc = info["dominant_variant_class"] if info else "other"
        tract = tractability_of(vc)
        conditions.append({
            "condition": name,
            "contested": name in contested,
            "s1_births_per_year": median,
            "dominant_variant_class": vc,
            "variant_class_label": VARIANT_CLASSES[vc]["label"],
            "tractability": tract,
            "tractability_label": TRACTABILITY_LABEL[tract],
            "platforms_in_principle": CAPABILITY.get(vc, []),
            "confidence": info["confidence"] if info else "unassigned",
            "heterogeneous": info["heterogeneous"] if info else True,
            "explanation": info["explanation"] if info else "Variant class not yet curated for this condition.",
            "citation": info["citation"] if info else None,
        })
    conditions.sort(key=lambda c: -c["s1_births_per_year"])

    # Headline uses the same convention as the rest of the project: contested conditions excluded.
    headline = [c for c in conditions if not c["contested"]]
    total = sum(c["s1_births_per_year"] for c in headline)

    def _sum(pred) -> float:
        return sum(c["s1_births_per_year"] for c in headline if pred(c))

    by_tract = {
        t: {
            "label": TRACTABILITY_LABEL[t],
            "births_per_year": _sum(lambda c, t=t: c["tractability"] == t),
            "n_conditions": sum(1 for c in headline if c["tractability"] == t),
        }
        for t in TRACTABILITY_ORDER
    }
    with_route = _sum(lambda c: c["tractability"] != "no_current_route")

    return {
        "meta": {
            "epistemic_status": "derived from curated variant classes; no efficiency or safety "
                                "parameters are used",
            "headline_excludes_contested": sorted(contested),
            "caveats": [
                "Every gene here is allelically heterogeneous to some degree, so assigning one "
                "dominant variant class per condition is an approximation. Conditions where that "
                "matters most are flagged as heterogeneous.",
                "Gate 2 asks only whether a platform could make the molecular change in "
                "principle. It is not a claim that the change can be made in an embryo, "
                "efficiently, or safely — those are gates 3 and 4, and neither is established.",
                "No editing efficiency, mosaicism or off-target figures are used anywhere in this "
                "module; sourcing them is listed in DATA_NEEDED.md.",
                "The S1 population itself carries the credible interval reported on the residual "
                "view; the split below uses median values only.",
            ],
        },
        "platforms": PLATFORMS,
        "variant_classes": VARIANT_CLASSES,
        "capability": CAPABILITY,
        "gates": GATES,
        "conditions": conditions,
        "by_tractability": by_tract,
        "s1_total_headline": total,
        "s1_with_correction_route": with_route,
        "s1_without_correction_route": total - with_route,
        "share_with_correction_route": (with_route / total) if total else 0.0,
    }
