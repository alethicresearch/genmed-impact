"""RQ3 residual: births for which germline editing is the *only* preventive option.

S1 — "no selectable unaffected embryo": couple configurations where embryo selection cannot
     work. For a recessive disorder this requires an affected × affected (aa × aa) couple; for
     a viable-homozygote dominant disorder (e.g. Huntington) it requires an AA parent. Standard
     both-heterozygous couples (¼ unaffected embryos) are selection-addressable and excluded.

S2 — "editing superior for complex disease": the multifactorial share for which a single/oligo
     -locus germline edit would uniquely benefit after netting out somatic/pharmacological/
     public-health alternatives, under strict vs permissive criteria.

All functions are vectorized over the Monte-Carlo draw dimension (arrays of length ``n``).
"""
from __future__ import annotations

import numpy as np

from . import montecarlo as mc


def _default(param_or_none, fallback):
    return param_or_none if param_or_none is not None else fallback


def is_contested(cond: dict) -> bool:
    return bool(cond.get("contested", False))


def s1_by_condition(births: np.ndarray, conditions: dict, n: int, rng: np.random.Generator,
                    F_param: dict | None = None, include_contested: bool = True) -> dict:
    """Return {condition_name: births_S1 array} plus a 'Balanced translocations' lump term.

    Parameters
    ----------
    births : per-draw births to which the S1 couple-probabilities apply (global or a region).
    F_param : optional consanguinity-F constant dict {value,low,high} overriding the global
              default (used for per-region S1 where inbreeding differs).
    include_contested : if False, conditions flagged ``contested: true`` (e.g. congenital
              deafness) are omitted from the returned map — the explicit in/out toggle.
    """
    gd = conditions["global_defaults"]
    F_src = F_param if F_param is not None else gd["consanguinity_F"]
    out: dict[str, np.ndarray] = {}

    for cond in conditions["conditions"]:
        if not include_contested and is_contested(cond):
            continue
        name = cond["name"]
        q = mc.sample_positive(cond["allele_freq"], n, rng)
        pen = mc.sample_proportion(cond["penetrance"], n, rng)
        s = mc.sample_proportion(cond["survival_to_repro"], n, rng)
        alpha = mc.sample_proportion(cond["assortative"], n, rng)

        if cond.get("consanguinity_sensitive", False):
            F = mc.sample_proportion(F_src, n, rng)
        else:
            F = np.zeros(n)

        if cond["inheritance"] == "recessive":
            lc = mc.sample_proportion(
                _default(cond.get("locus_concordance"),
                         {"value": 0.9, "low": 0.8, "high": 0.98}),
                n, rng)
            p_aa = q ** 2 + F * q * (1 - q)               # affected genotype freq at birth
            p_aa_repro = p_aa * s * pen                   # affected who survive & reproduce
            alpha_eff = alpha * lc                        # partner affected AND at same locus
            p_couple = p_aa_repro * (alpha_eff + (1 - alpha_eff) * p_aa_repro)
        elif cond["inheritance"] == "dominant_viable_homozygote":
            p_AA = q ** 2 + F * q * (1 - q)               # viable homozygous-dominant freq
            p_AA_repro = p_AA * s * pen
            # at least one parent is a reproducing AA homozygote:
            p_couple = 2 * p_AA_repro - p_AA_repro ** 2
        else:  # pragma: no cover - guarded by curation
            raise ValueError(f"unknown inheritance: {cond['inheritance']}")

        out[name] = births * p_couple

    # Structural-variant lump: balanced-translocation carriers with no viable euploid embryo.
    tx_rate = mc.sample_positive(gd["translocation_no_viable_euploid_per_1000"], n, rng) / 1000.0
    out["Balanced translocations (no viable euploid)"] = births * tx_rate
    return out


def s1_total(births: np.ndarray, conditions: dict, n: int, rng: np.random.Generator,
             F_param: dict | None = None, include_contested: bool = True) -> tuple[np.ndarray, dict]:
    by_cond = s1_by_condition(births, conditions, n, rng, F_param=F_param,
                              include_contested=include_contested)
    total = np.sum(np.stack(list(by_cond.values()), axis=0), axis=0)
    return total, by_cond


def s2_total(multifactorial_births: np.ndarray, constants: dict, criteria: str,
             n: int, rng: np.random.Generator) -> np.ndarray:
    """S2 as a fraction of multifactorial burden under strict/permissive criteria."""
    frac = mc.sample_proportion(constants["s2"]["fraction_of_multifactorial"][criteria], n, rng)
    return multifactorial_births * frac
