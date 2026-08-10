"""Paths and global run configuration."""
from __future__ import annotations

from pathlib import Path

PKG_DIR = Path(__file__).resolve().parent
CORE_DIR = PKG_DIR.parent
REPO_DIR = CORE_DIR.parent

CONSTANTS_YAML = PKG_DIR / "constants.yaml"
CONDITIONS_YAML = PKG_DIR / "conditions.yaml"

DATA_RAW = CORE_DIR / "data" / "raw"
DATA_CURATED = CORE_DIR / "data" / "curated"

RESULTS_DIR = REPO_DIR / "results"
FIGURES_DIR = RESULTS_DIR / "figures"
APP_DATA_DIR = REPO_DIR / "app" / "public" / "data"

# Monte Carlo
N_DRAWS = 10_000
SEED = 20260810

# Default headline assumption set (chosen to be the paper's operationalization).
DEFAULT_SEVERITY = "def_b"          # "lethal or lifelong serious disability absent treatment"
DEFAULT_ATTRIBUTION = "inclusive"   # count multifactorial cases in full
DEFAULT_SCENARIO = "current"
DEFAULT_PND_COUNTS = True

SEVERITY_DEFS = ["def_a", "def_b", "def_c"]
ATTRIBUTION_STANCES = ["inclusive", "heritability_weighted", "exclusive"]
SCENARIOS = ["current", "achievable_2035", "ideal"]
TOOLS = ["CS", "PGT", "PND", "NBS"]
S2_CRITERIA = ["strict", "permissive"]


def ensure_dirs() -> None:
    for d in (DATA_CURATED, RESULTS_DIR, FIGURES_DIR, APP_DATA_DIR):
        d.mkdir(parents=True, exist_ok=True)
