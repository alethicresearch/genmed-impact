import { useMemo, useRef } from 'react';
import { AllData, ProvenanceLeaf, TornadoRow, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { Card, SectionHeading, ExportSvgButton } from '../components/ui';
import { exportContainerSvg } from '../svgExport';
import { GLOSSARY } from '../glossary';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

interface FlatLeaf {
  path: string;
  leaf: ProvenanceLeaf;
}

// A node is a provenance leaf only when it carries a PRIMITIVE `value` or a STRING `source`.
// (A container like `regions` has a `source` child that is itself an object — treating it as a
// leaf would render that object into a table cell and crash React, error #31.)
function isLeaf(rec: Record<string, unknown>): boolean {
  const hasPrimitiveValue = 'value' in rec && typeof rec.value !== 'object';
  const hasStringSource = typeof rec.source === 'string';
  return hasPrimitiveValue || hasStringSource;
}

function flatten(obj: unknown, path: string[], out: FlatLeaf[]): void {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const rec = obj as Record<string, unknown>;
    if (isLeaf(rec)) {
      out.push({ path: path.join('.'), leaf: rec as ProvenanceLeaf });
      return;
    }
    for (const [k, v] of Object.entries(rec)) {
      flatten(v, [...path, k], out);
    }
  }
}

// Always coerce to a string so an unexpected object can never reach a React child.
function leafStr(v: unknown): string {
  if (v === undefined || v === null) return '';
  if (typeof v === 'number') return v.toLocaleString('en-US');
  if (typeof v === 'object') return '';
  return String(v);
}

// ---- Parameter badges ----
// Every input is classified so a reader can see at a glance what kind of number it is. The
// classification is derived from each entry's provenance fields (placeholder flag, DOI,
// source text), plus a short list of paths that encode the authors' normative choices.
type Badge = 'cited' | 'derived' | 'assumption' | 'normative' | 'provisional';

const BADGE_META: Record<Badge, { label: string; cls: string; desc: string }> = {
  cited: {
    label: 'Cited data',
    cls: 'bg-emerald-100 text-emerald-800',
    desc: 'Directly taken from an identified empirical source.',
  },
  derived: {
    label: 'Derived',
    cls: 'bg-sky-100 text-sky-800',
    desc: 'Calculated from other inputs in the analysis.',
  },
  assumption: {
    label: 'Modeling assumption',
    cls: 'bg-amber-100 text-amber-800',
    desc: 'An explicit value or range used where no adequate direct empirical estimate exists.',
  },
  normative: {
    label: 'Normative choice',
    cls: 'bg-violet-100 text-violet-800',
    desc: 'A definitional or value-sensitive decision that changes what is counted or how an outcome is classified.',
  },
  provisional: {
    label: 'Provisional',
    cls: 'bg-rose-100 text-rose-800',
    desc: 'An input retained for exploratory analysis but awaiting stronger empirical support.',
  },
};

// Pipeline epistemic_status values → UI badge keys. The pipeline is the single source of
// truth (core/denominator/provenance.py); the app only maps names.
const STATUS_TO_BADGE: Record<string, Badge> = {
  cited: 'cited',
  derived: 'derived',
  modeling_assumption: 'assumption',
  normative_choice: 'normative',
  provisional: 'provisional',
};

// Temporary backwards-compatibility fallback for data exported before epistemic_status
// existed. Warns in development so a missing annotation is caught, not silently guessed.
function legacyBadgeOf(path: string, leaf: ProvenanceLeaf): Badge {
  if (import.meta.env.DEV) {
    console.warn(`provenance leaf ${path} lacks epistemic_status — re-run the pipeline`);
  }
  if ((leaf as Record<string, unknown>).placeholder) return 'provisional';
  if (path.startsWith('constants.attribution')) return 'normative';
  const txt = `${leaf.source || ''} ${leaf.table_or_page || ''}`.toLowerCase();
  if (txt.includes('derived')) return 'derived';
  if (txt.includes('reasoned') || txt.includes('assumption')) return 'assumption';
  if (leaf.source) return 'cited';
  return 'assumption';
}

function badgeOf(path: string, leaf: ProvenanceLeaf): Badge {
  const status = (leaf as Record<string, unknown>).epistemic_status;
  if (typeof status === 'string' && status in STATUS_TO_BADGE) return STATUS_TO_BADGE[status];
  return legacyBadgeOf(path, leaf);
}

