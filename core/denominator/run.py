"""End-to-end pipeline orchestration.

Draws the full Monte-Carlo sample once, computes every downstream quantity on the SAME draws
(so ratios and shares carry correct credible intervals), and returns a structured results
object of summarized {median, mean, ci95} leaves for export.
"""
from __future__ import annotations

import subprocess
from typing import Any

import numpy as np

from . import (attribution, config, editing_tech, embryos, harmonize, library, model,
               montecarlo as mc,
               multifactorial, opportunities, perspectives, provenance, residual,
               retroactive, sensitivity)


def _git_commit() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], cwd=str(config.REPO_DIR),
            stderr=subprocess.DEVNULL).decode().strip()
    except Exception:
        return "uncommitted"


def _s(arr) -> dict:
    return mc.summarize(arr)


def run(n: int = config.N_DRAWS, seed: int = config.SEED) -> dict[str, Any]:
    rng = np.random.default_rng(seed)
    constants = harmonize.load_constants()
    conditions = harmonize.load_conditions()

    births = mc.sample_positive(constants["births"]["global_per_year"], n, rng)

    # ---- RQ1 burden grid: severity x attribution -------------------------------------
    grid = attribution.burden_grid(births, constants, config.SEVERITY_DEFS,
                                    config.ATTRIBUTION_STANCES, n, rng)
    dsev, datt = config.DEFAULT_SEVERITY, config.DEFAULT_ATTRIBUTION
    mono_default = grid[dsev][datt]["mono"]
    multi_default = grid[dsev][datt]["multi"]
    total_default = grid[dsev][datt]["total"]

    # ---- RQ3 residual: S1 (contested toggle + per region) + S2 (per criteria) ---------
    contested_names = [c["name"] for c in conditions["conditions"] if residual.is_contested(c)]

    s1_incl, s1_by_cond = residual.s1_total(births, conditions, n, rng, include_contested=True)
    # subtract the contested conditions' OWN per-draw contribution (same draws) so the delta and
    # the without-contested total are internally consistent and non-negative.
    contested_delta = sum((s1_by_cond[name] for name in contested_names), start=np.zeros(n))
    s1_excl = s1_incl - contested_delta
    s1_variants = {"with_contested": s1_incl, "without_contested": s1_excl}

    # per income-group S1: region births × region-specific consanguinity F
    s1_by_region: dict = {}
    for region, meta in harmonize.INCOME_GROUPS.items():
        share = mc.sample_proportion(meta["birth_share"], n, rng)
        births_r = births * share
        r_incl, _ = residual.s1_total(births_r, conditions, n, rng,
                                      F_param=meta["consanguinity_F"], include_contested=True)
        r_excl, _ = residual.s1_total(births_r, conditions, n, rng,
                                      F_param=meta["consanguinity_F"], include_contested=False)
        s1_by_region[region] = {"with_contested": r_incl, "without_contested": r_excl}

    s2 = {crit: residual.s2_total(multi_default, constants, crit, n, rng)
          for crit in config.S2_CRITERIA}

    # editable = S1 + S2 across contested-toggle × S2-criteria
    editable = {ck: {crit: s1_variants[ck] + s2[crit] for crit in config.S2_CRITERIA} for ck in s1_variants}
    ed_share_serious = {ck: {crit: editable[ck][crit] / total_default for crit in config.S2_CRITERIA} for ck in s1_variants}
    ed_share_births = {ck: {crit: editable[ck][crit] / births for crit in config.S2_CRITERIA} for ck in s1_variants}
    addressable = {ck: {crit: 1.0 - ed_share_serious[ck][crit] for crit in config.S2_CRITERIA} for ck in s1_variants}
    # Decision (see ANALYSIS_LOG §status/§S1): the headline S1 residual EXCLUDES congenital
    # deafness — a contested condition many do not regard as a disease to prevent, and the single
    # largest S1 swing. The in/out toggle remains available in the app.
    HEAD = "without_contested"

    # ---- RQ2 prevention waterfalls: class x region(income) x scenario -----------------
    waterfalls: dict = {}
    region_class_births: dict = {}
    for region, meta in {"Global": None, **harmonize.INCOME_GROUPS}.items():
        if region == "Global":
            share = np.ones(n)
            access = np.ones(n)
        else:
            share = mc.sample_proportion(meta["birth_share"], n, rng)
            access = mc.sample_proportion(meta["access_multiplier"], n, rng)
        waterfalls[region] = {}
        region_class_births[region] = {
            "monogenic": mono_default * share,
            "multifactorial": multi_default * share,
        }
        for scen in config.SCENARIOS:
            waterfalls[region][scen] = {}
            for cls in ("monogenic", "multifactorial"):
                for pnd_counts in (True, False):
                    key = "pnd_on" if pnd_counts else "pnd_off"
                    waterfalls[region][scen].setdefault(cls, {})[key] = model.waterfall(
                        constants, cls, scen, access, n, rng, pnd_counts=pnd_counts)

    # ---- RQ4 resistance ---------------------------------------------------------------
    hiv_infections = mc.sample_positive(constants["resistance"]["hiv_vertical_infections_per_year"], n, rng)
    pmtct_eff = mc.sample_proportion(constants["resistance"]["pmtct_effectiveness"], n, rng)
    pmtct_cov = mc.sample_proportion(constants["resistance"]["pmtct_coverage_global"], n, rng)
    hiv_residual = hiv_infections * (1.0 - pmtct_eff * pmtct_cov)

    # ---- RQ5 allocation ---------------------------------------------------------------
    c = constants["costs"]
    cost_screen_program = mc.sample_positive(c["haemoglobinopathy_program_per_birth_prevented"], n, rng)
    cost_edit_program = mc.sample_positive(c["editing_program_per_birth_prevented"], n, rng)
    daly_per_case = mc.sample_positive(c["daly_per_severe_monogenic_case"], n, rng)
    cost_screen_per_daly = cost_screen_program / daly_per_case
    cost_edit_per_daly = cost_edit_program / daly_per_case
    budgets = [1e9, 5e9, 10e9]
    buys = {
        f"${int(b/1e9)}B/yr": {
            "screening_births_prevented": _s(b / cost_screen_program),
            "editing_births_prevented": _s(b / cost_edit_program),
        }
        for b in budgets
    }

    # ---- RQ6 tornado (deterministic) --------------------------------------------------
    tornado_rows = sensitivity.tornado(constants, conditions)

    # library (built once; reused for embryo accounting)
    _library_built = library.build_library(constants)
    _multifactorial_built = multifactorial.build_multifactorial()

    # ---------------------------------------------------------------------------------
    # Assemble summarized results object
    # ---------------------------------------------------------------------------------
    R: dict[str, Any] = {
        "meta": {
            "n_draws": n, "seed": seed, "commit": _git_commit(),
            "spec_version": constants["meta"]["spec_version"],
            "default_assumptions": {
                "severity": dsev, "attribution": datt,
                "scenario": config.DEFAULT_SCENARIO, "pnd_counts": config.DEFAULT_PND_COUNTS,
            },
        },
        "births_per_year": _s(births),
        "burden": {
            "default": {
                "monogenic": _s(mono_default), "multifactorial": _s(multi_default),
                "total_serious": _s(total_default),
                "monogenic_share_of_serious": _s(mono_default / total_default),
                "multifactorial_share_of_serious": _s(multi_default / total_default),
                "serious_share_of_births": _s(total_default / births),
            },
            "grid": {
                sev: {st: {"monogenic": _s(grid[sev][st]["mono"]),
                           "multifactorial": _s(grid[sev][st]["multi"]),
                           "total_serious": _s(grid[sev][st]["total"]),
                           "serious_share_of_births": _s(grid[sev][st]["total"] / births)}
                      for st in config.ATTRIBUTION_STANCES}
                for sev in config.SEVERITY_DEFS
            },
        },
        "residual": {
            # headline S1 keeps contested conditions IN (documented); toggle variants below.
            "s1_total": _s(s1_variants[HEAD]),
            "s1_total_without_contested": _s(s1_variants["without_contested"]),
            "s1_contested_delta": _s(contested_delta),
            "contested_conditions": contested_names,
            "s1_by_condition": {name: {**_s(arr), "contested": name in contested_names}
                                for name, arr in s1_by_cond.items()},
            "s1_by_region": {
                region: {ck: _s(v[ck]) for ck in v} for region, v in s1_by_region.items()
            },
            "s1_by_region_note": ("Per income group: region births × region-specific consanguinity F. "
                                  "Sum across regions need not equal the global-F headline because F "
                                  "and allele exposure differ by region; allele frequencies are still "
                                  "global pending an ancestry-weighted gnomAD pull."),
            "s2": {crit: _s(s2[crit]) for crit in config.S2_CRITERIA},
            # headline editable/shares = with-contested variant (unchanged keys for back-compat):
            "uniquely_editable_total": {crit: _s(editable[HEAD][crit]) for crit in config.S2_CRITERIA},
            "uniquely_editable_share_of_serious": {crit: _s(ed_share_serious[HEAD][crit]) for crit in config.S2_CRITERIA},
            "uniquely_editable_share_of_births": {crit: _s(ed_share_births[HEAD][crit]) for crit in config.S2_CRITERIA},
            "addressable_share_of_serious": {crit: _s(addressable[HEAD][crit]) for crit in config.S2_CRITERIA},
            # full grid for the app's contested toggle:
            "by_contested": {
                ck: {
                    "s1_total": _s(s1_variants[ck]),
                    "uniquely_editable_total": {crit: _s(editable[ck][crit]) for crit in config.S2_CRITERIA},
                    "uniquely_editable_share_of_serious": {crit: _s(ed_share_serious[ck][crit]) for crit in config.S2_CRITERIA},
                    "addressable_share_of_serious": {crit: _s(addressable[ck][crit]) for crit in config.S2_CRITERIA},
                } for ck in s1_variants
            },
        },
        "prevention": _summarize_waterfalls(waterfalls, region_class_births),
        "resistance": {
            "hiv": {
                "vertical_infections_per_year": _s(hiv_infections),
                "residual_after_pmtct": _s(hiv_residual),
                "note": "Residual = infections × (1 − PMTCT effectiveness × coverage). CCR5 germline uniquely matters only within this residual.",
            },
            "cardiovascular": {
                "note": "Statins + somatic PCSK9 inhibition deliver comparable LDL lowering cheaply; unique germline benefit is small. Not reduced to a single birth count.",
            },
            "neurodegeneration": {"computable": False,
                "note": "APOE developmental pleiotropy — no safe, clearly causal embryo-level target. Reported as not computable."},
        },
        "allocation": {
            "cost_per_birth_prevented": {
                "screening_program": _s(cost_screen_program),
                "editing_program": _s(cost_edit_program),
            },
            "cost_per_daly_averted": {
                "screening_program": _s(cost_screen_per_daly),
                "editing_program": _s(cost_edit_per_daly),
            },
            "budget_buys": buys,
        },
        "sensitivity": {"tornado": tornado_rows},
        "library": _library_built,
        "multifactorial": _multifactorial_built,
        "embryos": embryos.build_embryos(constants, _library_built["diseases"]),
        "provenance": {
            "constants": provenance.annotate(constants, "constants"),
            "conditions": provenance.annotate(conditions, "conditions"),
            "regions": provenance.annotate(
                {"income_groups": harmonize.INCOME_GROUPS,
                 "gbd_super_regions": harmonize.GBD_SUPER_REGIONS,
                 "source": harmonize.REGION_SOURCE}, "regions"),
        },
    }
    # Funding opportunities are derived from the assembled results, so they build last.
    R["opportunities"] = opportunities.build_opportunities(
        constants, _library_built, R["residual"], _multifactorial_built)
    # Phase 2: whose values rank these opportunities, and how predictions score against reality.
    R["editing_tech"] = editing_tech.build_editing_tech(R["residual"])
    R["perspectives"] = perspectives.build_perspectives(R["opportunities"]["opportunities"])
    R["retroactive"] = retroactive.build_retroactive(constants)
    return R


