import { ReactNode } from 'react';
import { AllData, fmtCompact, fmtInt, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { Card, SectionHeading } from '../components/ui';
import StatValue from '../components/StatValue';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

// Safely read a {source, doi} leaf from the provenance constants tree without
// letting an unexpected object reach a React child.
function provSource(
  data: AllData,
  path: string[]
): { source: string; doi: string | null } {
  let node: unknown = data.provenance.constants;
  for (const k of path) {
    if (node && typeof node === 'object' && k in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[k];
    } else {
      node = undefined;
      break;
    }
  }
  const rec = (node && typeof node === 'object' ? node : {}) as Record<string, unknown>;
  return {
    source: typeof rec.source === 'string' ? rec.source : '',
    doi: typeof rec.doi === 'string' ? rec.doi : null,
  };
}

export default function Overview({ data, state, update }: Props) {
  const mode = state.mode === 'detailed' ? 'detailed' : 'simple';
  const rollup = data.library.rollup;

  const birthsSrc = provSource(data, ['births', 'global_per_year']);
  const monoSrc = provSource(data, ['burden', 'monogenic_serious_per_1000']);
  const multiSrc = provSource(data, ['burden', 'multifactorial_serious_per_1000']);
  const s2Src = provSource(data, ['s2']);

  const topDown = data.summary.burden_default.total_serious.median;
  const bottomUp = rollup.total_affected_births_per_year;
  const climbShare = bottomUp / topDown;

  return (
    <SourcesProvider>
      <div className="space-y-6">
        <SectionHeading
          title="What this is measuring"
          subtitle="A plain-language read of the model before the numbers."
        />

        <Card>
          <p className="text-sm leading-relaxed text-slate-700">
            The core object is a <strong>library of genetic diseases</strong> mapped to their
            causal genes and to the interventions that can address them (carrier screening,
            embryo testing, prenatal diagnosis, newborn screening). The aggregate burden
            numbers are <strong>derived by summing that library</strong> from the bottom up, and
            cross-checked against a parametric <strong>Monte-Carlo model</strong> that estimates
            the same denominator top-down, with 95% credible intervals. Nothing here is computed
            live: every figure is precomputed and this page only recombines and displays it.
          </p>
        </Card>

        {/* What you're looking at: measured / derived / assumptions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ExplainerChip
            tone="measured"
            label="Measured"
            body="The disease catalogue itself: genes, inheritance mode, incidence figures, and which interventions apply — curated from OMIM/Orphanet gene–disease relationships."
          />
          <ExplainerChip
            tone="derived"
            label="Derived"
            body="Burden totals, the share addressable by existing tools, and the uniquely-editable residual — all obtained by summing or reweighting the measured values."
          />
          <ExplainerChip
            tone="assumptions"
            label="Assumptions"
            body="A severity threshold and an attribution stance decide what counts as 'serious'. These are toggles, not facts."
            action={
              <button
                type="button"
                onClick={() => update({ mode: 'detailed', tab: 'denominator' })}
                className="mt-2 text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Open the Denominator toggles →
              </button>
            }
          />
        </div>

        {/* Headline stat tiles, each with a source footnote */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Serious genetic births / yr">
            <StatValue stat={data.summary.burden_default.total_serious} kind="compact" />
            <SourceNote
              source={monoSrc.source || 'Modell & Darlison 2008'}
              doi={monoSrc.doi}
              detail="top-down parametric total (serious)"
            />
          </StatTile>

          <StatTile label="Addressable by existing tools">
            <StatValue
              stat={data.summary.addressable_share_of_serious.permissive}
              kind="pct"
              decimals={1}
            />
            <SourceNote
              source="Derived: share of serious cases reachable by ≥1 reproductive/newborn tool (permissive S2)"
              doi={null}
            />
          </StatTile>

          <StatTile label="Uniquely editable / yr (permissive)">
            <StatValue stat={data.summary.uniquely_editable_total.permissive} kind="compact" />
            <SourceNote
              source={s2Src.source || 'Derived residual (S2)'}
              doi={s2Src.doi}
              detail="cases reachable only by germline editing"
            />
          </StatTile>

          <StatTile label="Library coverage">
            <span className="tnum text-lg font-semibold text-slate-900">
              {fmtInt(rollup.n_diseases)} diseases
            </span>
            <span className="ml-1 text-sm text-slate-500">
              · {fmtCompact(rollup.total_affected_births_per_year)}/yr
            </span>
            <SourceNote
              source="Seed disease library (this project), curated from OMIM/Orphanet"
              doi={data.provenance.constants ? null : null}
              detail={data.library.meta.incidence_unit}
            />
          </StatTile>
        </div>

        {/* Honesty callout: lower bound vs top-down */}
        <Card className="border-amber-300 bg-amber-50/60">
          <h3 className="text-base font-semibold text-slate-900">
            The catalogue total is a lower bound
          </h3>
          <p className="mt-1 text-sm text-slate-700">
            The library is a <strong>curated seed catalogue</strong> of the highest-burden
            conditions, so its bottom-up sum is a{' '}
            <strong>lower bound</strong> on the full genetic-disease denominator. It climbs
            toward the parametric top-down total as the catalogue grows — today the seed covers
            about <strong>{fmtPct(climbShare, 0)}</strong> of the modelled denominator. Both
            numbers are shown so the gap is explicit, not hidden.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded border border-amber-200 bg-white p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Bottom-up (library sum) · lower bound
              </p>
              <p className="tnum mt-1 text-2xl font-bold text-slate-900">
                {fmtCompact(bottomUp)}
              </p>
              <p className="text-xs text-slate-500">
                {fmtInt(bottomUp)} affected births / yr over {rollup.n_diseases} diseases
              </p>
            </div>
            <div className="rounded border border-amber-200 bg-white p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Top-down (Monte-Carlo model)
              </p>
              <p className="tnum mt-1 text-2xl font-bold text-slate-900">
                {fmtCompact(topDown)}
              </p>
              <p className="text-xs text-slate-500">
                median serious genetic disease / yr, with 95% CrI
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-600">{rollup.note}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">{data.library.meta.note}</p>
        </Card>

        {mode === 'detailed' && (
          <Card>
            <h3 className="text-base font-semibold text-slate-900">How the model works</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              The top-down denominator is a Monte-Carlo simulation over {fmtInt(data.meta.n_draws)}{' '}
              draws: birth counts, per-1,000 serious-disease rates by severity definition, and an
              attribution stance are each sampled from cited intervals, then combined to produce a
              distribution for the serious total and every downstream share. The Denominator tab
              lets you move the severity threshold and attribution stance and watch every number
              respond; the Methods &amp; Provenance tab lists each parameter, its cited source, and
              the sensitivity tornado. The bottom-up library is the ground-truth catalogue those
              parameters are calibrated to reproduce.
            </p>
            <button
              type="button"
              onClick={() => update({ tab: 'methods' })}
              className="mt-2 text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Go to Methods &amp; Provenance →
            </button>
          </Card>
        )}

        {/* Sources & notes */}
        <div className="space-y-2">
          {/* Register the key datasets so they always appear in the list. */}
          <span className="sr-only">
            <SourceNote source={birthsSrc.source || 'UN World Population Prospects 2024'} doi={birthsSrc.doi} />
            <SourceNote source={multiSrc.source || 'March of Dimes 2006; WHO congenital anomalies'} doi={multiSrc.doi} />
          </span>
          <SourcesList />
        </div>
      </div>
    </SourcesProvider>
  );
}

function StatTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl">{children}</p>
    </Card>
  );
}

function ExplainerChip({
  tone,
  label,
  body,
  action,
}: {
  tone: 'measured' | 'derived' | 'assumptions';
  label: string;
  body: string;
  action?: ReactNode;
}) {
  const toneClass: Record<string, string> = {
    measured: 'border-emerald-300 bg-emerald-50/60',
    derived: 'border-sky-300 bg-sky-50/60',
    assumptions: 'border-slate-300 bg-slate-50',
  };
  return (
    <div className={`rounded-lg border p-4 ${toneClass[tone]}`}>
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-700">{body}</p>
      {action}
    </div>
  );
}
