"""World Bank income classification (Tier A) — country → income group crosswalk.

Open API. Writes data/curated/income_groups.parquet [iso3, country, income_group].
"""
from __future__ import annotations

URL = "https://api.worldbank.org/v2/country?format=json&per_page=400"


def fetch() -> str:
    import json
    import urllib.request

    from .. import config

    try:
        with urllib.request.urlopen(URL, timeout=30) as resp:  # noqa: S310
            data = json.loads(resp.read())
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"World Bank API unreachable; GET {URL} -> data/raw/worldbank/ "
                           f"(auto-fetch failed: {exc})")
    rows = []
    for c in data[1]:
        inc = (c.get("incomeLevel") or {}).get("value")
        if inc and inc != "Aggregates":
            rows.append({"iso3": c.get("id"), "country": c.get("name"), "income_group": inc})
    import pandas as pd

    df = pd.DataFrame(rows)
    dest = config.DATA_CURATED / "income_groups.parquet"
    df.to_parquet(dest, index=False)
    return f"wrote {len(df)} country income classifications -> {dest.name}"
