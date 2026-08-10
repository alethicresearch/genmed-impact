"""Data ingestion layer.

Each module targets one source and writes tidy parquet/JSON into ``data/curated/``. Tier-A
sources (open programmatic access) are attempted directly; anything that fails or requires
registration is appended to ``DATA_NEEDED.md`` with an exact, executable request. The core
pipeline runs on ``constants.yaml`` regardless — successful pulls *overwrite* the matching
PLACEHOLDER entries, they are never required for a run.
"""
from __future__ import annotations

from . import un_wpp, who_gho, gnomad, worldbank, unaids, orphanet


MODULES = [un_wpp, who_gho, gnomad, worldbank, unaids, orphanet]


def run_all() -> None:
    from .. import config
    config.ensure_dirs()
    results = []
    for mod in MODULES:
        name = mod.__name__.split(".")[-1]
        try:
            msg = mod.fetch()
            results.append((name, "ok", msg))
            print(f"[ingest:{name}] {msg}")
        except Exception as exc:  # noqa: BLE001 - report, never halt
            results.append((name, "needs-manual", str(exc)))
            print(f"[ingest:{name}] deferred -> DATA_NEEDED.md ({exc})")
    print(f"[ingest] {sum(1 for _, s, _ in results if s == 'ok')}/{len(results)} sources pulled.")