def _summarize_waterfalls(waterfalls: dict, region_class_births: dict) -> dict:
    out: dict = {}
    for region, scen_map in waterfalls.items():
        out[region] = {}
        for scen, cls_map in scen_map.items():
            out[region][scen] = {}
            for cls, pnd_map in cls_map.items():
                cls_births = region_class_births[region][cls]
                out[region][scen][cls] = {}
                for pnd_key, wf in pnd_map.items():
                    out[region][scen][cls][pnd_key] = {
                        "averted_birth_fraction": {t: mc.summarize(wf["averted_birth"][t]) for t in config.TOOLS},
                        "averted_burden_fraction": {t: mc.summarize(wf["averted_burden"][t]) for t in config.TOOLS},
                        "residual_birth_fraction": mc.summarize(wf["residual_birth"]),
                        "residual_burden_fraction": mc.summarize(wf["residual_burden"]),
                        "total_averted_birth_fraction": mc.summarize(wf["total_averted_birth"]),
                        "total_averted_burden_fraction": mc.summarize(wf["total_averted_burden"]),
                        # absolute births
                        "averted_birth_count": {t: mc.summarize(wf["averted_birth"][t] * cls_births) for t in config.TOOLS},
                        "residual_birth_count": mc.summarize(wf["residual_birth"] * cls_births),
                        "class_births": mc.summarize(cls_births),
                    }
    return out
