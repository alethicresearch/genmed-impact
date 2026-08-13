import { useMemo, useState } from 'react';
import { AllData, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { Card, SectionHeading } from '../components/ui';
import { InlineLink } from '../components/prose';
import { RESPONDENT_TYPES, buildResponse, scoreWithWeights, useElicitation } from '../elicitation';

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

  const { state: elicit, patch, setWeight, resetWeights } = useElicitation();
  const hasOwnWeights = Object.values(elicit.weights).some((v) => v > 0);

  // The visitor's own ranking, recomputed from the precomputed dimension scores.
  const ownRanking = useMemo(() => {
    if (!hasOwnWeights) return [];
    return p.scored
      .map((s) => ({
        s,
        score: scoreWithWeights(s.dimensions, elicit.weights, elicit.valuesDistantPayoffs),
      }))
      .sort((a, b) => b.score - a.score);
  }, [p.scored, elicit.weights, elicit.valuesDistantPayoffs, hasOwnWeights]);

  // Which declared position the visitor's ranking most resembles (rank correlation of top order).
  const closest = useMemo(() => {
    if (!hasOwnWeights) return null;
    const mine = ownRanking.map((r) => r.s.id);
    let best: { key: string; agree: number } | null = null;
    for (const k of keys) {
      const theirs = p.rankings[k];
      const topN = Math.min(10, mine.length);
      const overlap = mine.slice(0, topN).filter((id) => theirs.slice(0, topN).includes(id)).length;
      const agree = overlap / topN;
      if (!best || agree > best.agree) best = { key: k, agree };
    }
    return best;
  }, [ownRanking, p.rankings, keys, hasOwnWeights]);

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
                  <span className="text-[11px] italic text-slate-400">{prof.tradition}</span>
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

      {/* Set your own weights */}
      <Card className="border-accent/50">
        <h3 className="text-base font-semibold text-slate-900">Set your own weights</h3>
        <p className="mt-1 text-sm text-slate-600">
          Rather than accept the positions above, say how much each dimension matters to you. Your
          ranking is recomputed from the same underlying scores, and compared with the declared
          positions.
        </p>
        <div className="mt-3 space-y-2.5">
          {Object.entries(p.dimensions).map(([k, d]) => (
            <div key={k} className="flex flex-wrap items-center gap-3">
              <label htmlFor={`w-${k}`} className="w-48 shrink-0 text-sm text-slate-700">
                {d.label}
              </label>
              <input
                id={`w-${k}`}
                type="range"
                min={0}
                max={100}
                step={5}
                value={elicit.weights[k] ?? 0}
                onChange={(e) => setWeight(k, Number(e.target.value))}
                className="h-2 w-56 max-w-full"
              />
              <span className="tnum w-10 text-right text-xs text-slate-500">
                {elicit.weights[k] ?? 0}
              </span>
            </div>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={elicit.valuesDistantPayoffs}
            onChange={(e) => patch({ valuesDistantPayoffs: e.target.checked })}
          />
          I value work whose payoff is distant (inverts immediacy, as the translational position does)
        </label>

        {hasOwnWeights ? (
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Your top 10
            </p>
            <ol className="mt-1.5 space-y-1">
              {ownRanking.slice(0, 10).map((r, i) => (
                <li key={r.s.id} className="flex flex-wrap items-baseline gap-2 text-sm">
                  <span className="tnum w-5 text-slate-400">{i + 1}</span>
                  <span className="text-slate-900">{r.s.title}</span>
                  <span className="text-xs text-slate-400">
                    {MARKET_LABEL[r.s.market] ?? r.s.market} · {r.score.toFixed(0)}
                  </span>
                </li>
              ))}
            </ol>
            {closest && (
              <p className="mt-2 text-sm text-slate-700">
                Your top 10 overlaps most with{' '}
                <span
                  className="font-semibold"
                  style={{ color: PERSPECTIVE_COLORS[closest.key] }}
                >
                  {p.perspectives[closest.key]?.label}
                </span>{' '}
                ({fmtPct(closest.agree, 0)} of the same opportunities).
              </p>
            )}
            <button
              type="button"
              onClick={resetWeights}
              className="mt-2 text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Reset weights
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Move any slider above zero to see your own ranking.
          </p>
        )}
      </Card>

      <ElicitationExport data={data} />

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
        <h3 className="mt-4 text-sm font-semibold text-slate-900">
          Where these positions come from
        </h3>
        <div className="mt-2 space-y-2">
          {keys.map((k) => (
            <div key={k} className="text-[13px] leading-6">
              <p className="font-medium text-slate-700">
                {p.perspectives[k].label}{' '}
                <span className="font-normal italic text-slate-500">
                  — {p.perspectives[k].tradition}
                </span>
              </p>
              <ul className="ml-4 list-disc text-slate-600">
                {p.perspectives[k].citations.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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

/**
 * The elicitation record. This site is a static page with no backend, so nothing is transmitted:
 * a respondent exports their own answer and decides whether to send it on.
 */
function ElicitationExport({ data }: { data: AllData }) {
  const { state, patch, reset } = useElicitation();
  const [copied, setCopied] = useState(false);

  const allocationDetail = useMemo(() => {
    const byId = Object.fromEntries(
      data.opportunities.opportunities.map((o) => [o.id, o])
    );
    return Object.entries(state.allocation)
      .filter(([, amt]) => amt > 0)
      .map(([id, amt]) => ({
        id,
        title: byId[id]?.title ?? id,
        market: byId[id]?.market ?? 'unknown',
        amount_usd: amt,
      }));
  }, [state.allocation, data.opportunities.opportunities]);

  const record = useMemo(
    () =>
      buildResponse(state, {
        commit: data.meta.commit,
        poolUsd: data.opportunities.meta.default_pool_usd,
      }, allocationDetail),
    [state, data.meta.commit, data.opportunities.meta.default_pool_usd, allocationDetail]
  );

  const json = JSON.stringify(record, null, 2);
  const nothingRecorded =
    !state.respondentType && allocationDetail.length === 0 &&
    !Object.values(state.weights).some((v) => v > 0);

  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-900">Record your response</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        If you would like your allocation and weights to count towards a comparison across
        vantage points, tag them and export the record below.
      </p>

      <label className="mt-3 flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">I am answering as</span>
        <select
          value={state.respondentType}
          onChange={(e) => patch({ respondentType: e.target.value })}
          className="w-72 max-w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {RESPONDENT_TYPES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      {state.respondentType === 'other' && (
        <input
          type="text"
          value={state.otherDetail}
          placeholder="Describe your vantage point"
          onChange={(e) => patch({ otherDetail: e.target.value })}
          className="mt-2 w-72 max-w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      )}

      <p className="mt-3 text-sm text-slate-700">
        Currently recorded: {allocationDetail.length} allocation
        {allocationDetail.length === 1 ? '' : 's'},{' '}
        {Object.values(state.weights).filter((v) => v > 0).length} weighted dimension
        {Object.values(state.weights).filter((v) => v > 0).length === 1 ? '' : 's'}.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={nothingRecorded}
          onClick={() => {
            navigator.clipboard?.writeText(json).then(
              () => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              },
              () => setCopied(false)
            );
          }}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {copied ? 'Copied ✓' : 'Copy response as JSON'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-500 hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Clear everything
        </button>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-medium text-slate-600">
          Preview the record
        </summary>
        <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-900 p-3 text-[11px] leading-5 text-slate-100">
          {json}
        </pre>
      </details>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Nothing is sent anywhere. This is a static page with no backend; your response is held in
        this browser only, and exporting it is entirely your choice. It is stamped with the
        pipeline commit so that a response can be matched to the figures it was made against.
      </p>
    </Card>
  );
}
