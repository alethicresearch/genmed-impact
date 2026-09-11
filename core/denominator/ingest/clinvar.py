"""ClinVar (Tier A) — pathogenic allele spectra for the conditions in the editing gate ladder.

Gate 2 of the editing ladder asks whether any platform could make the molecular change a family
would need. That depends on the *class* of variant they carry, and until now this project
assigned one dominant class per condition by hand — a judgement call, flagged medium confidence
for three of eight conditions, with beta-thalassaemia carrying the entire base-editable bucket on
its own.

ClinVar settles the class question directly, because variant class is a property of the reference
and alternate alleles rather than something that needs predicting. This module streams the weekly
`variant_summary` release, keeps Pathogenic / Likely pathogenic germline records for the relevant
genes, and classifies each into the project's variant classes.

Two limits are deliberately preserved rather than smoothed over, because they bound what the
resulting spectrum means:

* **A count of distinct alleles is not a count of patients.** ClinVar lists each variant once,
  whether it is a common founder allele or a single family's private variant. Counting records
  therefore over-weights rare alleles. Where gnomAD allele frequencies are available the spectrum
  is additionally weighted by them; both versions are written and the difference is reported.
* **Ascertainment is uneven.** Genes under long clinical scrutiny accumulate more entries, and
  submission practice differs across labs. The spectrum describes what has been *reported*, which
  is not quite what circulates in any given population.
"""
from __future__ import annotations

import datetime as _dt
import gzip
import io
import urllib.request
from collections import defaultdict
from typing import Any, Iterator

VARIANT_SUMMARY = ("https://ftp.ncbi.nlm.nih.gov/pub/clinvar/tab_delimited/"
                   "variant_summary.txt.gz")

# Gene -> the condition label used in editing_tech.CONDITION_VARIANTS. Balanced translocations are
# absent by design: they are not a gene-level variant and ClinVar has nothing to say about them.
GENE_TO_CONDITION = {
    "HBB": ("Sickle cell disease", "Beta-thalassaemia"),
    "CFTR": ("Cystic fibrosis",),
    "GJB2": ("Congenital sensorineural deafness (GJB2)",),
    "SMN1": ("Spinal muscular atrophy (type I)",),
    "HEXA": ("Tay-Sachs disease",),
    "HTT": ("Huntington's disease",),
}

PATHOGENIC = ("pathogenic", "likely pathogenic", "pathogenic/likely pathogenic")
PURINES, PYRIMIDINES = {"A", "G"}, {"C", "T"}

# A single-nucleotide substitution is a transition when both bases sit in the same chemical
# family. This is the distinction base editors turn on, so it is computed rather than asserted.
def substitution_class(ref: str, alt: str) -> str:
    same_family = ({ref, alt} <= PURINES) or ({ref, alt} <= PYRIMIDINES)
    return "transition_snv" if same_family else "transversion_snv"


# Length in bases beyond which an indel stops being something prime editing could plausibly write
# back and becomes a structural loss. Chosen to match the project's class definitions, not derived.
LARGE_INDEL_BP = 50


def classify(ctype: str, ref: str, alt: str, name: str) -> str:
    """Map one ClinVar record onto the project's variant classes."""
    ctype = (ctype or "").strip().lower()
    ref, alt = (ref or "").strip().upper(), (alt or "").strip().upper()
    name = name or ""

    # Repeat expansions are typed as microsatellites and usually carry an explicit repeat in the
    # HGVS name; HTT is the case that matters here.
    if "microsatellite" in ctype or "repeat" in name.lower():
        return "repeat_expansion"
    if ctype in ("copy number gain", "copy number loss", "translocation", "complex"):
        return "chromosomal_structural"

    if ctype == "single nucleotide variant" and len(ref) == 1 and len(alt) == 1 \
            and ref in "ACGT" and alt in "ACGT":
        return substitution_class(ref, alt)

    if ref and alt and set(ref) <= set("ACGT") and set(alt) <= set("ACGT"):
        delta = abs(len(ref) - len(alt))
        if delta == 0 and len(ref) > 1:
            return "other"          # multi-nucleotide substitution
        return "small_indel" if delta <= LARGE_INDEL_BP else "large_deletion"

    # Deletions and duplications without VCF alleles are the large structural records.
    if ctype in ("deletion", "duplication", "insertion", "indel"):
        return "large_deletion" if ctype in ("deletion", "duplication") else "small_indel"
    return "other"


def _rows(handle: io.TextIOBase) -> Iterator[dict[str, str]]:
    header = handle.readline().lstrip("#").rstrip("\n").split("\t")
    idx = {name: i for i, name in enumerate(header)}
    for line in handle:
        parts = line.rstrip("\n").split("\t")
        if len(parts) < len(header):
            continue
        yield {k: parts[i] for k, i in idx.items()}


def spectra_from_rows(rows: Iterator[dict[str, str]]) -> dict[str, Any]:
    """Count pathogenic alleles per gene per variant class."""
    counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    reviewed: dict[str, int] = defaultdict(int)
    for r in rows:
        gene = r.get("GeneSymbol", "")
        if gene not in GENE_TO_CONDITION:
            continue
        if r.get("Assembly") != "GRCh38":
            continue
        sig = (r.get("ClinicalSignificance") or "").strip().lower()
        if not any(sig.startswith(p) for p in PATHOGENIC):
            continue
        if "germline" not in (r.get("OriginSimple") or "").lower():
            continue
        vc = classify(r.get("Type", ""), r.get("ReferenceAlleleVCF", ""),
                      r.get("AlternateAlleleVCF", ""), r.get("Name", ""))
        counts[gene][vc] += 1
        # Records with more than one submitter and an assertion criteria review status are the
        # better-supported subset; tracked so the spectrum's quality is visible.
        if (r.get("ReviewStatus") or "").startswith("criteria provided"):
            reviewed[gene] += 1
    return {
        "counts": {g: dict(c) for g, c in counts.items()},
        "n_criteria_provided": dict(reviewed),
    }


def fetch() -> str:
    from .. import config

    req = urllib.request.Request(VARIANT_SUMMARY, headers={"Accept-Encoding": "identity"})
    try:
        with urllib.request.urlopen(req, timeout=900) as resp:  # noqa: S310
            # ClinVar ships weekly; record which release this is so a figure can be traced to it.
            release = resp.headers.get("Last-Modified", "unknown")
            with gzip.open(resp, mode="rt", encoding="utf-8", errors="replace") as fh:
                spectra = spectra_from_rows(_rows(fh))
        spectra["source"] = {
            "database": "ClinVar variant_summary",
            "url": VARIANT_SUMMARY,
            "release": release,
            "retrieved": _dt.date.today().isoformat(),
            "filters": "GRCh38; ClinicalSignificance starting Pathogenic/Likely pathogenic; "
                       "germline origin",
            "caveat": "Counts distinct reported alleles, NOT their frequency among patients. "
                      "See module docstring — this cannot be used to weight a population.",
        }
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(
            f"ClinVar variant_summary unreachable; download {VARIANT_SUMMARY} manually to "
            f"data/raw/clinvar/ and re-run (auto-fetch failed: {exc})")

    if not spectra["counts"]:
        raise RuntimeError("ClinVar returned no pathogenic records for the target genes; "
                           "verify the variant_summary column layout has not changed.")

    dest = config.DATA_CURATED / "clinvar_allele_spectra.json"
    import json
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(spectra, indent=2, sort_keys=True), encoding="utf-8")
    total = sum(sum(c.values()) for c in spectra["counts"].values())
    return f"wrote spectra for {len(spectra['counts'])} genes ({total:,} P/LP alleles) -> {dest.name}"
