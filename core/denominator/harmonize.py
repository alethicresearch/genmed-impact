"""Harmonization: region/income crosswalks and birth-share weights.

For v1 the geographic layer is resolved at the World Bank income-group level and the GBD
super-region level using population-weighted birth shares. ``ingest/un_wpp.py`` and
``ingest/worldbank.py`` refine ``data/curated/births_by_region.parquet`` with per-country
primary data; until then these cited shares drive the region selector.

Coverage multipliers scale the global-default coverage vectors in constants.yaml to reflect
differential access (the draft paper's point that ~94% of birth-defect births occur in LMICs).
"""
from __future__ import annotations

import yaml

from . import config


def load_yaml(path) -> dict:
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def load_constants() -> dict:
    return load_yaml(config.CONSTANTS_YAML)


def load_conditions() -> dict:
    return load_yaml(config.CONDITIONS_YAML)


# World Bank income groups: share of global annual births + access multiplier on coverage.
# Birth shares are population-weighted approximations (UN WPP 2024 regional births);
# access_multiplier <1 for LMICs reflects limited screening/diagnostic infrastructure.
INCOME_GROUPS = {
    "High income": {
        "birth_share": {"value": 0.10, "low": 0.08, "high": 0.12},
        "access_multiplier": {"value": 1.0, "low": 0.95, "high": 1.0},
        "consanguinity_F": {"value": 0.002, "low": 0.001, "high": 0.005},
    },
    "Upper-middle income": {
        "birth_share": {"value": 0.32, "low": 0.28, "high": 0.36},
        "access_multiplier": {"value": 0.55, "low": 0.35, "high": 0.75},
        "consanguinity_F": {"value": 0.010, "low": 0.004, "high": 0.020},
    },
    "Lower-middle income": {
        "birth_share": {"value": 0.44, "low": 0.40, "high": 0.48},
        "access_multiplier": {"value": 0.20, "low": 0.10, "high": 0.35},
        "consanguinity_F": {"value": 0.020, "low": 0.010, "high": 0.035},
    },
    "Low income": {
        "birth_share": {"value": 0.14, "low": 0.11, "high": 0.17},
        "access_multiplier": {"value": 0.08, "low": 0.03, "high": 0.18},
        "consanguinity_F": {"value": 0.025, "low": 0.012, "high": 0.045},
    },
}

# GBD super-regions: birth shares only (used for the burden decomposition view).
GBD_SUPER_REGIONS = {
    "Sub-Saharan Africa": {"birth_share": {"value": 0.24, "low": 0.21, "high": 0.27}},
    "South Asia": {"birth_share": {"value": 0.25, "low": 0.22, "high": 0.28}},
    "Southeast/East Asia & Oceania": {"birth_share": {"value": 0.20, "low": 0.17, "high": 0.23}},
    "North Africa & Middle East": {"birth_share": {"value": 0.09, "low": 0.07, "high": 0.11}},
    "Latin America & Caribbean": {"birth_share": {"value": 0.08, "low": 0.06, "high": 0.10}},
    "Central Europe/Eastern Europe/Central Asia": {"birth_share": {"value": 0.06, "low": 0.05, "high": 0.08}},
    "High-income": {"birth_share": {"value": 0.08, "low": 0.06, "high": 0.10}},
}

REGION_SOURCE = {
    "source": "UN WPP 2024 regional births; World Bank income classification FY24",
    "doi": "https://population.un.org/wpp/",
    "table_or_page": "regional live births 2023 (population-weighted)",
    "retrieved": "2026-08-10",
    "note": "Placeholder shares pending ingest/un_wpp.py per-country pull.",
}