// Internal model vocabulary, kept here (and only here) for reproducibility.
const INTERNAL_TERMS: Array<{ internal: string; meaning: string }> = [
  { internal: 'S1', meaning: 'No unaffected embryo can be selected — the families for whom editing would be the only preventive option.' },
  { internal: 'S2', meaning: 'Complex-disease cases where editing might outperform every alternative.' },
  { internal: 'strict / permissive', meaning: 'Current-evidence case / optimistic upper-bound case for how much complex-disease editing to credit.' },
  { internal: 'def_a / def_b / def_c', meaning: 'Narrow / Main / Broad definition of serious disease (severity threshold).' },
  { internal: 'attribution (inclusive / heritability_weighted / exclusive)', meaning: 'How much multifactorial disease to count as genetically attributable: all of it / weighted by heritability / only a small, strongly genetic-familial component (~10% — narrow attribution, not zero).' },
  { internal: 'pnd_on / pnd_off', meaning: 'Whether prenatal diagnosis followed by pregnancy termination is counted as reducing affected births.' },
];

// The one canonical research workflow — identical to the Overview's and the paper's Figure 2.
// Uncertainty is not a step: it is propagated through every quantitative step.
export const WORKFLOW_STEPS = [
  { title: 'Estimate the disease burden', desc: 'How much serious monogenic and multifactorial disease is attributed to the annual birth cohort?' },
  { title: 'Build the disease catalogue', desc: 'Which diseases, genes, inheritance patterns, frequencies, and interventions are represented?' },
  { title: 'Map what each intervention changes', desc: 'Does it avoid an affected birth, detect disease, or mitigate disease after birth?' },
  { title: 'Model access', desc: 'How much of the technically applicable benefit is reached under current, expanded-access, and idealized coverage?' },
  { title: 'Estimate what remains for editing', desc: 'How often can no unaffected embryo be selected, and could editing add additional benefit in complex disease?' },
  { title: 'Interpret the result separately from the model', desc: 'What do the empirical results imply — and what requires additional ethical and policy premises?' },
];

