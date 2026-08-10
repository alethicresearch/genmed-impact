"""Epistemic-status completeness + user-facing copy semantics.

The first half enforces that every provenance leaf the pipeline publishes carries a valid
``epistemic_status`` (the research page badges inputs from this field — it must never fall
back to guessing). The second half is a copy-semantics regression net over the app source:
the precision distinctions introduced in the 2026-08 review pass (editing-only vs
editing-advantage, uncertainty-interval terminology, waterfall remainder wording) must not
silently regress.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from denominator import harmonize, provenance

REPO = Path(__file__).resolve().parents[2]
APP_SRC = REPO / "app" / "src"
PROV_JSON = REPO / "app" / "public" / "data" / "provenance.json"


def _leaves(tree, path=()):
    if isinstance(tree, dict):
        has_primitive_value = "value" in tree and not isinstance(tree["value"], dict)
        has_string_source = isinstance(tree.get("source"), str)
        if has_primitive_value or has_string_source:
            yield path, tree
            return
        for k, v in tree.items():
            yield from _leaves(v, path + (str(k),))


def test_annotate_covers_every_constants_leaf():
    constants = provenance.annotate(harmonize.load_constants(), "constants")
    leaves = list(_leaves(constants, ("constants",)))
    assert leaves, "no provenance leaves found"
    for path, leaf in leaves:
        assert leaf.get("epistemic_status") in provenance.EPISTEMIC_STATUSES, (
            f"{'.'.join(path)} lacks a valid epistemic_status")


def test_annotate_covers_every_conditions_leaf():
    conditions = provenance.annotate(harmonize.load_conditions(), "conditions")
    for path, leaf in _leaves(conditions, ("conditions",)):
        assert leaf.get("epistemic_status") in provenance.EPISTEMIC_STATUSES, (
            f"{'.'.join(path)} lacks a valid epistemic_status")


def test_attribution_stances_are_normative():
    constants = provenance.annotate(harmonize.load_constants(), "constants")
    for stance in ("inclusive", "heritability_weighted", "exclusive"):
        assert constants["attribution"][stance]["epistemic_status"] == "normative_choice"


def test_exported_provenance_json_is_annotated():
    tree = json.loads(PROV_JSON.read_text())
    leaves = list(_leaves(tree))
    assert leaves, "exported provenance.json has no leaves"
    for path, leaf in leaves:
        assert leaf.get("epistemic_status") in provenance.EPISTEMIC_STATUSES, (
            f"exported {'.'.join(path)} lacks epistemic_status — re-run `make run`")


# ---------------------------------------------------------------------------
# Copy-semantics regression net over the app source (user-facing strings only).
# ---------------------------------------------------------------------------

def _app_sources() -> dict[str, str]:
    return {str(p.relative_to(REPO)): p.read_text() for p in APP_SRC.rglob("*.ts*")}


def test_no_user_facing_cri_terminology():
    for name, text in _app_sources().items():
        assert "95% CrI" not in text, f"{name}: use '95% uncertainty interval', not '95% CrI'"
        # The one permitted use is Methods explaining what the intervals are NOT
        # ("...Bayesian posterior credible intervals...").
        remainder = re.sub(r"posterior\s+credible interval", "", text.lower())
        assert "credible interval" not in remainder, (
            f"{name}: intervals are 'uncertainty intervals' in user-facing copy")


def test_permissive_residual_never_called_editing_only():
    # The combined S1 + permissive-S2 quantity is 'editing-relevant', never 'editing-only'.
    for name, text in _app_sources().items():
        assert "Editing-only total" not in text, (
            f"{name}: call the combined quantity the 'editing-relevant residual'")
        assert "uniquely needs germline editing" not in text, (
            f"{name}: distinguish editing-only prevention from editing advantage")


def test_prevention_remainder_not_claimed_for_editing():
    for name, text in _app_sources().items():
        assert "editing's domain" not in text and "editing’s domain" not in text, (
            f"{name}: the full-coverage remainder is 'remaining after full modeled coverage', "
            "not editing's domain")


def test_denominator_does_not_promise_every_number_moves():
    for name, text in _app_sources().items():
        assert "watch every number move" not in text, (
            f"{name}: editing-residual figures do not respond to the burden toggles")


def test_contested_deafness_defaults_to_excluded():
    residual_src = (APP_SRC / "views" / "Residual.tsx").read_text()
    assert "(state.deaf ?? '0') === '1'" in residual_src, (
        "Residual.tsx: congenital deafness must default to EXCLUDED, matching the headline")


def test_no_hardcoded_draw_count_in_app():
    for name, text in _app_sources().items():
        assert "20,000-draw" not in text and "20000-draw" not in text, (
            f"{name}: read the Monte-Carlo draw count from data.meta.n_draws")


def test_no_raw_note_fields_rendered_in_views():
    # Internal data notes serve provenance/model development; they must never automatically
    # become reader-facing prose. Explanatory UI text is written in the view (or a dedicated
    # curated field), not pulled from `.note`/`.notes`. Hover-only `title` attributes on the
    # per-disease intervention map are the one tolerated use.
    banned = re.compile(
        r"\{\s*(?:str\()?\s*[a-zA-Z_$][\w.$]*\.(note|notes|editing_note|liability_note|s1_by_region_note)\s*\)?\s*\}")
    for name, text in _app_sources().items():
        if "/views/" not in name.replace("\\", "/"):
            continue
        stripped = re.sub(r"title=\{[^}]*\}", "", text)  # tooltips excluded
        m = banned.search(stripped)
        assert m is None, (
            f"{name}: renders raw data note field '{m.group(0) if m else ''}' — write curated "
            "copy in the view instead")


def test_explainer_component_not_used():
    # The 'what this shows / reading it / what it tells you' pattern is retired from the
    # public UI; sections use a heading plus at most one orientation paragraph.
    for name, text in _app_sources().items():
        assert "components/Explainer" not in text and "<Explainer" not in text, (
            f"{name}: the Explainer pattern was removed from the public UI")
