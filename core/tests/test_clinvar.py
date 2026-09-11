"""ClinVar cross-check: what it is allowed to settle, and what it must never be used for.

The central risk this file guards is a tempting mistake: ClinVar counts each pathogenic allele
once, so using record counts to weight a population inverts the truth for exactly the conditions
the gate-2 split leans on. These tests pin both the classifier and that boundary.
"""
from __future__ import annotations

import json

import pytest

from denominator import config, editing_tech
from denominator.ingest import clinvar

SPECTRA = config.DATA_CURATED / "clinvar_allele_spectra.json"


# ---- the classifier -------------------------------------------------------------------------

@pytest.mark.parametrize("ref,alt,expected", [
    ("A", "G", "transition_snv"),    # purine -> purine
    ("G", "A", "transition_snv"),
    ("C", "T", "transition_snv"),    # pyrimidine -> pyrimidine
    ("T", "C", "transition_snv"),
    ("A", "T", "transversion_snv"),  # purine -> pyrimidine
    ("T", "A", "transversion_snv"),
    ("G", "C", "transversion_snv"),
    ("C", "G", "transversion_snv"),
])
def test_substitution_class(ref, alt, expected):
    assert clinvar.substitution_class(ref, alt) == expected


def test_sickle_substitution_is_a_transversion():
    """HbS is GAG->GTG: an A->T change. The distinction the gate-2 analysis turns on."""
    assert clinvar.substitution_class("A", "T") == "transversion_snv"


def test_classify_maps_record_types_to_project_classes():
    assert clinvar.classify("single nucleotide variant", "C", "T", "") == "transition_snv"
    assert clinvar.classify("Deletion", "CTT", "C", "") == "small_indel"
    assert clinvar.classify("Microsatellite", "", "", "HTT:c.52CAG[40]") == "repeat_expansion"
    assert clinvar.classify("Deletion", "", "", "NM_x:c.1_900del") == "large_deletion"
    assert clinvar.classify("Translocation", "", "", "") == "chromosomal_structural"


def test_a_long_deletion_is_not_a_small_indel():
    long_ref = "A" * (clinvar.LARGE_INDEL_BP + 10)
    assert clinvar.classify("Deletion", long_ref, "A", "") == "large_deletion"


# ---- the committed cross-check --------------------------------------------------------------

@pytest.fixture(scope="module")
def spectra():
    assert SPECTRA.exists(), "run `make ingest` — the ClinVar cross-check is committed data"
    return json.loads(SPECTRA.read_text(encoding="utf-8"))


def test_spectra_records_its_release_and_caveat(spectra):
    src = spectra["source"]
    assert src["database"].startswith("ClinVar")
    assert src["release"] and src["release"] != "unknown"
    assert "NOT their frequency" in src["caveat"], (
        "the file must carry its own warning — it is the thing most likely to be misused")


def test_every_curated_dominant_class_is_attested(spectra):
    """ClinVar's legitimate job here: confirm the curated class exists in that gene."""
    counts = spectra["counts"]
    for condition, gene in editing_tech.CONDITION_GENE.items():
        info = editing_tech.CONDITION_VARIANTS.get(condition)
        if not info or gene not in counts:
            continue
        vc = info["dominant_variant_class"]
        if vc == "chromosomal_structural":
            continue  # not a gene-level variant; ClinVar has nothing to say
        assert counts[gene].get(vc), (
            f"{condition}: curated class {vc} has no pathogenic {gene} allele in ClinVar")


# ---- the boundary ---------------------------------------------------------------------------

def test_record_counts_would_invert_the_answer_for_sma():
    """Why record counts are not used as weights — the case that proves it.

    ~95% of spinal muscular atrophy is the homozygous SMN1 exon-7 deletion, but that is a single
    ClinVar record set against dozens of rare point mutations. If the spectrum were used to weight
    the population, deletions would come out a small minority and SMA would appear correctable.
    """
    if not SPECTRA.exists():
        pytest.skip("cross-check not ingested")
    counts = json.loads(SPECTRA.read_text(encoding="utf-8"))["counts"].get("SMN1", {})
    if not counts:
        pytest.skip("SMN1 not present")
    total = sum(counts.values())
    deletion_share = counts.get("large_deletion", 0) / total
    assert deletion_share < 0.5, (
        "guard assumes record counts under-represent the common deletion; if ClinVar's "
        "composition has changed, revisit the reasoning rather than deleting this test")
    # The analysis must nonetheless treat SMA as having no correction route.
    assert editing_tech.CONDITION_VARIANTS[
        "Spinal muscular atrophy (type I)"]["dominant_variant_class"] == "large_deletion"
    assert editing_tech.tractability_of("large_deletion") == "no_current_route"


def test_tractability_is_driven_by_curation_not_by_clinvar():
    """The split must come from the curated class, so the cross-check cannot leak into weights."""
    residual = {
        "s1_by_condition": {"Spinal muscular atrophy (type I)": {"median": 1000.0}},
        "contested_conditions": [],
    }
    built = editing_tech.build_editing_tech(residual)
    assert built["by_tractability"]["no_current_route"]["births_per_year"] == pytest.approx(1000.0)
    assert built["s1_with_correction_route"] == pytest.approx(0.0)


def test_gene_level_counts_are_withheld_where_uninformative():
    """HBB carries sickle cell AND every beta-thalassaemia allele; the count describes neither
    on its own, so it must not be attached to sickle cell."""
    residual = {
        "s1_by_condition": {"Sickle cell disease": {"median": 100.0},
                            "Beta-thalassaemia": {"median": 100.0}},
        "contested_conditions": [],
    }
    built = editing_tech.build_editing_tech(residual)
    by_name = {c["condition"]: c for c in built["conditions"]}
    assert by_name["Sickle cell disease"]["reported_alleles"] is None
    assert by_name["Sickle cell disease"]["reported_alleles_note"]
    if SPECTRA.exists():
        assert by_name["Beta-thalassaemia"]["reported_alleles"] > 0
