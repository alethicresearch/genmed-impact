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
            causal genes and to the interventions that can address them — carrier screening,
            embryo testing, prenatal diagnosis, newborn screening, and germline editing. The
            question this answers: across the whole landscape of serious genetic disease,{' '}
            <strong>what can genetic medicine already do — and how much is left only for
            editing?</strong> The split below is that answer; the rest of the page is the evidence
            behind it, shown with its uncertainty.
          </p>
        </Card>

        {/* THE SPLIT — the headline */}
        <StatusSplit data={data} update={update} />

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

          <StatTile label="Not editing-dependent (top-down)">
            <StatValue
              stat={data.summary.addressable_share_of_serious.permissive}
              kind="pct"
              decimals={1}
            />
            <SourceNote
              source="Derived (top-down model): share of serious disease NOT in the editing-only residual, i.e. 1 − (S1 + permissive S2). Distinct from the catalogue 'addressable status' share above, which is computed bottom-up over the disease library."
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

const STATUS_COLORS: Record<string, string> = {
  preventable_treatable: '#059669', // emerald
  preventable: '#0284c7', // sky
  treatable: '#0d9488', // teal
  detectable_only: '#d97706', // amber
  none: '#94a3b8', // slate
};

function StatusSplit({
  data,
  update,
}: {
  data: AllData;
  update: (patch: UrlState) => void;
}) {
  const s = data.library.rollup.genetic_medicine_status;
  const totalB = s.order.reduce((a, k) => a + s.distribution[k].births, 0) || 1;
  let x = 0;
  const segs = s.order.map((k) => {
    const w = (s.distribution[k].births / totalB) * 100;
    const seg = { k, x, w, ...s.distribution[k] };
    x += w;
    return seg;
  });
  const editable = data.summary.uniquely_editable_total.permissive.median;

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">
          What genetic medicine can already do
        </h3>
        <p className="text-sm text-slate-600">
          <strong className="text-slate-900">{fmtPct(s.addressable_by_existing_tools_share, 0)}</strong>{' '}
          of serious genetic disease (by affected births in the catalogue) sits in a status that
          existing tools already address.
        </p>
      </div>

      {/* stacked bar by births */}
      <div
        className="mt-3 flex h-9 w-full overflow-hidden rounded"
        role="img"
        aria-label="Genetic-medicine status distribution by affected births"
      >
        {segs.map((seg) =>
          seg.w > 0 ? (
            <button
              key={seg.k}
              type="button"
              onClick={() => update({ tab: 'library', status: seg.k, libsort: 'status' })}
              title={`${seg.label}: ${fmtInt(seg.births)} births/yr (${fmtPct(
                seg.births / totalB,
                0
              )}) · ${seg.n_diseases} diseases — click to filter the library`}
              style={{ width: `${seg.w}%`, backgroundColor: STATUS_COLORS[seg.k] }}
              className="h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-slate-900"
            />
          ) : null
        )}
      </div>

      {/* legend */}
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {segs.map((seg) => (
          <button
            key={seg.k}
            type="button"
            onClick={() => update({ tab: 'library', status: seg.k, libsort: 'status' })}
            className="flex items-center gap-2 text-left text-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: STATUS_COLORS[seg.k] }}
            />
            <span className="text-slate-700">{seg.label}</span>
            <span className="tnum ml-auto text-slate-500">
              {fmtCompact(seg.births)} · {seg.n_diseases}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-700">
        Set against that, the residual for which germline editing is the{' '}
        <strong>only</strong> option is a sliver of couples <em>within</em> diseases (no selectable
        unaffected embryo), on the order of{' '}
        <strong className="text-slate-900">{fmtCompact(editable)}</strong> births / yr — explored on
        the Residual tab, not a disease category here.
      </p>
      <p className="mt-1 text-xs text-slate-500">{s.definition}</p>
    </Card>
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
