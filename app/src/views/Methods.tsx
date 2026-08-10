import { useMemo, useRef } from 'react';
import { AllData, ProvenanceLeaf, TornadoRow, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { Card, SectionHeading, ExportSvgButton } from '../components/ui';
import { exportContainerSvg } from '../svgExport';
import Explainer from '../components/Explainer';
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

export default function Methods({ data, state, update }: Props) {
  const m = data.meta;
  const query = (state.q || '').toLowerCase();
  const tornadoRef = useRef<HTMLDivElement>(null);

  const leaves = useMemo(() => {
    const out: FlatLeaf[] = [];
    flatten(data.provenance, [], out);
    return out;
  }, [data.provenance]);

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
        title="Methods & sources"
        subtitle="How the figures were computed, how sensitive they are to assumptions, every source behind them, and a glossary of the terms used throughout."
      />
      <Explainer
        whatThisShows="The machinery behind the numbers: how they were computed, which assumptions matter most, the full list of source values with their citations, and a plain-language glossary."
        howToRead="The sensitivity chart shows which single assumption moves the headline result the most. The sources table lists every input value with its range and reference — filter it by name or source. The glossary defines each technical term used elsewhere in the page."
        whatItDetermines="Whether you can trust and reproduce the figures — and what each term means when you meet it in another view."
      />

      {/* Meta */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-slate-900">Model run</h3>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <MetaItem label="Monte-Carlo draws" value={m.n_draws.toLocaleString('en-US')} />
          <MetaItem label="Seed" value={String(m.seed)} />
          <MetaItem label="Pipeline commit" value={m.commit} mono />
          <MetaItem label="Model version" value={m.spec_version} />
          <MetaItem label="Default severity" value={m.default_assumptions.severity} />
          <MetaItem label="Default attribution" value={m.default_assumptions.attribution} />
          <MetaItem label="Default scenario" value={m.default_assumptions.scenario} />
          <MetaItem label="PND counts (default)" value={m.default_assumptions.pnd_counts ? 'yes' : 'no'} />
        </dl>
      </Card>

      {/* Tornado */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Sensitivity — editable share of serious
          </h3>
          <ExportSvgButton onClick={() => exportContainerSvg(tornadoRef.current, 'sensitivity-tornado.svg')} />
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Each bar spans the low/high value of the uniquely-editable share as one parameter is
          varied; the vertical line is the base case.
        </p>
        <div ref={tornadoRef}>
          <Tornado rows={data.sensitivity.tornado} />
        </div>
      </Card>

      {/* Provenance */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">Provenance constants</h3>
          <label htmlFor="prov-q" className="flex items-center gap-2 text-sm">
            <span className="sr-only">Filter provenance</span>
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
          {filtered.length} of {leaves.length} constants shown.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Provenance constants with values, intervals and sources</caption>
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th scope="col" className="px-3 py-2 text-left font-medium">Path</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Value</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Low</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">High</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">Source</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">DOI</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">Table / page</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.path} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-1.5 font-mono text-xs text-slate-700">{f.path}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
      aria-label="Tornado sensitivity chart of the editable share of serious disease"
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
