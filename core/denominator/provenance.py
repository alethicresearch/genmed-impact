"""Epistemic-status annotation for provenance trees.

Every parameter the model consumes is published with an explicit ``epistemic_status`` so the
research page can badge each input without inferring anything client-side:

  cited               — taken from a published source, citation attached
  derived             — computed from other inputs; no independent evidence of its own
  modeling_assumption — reasoned central estimate where no direct measurement exists
  normative_choice    — a judgment call (attribution stance, severity cut, PND counting)
                        exposed as a toggle, not a fact
  provisional         — placeholder awaiting stronger sourcing (flagged in DATA_NEEDED.md)

A YAML entry may declare its own ``epistemic_status``; the declaration wins. Otherwise the
status is assigned here from the entry's provenance fields, with the rules kept deliberately
simple and documented in one place. ``annotate`` returns the same tree with every leaf
carrying a valid status — a test enforces completeness on the exported JSON.
"""
from __future__ import annotations

from typing import Any

EPISTEMIC_STATUSES = {
    "cited", "derived", "modeling_assumption", "normative_choice", "provisional",
}

# Subtrees that encode the authors' judgment calls rather than measurements.
_NORMATIVE_PREFIXES = (
    ("constants", "attribution"),
)

# Subtrees computed from other facts (e.g. Mendelian expectations), not measured or assumed.
_DERIVED_PREFIXES = (
    ("constants", "embryo_accounting", "unaffected_embryo_fraction"),
)

# Leaf = mapping with a primitive `value` or a string `source` (mirrors the app's reader).
def _is_leaf(rec: dict) -> bool:
    has_primitive_value = "value" in rec and not isinstance(rec["value"], dict)
    has_string_source = isinstance(rec.get("source"), str)
    return has_primitive_value or has_string_source


def _classify(path: tuple[str, ...], leaf: dict) -> str:
    declared = leaf.get("epistemic_status")
    if declared is not None:
        if declared not in EPISTEMIC_STATUSES:
            raise ValueError(f"{'.'.join(path)}: unknown epistemic_status {declared!r}")
        return declared
    if leaf.get("placeholder"):
        return "provisional"
    for prefix in _NORMATIVE_PREFIXES:
        if path[: len(prefix)] == prefix:
            return "normative_choice"
    for prefix in _DERIVED_PREFIXES:
        if path[: len(prefix)] == prefix:
            return "derived"
    text = f"{leaf.get('source', '')} {leaf.get('table_or_page', '')}".lower()
    if "derived" in text:
        return "derived"
    if "reasoned" in text or "assumption" in text:
        return "modeling_assumption"
    if leaf.get("source"):
        return "cited"
    return "modeling_assumption"


def annotate(tree: Any, root: str) -> Any:
    """Set ``epistemic_status`` on every leaf of ``tree`` (in place); returns the tree."""

    def walk(node: Any, path: tuple[str, ...]) -> None:
        if not isinstance(node, dict):
            return
        if _is_leaf(node):
            node["epistemic_status"] = _classify(path, node)
            return
        for key, child in node.items():
            walk(child, path + (str(key),))

    walk(tree, (root,))
    return tree
