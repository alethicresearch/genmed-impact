import { useMemo, useState } from 'react';
import { AllData, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { Card, SectionHeading } from '../components/ui';
import { InlineLink } from '../components/prose';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

const MARKET_LABEL: Record<string, string> = {
  impact_now: 'Impact now',
  translational: 'Translational R&D',
  future: 'Future research',
};

const PERSPECTIVE_COLORS: Record<string, string> = {
  population_health: '#0284c7',
  clinical_family: '#059669',
  equity_first: '#7c3aed',
  evidence_first: '#0d9488',
  translational_research: '#d97706',
};

export default function Perspectives({ data, update }: Props) {
  const p = data.perspectives;
  const keys = Object.keys(p.perspectives);
  const [focus, setFocus] = useState<string>(keys[0]);
  const [showAll, setShowAll] = useState(false);

  const byId = useMemo(
    () => Object.fromEntries(p.scored.map((s) => [s.id, s])),
    [p.scored]
  );

  const focusOrder = p.rankings[focus] || [];
  const rows = showAll ? focusOrder : focusOrder.slice(0, 10);

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Whose values decide which opportunities matter?"
        subtitle="The same opportunities, ranked under several explicitly stated positions — shown side by side rather than averaged into one score."
      />

      <p className="max-w-3xl text-[15px] leading-7 text-slate-700">
        Reasonable people rank these opportunities differently, and not because they disagree
        about the arithmetic. A public-health funder weighting expected cases averted and a family
        for whom no unaffected embryo can be selected are weighting different kinds of value.
        Collapsing that into a single score would hide the most interesting thing in the data, so
        each position is scored separately and the disagreement is reported as a result in its
        own right.
      </p>

      <div className="rounded-lg border border-violet-300 bg-violet-50/60 p-4">
        <p className="text-sm font-semibold text-slate-900">
          These positions are stipulated, not measured.
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          No group has been surveyed. Each profile below is a declared weighting with its
          reasoning attached — the same epistemic status as the severity threshold or the
          attribution stance used elsewhere in this project. They are named for the viewpoint
          they represent, not offered as evidence about what anyone actually believes.
        </p>
      </div>

      {/* Perspective profiles */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          The positions
        </h3>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          {keys.map((k) => {
            const prof = p.perspectives[k];
            const active = k === focus;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setFocus(k)}
                className={`rounded-lg border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active ? 'border-accent bg-accent-soft/40' : 'border-slate-200 bg-white hover:border-accent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: PERSPECTIVE_COLORS[k] }}
                  />
                  <span className="text-sm font-semibold text-slate-900">{prof.label}</span>
                  {active && (
                    <span className="ml-auto text-[11px] font-medium uppercase tracking-wide text-accent">
                      ranking shown
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-700">{prof.stance}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{prof.rationale}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(prof.weights)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([d, w]) => (
                      <span
                        key={d}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600"
                      >
                        {p.dimensions[d]?.label ?? d} {fmtPct(w, 0)}
                      </span>
                    ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ranking under the focused perspective */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">
          Ranked by: {p.perspectives[focus].label}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Rank under this position, with the range of ranks the same opportunity takes across all{' '}
          {p.meta.n_perspectives} positions. A wide range means the opportunity&apos;s standing
          depends heavily on whose values are applied.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Opportunities ranked under the selected perspective</caption>
            <thead>
              <tr className="border-b border-slate-300 text-left text-slate-600">
                <th scope="col" className="px-2 py-2 font-medium">#</th>
                <th scope="col" className="px-2 py-2 font-medium">Opportunity</th>
                <th scope="col" className="px-2 py-2 font-medium">Market</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Score</th>
                <th scope="col" className="px-2 py-2 font-medium">Rank range across positions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((id, i) => {
                const s = byId[id];
                if (!s) return null;
                const total = p.scored.length;
                return (
                  <tr key={id} className="border-b border-slate-100">
                    <td className="tnum px-2 py-1.5 text-slate-500">{i + 1}</td>
                    <td className="px-2 py-1.5 text-slate-900">{s.title}</td>
                    <td className="px-2 py-1.5 text-xs text-slate-500">
                      {MARKET_LABEL[s.market] ?? s.market}
                    </td>
                    <td className="tnum px-2 py-1.5 text-right font-medium">
                      {s.scores[focus].toFixed(0)}
                    </td>
                    <td className="px-2 py-1.5">
                      <RankRange best={s.best_rank} worst={s.worst_rank} total={total} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {focusOrder.length > 10 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-2 text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {showAll ? 'Show top 10 only' : `Show all ${focusOrder.length}`}
          </button>
        )}
      </Card>

      {/* Where the positions disagree most */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">Where the positions disagree most</h3>
        <p className="mt-1 text-sm text-slate-600">
          These opportunities are valued very differently depending on the position taken. They
          are where an allocation decision is really a decision about values rather than about
          evidence.
        </p>
        <div className="mt-3 space-y-2">
          {p.most_contested.map((c) => (
            <div key={c.id} className="rounded border border-slate-200 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-slate-900">{c.title}</span>
                <span className="text-xs text-slate-500">
                  {MARKET_LABEL[c.market] ?? c.market} · rank {c.best_rank}–{c.worst_rank}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Ranked highest by{' '}
                <span className="font-medium" style={{ color: PERSPECTIVE_COLORS[c.most_favoured_by] }}>
                  {p.perspectives[c.most_favoured_by]?.label ?? c.most_favoured_by}
                </span>
                , lowest by{' '}
                <span className="font-medium" style={{ color: PERSPECTIVE_COLORS[c.least_favoured_by] }}>
                  {p.perspectives[c.least_favoured_by]?.label ?? c.least_favoured_by}
                </span>
                .
              </p>
              <PerspectiveBars
                scores={byId[c.id]?.scores || {}}
                labels={p.perspectives}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Where they agree */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">Where the positions agree</h3>
        <p className="mt-1 text-sm text-slate-600">
          Opportunities whose standing barely moves across positions. Agreement here is a
          stronger signal than a high score under any single position.
        </p>
        <ul className="mt-2 space-y-1">
          {p.most_agreed.map((c) => (
            <li key={c.id} className="flex flex-wrap items-baseline gap-2 text-sm text-slate-700">
              <span>{c.title}</span>
              <span className="text-xs text-slate-400">
                {MARKET_LABEL[c.market] ?? c.market} · spread {c.disagreement.toFixed(1)} pts
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Dimensions + caveats */}
      <Card className="bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-900">What the positions weight</h3>
        <dl className="mt-2 space-y-1.5">
          {Object.entries(p.dimensions).map(([k, d]) => (
            <div key={k} className="text-[13px] leading-6">
              <dt className="inline font-medium text-slate-700">{d.label}. </dt>
              <dd className="inline text-slate-600">{d.definition}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-3 space-y-1.5">
          {p.meta.caveats.map((c) => (
            <li key={c} className="flex gap-2.5 text-[13px] leading-6 text-slate-600">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-6 text-slate-600">
          <InlineLink onClick={() => update({ tab: 'funding' })}>
            Back to the opportunities and their underlying quantities
          </InlineLink>
          .
        </p>
      </Card>
    </div>
  );
}

function RankRange({ best, worst, total }: { best: number; worst: number; total: number }) {
  const left = ((best - 1) / total) * 100;
  const width = Math.max(2, ((worst - best + 1) / total) * 100);
  const contested = worst - best > total * 0.3;
  return (
    <span className="flex items-center gap-2">
      <span className="relative h-2 w-28 overflow-hidden rounded bg-slate-100">
        <span
          className={`absolute h-full rounded ${contested ? 'bg-amber-500' : 'bg-slate-400'}`}
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      </span>
      <span className="tnum text-xs text-slate-500">
        {best}–{worst}
      </span>
    </span>
  );
}

function PerspectiveBars({
  scores,
  labels,
}: {
  scores: Record<string, number>;
  labels: Record<string, { label: string }>;
}) {
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <span className="w-36 shrink-0 truncate text-[11px] text-slate-600">
            {labels[k]?.label ?? k}
          </span>
          <span className="h-2.5 flex-1 overflow-hidden rounded bg-slate-100">
            <span
              className="block h-full rounded"
              style={{ width: `${v}%`, backgroundColor: PERSPECTIVE_COLORS[k] }}
            />
          </span>
          <span className="tnum w-8 shrink-0 text-right text-[11px] font-medium text-slate-700">
            {v.toFixed(0)}
          </span>
        </div>
      ))}
    </div>
  );
}
