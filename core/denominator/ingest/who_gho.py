"""WHO Global Health Observatory (Tier A) — OData API https://ghoapi.azureedge.net/api/.

Pulls PMTCT/ART coverage and congenital-anomaly mortality indicators used by the coverage and
resistance layers. Writes data/curated/who_gho_<indicator>.parquet.
"""
from __future__ import annotations

BASE = "https://ghoapi.azureedge.net/api/"
INDICATORS = {
    "MDG_0000000026": "PMTCT ARV coverage (%)",
    "MORT_100": "Congenital anomalies mortality (under-5)",
}


def fetch() -> str:
    import json
    import urllib.request

    from .. import config

    written = []
    for code, label in INDICATORS.items():
        url = f"{BASE}{code}"
        try:
            with urllib.request.urlopen(url, timeout=30) as resp:  # noqa: S310
                data = json.loads(resp.read())
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(
                f"GHO OData unreachable for {code} ({label}); query {url} manually -> "
                f"data/raw/who_gho/{code}.json (auto-fetch failed: {exc})")
        import pandas as pd

        df = pd.DataFrame(data.get("value", []))
        dest = config.DATA_CURATED / f"who_gho_{code}.parquet"
        df.to_parquet(dest, index=False)
        written.append(dest.name)
    return f"wrote {', '.join(written)}"
