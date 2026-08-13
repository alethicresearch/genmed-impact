import { useMemo, useState } from 'react';
import {
  AllData,
  Grade,
  MarketKey,
  Opportunity,
  fmtCompact,
  fmtInt,
  fmtPct,
} from '../data';
import { UrlState } from '../urlState';
import { Card, SectionHeading } from '../components/ui';
import { InlineLink } from '../components/prose';
import { useElicitation } from '../elicitation';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

const MARKET_ORDER: MarketKey[] = ['impact_now', 'translational', 'future'];

const GRADE_CLS: Record<Grade, string> = {
  High: 'bg-emerald-100 text-emerald-800',
  Moderate: 'bg-amber-100 text-amber-800',
  Low: 'bg-slate-200 text-slate-600',
};

function usd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

export default function ImpactFunding({ data, update }: Props) {
  const { markets, opportunities, meta } = data.opportunities;
  const pool = meta.default_pool_usd;

  const [market, setMarket] = useState<MarketKey>('impact_now');
  const [sort, setSort] = useState<'impact' | 'efficiency' | 'ask'>('efficiency');
  // Allocation is shared with the perspectives view and kept in this browser only.
  const { state: elicit, setAllocation, clearAllocation } = useElicitation();
  const alloc = elicit.allocation;

  const committed = Object.values(alloc).reduce((a, b) => a + b, 0);
  const remaining = Math.max(0, pool - committed);

  const shown = useMemo(() => {
    const rows = opportunities.filter((o) => o.market === market);
    return rows.slice().sort((a, b) => {
      if (sort === 'impact') return b.expected_impact_per_year - a.expected_impact_per_year;
      if (sort === 'ask') return b.funding_requested - a.funding_requested;
      return a.cost_per_outcome - b.cost_per_outcome; // efficiency: cheapest per outcome first
    });
  }, [opportunities, market, sort]);

  // Portfolio consequences, computed per market so units are never mixed.
  const portfolio = useMemo(() => {
    const byMarket: Record<string, { spend: number; impact: number; unit: string; n: number }> = {};
    for (const o of opportunities) {
      const amt = alloc[o.id] || 0;
      if (amt <= 0) continue;
      const share = Math.min(1, amt / o.funding_requested);
      const impact = o.expected_impact_per_year * share;
      const cur = byMarket[o.market] || {
        spend: 0,
        impact: 0,
        unit: markets[o.market as MarketKey].outcome_unit,
        n: 0,
      };
      cur.spend += amt;
      cur.impact += impact;
      cur.n += 1;
      byMarket[o.market] = cur;
    }
    return byMarket;
  }, [alloc, opportunities, markets]);

  const setAmount = (id: string, amount: number) => setAllocation(id, amount);

  return (
    <div className="space-y-6">
      <SectionHeading
        title="If additional resources were available, where could they create the most impact?"
        subtitle="The disease and intervention models in this project, expressed as costed funding opportunities."
      />

      <p className="max-w-3xl text-[15px] leading-7 text-slate-700">
        The rest of this project estimates where genetic medicine could do the most good. This
        view turns that estimate into specific, costed opportunities and asks a harder question:
        given a fixed budget, where should the next dollar go? Allocate the pool below and the
        model reports what your portfolio would be expected to achieve.
      </p>

      <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4">
        <p className="text-sm leading-6 text-slate-700">
          <span className="font-semibold">Illustrative allocation exercise.</span> These are
          modelled opportunities generated from this project&apos;s catalogue and cost anchors —
          not solicitations, not real programmes, and not endorsements of any organisation. They
          exist so that different people can be asked how they would allocate, and their
          allocations compared.
        </p>
      </div>

      {/* Budget bar */}
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Hypothetical annual pool
            </p>
            <p className="tnum text-2xl font-bold text-slate-900">{usd(pool)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Committed / remaining
            </p>
            <p className="tnum text-lg font-semibold text-slate-900">
              {usd(committed)}{' '}
              <span className="font-normal text-slate-400">/ {usd(remaining)}</span>
            </p>
          </div>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded bg-slate-100">
          <div
            className={`h-full ${committed > pool ? 'bg-rose-500' : 'bg-accent'}`}
            style={{ width: `${Math.min(100, (committed / pool) * 100)}%` }}
          />
        </div>
        {committed > pool && (
          <p className="mt-1 text-xs font-medium text-rose-700">
            Over-committed by {usd(committed - pool)}.
          </p>
        )}
        {Object.keys(portfolio).length > 0 && (
          <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              What this portfolio would be expected to achieve
            </p>
            {MARKET_ORDER.filter((m) => portfolio[m]).map((m) => (
              <p key={m} className="text-sm text-slate-700">
                <span className="font-medium">{markets[m].label}:</span>{' '}
                <span className="tnum font-semibold text-slate-900">
                  {portfolio[m].impact < 10
                    ? portfolio[m].impact.toFixed(2)
                    : fmtInt(portfolio[m].impact)}
                </span>{' '}
                <span className="text-slate-500">{portfolio[m].unit}</span>{' '}
                <span className="text-slate-400">
                  — {usd(portfolio[m].spend)} across {portfolio[m].n}{' '}
                  {portfolio[m].n === 1 ? 'opportunity' : 'opportunities'}
                </span>
              </p>
            ))}
            <p className="text-xs leading-5 text-slate-500">
              Totals are reported separately per market because the three are not denominated in
              the same units. Within a market, opportunities overlap — the same affected birth can
              be avoided by more than one programme — so these are not a headcount of distinct
              people helped.
            </p>
            <button
              type="button"
              onClick={clearAllocation}
              className="text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Clear allocation
            </button>
          </div>
        )}
      </Card>

      {/* Market picker */}
      <div className="flex flex-wrap gap-2">
        {MARKET_ORDER.map((m) => {
          const active = m === market;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMarket(m)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active
                  ? 'border-accent bg-accent text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-accent'
              }`}
            >
              <span className="font-semibold">{markets[m].label}</span>
              <span className={`ml-2 text-xs ${active ? 'text-white/80' : 'text-slate-400'}`}>
                {markets[m].n}
              </span>
            </button>
          );
        })}
      </div>

      <p className="max-w-3xl text-sm leading-6 text-slate-700">{markets[market].question}</p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Best cost per outcome in this market:{' '}
          <span className="tnum font-medium text-slate-700">
            {markets[market].best_cost_per_outcome
              ? usd(markets[market].best_cost_per_outcome as number)
              : '—'}
          </span>{' '}
          per {markets[market].outcome_unit}
        </p>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="efficiency">Cost per outcome (lowest)</option>
            <option value="impact">Expected impact (highest)</option>
            <option value="ask">Funding ask (largest)</option>
          </select>
        </label>
      </div>

      <div className="space-y-4">
        {shown.map((o) => (
          <OpportunityCard
            key={o.id}
            o={o}
            amount={alloc[o.id] || 0}
            onAmount={(n) => setAmount(o.id, n)}
            remaining={remaining}
            update={update}
          />
        ))}
      </div>

      <Card className="bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-900">How these opportunities are built</h3>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          Every implementation opportunity uses the same accounting identity —{' '}
          <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">{meta.identity}</code> —
          where N is the regional birth cohort, G the condition&apos;s frequency, ΔC the coverage
          the project would add, E the intervention&apos;s effectiveness, and A the share of the
          change credited to the project.
        </p>
        <ul className="mt-3 space-y-1.5">
          {meta.caveats.map((c) => (
            <li key={c} className="flex gap-2.5 text-[13px] leading-6 text-slate-600">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-6 text-slate-600">
          Opportunities are derived from the same disease catalogue, coverage and effectiveness
          parameters, and cost anchors used everywhere else in this project. They are illustrative
          allocation objects for studying how people value different kinds of genetic-medicine
          impact — not solicitations, and not endorsements of any named programme. Impact in the
          two research markets is probability-weighted using explicit modelling assumptions.{' '}
          <InlineLink onClick={() => update({ tab: 'methods' })}>
            See the sources and assumptions behind every parameter
          </InlineLink>
          .
        </p>
      </Card>
    </div>
  );
}

function OpportunityCard({
  o,
  amount,
  onAmount,
  remaining,
  update,
}: {
  o: Opportunity;
  amount: number;
  onAmount: (n: number) => void;
  remaining: number;
  update: (patch: UrlState) => void;
}) {
  const [open, setOpen] = useState(false);
  const share = amount > 0 ? Math.min(1, amount / o.funding_requested) : 0;
  const impactAtAmount = o.expected_impact_per_year * share;
  const isResearch = o.market !== 'impact_now';

  return (
    <Card className={amount > 0 ? 'border-accent' : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900">{o.title}</h3>
          <p className="mt-0.5 text-sm text-slate-600">
            {o.detail || o.intervention}
            {o.n_conditions_covered ? ` · covers ${o.n_conditions_covered} catalogue conditions` : ''}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Badge label={`Evidence ${o.evidence}`} grade={o.evidence} />
          <Badge label={`Uncertainty ${o.uncertainty}`} grade={invert(o.uncertainty)} />
          <Badge label={`Equity ${o.equity}`} grade={o.equity} />
        </div>
      </div>

      {/* Headline quantities */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Funding ask" value={usd(o.funding_requested)} />
        <Metric
          label="Expected impact / yr"
          value={
            o.expected_impact_per_year < 10
              ? o.expected_impact_per_year.toFixed(2)
              : fmtCompact(o.expected_impact_per_year)
          }
          sub={o.outcome_unit}
        />
        <Metric label="Cost per outcome" value={usd(o.cost_per_outcome)} />
        {isResearch ? (
          <Metric
            label="Probability weighting"
            value={`${fmtPct(o.p_technical || 0, 0)} × ${fmtPct(o.p_translation || 0, 0)}`}
            sub={`technical × translation · ~${o.horizon_years}yr horizon`}
          />
        ) : (
          <Metric
            label="Coverage"
            value={`${fmtPct(o.current_coverage || 0, 0)} → ${fmtPct(o.target_coverage || 0, 0)}`}
            sub={`+${fmtPct(o.coverage_gain || 0, 0)} in ${o.region}`}
          />
        )}
      </div>

      {o.overlaps_with && (
        <p className="mt-2 text-xs text-amber-800">
          ⚠ Overlaps with “{o.overlaps_with}” — funding both double-counts the same cases.
        </p>
      )}

      {/* Allocation */}
      <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          <span className="font-medium">Allocate (US$)</span>
          <input
            type="number"
            min={0}
            step={1_000_000}
            value={amount || ''}
            placeholder="0"
            onChange={(e) => onAmount(Math.max(0, Number(e.target.value) || 0))}
            className="tnum w-40 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>
        <div className="flex gap-1.5">
          {[10_000_000, 50_000_000].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onAmount(amount + n)}
              className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              +{usd(n)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onAmount(Math.min(o.funding_requested, remaining + amount))}
            className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Fill
          </button>
          {amount > 0 && (
            <button
              type="button"
              onClick={() => onAmount(0)}
              className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-500 hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Clear
            </button>
          )}
        </div>
        {amount > 0 && (
          <p className="text-sm text-slate-700">
            Funds <span className="tnum font-semibold">{fmtPct(share, 0)}</span> of the gap →{' '}
            <span className="tnum font-semibold text-slate-900">
              {impactAtAmount < 10 ? impactAtAmount.toFixed(2) : fmtInt(impactAtAmount)}
            </span>{' '}
            <span className="text-slate-500">{o.outcome_unit}</span>
          </p>
        )}
      </div>

      {/* Assumptions drill-down */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="mt-3 text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {open ? 'Hide assumptions ▲' : 'View assumptions ▼'}
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded border border-slate-200 bg-slate-50 p-3">
          <ul className="space-y-1.5">
            {o.assumptions.map((a) => (
              <li key={a} className="flex gap-2.5 text-[13px] leading-6 text-slate-600">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
          {o.top_conditions && o.top_conditions.length > 0 && (
            <p className="text-[13px] leading-6 text-slate-600">
              <span className="font-medium text-slate-700">Largest contributors: </span>
              {o.top_conditions
                .map((c) => `${c.disease} (${fmtInt(c.impact_per_year)}/yr)`)
                .join(', ')}
              .
            </p>
          )}
          {(o.incidence_source || o.effectiveness_source) && (
            <p className="text-[13px] leading-6 text-slate-500">
              {o.incidence_source && <>Burden: {o.incidence_source}. </>}
              {o.effectiveness_source && <>Effect size: {o.effectiveness_source}.</>}
            </p>
          )}
          {o.people_served != null && o.unit_cost != null && (
            <p className="text-[13px] leading-6 text-slate-500">
              Costed over {fmtCompact(o.people_served)} {o.served_unit || 'people served'} at{' '}
              {usd(o.unit_cost)} each.
            </p>
          )}
          <InlineLink onClick={() => update({ tab: 'methods' })}>
            Open methods &amp; sources
          </InlineLink>
        </div>
      )}
    </Card>
  );
}

// Uncertainty reads inversely: "High uncertainty" is a warning, not a strength.
function invert(g: Grade): Grade {
  if (g === 'High') return 'Low';
  if (g === 'Low') return 'High';
  return 'Moderate';
}

function Badge({ label, grade }: { label: string; grade: Grade }) {
  return (
    <span
      className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium ${GRADE_CLS[grade]}`}
    >
      {label}
    </span>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="tnum mt-0.5 text-lg font-semibold text-slate-900">{value}</p>
      {sub && <p className="text-[11px] leading-snug text-slate-500">{sub}</p>}
    </div>
  );
}
