"""UN World Population Prospects 2024 — annual births by country (Tier A).

Open CSV/XLSX from population.un.org. Writes data/curated/births_by_country.parquet with
columns [iso3, country, births_2023]. If the download host is unreachable, raises with a
DATA_NEEDED-style message; the pipeline continues on constants.yaml.
"""
from __future__ import annotations

WPP_INDICATOR = "Births (thousands), medium variant, 2023"
WPP_HINT = ("Download 'WPP2024_Demographic_Indicators_Medium.csv.gz' from "
            "https://population.un.org/wpp/Download/Standard/CSV/ and place it in "
            "data/raw/un_wpp/ ; columns needed: ISO3_code, Time==2023, Births.")


def fetch() -> str:
    import io
    import urllib.request

    from .. import config

    url = ("https://population.un.org/wpp/assets/Excel%20Files/1_Indicators%20(Standard)/"
           "CSV_FILES/WPP2024_Demographic_Indicators_Medium.csv.gz")
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:  # noqa: S310
            raw = resp.read()
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"{WPP_HINT} (auto-fetch failed: {exc})")

    import gzip
    import pandas as pd

    df = pd.read_csv(io.BytesIO(gzip.decompress(raw)))
    df = df[(df["Time"] == 2023) & (df["ISO3_code"].notna())]
    out = df[["ISO3_code", "Location", "Births"]].rename(
        columns={"ISO3_code": "iso3", "Location": "country", "Births": "births_thousands"})
    out["births_2023"] = out["births_thousands"] * 1000.0
    dest = config.DATA_CURATED / "births_by_country.parquet"
    out.to_parquet(dest, index=False)
    return f"wrote {len(out)} countries -> {dest.name} (global {out['births_2023'].sum():,.0f})"
