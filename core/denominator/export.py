"""Export the results object to app JSON, results/paper_numbers.json, and results/tables.md."""
from __future__ import annotations

import json
from typing import Any

from . import config


def _write_json(path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, indent=2, ensure_ascii=False)


def _fmt(n: float, kind: str = "count") -> str:
    if kind == "count":
        return f"{n:,.0f}"
    if kind == "pct":
        return f"{n * 100:.2f}%"
    if kind == "pct1":
        return f"{n * 100:.1f}%"
    return f"{n:g}"


def export_all(R: dict[str, Any]) -> None:
    config.ensure_dirs()

    # ---- app data files (app never computes epidemiology) ----------------------------
    app = config.APP_DATA_DIR
    _write_json(app / "meta.json", R["meta"])
    _write_json(app / "burden.json", R["burden"])
    _write_json(app / "residual.json", R["residual"])
    _write_json(app / "prevention.json", R["prevention"])
    _write_json(app / "resistance.json", R["resistance"])
    _write_json(app / "allocation.json", R["allocation"])
    _write_json(app / "sensitivity.json", R["sensitivity"])
    _write_json(app / "provenance.json", R["provenance"])

    # compact summary the landing view can load first
    summary = {
        "meta": R["meta"],
        "births_per_year": R["births_per_year"],
        "burden_default": R["burden"]["default"],
        "uniquely_editable_total": R["residual"]["uniquely_editable_total"],
        "uniquely_editable_share_of_serious": R["residual"]["uniquely_editable_share_of_serious"],
        "addressable_share_of_serious": R["residual"]["addressable_share_of_serious"],
        "s1_total": R["residual"]["s1_total"],
        "s2": R["residual"]["s2"],
    }
    _write_json(app / "summary.json", summary)

    # ---- results/paper_numbers.json : flat map of citable figures --------------------
    d = R["meta"]["default_assumptions"]
    flat: dict[str, Any] = {}

    def put(key, node, extra=None):
        entry = {"median": node["median"], "ci95": node["ci95"]}
        if extra:
            entry.update(extra)
        flat[key] = entry

    ctx = {"severity_def": d["severity"], "attribution": d["attribution"]}
    put("births_per_year", R["births_per_year"])
    put("serious_genetic_births_per_year", R["burden"]["default"]["total_serious"], ctx)
    put("monogenic_births_per_year", R["burden"]["default"]["monogenic"], ctx)
    put("multifactorial_births_per_year", R["burden"]["default"]["multifactorial"], ctx)
    put("serious_share_of_all_births", R["burden"]["default"]["serious_share_of_births"], ctx)
    put("s1_no_selectable_embryo_births_per_year", R["residual"]["s1_total"], ctx)
    for crit in config.S2_CRITERIA:
        put(f"s2_editing_superior_births_per_year__{crit}", R["residual"]["s2"][crit], {"criteria": crit})
        put(f"uniquely_editable_births_per_year__{crit}", R["residual"]["uniquely_editable_total"][crit], {**ctx, "criteria": crit})
        put(f"uniquely_editable_share_of_serious__{crit}", R["residual"]["uniquely_editable_share_of_serious"][crit], {**ctx, "criteria": crit})
        put(f"addressable_share_of_serious__{crit}", R["residual"]["addressable_share_of_serious"][crit], {**ctx, "criteria": crit})
    put("hiv_vertical_infections_per_year", R["resistance"]["hiv"]["vertical_infections_per_year"])
    put("hiv_residual_after_pmtct", R["resistance"]["hiv"]["residual_after_pmtct"])
    put("cost_per_birth_prevented_screening", R["allocation"]["cost_per_birth_prevented"]["screening_program"])
    put("cost_per_birth_prevented_editing", R["allocation"]["cost_per_birth_prevented"]["editing_program"])
    _write_json(config.RESULTS_DIR / "paper_numbers.json", flat)

    # ---- results/tables.md -----------------------------------------------------------
    _write_tables_md(R)


def _row(*cells) -> str:
    return "| " + " | ".join(str(c) for c in cells) + " |"


