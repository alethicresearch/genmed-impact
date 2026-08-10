# denominator

**Global genetic-disease burden × intervention impact — a reproducible analysis pipeline and interactive webapp.**

Derives, from cited primary data and first principles, a quantitative account of global genetic
disease burden and the comparative impact of genetic-medicine interventions — preconception
carrier screening (CS), IVF + preimplantation genetic testing (PGT), prenatal diagnosis (PND),
newborn genomic screening with targeted therapy (NBS), and germline embryo editing.

Every headline figure is derived from a parameterized, cited assumption set with Monte-Carlo
uncertainty. Contestable judgment calls (severity threshold, attribution stance, penetrance
floor, S2 criteria, PND counting) are explicit parameters reported across their defensible range
— see [`ANALYSIS_LOG.md`](ANALYSIS_LOG.md).

## Headline results (default assumptions: severity `def_b`, inclusive attribution, current coverage)

| Category | Births / year (median) | Share |
|---|---:|---:|
| Severe monogenic disorders | ~1.40M | 17.5% of serious genetic disease |
| Serious multifactorial / partly-genetic | ~6.62M | 82.3% |
| **All serious genetic disorders** | **~8.04M** | 5.96% of all births |
| S1 — no selectable unaffected embryo | ~25k (CrI 13k–46k) | 0.31% |
| S2 — editing-superior complex disease (permissive) | ~127k | 1.57% |
| **Total uniquely embryo-editable (permissive)** | **~153k** | **~1.9%** |
| **Addressable by existing tools** | | **~98.1%** (CrI 96.7–99.0%) |

These reproduce the draft paper's figures, with one surfaced deviation: the first-principles S1
residual (median ~25k) runs above the paper's 14k point estimate — see `ANALYSIS_LOG.md §S1`.

## Layout

```
denominator/
├── core/                      # Python analysis pipeline (denominator-core)
│   ├── denominator/
│   │   ├── constants.yaml     # cited Tier-C anchors + parameterized judgment defaults
│   │   ├── conditions.yaml    # S1 condition curation (allele freqs, survival, assortative mating)
│   │   ├── ingest/            # one module per source → data/curated/*.parquet
│   │   ├── harmonize.py       # region/income crosswalks + birth shares
│   │   ├── attribution.py     # RQ1 burden grid (severity × attribution)
│   │   ├── model.py           # RQ2 sequential CS→PGT→PND→NBS engine
│   │   ├── residual.py        # RQ3 S1/S2
│   │   ├── montecarlo.py      # sampling + summarization
│   │   ├── sensitivity.py     # RQ6 tornado
│   │   ├── run.py             # orchestration (one MC sample, correct ratio CrIs)
│   │   └── export.py          # → app/public/data/*.json, results/paper_numbers.json, tables.md
│   └── tests/                 # invariants + program-anchor reproduction
├── app/                       # Vite + React + TS static webapp (never computes epidemiology)
│   └── public/data/           # JSON emitted by the pipeline
└── results/                   # paper_numbers.json, tables.md, figures/
```

## Reproduce

```bash
make install     # install core (numpy/scipy/pyyaml/pandas) + test deps
make ingest      # optional: pull Tier-A sources; writes DATA_NEEDED.md for the rest
make run         # Monte-Carlo pipeline → app/public/data/*.json + results/
make test        # invariants + anchor-reproduction tests
make app-install && make app-build   # build the static webapp
make all         # run + app-build
```

The pipeline runs on the cited `constants.yaml` out of the box; Tier-A/B pulls tighten
provenance but are never required (see [`DATA_NEEDED.md`](DATA_NEEDED.md)).

## Webapp

Six tabbed views (sober, GBD-Compare register): **Denominator** cascade, **Prevention waterfall**
(coverage sliders, region/scenario, PND toggle, averted_birth vs averted_burden tracks),
**Residual explorer** (S1 by condition, S2 strict vs permissive), **Resistance** (HIV / CVD /
neurodegeneration, "not computable" rendered honestly), **Allocation** ($1B/$5B/$10B buys), and
**Methods & provenance** (auto-generated from constants + pipeline commit). Every number carries
its source, vintage, and credible interval; state is URL-serializable; charts export to SVG/PNG.

## Provenance rules

Every constant is `{value, low, high, source, doi, table_or_page, retrieved}`. No value without a
source; unknowns are explicit `PLACEHOLDER` free parameters with a `DATA_NEEDED.md` entry, never a
guess. Where sources conflict, all anchors are carried through the Monte-Carlo.
