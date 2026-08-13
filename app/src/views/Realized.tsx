import { AllData, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { Card, SectionHeading } from '../components/ui';
import { InlineLink } from '../components/prose';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

export default function Realized({ data, update }: Props) {
  const r = data.retroactive;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Did the predictions hold?"
        subtitle="Checking modelled effectiveness against programmes that actually ran, and defining how funded projects would report what they delivered."
      />

      <p className="max-w-3xl text-[15px] leading-7 text-slate-700">
        A funding market that only ever states predicted impact cannot learn anything. The loop
        closes when a project reports what actually happened and the prediction is scored against
        it. Part of that check is already possible: several national programmes have run for
        decades and their outcomes are published, so the effectiveness this model assumes can be
        compared against what those programmes achieved.
      </p>

      {/* Retrospective validation — real data */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Modelled assumption vs. observed outcome
        </h3>
        <div className="mt-2 space-y-4">
          {r.validation.map((v) => (
            <Card key={v.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-base font-semibold text-slate-900">{v.programme}</h4>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    v.within_modelled_interval
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {v.within_modelled_interval
                    ? 'Within the modelled range'
                    : 'Outside the modelled range'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{v.what_ran}</p>

              <div className="mt-3 space-y-2">
                <CompareBar
                  label={v.model_param_label}
                  value={v.modelled_effectiveness}
                  low={v.modelled_low}
                  high={v.modelled_high}
                  color="#0284c7"
                />
                <CompareBar
                  label={v.outcome_label}
                  value={v.observed_reduction}
                  low={v.observed_low}
                  high={v.observed_high}
                  color="#059669"
                />
              </div>

              <p className="mt-3 text-sm text-slate-700">
                The programme achieved{' '}
                <span className="tnum font-semibold">
                  {v.observed_over_modelled.toFixed(2)}×
                </span>{' '}
                the effectiveness the model assumes
                {v.observed_over_modelled >= 1 ? ' — slightly better than assumed.' : ' — slightly below the assumption.'}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Source: {v.source}
                {v.citation ? ` (${v.citation})` : ''}
                {v.doi && v.doi !== 'n/a' ? (
                  <>
                    {' · '}
                    <a
                      href={`https://doi.org/${v.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      {v.doi}
                    </a>
                  </>
                ) : null}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Forward ledger — deliberately empty */}
      <Card className="border-amber-300 bg-amber-50/50">
        <h3 className="text-base font-semibold text-slate-900">
          The forward ledger is empty — and stays that way until something real is reported
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          No project has been funded or reported through this market. Nothing here has been
          simulated to fill the gap: a plausible-looking invented outcome would be worse than an
          empty table, because it would read as evidence. What follows is the mechanism —
          what a project would commit to, what it would have to report, and how the reward
          would be computed.
        </p>
        <p className="mt-2 text-sm font-medium text-slate-900">
          Entries: {r.meta.n_ledger_entries}
        </p>
      </Card>

      {/* Schema */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">What a project records</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          {Object.entries(r.ledger_schema).map(([stage, fields]) => (
            <div key={stage}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {stage === 'committed'
                  ? '1 · At funding'
                  : stage === 'reported'
                  ? '2 · At reporting'
                  : '3 · Computed'}
              </p>
              <dl className="mt-1.5 space-y-1.5">
                {fields.map((f) => (
                  <div key={f.field} className="text-[13px] leading-5">
                    <dt className="font-mono text-[11px] text-slate-700">{f.field}</dt>
                    <dd className="text-slate-600">{f.meaning}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </Card>

      {/* Rules */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">
          How a retroactive reward would work
        </h3>
        <ul className="mt-2 space-y-1.5">
          {r.retroactive_rules.map((rule) => (
            <li key={rule} className="flex gap-2.5 text-[14px] leading-6 text-slate-700">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-900">Limits of this check</h3>
        <ul className="mt-2 space-y-1.5">
          {r.meta.caveats.map((c) => (
            <li key={c} className="flex gap-2.5 text-[13px] leading-6 text-slate-600">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-6 text-slate-600">
          <InlineLink onClick={() => update({ tab: 'funding' })}>
            Back to the opportunities
          </InlineLink>
          {' · '}
          <InlineLink onClick={() => update({ tab: 'methods' })}>
            See every parameter and its source
          </InlineLink>
          .
        </p>
      </Card>
    </div>
  );
}

// A 0-100% bar with the cited/modelled interval shown behind the point estimate.
function CompareBar({
  label,
  value,
  low,
  high,
  color,
}: {
  label: string;
  value: number;
  low: number;
  high: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="tnum font-semibold text-slate-900">
          {fmtPct(value, 0)}
          <span className="ml-1 font-normal text-slate-400">
            ({fmtPct(low, 0)}–{fmtPct(high, 0)})
          </span>
        </span>
      </div>
      <div className="relative mt-1 h-4 w-full overflow-hidden rounded bg-slate-100">
        <div
          className="absolute h-full bg-slate-200"
          style={{ left: `${low * 100}%`, width: `${Math.max(1, (high - low) * 100)}%` }}
        />
        <div
          className="absolute h-full w-0.5"
          style={{ left: `${value * 100}%`, backgroundColor: color }}
        />
        <div
          className="absolute h-full rounded-l opacity-30"
          style={{ width: `${value * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