def _write_tables_md(R: dict[str, Any]) -> None:
    d = R["meta"]["default_assumptions"]
    commit = R["meta"]["commit"]
    b = R["burden"]["default"]
    res = R["residual"]
    lines: list[str] = []
    lines.append("# denominator — regenerated tables")
    lines.append("")
    lines.append(f"_Assumption set: severity=`{d['severity']}`, attribution=`{d['attribution']}`, "
                 f"scenario=`{d['scenario']}`, PND-counts=`{d['pnd_counts']}` · "
                 f"Monte-Carlo n={R['meta']['n_draws']} · pipeline commit `{commit}`._")
    lines.append("")

    # Table 1 — burden decomposition (default) reproducing the draft-paper table
    total = b["total_serious"]["median"]
    mono = b["monogenic"]["median"]
    multi = b["multifactorial"]["median"]
    births = R["births_per_year"]["median"]
    perm = res["uniquely_editable_total"]["permissive"]["median"]
    s1 = res["s1_total"]["median"]
    s2p = res["s2"]["permissive"]["median"]
    lines.append("## Table 1 — Serious genetic disease: burden and uniquely editable residual")
    lines.append("")
    lines.append(_row("Category", "Births / year", "% of serious genetic disease", "% of all births"))
    lines.append(_row("---", "---:", "---:", "---:"))
    lines.append(_row("Severe monogenic disorders", _fmt(mono), _fmt(mono / total, "pct1"), _fmt(mono / births, "pct")))
    lines.append(_row("Serious multifactorial / partly-genetic", _fmt(multi), _fmt(multi / total, "pct1"), _fmt(multi / births, "pct")))
    lines.append(_row("All serious genetic disorders", _fmt(total), "100%", _fmt(total / births, "pct")))
    lines.append(_row("S1 — no selectable unaffected embryo", _fmt(s1), _fmt(s1 / total, "pct"), _fmt(s1 / births, "pct")))
    lines.append(_row("S2 — editing-superior complex disease (permissive)", _fmt(s2p), _fmt(s2p / total, "pct"), _fmt(s2p / births, "pct")))
    lines.append(_row("**Total uniquely embryo-editable (permissive)**", f"**{_fmt(perm)}**",
                      f"**{_fmt(perm / total, 'pct')}**", f"**{_fmt(perm / births, 'pct')}**"))
    lines.append("")
    add = res["addressable_share_of_serious"]["permissive"]
    lines.append(f"_Addressable by existing tools (1 − uniquely editable): "
                 f"**{_fmt(add['median'], 'pct1')}** "
                 f"(95% CrI {_fmt(add['ci95'][0], 'pct1')}–{_fmt(add['ci95'][1], 'pct1')})._")
    lines.append("")

    # Table 2 — burden across severity × attribution grid
    lines.append("## Table 2 — Serious genetic births/year across severity × attribution")
    lines.append("")
    lines.append(_row("Severity", "Attribution", "Monogenic", "Multifactorial", "Total serious", "% of births"))
    lines.append(_row("---", "---", "---:", "---:", "---:", "---:"))
    for sev, stmap in R["burden"]["grid"].items():
        for st, node in stmap.items():
            lines.append(_row(sev, st, _fmt(node["monogenic"]["median"]),
                              _fmt(node["multifactorial"]["median"]),
                              _fmt(node["total_serious"]["median"]),
                              _fmt(node["serious_share_of_births"]["median"], "pct")))
    lines.append("")

    # Table 3 — S1 by condition
    lines.append("## Table 3 — S1 residual by condition (no selectable unaffected embryo)")
    lines.append("")
    lines.append(_row("Condition", "Births / year (median)", "95% CrI"))
    lines.append(_row("---", "---:", "---:"))
    for name, node in sorted(res["s1_by_condition"].items(), key=lambda kv: -kv[1]["median"]):
        lines.append(_row(name, _fmt(node["median"]),
                          f"{_fmt(node['ci95'][0])} – {_fmt(node['ci95'][1])}"))
    lines.append(_row("**S1 total**", f"**{_fmt(s1)}**",
                      f"{_fmt(res['s1_total']['ci95'][0])} – {_fmt(res['s1_total']['ci95'][1])}"))
    lines.append("")

    # Table 4 — global prevention waterfall (current vs achievable_2035), monogenic, PND on
    lines.append("## Table 4 — Global prevention waterfall, monogenic class (PND counted)")
    lines.append("")
    lines.append(_row("Scenario", "CS", "PGT", "PND", "Total averted births", "Residual births", "Averted burden (incl. NBS)"))
    lines.append(_row("---", "---:", "---:", "---:", "---:", "---:", "---:"))
    for scen in config.SCENARIOS:
        wf = R["prevention"]["Global"][scen]["monogenic"]["pnd_on"]
        ab = wf["averted_birth_fraction"]
        lines.append(_row(scen,
                          _fmt(ab["CS"]["median"], "pct1"), _fmt(ab["PGT"]["median"], "pct1"),
                          _fmt(ab["PND"]["median"], "pct1"),
                          _fmt(wf["total_averted_birth_fraction"]["median"], "pct1"),
                          _fmt(wf["residual_birth_fraction"]["median"], "pct1"),
                          _fmt(wf["total_averted_burden_fraction"]["median"], "pct1")))
    lines.append("")

    # LaTeX block for Table 1
    lines.append("## Table 1 — LaTeX")
    lines.append("")
    lines.append("```latex")
    lines.append("\\begin{tabular}{lrrr}")
    lines.append("\\toprule")
    lines.append("Category & Births/yr & \\% serious & \\% births \\\\")
    lines.append("\\midrule")
    lines.append(f"Severe monogenic & {_fmt(mono)} & {_fmt(mono/total,'pct1')} & {_fmt(mono/births,'pct')} \\\\")
    lines.append(f"Serious multifactorial & {_fmt(multi)} & {_fmt(multi/total,'pct1')} & {_fmt(multi/births,'pct')} \\\\")
    lines.append(f"All serious genetic & {_fmt(total)} & 100\\% & {_fmt(total/births,'pct')} \\\\")
    lines.append(f"Uniquely editable (permissive) & {_fmt(perm)} & {_fmt(perm/total,'pct')} & {_fmt(perm/births,'pct')} \\\\")
    lines.append("\\bottomrule")
    lines.append("\\end{tabular}")
    lines.append("```")
    lines.append("")

    with open(config.RESULTS_DIR / "tables.md", "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
