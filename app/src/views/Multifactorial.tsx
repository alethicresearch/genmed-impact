import { AllData, MfDisease, MfScenario, MfScenarioKey, Verdict, fmtInt, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { Card, SectionHeading, Segmented } from '../components/ui';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';
import Explainer from '../components/Explainer';
import Term from '../components/Term';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

// Always coerce to a string so an unexpected object can never reach a React child.
function str(v: unknown): string {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object') return '';
  return String(v);
}

const CLASS_LABEL: Record<string, string> = {
  oligogenic: 'Oligogenic',
  intermediate: 'Intermediate',
  highly_polygenic: 'Highly polygenic',
  massively_polygenic: 'Massively polygenic',
};

const CLASS_TERM: Record<string, string> = {
  oligogenic: 'oligogenic',
  intermediate: 'polygenicity',
  highly_polygenic: 'polygenicity',
  massively_polygenic: 'polygenicity',
};

const VERDICT_META: Record<Verdict, { label: string; fill: string; text: string; hatch?: boolean }> = {
  viable: { label: 'Viable', fill: '#059669', text: 'text-emerald-800' },
  marginal: { label: 'Marginal', fill: '#f59e0b', text: 'text-amber-800' },
  not_viable: { label: 'Not viable', fill: '#94a3b8', text: 'text-slate-600' },
  not_recommended_pleiotropy: {
    label: 'Blocked (pleiotropy)',
    fill: '#dc2626',
    text: 'text-red-700',
    hatch: true,
  },
};

const SCEN_OPTS = [
  { value: 'present', label: 'Present' },
  { value: 'near_future', label: 'Near-future' },
  { value: 'both', label: 'Both' },
];

export default function Multifactorial({ data, state, update }: Props) {
  const mf = data.multifactorial;
  const rawScen = state.scen || 'present';
  const scen = ['present', 'near_future', 'both'].includes(rawScen) ? rawScen : 'present';
  const showKeys: MfScenarioKey[] =
    scen === 'both' ? ['present', 'near_future'] : [scen as MfScenarioKey];

  const vThresh = mf.viability_thresholds.viable;
  const mThresh = mf.viability_thresholds.marginal;

  return (
    <SourcesProvider>
      <div className="space-y-6">
        <SectionHeading
          title="Multifactorial viability"
          subtitle="How far embryo selection and gene editing can move risk for common, many-gene diseases — arranged along the polygenicity spectrum."
        />

        <Explainer
          whatThisShows={
            <>
              Ten common <Term k="multifactorial">multifactorial</Term> diseases arranged along a{' '}
              <strong>spectrum</strong>: from <Term k="oligogenic">oligogenic</Term> (a few
              big-effect genes) to <strong>massively polygenic</strong> (thousands of tiny
              effects). For each, two levers — <Term k="embryo selection">embryo selection</Term> on
              a <Term k="PRS">PRS</Term> and <Term k="germline embryo editing">editing</Term> of a
              handful of large-effect loci — are scored by how much risk they can remove.
            </>
          }
          howToRead={
            <>
              Each disease has two bars for the paper's two mechanisms:{' '}
              <strong>selection</strong> (choose among embryos) and <strong>correction</strong>{' '}
              (edit a few large-effect loci), showing the{' '}
              <Term k="RRR">relative risk reduction</Term> each achieves. Colour is the
              verdict — <span className="font-medium text-emerald-700">green = viable</span>,{' '}
              <span className="font-medium text-amber-700">amber = marginal</span>, grey = not
              viable, <span className="font-medium text-red-700">red = blocked by pleiotropy</span>.
              Hover a bar for the underlying liability shift and embryo/edit counts.
            </>
          }
          whatItDetermines={
            <>
              Where each lever <em>can</em> work and where architecture forecloses it. The{' '}
              <strong>frontier moves outward</strong> as technology advances (more embryos, more
              simultaneous edits) — but for the most polygenic traits, editing a few loci can never
              reach far, and <Term k="pleiotropy">pleiotropy</Term> (e.g. APOE) blocks otherwise
              concentrated targets no matter the tech.
            </>
          }
          defaultOpen={false}
        />

        {/* The core teaching text, grounded in the model note */}
        <Card>
          <p className="text-sm leading-relaxed text-slate-700">{str(mf.note)}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            All risk reductions here are computed on the{' '}
            <Term k="liability threshold">liability-threshold</Term> model: everyone carries a
            continuous risk load, and the disease appears once that load crosses a fixed threshold.
            An intervention shifts that load by some fraction of a standard deviation.
          </p>
        </Card>

        {/* Scenario control */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Segmented
            label="Technology scenario"
            ariaLabel="Technology scenario"
            value={scen}
            options={SCEN_OPTS}
            onChange={(v) => update({ scen: v })}
          />
          <p className="max-w-md text-xs text-slate-500">
            <span className="font-medium text-slate-700">Present</span> ={' '}
            {str(mf.tech_scenarios.present.label)}. <span className="font-medium text-slate-700">Near-future</span>{' '}
            = {str(mf.tech_scenarios.near_future.label)}.
          </p>
        </div>

        {/* Frontier summary */}
        <FrontierSummary mf={data.multifactorial} />

        {/* Legend */}
        <Legend vThresh={vThresh} mThresh={mThresh} />

        {/* Spectrum matrix */}
        <Card>
          <h3 className="text-base font-semibold text-slate-900">
            The polygenicity spectrum
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Ordered from a few big-effect genes (top) to thousands of tiny effects (bottom). Read
            each row across: architecture on the left, then what selection and editing can each
            achieve.
          </p>
          <div className="mt-4 space-y-3">
            {mf.diseases.map((d) => (
              <DiseaseRow key={d.id} d={d} showKeys={showKeys} vThresh={vThresh} mThresh={mThresh} />
            ))}
          </div>
        </Card>

        {/* Required caveat */}
        <Card className="border-amber-300 bg-amber-50/60">
          <h3 className="text-sm font-semibold text-slate-900">How to read these numbers honestly</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            A selection <Term k="RRR">RRR</Term> can look large for a rare, highly heritable trait —
            that is a property of the <Term k="liability threshold">liability-threshold model</Term>,
            not a promise. It is <strong>not</strong> the same as an achievable population-level
            intervention: it describes one couple choosing among their own embryos, conditional on
            doing IVF at all. Editing viability, meanwhile, needs more than genetic tractability — a
            locus can be concentrated and still be a poor or unsafe edit target, so a green editing
            bar is a <em>necessary</em>, not sufficient, condition.
          </p>
        </Card>

        <Card>
          <p className="text-xs leading-relaxed text-slate-500">{str(mf.meta.liability_note)}</p>
        </Card>

        <SourcesList title="Genetic-architecture sources" />
      </div>
    </SourcesProvider>
  );
}

function FrontierSummary({ mf }: { mf: AllData['multifactorial'] }) {
  const p = mf.frontier.present;
  const f = mf.frontier.near_future;
  const n = mf.n_diseases;

  // Identify WHICH diseases each count refers to, so a bare "3 of 10" names its members.
  const names = (pred: (d: MfDisease) => boolean) => mf.diseases.filter(pred).map((d) => str(d.name));
  const editNF = names((d) => d.scenarios.near_future.editing.verdict === 'viable');
  const selNF = names((d) => d.scenarios.near_future.selection.verdict === 'viable');
  const selMargNF = names((d) =>
    ['viable', 'marginal'].includes(d.scenarios.near_future.selection.verdict));

  return (
    <Card className="border-accent/40 bg-accent-soft/40">
      <h3 className="text-base font-semibold text-slate-900">The moving frontier</h3>
      <p className="mt-1 text-sm text-slate-600">
        Counts are across the <strong>{n} diseases listed below</strong> (each named row in the
        spectrum). As technology advances more fall inside reach — but architecture caps how far
        correction can ever go. Near-future members are named under each count.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FrontierStat
          label="Correction (editing) viable"
          from={p.editing_viable}
          to={f.editing_viable}
          n={n}
          note="editing a few loci clears the viability bar"
          members={editNF}
        />
        <FrontierStat
          label="Selection viable"
          from={p.selection_viable}
          to={f.selection_viable}
          n={n}
          note="PRS-based embryo selection clears the bar"
          members={selNF}
        />
        <FrontierStat
          label="Selection viable + marginal"
          from={p.selection_viable_or_marginal}
          to={f.selection_viable_or_marginal}
          n={n}
          note="selection at least marginally useful"
          members={selMargNF}
        />
      </div>
    </Card>
  );
}

function FrontierStat({
  label,
  from,
  to,
  n,
  note,
  members,
}: {
  label: string;
  from: number;
  to: number;
  n: number;
  note: string;
  members: string[];
}) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="tnum mt-1 text-xl font-bold text-slate-900">
        {from} <span className="text-sm font-normal text-slate-400">today</span> →{' '}
        {to} <span className="text-sm font-normal text-slate-400">near-future</span>
      </p>
      <p className="text-xs text-slate-500">
        of {n} diseases · {note}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-slate-600">
        <span className="text-slate-400">Near-future: </span>
        {members.length ? members.join(', ') : 'none'}
      </p>
    </div>
  );
}

