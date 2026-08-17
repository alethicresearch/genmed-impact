"""Invariants for the editing-technology gate ladder."""
from __future__ import annotations

import re

import pytest

from denominator import editing_tech

APP_SRC = __import__("pathlib").Path(__file__).resolve().parents[2] / "app" / "src"


@pytest.fixture(scope="module")
def built():
    # A residual stand-in keeps this independent of the Monte-Carlo run.
    residual = {
        "s1_by_condition": {
            "Sickle cell disease": {"median": 6173.0},
            "Balanced translocations (no viable euploid)": {"median": 2760.0},
            "Beta-thalassaemia": {"median": 1155.0},
            "Cystic fibrosis": {"median": 411.0},
            "Spinal muscular atrophy (type I)": {"median": 3.0},
            "Huntington's disease": {"median": 1.0},
            "Tay-Sachs disease": {"median": 0.4},
            "Congenital sensorineural deafness (GJB2)": {"median": 12343.0},
        },
        "contested_conditions": ["Congenital sensorineural deafness (GJB2)"],
    }
    return editing_tech.build_editing_tech(residual)


def test_every_s1_condition_is_classified(built):
    for c in built["conditions"]:
        assert c["dominant_variant_class"] in editing_tech.VARIANT_CLASSES
        assert c["tractability"] in editing_tech.TRACTABILITY_ORDER
        assert c["confidence"] != "unassigned", (
            f"{c['condition']} has no curated variant class — it fell through to a default")
        assert c["explanation"]


def test_base_editors_cannot_do_transversions(built):
    """The distinction the whole analysis turns on: base editors perform transitions only."""
    assert editing_tech.CAPABILITY["transition_snv"] == ["base_editor", "prime_editor"]
    assert "base_editor" not in editing_tech.CAPABILITY["transversion_snv"]
    assert editing_tech.tractability_of("transversion_snv") == "prime_only"


def test_sickle_cell_is_a_transversion(built):
    """Sickle cell is the canonical 'point mutation' but is NOT base-editable."""
    sc = next(c for c in built["conditions"] if c["condition"] == "Sickle cell disease")
    assert sc["dominant_variant_class"] == "transversion_snv"
    assert sc["tractability"] == "prime_only"


def test_classes_with_no_route_have_no_platform(built):
    for vc in ("large_deletion", "repeat_expansion", "chromosomal_structural"):
        assert editing_tech.CAPABILITY[vc] == []
        assert editing_tech.tractability_of(vc) == "no_current_route"


def test_gene_addition_is_not_editing(built):
    """The category error this module exists to fix."""
    assert built["platforms"]["gene_addition"]["edits_genome"] is False
    assert built["platforms"]["epigenetic"]["edits_genome"] is False
    for k in ("nuclease", "base_editor", "prime_editor"):
        assert built["platforms"][k]["edits_genome"] is True


def test_tractability_split_reconciles_to_the_headline(built):
    total = sum(v["births_per_year"] for v in built["by_tractability"].values())
    assert total == pytest.approx(built["s1_total_headline"], rel=1e-9)
    assert built["s1_with_correction_route"] + built["s1_without_correction_route"] == \
        pytest.approx(built["s1_total_headline"], rel=1e-9)
    assert 0.0 <= built["share_with_correction_route"] <= 1.0


def test_contested_conditions_excluded_from_headline(built):
    """Matches the convention used for the S1 headline everywhere else."""
    contested = [c for c in built["conditions"] if c["contested"]]
    assert contested, "expected the contested condition to be present but flagged"
    headline_names = {c["condition"] for c in built["conditions"] if not c["contested"]}
    for c in contested:
        assert c["condition"] not in headline_names
        # its births must not be inside the headline total
        assert c["s1_births_per_year"] > 0
    assert built["s1_total_headline"] < sum(
        c["s1_births_per_year"] for c in built["conditions"])


def test_gates_are_ordered_and_honest_about_status(built):
    keys = [g["key"] for g in built["gates"]]
    assert keys == ["selection_fails", "correction_route", "works_in_embryo", "safe_enough"]
    statuses = {g["key"]: g["status"] for g in built["gates"]}
    # The later gates must NOT claim to be quantified — that is the point of separating them.
    assert statuses["works_in_embryo"] != "quantified"
    assert statuses["safe_enough"] != "quantified"


def test_no_efficiency_or_safety_numbers_are_asserted():
    """Efficiency/mosaicism/off-target rates are unsourced; none may be hard-coded here."""
    src = (__import__("pathlib").Path(editing_tech.__file__)).read_text()
    # a percentage or decimal attached to efficiency-flavoured wording would be fabricated data
    banned = re.compile(
        r"(efficiency|mosaicism|off[- ]target|editing_rate)\s*[:=]\s*[0-9]", re.I)
    assert banned.search(src) is None, "an efficiency/safety figure was hard-coded"