export default function Methods({ data, state, update }: Props) {
  const m = data.meta;
  const query = (state.q || '').toLowerCase();
  const tornadoRef = useRef<HTMLDivElement>(null);

  const leaves = useMemo(() => {
    const out: FlatLeaf[] = [];
    flatten(data.provenance, [], out);
    return out;
  }, [data.provenance]);

  const badgeCounts = useMemo(() => {
    const counts: Record<Badge, number> = {
      cited: 0,
      derived: 0,
      assumption: 0,
      normative: 0,
      provisional: 0,
    };
    for (const f of leaves) counts[badgeOf(f.path, f.leaf)]++;
    return counts;
  }, [leaves]);

  const filtered = useMemo(() => {
    if (!query) return leaves;
    return leaves.filter((f) => {
      const hay = (
        f.path +
        ' ' +
        leafStr(f.leaf.value) +
        ' ' +
        (f.leaf.source || '') +
        ' ' +
        (f.leaf.doi || '') +
        ' ' +
        (f.leaf.table_or_page || '')
      ).toLowerCase();
      return hay.includes(query);
    });
  }, [leaves, query]);

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Methods & data"
        subtitle="How the disease catalogue, burden estimates, intervention model, editing residual, uncertainty analysis, and source provenance are constructed."
      />
      <p className="text-sm leading-relaxed text-slate-700">
        The study has three linked empirical components. First, we estimate the burden of
        serious monogenic and multifactorial disease in an annual global birth cohort. Second,
        we map diseases to existing reproductive, screening, and treatment pathways and
        estimate outcomes under different levels of access. Third, we estimate the reproductive
        situations left without an unaffected embryo for selection and separately explore
        whether editing could provide additional risk reduction for complex disease.
      </p>
      <p className="text-sm leading-relaxed text-slate-700">
        Quantitative uncertainty is propagated through {m.n_draws.toLocaleString('en-US')}{' '}
        Monte-Carlo draws. Definitional and ethical choices — such as what counts as serious
        disease, how multifactorial disease is attributed to genetics, and whether prenatal
        diagnosis followed by pregnancy termination counts toward affected-birth avoidance —
        are exposed separately rather than hidden inside the uncertainty interval.
      </p>

      {/* The canonical six-step workflow (same as the Overview and the paper's Figure 2) */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-slate-900">
          The analysis in six steps
        </h3>
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col rounded border border-slate-200 bg-slate-50/60 p-3">
              <span className="text-xs font-semibold text-slate-400">{i + 1}</span>
              <span className="mt-0.5 text-sm font-semibold text-slate-900">{s.title}</span>
              <span className="mt-1 text-xs leading-5 text-slate-600">{s.desc}</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-slate-500">
          Uncertainty is not a separate stage: every input is sampled in a{' '}
          {m.n_draws.toLocaleString('en-US')}-draw Monte-Carlo, so uncertainty propagates through
          all quantitative steps and every figure carries a 95% uncertainty interval.
        </p>
      </Card>

      {/* What this analysis does NOT show */}
      <Card className="border-slate-300">
        <h3 className="text-base font-semibold text-slate-900">
          What this analysis does <em>not</em> show
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
          {[
            'It does not establish that germline editing is currently safe or clinically ready.',
            'It does not equate technical applicability with access, uptake, affordability, or effectiveness in practice.',
            'It does not treat affected-birth avoidance, diagnosis, treatment, cure, and palliation as equivalent outcomes.',
            'It does not assume that every genetic condition should be prevented.',
            'It does not treat the hypothetical high-capacity complex-disease scenario as a forecast.',
            'It does not derive an ethical or regulatory conclusion from the quantitative model alone.',
          ].map((s) => (
            <li key={s} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* What kind of number is each input? */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">
          What is the evidentiary basis for each input?
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Each parameter is classified by evidentiary status so empirical inputs, derived
          quantities, assumptions, normative choices, and provisional values can be
          distinguished. The counts below cover the {leaves.length} inputs in the sources table.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(BADGE_META) as Badge[]).map((b) => (
            <div key={b} className="rounded border border-slate-200 p-3">
              <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${BADGE_META[b].cls}`}>
                {BADGE_META[b].label}
              </span>
              <p className="tnum mt-1 text-xl font-bold text-slate-900">{badgeCounts[b]}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">{BADGE_META[b].desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Tornado */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Which assumptions most affect the editing-relevant share?
          </h3>
          <ExportSvgButton onClick={() => exportContainerSvg(tornadoRef.current, 'sensitivity-tornado.svg')} />
        </div>
        <p className="mt-1 text-sm text-slate-600">
          This analysis varies one major input at a time to show which assumptions most change
          the estimated share of serious disease for which germline editing might add a
          distinct role. Each bar spans the low/high value as one parameter is varied; the
          vertical line is the base case.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Uncertainty intervals throughout this site reflect propagation of the specified
          uncertainty ranges and distributions through the Monte-Carlo model; they should not be
          interpreted as confidence intervals from repeated sampling or Bayesian posterior
          credible intervals unless otherwise stated.
        </p>
        <div ref={tornadoRef}>
          <Tornado rows={data.sensitivity.tornado} />
        </div>
      </Card>

      {/* Provenance */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">Sources &amp; assumptions</h3>
          <label htmlFor="prov-q" className="flex items-center gap-2 text-sm">
            <span className="sr-only">Filter sources</span>
            <input
              id="prov-q"
              type="search"
              placeholder="Filter by name, source, DOI…"
              value={state.q || ''}
              onChange={(e) => update({ q: e.target.value })}
              className="w-64 rounded border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {filtered.length} of {leaves.length} inputs shown. Search any model parameter to see
          its value, uncertainty range, evidentiary status, source, DOI, and source location.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Model inputs with badges, values, intervals and sources</caption>
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th scope="col" className="px-3 py-2 text-left font-medium">Parameter</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">Kind</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Value</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Low</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">High</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">Source</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">DOI</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">Table / page</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const b = badgeOf(f.path, f.leaf);
                return (
                  <tr key={f.path} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-1.5 font-mono text-xs text-slate-700">{f.path}</td>
                    <td className="px-3 py-1.5">
                      <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${BADGE_META[b].cls}`}>
                        {BADGE_META[b].label}
                      </span>
                    </td>
                    <td className="tnum px-3 py-1.5 text-right">{leafStr(f.leaf.value)}</td>
                    <td className="tnum px-3 py-1.5 text-right text-slate-500">{leafStr(f.leaf.low)}</td>
                    <td className="tnum px-3 py-1.5 text-right text-slate-500">{leafStr(f.leaf.high)}</td>
                    <td className="px-3 py-1.5 text-slate-700">{leafStr(f.leaf.source) || '—'}</td>
                    <td className="px-3 py-1.5 text-slate-500">
                      {f.leaf.doi && f.leaf.doi !== 'n/a' ? (
                        f.leaf.doi.startsWith('http') ? (
                          <a href={f.leaf.doi} target="_blank" rel="noreferrer" className="text-accent underline">
                            link
                          </a>
                        ) : (
                          <span className="font-mono text-xs">{f.leaf.doi}</span>
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-slate-500">{leafStr(f.leaf.table_or_page) || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Advanced / reproducibility */}
      <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">
          Advanced — reproducibility record &amp; internal model terms
        </summary>
        <div className="mt-3 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Model run</h4>
            <dl className="mt-2 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <MetaItem label="Monte-Carlo draws" value={m.n_draws.toLocaleString('en-US')} />
              <MetaItem label="Seed" value={String(m.seed)} />
              <MetaItem label="Pipeline commit" value={m.commit} mono />
              <MetaItem label="Model version" value={m.spec_version} />
              <MetaItem label="Default severity" value={m.default_assumptions.severity} mono />
              <MetaItem label="Default attribution" value={m.default_assumptions.attribution} mono />
              <MetaItem label="Default scenario" value={m.default_assumptions.scenario} mono />
              <MetaItem label="PND counts (default)" value={m.default_assumptions.pnd_counts ? 'yes' : 'no'} />
            </dl>
            <p className="mt-2 text-xs text-slate-500">
              The full pipeline, tests, and data recipes are in the repository; <code>make repro</code>{' '}
              regenerates every figure on this page from the cited inputs.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Internal model terms</h4>
            <p className="mt-1 text-xs text-slate-500">
              The site uses plain-language labels; these are the corresponding identifiers in the
              code, configuration, and URL parameters.
            </p>
            <dl className="mt-2 space-y-2">
              {INTERNAL_TERMS.map((t) => (
                <div key={t.internal} className="text-sm">
                  <dt className="inline font-mono text-xs font-semibold text-slate-800">{t.internal}</dt>
                  <dd className="inline text-slate-600"> — {t.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </details>

      {/* Glossary */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">Glossary</h3>
        <p className="mt-1 text-sm text-slate-600">
          Plain-language definitions for the terms used across the views (also shown on hover
          wherever a term is underlined).
        </p>
        <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
          {Object.entries(GLOSSARY).map(([term, def]) => (
            <div key={term} className="border-b border-slate-100 pb-2">
              <dt className="text-sm font-semibold capitalize text-slate-800">{term}</dt>
              <dd className="mt-0.5 text-sm leading-relaxed text-slate-600">{String(def)}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}

function MetaItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-slate-900 ${mono ? 'font-mono text-sm' : ''}`}>{value}</dd>
    </div>
  );
}

function Tornado({ rows }: { rows: TornadoRow[] }) {
  const W = 820;
  const rowH = 34;
  const gap = 12;
  const labelW = 240;
  const padR = 20;
  const plotL = labelW;
  const plotW = W - labelW - padR;
  const H = rows.length * (rowH + gap) + 30;

  const all = rows.flatMap((r) => [r.low, r.high, r.base]);
  const minV = Math.min(...all);
  const maxV = Math.max(...all);
  const pad = (maxV - minV) * 0.08 || 0.001;
  const lo = minV - pad;
  const hi = maxV + pad;
  const x = (v: number) => plotL + ((v - lo) / (hi - lo)) * plotW;

  return (
    <svg
      role="img"
      aria-label="Tornado sensitivity chart of the editing-only share of serious disease"
      viewBox={`0 0 ${W} ${H}`}
      className="mt-3 w-full"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
    >
      {rows.map((r, i) => {
        const y = i * (rowH + gap) + 6;
        const cy = y + rowH / 2;
        const xLo = x(Math.min(r.low, r.high));
        const xHi = x(Math.max(r.low, r.high));
        const xBase = x(r.base);
        return (
          <g key={r.parameter}>
            <text x={0} y={cy - 2} fontSize={12} fontWeight={600} fill="#334155">
              {r.parameter}
            </text>
            <text x={0} y={cy + 13} fontSize={10} fill="#94a3b8">
              {r.detail}
            </text>
            <rect x={xLo} y={cy - 9} width={Math.max(xHi - xLo, 2)} height={18} rx={2} fill="#93c5fd" />
            <line x1={xBase} x2={xBase} y1={cy - 12} y2={cy + 12} stroke="#0f172a" strokeWidth={1.5} />
            <text x={xLo - 4} y={cy + 4} fontSize={10} textAnchor="end" fill="#475569">
              {fmtPct(Math.min(r.low, r.high), 2)}
            </text>
            <text x={xHi + 4} y={cy + 4} fontSize={10} textAnchor="start" fill="#475569">
              {fmtPct(Math.max(r.low, r.high), 2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