function Legend({ vThresh, mThresh }: { vThresh: number; mThresh: number }) {
  const items: Array<{ v: Verdict }> = [
    { v: 'viable' },
    { v: 'marginal' },
    { v: 'not_viable' },
    { v: 'not_recommended_pleiotropy' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
      {items.map(({ v }) => {
        const m = VERDICT_META[v];
        return (
          <span key={v} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{
                background: m.hatch
                  ? 'repeating-linear-gradient(45deg,#dc2626,#dc2626 2px,#fff 2px,#fff 4px)'
                  : m.fill,
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            />
            {m.label}
          </span>
        );
      })}
      <span className="text-slate-400">
        Viable ≥ {fmtPct(vThresh, 0)} RRR · marginal ≥ {fmtPct(mThresh, 0)} RRR
      </span>
    </div>
  );
}

function DiseaseRow({
  d,
  showKeys,
  vThresh,
  mThresh,
}: {
  d: MfDisease;
  showKeys: MfScenarioKey[];
  vThresh: number;
  mThresh: number;
}) {
  const archSrc = str(d.sources.oligo_editable_h2);
  const prsSrc = str(d.sources.prs_r2);
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Architecture */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-900">{str(d.name)}</p>
            <ClassBadge cls={d.polygenicity_class} />
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <Metric term="heritability" label="Heritability" value={fmtPct(d.heritability, 0)} />
            <Metric label="Lifetime prevalence" value={fmtPct(d.lifetime_prevalence, 2)} />
            <Metric
              term="PRS"
              label="PRS R²"
              value={fmtPct(d.prs_r2, 0)}
              src={prsSrc ? { source: prsSrc } : undefined}
            />
            <Metric
              label="Oligo-editable h²"
              value={fmtPct(d.oligo_editable_h2, 0)}
              src={archSrc ? { source: archSrc } : undefined}
            />
            <Metric
              term="effective loci"
              label="Effective loci"
              value={d.effective_loci == null ? '—' : fmtInt(d.effective_loci)}
            />
          </dl>
          {d.notes && <p className="mt-2 text-xs italic leading-relaxed text-slate-500">{str(d.notes)}</p>}
        </div>

        {/* Intervention tracks */}
        <div className="space-y-3">
          {showKeys.map((k) => {
            const sc = d.scenarios[k];
            return (
              <div key={k}>
                {showKeys.length > 1 && (
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {k === 'present' ? 'Present' : 'Near-future'}
                  </p>
                )}
                <TrackBar
                  label="Selection"
                  result={sc.selection}
                  scenario={sc}
                  kind="selection"
                  vThresh={vThresh}
                  mThresh={mThresh}
                />
                <TrackBar
                  label="Correction"
                  result={sc.editing}
                  scenario={sc}
                  kind="editing"
                  vThresh={vThresh}
                  mThresh={mThresh}
                />
              </div>
            );
          })}
          {d.pleiotropy_caution && (
            <p className="text-[11px] leading-snug text-red-700">
              ⚠ <Term k="pleiotropy">Pleiotropy</Term> caution: a concentrated locus here (e.g.
              HLA/APOE) is a poor or unsafe edit target regardless of tractability.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  term,
  src,
}: {
  label: string;
  value: string;
  term?: string;
  src?: { source: string };
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-slate-500">{term ? <Term k={term}>{label}</Term> : label}</dt>
      <dd className="tnum font-medium text-slate-800">
        {value}
        {src && <SourceNote source={src.source} doi={null} />}
      </dd>
    </div>
  );
}

function ClassBadge({ cls }: { cls: MfDisease['polygenicity_class'] }) {
  const label = CLASS_LABEL[cls] || cls;
  const term = CLASS_TERM[cls];
  return (
    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
      <Term k={term}>{label}</Term>
    </span>
  );
}

// A single RRR bar coloured by verdict, with a viability threshold tick.
function TrackBar({
  label,
  result,
  scenario,
  kind,
  vThresh,
  mThresh,
}: {
  label: string;
  result: { delta: number; rrr: number; verdict: Verdict };
  scenario: MfScenario;
  kind: 'selection' | 'editing';
  vThresh: number;
  mThresh: number;
}) {
  const meta = VERDICT_META[result.verdict];
  const W = 240;
  const H = 20;
  const w = Math.max(Math.min(result.rrr, 1), 0) * W;
  const counts =
    kind === 'selection'
      ? `${fmtInt(scenario.n_embryos)} embryos`
      : `${fmtInt(scenario.n_edits)} edits`;
  const hoverTitle = `${label}: ${fmtPct(result.rrr, 1)} RRR · liability shift ${result.delta.toFixed(
    2
  )} SD · ${counts} · ${meta.label}`;
  const fill = meta.hatch
    ? 'repeating-linear-gradient(45deg,#dc2626,#dc2626 3px,#fecaca 3px,#fecaca 6px)'
    : meta.fill;
  return (
    <div className="flex items-center gap-2 py-0.5" title={hoverTitle}>
      <span className="w-16 shrink-0 text-[11px] font-medium text-slate-600">{label}</span>
      <div
        className="relative overflow-hidden rounded bg-slate-100"
        style={{ width: W, height: H, maxWidth: '100%' }}
      >
        <div
          className="h-full rounded-l"
          style={{ width: w, background: fill }}
          aria-hidden="true"
        />
        {/* viability + marginal threshold ticks */}
        <span
          className="absolute top-0 h-full border-l border-dashed border-slate-400"
          style={{ left: vThresh * W }}
          aria-hidden="true"
        />
        <span
          className="absolute top-0 h-full border-l border-dotted border-slate-300"
          style={{ left: mThresh * W }}
          aria-hidden="true"
        />
      </div>
      <span className={`tnum w-12 shrink-0 text-xs font-semibold ${meta.text}`}>
        {fmtPct(result.rrr, 0)}
      </span>
    </div>
  );
}
