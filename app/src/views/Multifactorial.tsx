import { AllData, MfDisease, MfScenario, MfScenarioKey, Verdict, fmtInt, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { Card, SectionHeading, Segmented } from '../components/ui';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';
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

// Labels state the modeled risk-reduction band directly (thresholds 30% / 10% in the data),
// so the reader knows what each colour means without looking elsewhere. Not clinical verdicts.
const VERDICT_META: Record<Verdict, { label: string; fill: string; text: string; hatch?: boolean }> = {
  viable: { label: '≥30% modeled risk reduction', fill: '#059669', text: 'text-emerald-800' },
  marginal: { label: '10–30% modeled risk reduction', fill: '#f59e0b', text: 'text-amber-800' },
  not_viable: { label: '<10% modeled risk reduction', fill: '#94a3b8', text: 'text-slate-600' },
  not_recommended_pleiotropy: {
    label: 'Pleiotropy caution',
    fill: '#dc2626',
    text: 'text-red-700',
    hatch: true,
  },
};

const SCEN_OPTS = [
  { value: 'present', label: 'Current-capacity assumption set' },
  { value: 'near_future', label: 'Future high-capacity assumption set' },
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
          title="How far is polygenic editing from medical usefulness?"
          subtitle="Polygenic editing is not clinically viable today, but its potential could change substantially if causal variants can be identified more reliably and multiplex editing becomes sufficiently safe and precise. This model asks where that frontier currently lies and how it moves under higher-capacity assumptions."
        />

        <p className="text-sm leading-relaxed text-slate-700">
          Monogenic editing and polygenic editing solve different problems. In a monogenic
          disorder, changing one pathogenic variant may remove most of the relevant inherited
          risk. In a common complex disease, risk is distributed across many variants and
          interacts with environment and chance.
        </p>
        <p className="text-sm leading-relaxed text-slate-700">
          That makes polygenic intervention more demanding — but it does not make it
          unimportant. Recent quantitative work has argued that editing a limited number of
          well-chosen causal variants could eventually produce large reductions in lifetime
          disease risk if causal inference and multiplex editing improve sufficiently (Visscher
          et al., <em>Nature</em>, 2025,{' '}
          <a
            href="https://doi.org/10.1038/s41586-024-08300-4"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline"
          >
            10.1038/s41586-024-08300-4
          </a>
          ). We therefore model polygenic editing as a <strong>developing technological
          frontier</strong>, not as an extension of the monogenic no-alternative population.
        </p>
        <p className="text-sm leading-relaxed text-slate-700">
          We model each disease as a continuous underlying liability to disease. Embryo
          selection can choose among embryos with different polygenic risk; germline editing
          can change only the loci specified for editing. The potential benefit of either
          strategy therefore depends on the disease&apos;s genetic architecture, the number of
          embryos available for selection, and the number of loci that could be edited.
        </p>
        <p className="text-xs text-slate-500">
          The chart reports the resulting modeled relative risk reduction, not clinical
          efficacy.
        </p>

        <Card>
          <p className="text-sm leading-relaxed text-slate-700">
            Risk reductions are computed on the{' '}
            <Term k="liability threshold">liability-threshold</Term> model: everyone carries a
            continuous risk load, and the disease appears once that load crosses a fixed
            threshold. Selection power grows with the number of embryos available; editing power
            depends on how concentrated a disease&apos;s risk is in a few editable loci. A large
            modeled genetic effect does not by itself make a locus a suitable editing target;{' '}
            <Term k="pleiotropy">pleiotropic</Term> effects may substantially weaken the clinical
            case.
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
            <span className="font-medium text-slate-700">Current capacity</span>: approximately
            five embryos available for selection and one modeled edit.{' '}
            <span className="font-medium text-slate-700">Future high capacity</span>:
            approximately 200 embryos and up to ten modeled edits, representing a hypothetical
            combination of much larger embryo sets and multiplex editing. This is a boundary
            scenario, not a prediction that these capabilities will arrive on a specified date.
          </p>
        </div>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">
            Why model the future before it is clinically ready?
          </h3>
          <p className="text-sm leading-relaxed text-slate-700">
            Decisions about research, governance, and investment are made before a technology
            reaches the clinic. Modeling the conditions under which polygenic editing begins to
            provide meaningful benefit helps identify which scientific advances would matter,
            which diseases might become relevant first, and where pleiotropy or distributed
            genetic architecture may remain limiting.
          </p>
        </section>

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
            Diseases near the top have more genetic risk concentrated in fewer loci; those
            toward the bottom distribute risk across many more variants. Each row compares the
            modeled effect of embryo selection with the modeled effect of editing.
          </p>
          <div className="mt-4 space-y-3">
            {mf.diseases.map((d) => (
              <DiseaseRow key={d.id} d={d} showKeys={showKeys} vThresh={vThresh} mThresh={mThresh} />
            ))}
          </div>
        </Card>

        {/* Required caveat */}
        <Card className="border-amber-300 bg-amber-50/60">
          <h3 className="text-sm font-semibold text-slate-900">
            What these estimates do — and do not — mean
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            These values describe modeled changes in relative risk for a couple already using
            IVF. They are not estimates of population-wide disease prevention. A large modeled
            effect also does not establish that an edit is safe, clinically useful, ethically
            justified, or free of harmful pleiotropic effects. The purpose is to map a possible
            future intervention frontier — not to declare these applications either clinically
            ready or permanently infeasible.
          </p>
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
      <h3 className="text-base font-semibold text-slate-900">
        How the frontier moves as technical capacity increases
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Greater technical capacity increases the modeled risk reduction for some diseases,
        especially where a larger share of genetic risk is concentrated in relatively few loci.
        For highly polygenic diseases, changing only a small number of loci continues to move
        overall risk much less. Counts are across the <strong>{n} diseases listed below</strong>;
        high-capacity members are named under each count.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FrontierStat
          label="Germline editing ≥30% modeled reduction"
          from={p.editing_viable}
          to={f.editing_viable}
          n={n}
          note="editing a few loci reaches a ≥30% modeled risk reduction"
          members={editNF}
        />
        <FrontierStat
          label="Embryo selection ≥30% modeled reduction"
          from={p.selection_viable}
          to={f.selection_viable}
          n={n}
          note="PRS-based embryo selection reaches a ≥30% modeled risk reduction"
          members={selNF}
        />
        <FrontierStat
          label="Embryo selection ≥10% modeled reduction"
          from={p.selection_viable_or_marginal}
          to={f.selection_viable_or_marginal}
          n={n}
          note="selection reaches at least a 10% modeled risk reduction"
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
        {from} <span className="text-sm font-normal text-slate-400">current-capacity</span> →{' '}
        {to}{' '}
        <span className="text-sm font-normal text-slate-400">future high capacity</span>
      </p>
      <p className="text-xs text-slate-500">
        of {n} diseases · {note}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-slate-600">
        <span className="text-slate-400">High-capacity: </span>
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
        Bands use thresholds of {fmtPct(vThresh, 0)} and {fmtPct(mThresh, 0)} modeled relative
        risk reduction
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
        </div>

        {/* Intervention tracks */}
        <div className="space-y-3">
          {showKeys.map((k) => {
            const sc = d.scenarios[k];
            return (
              <div key={k}>
                {showKeys.length > 1 && (
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {k === 'present' ? 'Current capacity' : 'Future high capacity'}
                  </p>
                )}
                <TrackBar
                  label="Embryo selection"
                  result={sc.selection}
                  scenario={sc}
                  kind="selection"
                  vThresh={vThresh}
                  mThresh={mThresh}
                />
                <TrackBar
                  label="Germline editing"
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
