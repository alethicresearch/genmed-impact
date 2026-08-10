"""Invariants for the genetic-disease × intervention library."""
from __future__ import annotations

import pytest

from denominator import harmonize, library

CATEGORIES = {"monogenic_recessive", "monogenic_dominant", "x_linked", "chromosomal", "multifactorial"}
TOOLS = {"CS", "PGT", "PND", "NBS"}


@pytest.fixture(scope="module")
def built():
    return library.build_library(harmonize.load_constants())


def test_library_nonempty(built):
    assert built["rollup"]["n_diseases"] >= 7
    # `n_diseases` is the curated core (headline); `diseases` includes the rare tier too.
    assert len(built["diseases"]) == built["rollup"]["n_diseases_all"]
    assert built["rollup"]["n_diseases_all"] >= built["rollup"]["n_diseases"]


def test_tiers_reconcile(built):
    r = built["rollup"]
    t = r["tiers"]
    assert t["core"]["n_diseases"] == r["n_diseases"]
    assert t["core"]["n_diseases"] + t["rare"]["n_diseases"] == t["all"]["n_diseases"]
    assert t["all"]["n_diseases"] == r["n_diseases_all"]
    # headline burden is the core tier only
    assert abs(t["core"]["affected_births_per_year"] - r["total_affected_births_per_year"]) < 1.0
    # rare tier is genuinely present and near-fully cited (Orphanet birth prevalence)
    assert t["rare"]["n_diseases"] > 0
    assert t["rare"]["cited_incidence_share_by_count"] > 0.9


SINGLE_GENE = {"monogenic_recessive", "monogenic_dominant", "x_linked"}


def test_every_disease_has_inheritance_and_category(built):
    for d in built["diseases"]:
        assert d["inheritance"], f"{d['id']} missing inheritance"
        assert d["category"] in CATEGORIES, f"{d['id']} bad category {d['category']}"


def test_single_gene_diseases_name_a_gene(built):
    # Chromosomal (whole-chromosome) and multifactorial (many loci) legitimately have no
    # single causal gene; single-gene categories must name at least one.
    for d in built["diseases"]:
        if d["category"] in SINGLE_GENE:
            assert d["genes"], f"{d['id']} ({d['category']}) missing gene"


def test_intervention_shape(built):
    for d in built["diseases"]:
        assert set(d["interventions"].keys()) == TOOLS
        for t in TOOLS:
            assert isinstance(d["interventions"][t]["applicable"], bool)


def test_affected_births_positive(built):
    for d in built["diseases"]:
        assert d["affected_births_per_year"] > 0
    assert built["rollup"]["total_affected_births_per_year"] > 0


def test_ids_unique(built):
    ids = [d["id"] for d in built["diseases"]]
    assert len(ids) == len(set(ids))


def test_every_disease_has_prevention_and_intent(built):
    prev_valid = set(library.PREVENTION_ORDER)
    intent_valid = set(library.TREATMENT_INTENT_ORDER)
    for d in built["diseases"]:
        assert d["prevention"]["category"] in prev_valid
        assert d["treatment"]["intent"] in intent_valid
        # reach never claims "no genetic-medicine option": it is addressable-by-existing XOR
        # the editing-relevant residual.
        assert d["reach"]["addressable_by_existing_tools"] != d["reach"]["editing_relevant_residual"]


def test_prevention_logic():
    def dz(cs, pgt, pnd):
        return {"interventions": {"CS": {"applicable": cs}, "PGT": {"applicable": pgt},
                                  "PND": {"applicable": pnd}, "NBS": {"applicable": False}}}
    assert library.compute_prevention(dz(1, 0, 1))["category"] == "preventable"
    assert library.compute_prevention(dz(0, 1, 1))["category"] == "preventable"
    assert library.compute_prevention(dz(0, 0, 1))["category"] == "detectable_only"
    assert library.compute_prevention(dz(0, 0, 0))["category"] == "not_preventable"
    assert library.compute_prevention(dz(1, 0, 0))["by"] == ["CS"]


def test_treatment_intent_from_modality():
    # intent defaults from the modality, and is overridable per disease.
    assert library.treatment_of({"treatment": {"modality": "transplant"}})["intent"] == "curative"
    assert library.treatment_of({"treatment": {"modality": "enzyme_replacement"}})["intent"] == "disease_modifying"
    assert library.treatment_of({"treatment": {"modality": "supportive"}})["intent"] == "palliative"
    assert library.treatment_of({"treatment": {"modality": "none"}})["intent"] == "none"
    # explicit intent overrides the modality default and is flagged as curated
    ov = library.treatment_of({"treatment": {"modality": "surgical", "intent": "curative"}})
    assert ov["intent"] == "curative" and ov["intent_curated"] is True


def test_prevention_distribution_reconciles(built):
    dist = built["rollup"]["prevention"]["distribution"]
    assert sum(v["n_diseases"] for v in dist.values()) == built["rollup"]["n_diseases"]
    total_b = built["rollup"]["total_affected_births_per_year"]
    assert abs(sum(v["births"] for v in dist.values()) - total_b) < 1.0


def test_treatment_intent_distribution_reconciles(built):
    dist = built["rollup"]["treatment_intent"]["distribution"]
    assert sum(v["n_diseases"] for v in dist.values()) == built["rollup"]["n_diseases"]
    total_b = built["rollup"]["total_affected_births_per_year"]
    assert abs(sum(v["births"] for v in dist.values()) - total_b) < 1.0


def test_every_disease_has_treatment_modality(built):
    valid = set(library.TREATMENT_ORDER)
    for d in built["diseases"]:
        assert d["treatment"]["modality"] in valid
        assert d["treatment"]["disease_modifying"] == (
            d["treatment"]["intent"] in ("curative", "disease_modifying"))


def test_editing_is_not_a_treatment_modality():
    # the whole point: germline editing must never be one of the existing treatment modalities
    assert "editing" not in library.TREATMENT_ORDER
    assert "germline_editing" not in library.TREATMENT_ORDER


def test_treatment_distribution_reconciles(built):
    dist = built["rollup"]["treatment_modalities"]["distribution"]
    assert sum(v["n_diseases"] for v in dist.values()) == built["rollup"]["n_diseases"]


def test_rollup_shares_in_unit_interval(built):
    r = built["rollup"]
    assert 0.0 <= r["share_addressable_by_reproductive_tool"] <= 1.0
    assert 0.0 <= r["cited_incidence_share"] <= 1.0
    assert r["births_editing_unique"] <= r["total_affected_births_per_year"] + 1e-6
    # category sums reconcile to the total
    assert abs(sum(r["by_category"].values()) - r["total_affected_births_per_year"]) < 1.0
