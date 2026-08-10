"""UNAIDS AIDSinfo (Tier A) — vertical (mother-to-child) HIV infections per year.

Open exports at aidsinfo.unaids.org. The programmatic export path changes between vintages,
so this module records the exact request and, when the small headline figure cannot be pulled,
defers to the transcribed anchor in constants.yaml (resistance.hiv_vertical_infections_per_year).
"""
from __future__ import annotations

HINT = ("Export 'New HIV infections — vertical transmission, 0-14, all, global' from "
        "https://aidsinfo.unaids.org/ (Data → Download) into data/raw/unaids/ ; "
        "the constants.yaml anchor (resistance.hiv_vertical_infections_per_year) is used "
        "until this file is present.")


def fetch() -> str:
    raise RuntimeError(HINT)
