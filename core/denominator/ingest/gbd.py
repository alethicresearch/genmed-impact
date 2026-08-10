"""GBD 2023 Results (Tier B) — parse the manually-downloaded export.

Reads the CSV(s) dropped into ``data/raw/gbd/`` (from the GBD Results Tool, see DATA_NEEDED.md),
tidies them to ``data/curated/gbd_2023.parquet``, and prints the birth-incidence and burden
anchors used to source library incidences (congenital anomalies, haemoglobinopathies), the
DALYs-per-case constant, and the complex-disease prevalence cross-checks. Curation (promoting
values into the YAMLs) is done deliberately, not automatically, so a re-pull never silently
moves headline numbers.
"""
from __future__ import annotations

GBD_CITATION = ("Global Burden of Disease Study 2023 (GBD 2023) Results. IHME, 2024. "
                "https://vizhub.healthdata.org/gbd-results/")


def fetch() -> str:
    import glob

    from .. import config

    raw = config.DATA_RAW / "gbd"
    files = sorted(glob.glob(str(raw / "*.csv")) + glob.glob(str(raw / "*.CSV")))
    if not files:
        raise RuntimeError(
            "No GBD CSV in data/raw/gbd/. Download from https://vizhub.healthdata.org/gbd-results/ "
            "per DATA_NEEDED.md §1 (Measure: Incidence, Prevalence, Deaths, DALYs; Metric: Number, "
            "Rate; Cause: Congenital birth defects + sub-causes, Hemoglobinopathies + sub-causes, "
            "T2D/IHD/Stroke/MDD/Schizophrenia/Asthma; Age: <1yr + All ages; Year: 2023).")

    import pandas as pd

    frames = [pd.read_csv(f) for f in files]
    df = pd.concat(frames, ignore_index=True)
    keep = [c for c in ["measure_name", "location_name", "sex_name", "age_name",
                        "cause_name", "metric_name", "year", "val", "upper", "lower"] if c in df.columns]
    df = df[keep]
    dest = config.DATA_CURATED / "gbd_2023.parquet"
    df.to_parquet(dest, index=False)

    def rate(measure, cause, age="<1 year"):
        m = df[(df.measure_name.str.startswith(measure)) & (df.cause_name == cause)
               & (df.age_name == age) & (df.metric_name == "Rate")]
        return None if m.empty else float(m.iloc[0]["val"])

    anchors = {
        "sickle_cell_disorders_incidence_per_100k": rate("Incidence", "Sickle cell disorders"),
        "congenital_heart_birth_prev_per_100k": rate("Prevalence", "Congenital heart anomalies"),
        "neural_tube_incidence_per_100k": rate("Incidence", "Neural tube defects"),
        "down_syndrome_incidence_per_100k": rate("Incidence", "Down syndrome"),
        "orofacial_clefts_incidence_per_100k": rate("Incidence", "Orofacial clefts"),
    }
    got = ", ".join(f"{k}={v:.0f}" for k, v in anchors.items() if v is not None)
    return f"parsed {len(df):,} GBD rows -> {dest.name}. Birth anchors: {got}. Cite: {GBD_CITATION}"
