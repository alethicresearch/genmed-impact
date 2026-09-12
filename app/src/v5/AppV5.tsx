import { useEffect, useState } from 'react';
import {
  AllData,
  Attribution,
  PndKey,
  SeverityDef,
  Stat,
  fmtCompact,
  fmtInt,
  fmtPct,
  loadAll,
} from '../data';
import { useUrlState, UrlState } from '../urlState';
import { UncertaintyProvider } from '../uncertaintyMode';
import { ViewNavProvider } from '../viewNav';
import Overview from '../views/Overview';
import Library from '../views/Library';
import Denominator from '../views/Denominator';
import Prevention from '../views/Prevention';
import Multifactorial from '../views/Multifactorial';
import Embryos from '../views/Embryos';
import EditingTech from '../views/EditingTech';
import Residual from '../views/Residual';
import Beyond from '../views/Beyond';
import EthicsPolicy from '../views/EthicsPolicy';
import Allocation from '../views/Allocation';
import ImpactFunding from '../views/ImpactFunding';
import Perspectives from '../views/Perspectives';
import Realized from '../views/Realized';
import Methods from '../views/Methods';

const REPO_URL = 'https://github.com/alethicresearch/genmed-impact';
const ALPHAGENOME_URL =
  'https://deepmind.google/blog/alphagenome-atlas-a-predictive-map-of-every-possible-dna-letter-change-in-the-human-genome/';


type DeepView = {
  id: string;
  label: string;
  short: string;
};

type DeepGroup = {
  label: string;
  views: DeepView[];
};

const GROUPS: DeepGroup[] = [
  {
    label: 'Orientation',
    views: [{ id: 'overview', label: 'Overview', short: 'Headline findings and argument' }],
  },
  {
    label: 'Disease burden',
    views: [
      { id: 'denominator', label: 'Burden estimate', short: 'Definitions, denominator and sensitivity' },
      { id: 'library', label: 'Disease catalogue', short: 'Conditions, interventions and source evidence' },
    ],
  },
  {
    label: 'Impact now',
    views: [
      { id: 'prevention', label: 'Existing medicine', short: 'Screening, selection, diagnosis and treatment' },
      { id: 'realized', label: 'Predicted vs realized', short: 'Back-check model expectations against programs' },
    ],
  },
  {
    label: 'Role of editing',
    views: [
      { id: 'residual', label: 'When selection is not enough', short: 'Editing-only prevention and residuals' },
      { id: 'embryos', label: 'Selection vs correction', short: 'Embryo-level reproductive burden' },
      { id: 'editing-tech', label: 'Which technology?', short: 'Variant classes and four editing gates' },
      { id: 'multifactorial', label: 'Polygenic frontier', short: 'Selection and editing under future capacity' },
    ],
  },
  {
    label: 'Ethics, policy and allocation',
    views: [
      { id: 'ethics', label: 'Policy implications', short: 'A proportional pathway for research and regulation' },
      { id: 'beyond', label: 'Resistance & enhancement', short: 'Different purposes, different justifications' },
      { id: 'allocation', label: 'Exploratory costs', short: 'Provisional cost and allocation scenarios' },
    ],
  },
  {
    label: 'Impact funding',
    views: [
      { id: 'funding', label: 'Funding opportunities', short: 'Where marginal resources could matter' },
      { id: 'perspectives', label: 'Whose values?', short: 'Multi-perspective valuation and disagreement' },
    ],
  },
  {
    label: 'Reproducibility',
    views: [{ id: 'methods', label: 'Methods & data', short: 'Assumptions, uncertainty, provenance and outputs' }],
  },
];

const ALL_VIEWS = GROUPS.flatMap((group) => group.views);
const VIEW_IDS = new Set(ALL_VIEWS.map((view) => view.id));

export default function AppV4() {
  const [data, setData] = useState<AllData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [curveIndex, setCurveIndex] = useState(2);
  const [state, update] = useUrlState({});

  useEffect(() => {
    document.title = 'Reframing Genetic Editing in Terms of Medical Impact — v5';
    loadAll()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const openView = state.open && VIEW_IDS.has(state.open) ? state.open : '';

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-700">Data load error</p>
        <p className="mt-3 text-slate-700">{error}</p>
      </div>
    );
  }

  if (!data) return <div className="py-24 text-center text-sm text-slate-500">Loading analysis…</div>;

  const severity =
    (state.severity as SeverityDef) || (data.meta.default_assumptions.severity as SeverityDef) || 'def_b';
  const attribution =
    (state.attribution as Attribution) ||
    (data.meta.default_assumptions.attribution as Attribution) ||
    'inclusive';
  const pndOn = state.pnd !== 'off';
  const includeContested = (state.deaf ?? '0') === '1';
  const pndKey: PndKey = pndOn ? 'pnd_on' : 'pnd_off';

  const burden = data.burden.grid[severity][attribution];
  const preventionGlobal = data.prevention.Global;
  const current = preventionGlobal?.current?.monogenic?.[pndKey];
  const expanded = preventionGlobal?.achievable_2035?.monogenic?.[pndKey];
  const ideal = preventionGlobal?.ideal?.monogenic?.[pndKey];
  const residual = data.residual.by_contested[includeContested ? 'with_contested' : 'without_contested'];
  const curve = data.embryos.curve;
  const point = curve[Math.min(curveIndex, Math.max(0, curve.length - 1))];

  const changed =
    Number(severity !== 'def_b') +
    Number(attribution !== 'inclusive') +
    Number(!pndOn) +
    Number(includeContested);

  const openInline = (id: string) => update({ open: id });
  const goToView = (id: string, extra?: UrlState) => update({ open: id, ...(extra ?? {}) });

  return (
    <UncertaintyProvider on={state.unc === '1'}>
      <ViewNavProvider go={goToView}>
      <div className="min-h-screen bg-white text-slate-950">
        <Hero
          burden={burden.total_serious}
          current={current?.total_averted_birth_fraction ?? null}
          ideal={ideal?.total_averted_birth_fraction ?? null}
          s1={residual.s1_total}
          onAssumptions={() => setAssumptionsOpen(true)}
          changed={changed}
        />

        <JourneyNav
          onAssumptions={() => setAssumptionsOpen(true)}
          changed={changed}
          uncertainty={state.unc === '1'}
          onUncertainty={(on) => update({ unc: on ? '1' : '' })}
        />

        <main>
          <BurdenSection
            data={data}
            burden={burden}
            severity={severity}
            attribution={attribution}
            onAssumptions={() => setAssumptionsOpen(true)}
            active={openView}
            onOpen={openInline}
            state={state}
            update={update}
          />
          <ImpactNowSection
            current={current?.total_averted_birth_fraction ?? null}
            expanded={expanded?.total_averted_birth_fraction ?? null}
            ideal={ideal?.total_averted_birth_fraction ?? null}
            currentBurden={current?.total_averted_burden_fraction ?? null}
            pndOn={pndOn}
            data={data}
            active={openView}
            onOpen={openInline}
            state={state}
            update={update}
          />
          <EditingFrontierSection
            data={data}
            residual={residual}
            includeContested={includeContested}
            active={openView}
            onOpen={openInline}
            state={state}
            update={update}
          />
          <SelectionSection
            data={data}
            point={point}
            curveIndex={curveIndex}
            setCurveIndex={setCurveIndex}
            active={openView}
            onOpen={openInline}
            state={state}
            update={update}
          />
          <FutureSection data={data} active={openView} onOpen={openInline} state={state} update={update} />
          <PolicySection data={data} active={openView} onOpen={openInline} state={state} update={update} />
          <MethodsSection data={data} active={openView} onOpen={openInline} state={state} update={update} />
        </main>

        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Analysis commit <span className="font-mono text-slate-700">{data.meta.commit}</span> · model{' '}
              {data.meta.spec_version} · {fmtInt(data.meta.n_draws)} Monte Carlo draws
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#methods" className="hover:text-blue-700">
                Methods &amp; data
              </a>
              <a className="hover:text-blue-700" href={`${REPO_URL}/tree/main/results`} target="_blank" rel="noreferrer">
                Results ↗
              </a>
              <a className="hover:text-blue-700" href={REPO_URL} target="_blank" rel="noreferrer">
                Repository ↗
              </a>
            </div>
          </div>
        </footer>

        <AssumptionsDrawer
          open={assumptionsOpen}
          severity={severity}
          attribution={attribution}
          pndOn={pndOn}
          includeContested={includeContested}
          changed={changed}
          update={update}
          onClose={() => setAssumptionsOpen(false)}
        />

      </div>
      </ViewNavProvider>
    </UncertaintyProvider>
  );
}

function Hero({
  burden,
  current,
  ideal,
  s1,
  onAssumptions,
  changed,
}: {
  burden: Stat;
  current: Stat | null;
  ideal: Stat | null;
  s1: Stat;
  onAssumptions: () => void;
  changed: number;
}) {
  return (
    <header className="border-b border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_72%)]">
      <div className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={onAssumptions}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:border-blue-400 hover:text-blue-700"
            >
              Assumptions{changed ? ` · ${changed} changed` : ''}
            </button>
          </div>
        </div>

        <div className="mt-12 max-w-4xl">
          <h1 className="text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[3.55rem] lg:leading-[1.03]">
            Reframing Genetic Editing in Terms of Medical Impact
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
            Most debate about genetic medicine is about editing embryos. This asks a plainer
            question: where would it actually help, and what already works without it?
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
          <Horizon
            kicker="Impact now"
            title="Most of what works is unused"
            body="Screening, embryo selection, prenatal diagnosis and newborn treatment already exist. The limit on them is access, not technology."
            anchor="impact-now"
          />
          <Horizon
            kicker="Translational frontier"
            title="A narrow case editing could reach"
            body="For a few thousand couples a year, every embryo would inherit the condition. Selection cannot help them. This is where editing has a claim."
            anchor="editing-frontier"
          />
          <Horizon
            kicker="Future impact"
            title="Common disease is a different problem"
            body="Risk is spread across thousands of variants, so no single edit moves it much. Whether that changes depends on three technologies improving together."
            anchor="future-impact"
          />
        </div>

        <div className="mt-10 grid gap-6 border-y border-slate-200 py-7 sm:grid-cols-3">
          <HeroStat
            value={fmtCompact(burden.median)}
            label="births a year with serious genetic disease"
            interval={formatInterval(burden, fmtCompact)}
          />
          <HeroStat
            value={current && ideal ? `${fmtPct(current.median, 1)} → ${fmtPct(ideal.median, 1)}` : '—'}
            label="of single-gene cases avoidable today, against what full access would reach"
          />
          <HeroStat
            value={fmtCompact(s1.median)}
            label="births a year where no unaffected embryo could be selected"
            interval={formatInterval(s1, fmtCompact)}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <a href="#burden" className="font-semibold text-blue-700 hover:text-blue-900">
            Start the story ↓
          </a>
        </div>
      </div>
    </header>
  );
}

/** The seven steps of the argument, in order. Shared by the nav and the end-of-section links. */
const STEPS: { id: string; label: string }[] = [
  { id: 'burden', label: 'How much disease' },
  { id: 'impact-now', label: 'What works now' },
  { id: 'editing-frontier', label: 'Where editing helps' },
  { id: 'selection-correction', label: "Selection's limits" },
  { id: 'future-impact', label: 'If tech improves' },
  { id: 'policy', label: 'What follows' },
  { id: 'methods', label: 'Methods' },
];

/** Tracks which section is currently in view, so the reader can see where they are. */
function useActiveStep(): string {
  const [active, setActive] = useState(STEPS[0].id);
  useEffect(() => {
    const seen = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => seen.set(entry.target.id, entry.intersectionRatio));
        let best = '';
        let bestRatio = 0;
        seen.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        });
        if (best && bestRatio > 0) setActive(best);
      },
      { rootMargin: '-72px 0px -45% 0px', threshold: [0, 0.15, 0.4, 0.75, 1] },
    );
    STEPS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

function JourneyNav({
  onAssumptions,
  changed,
  uncertainty,
  onUncertainty,
}: {
  onAssumptions: () => void;
  changed: number;
  uncertainty: boolean;
  onUncertainty: (on: boolean) => void;
}) {
  const active = useActiveStep();
  const activeIndex = Math.max(0, STEPS.findIndex((step) => step.id === active));
  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur no-print">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2.5">
        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto text-xs" aria-label="Sections">
          {STEPS.map((step) => {
            const isActive = step.id === active;
            return (
              <a
                key={step.id}
                href={`#${step.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 font-medium transition-colors ${
                  isActive ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {step.label}
              </a>
            );
          })}
        </nav>
        <div className="flex min-w-max items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={uncertainty}
              onChange={(e) => onUncertainty(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
            />
            Uncertainty
          </label>
          <button type="button" onClick={onAssumptions} className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
            Assumptions{changed ? ` (${changed})` : ''}
          </button>
        </div>
      </div>
      <div className="h-0.5 bg-slate-100">
        <div
          className="h-full bg-blue-700 transition-all duration-300"
          style={{ width: `${((activeIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

/** Points at the next step, so the argument has an obvious path through it. */
function NextStep({ from }: { from: string }) {
  const i = STEPS.findIndex((step) => step.id === from);
  const next = i >= 0 ? STEPS[i + 1] : undefined;
  if (!next) return null;
  return (
    <a
      href={`#${next.id}`}
      className="mt-10 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm hover:border-blue-300 hover:bg-blue-50/40"
    >
      <span className="text-slate-500">Next</span>
      <span className="font-semibold text-slate-900">{next.label} →</span>
    </a>
  );
}

function BurdenSection({
  data,
  burden,
  severity,
  attribution,
  onAssumptions,
  active,
  onOpen,
  state,
  update,
}: {
  data: AllData;
  burden: AllData['burden']['grid'][SeverityDef][Attribution];
  severity: SeverityDef;
  attribution: Attribution;
  onAssumptions: () => void;
  active: string;
  onOpen: (id: string) => void;
  state: UrlState;
  update: (patch: UrlState) => void;
}) {
  const totalBirths = data.summary.births_per_year;
  const monoShare = burden.monogenic.median / burden.total_serious.median;
  const multiShare = burden.multifactorial.median / burden.total_serious.median;

  return (
    <StorySection id="burden" number="01" eyebrow="Disease burden" title="How much serious genetic disease is there?">
      <p className="story-prose">
        About 8 million of the world's 135 million annual births involve serious disease with a genetic
        cause. Most of that is <strong>multifactorial</strong> — conditions like heart disease or diabetes,
        where genes are one cause among several. Around 1.4 million are <strong>single-gene</strong>{' '}
        disorders, where one faulty gene is the cause. Both numbers move depending on where you draw the
        line for &ldquo;serious&rdquo; and how much multifactorial disease you count as genetic. You can
        change either and watch the total move.
      </p>

      <div className="mt-9 space-y-5">
        <FlowRow label="Annual global births" value={fmtCompact(totalBirths.median)} sub={formatInterval(totalBirths, fmtCompact)} width={100} tone="slate" />
        <FlowRow
          label="Serious genetic disease"
          value={fmtCompact(burden.total_serious.median)}
          sub={`${fmtPct(burden.serious_share_of_births.median, 2)} of annual births · ${formatInterval(burden.total_serious, fmtCompact)}`}
          width={Math.max(7, burden.serious_share_of_births.median * 100)}
          tone="blue"
        />
      </div>

      <div className="mt-8">
        <div className="mb-2 flex items-end justify-between gap-4">
          <p className="text-sm font-semibold text-slate-900">What makes up that total</p>
          <button type="button" onClick={onAssumptions} className="text-xs font-medium text-blue-700 hover:text-blue-900">
            Change assumptions
          </button>
        </div>
        <div className="flex h-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <div className="flex items-center bg-blue-700 px-3 text-xs font-semibold text-white" style={{ width: `${monoShare * 100}%` }}>
            {monoShare > 0.12 ? 'Single-gene' : ''}
          </div>
          <div className="flex items-center justify-end bg-blue-100 px-3 text-xs font-semibold text-blue-950" style={{ width: `${multiShare * 100}%` }}>
            Multifactorial
          </div>
        </div>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <MiniResult label="Single-gene (monogenic)" value={fmtCompact(burden.monogenic.median)} detail={formatInterval(burden.monogenic, fmtCompact)} />
          <MiniResult label="Multifactorial (partly genetic)" value={fmtCompact(burden.multifactorial.median)} detail={formatInterval(burden.multifactorial, fmtCompact)} />
        </div>
      </div>

      <ReaderTools>
        <ToolNote title="Why this matters">Population scale sets the denominator against which the reach of existing medicine and editing-relevant scenarios are compared.</ToolNote>
        <ToolNote title="Current reader choices">Severity: {severityLabel(severity)}. Multifactorial attribution: {attributionLabel(attribution)}.</ToolNote>
        </ReaderTools>
      <InlineAnalysis
        views={[['denominator', 'Open burden model'], ['library', 'Browse disease catalogue']]}
        active={active}
        onOpen={onOpen}
        data={data}
        state={state}
        update={update}
      />
      <NextStep from="burden" />
    </StorySection>
  );
}

function ImpactNowSection({
  current,
  expanded,
  ideal,
  currentBurden,
  pndOn,
  data,
  active,
  onOpen,
  state,
  update,
}: {
  current: Stat | null;
  expanded: Stat | null;
  ideal: Stat | null;
  currentBurden: Stat | null;
  pndOn: boolean;
  data: AllData;
  active: string;
  onOpen: (id: string) => void;
  state: UrlState;
  update: (patch: UrlState) => void;
}) {
  const rows = [
    { label: 'Access as it is today', stat: current, note: 'what screening, selection and diagnosis actually reach now' },
    { label: 'If access expanded by 2035', stat: expanded, note: 'a plausible scale-up of existing programmes' },
    { label: 'If everyone had access', stat: ideal, note: 'the ceiling for these tools, with no access barrier at all' },
  ];
  return (
    <StorySection id="impact-now" number="02" eyebrow="Impact now" title="What can medicine already do about it?" tint>
      <p className="story-prose">
        Today&apos;s tools reach far further than they are actually used. On current access they avoid
        about a third of single-gene affected births; if everyone who could benefit had access, the same
        tools would reach almost all of them. The gap is delivery, not invention. Two different goods are
        counted separately throughout, because conflating them flatters the numbers:{' '}
        <strong>avoiding an affected birth</strong>, and <strong>reducing the burden</strong> of a disease
        someone already has.
      </p>
      <div className="mt-9 space-y-5">
        {rows.map((row) => <CoverageBar key={row.label} label={row.label} stat={row.stat} note={row.note} />)}
      </div>
      <div className="mt-8 border-l-2 border-blue-600 pl-5">
        <p className="text-sm font-semibold text-slate-900">The implementation gap is itself part of the impact question.</p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Under current modeled coverage, monogenic affected-birth avoidance is far below the model's idealized full-coverage potential. Scaling established genetic medicine therefore remains a major present-impact opportunity.
        </p>
        {currentBurden && <p className="mt-2 text-xs text-slate-500">Including modeled postnatal burden mitigation, current coverage reaches {fmtPct(currentBurden.median, 1)} of monogenic burden on this track.</p>}
      </div>
      <ReaderTools>
        <ToolNote title="Important distinction">Prenatal diagnosis is {pndOn ? 'included' : 'excluded'} in affected-birth avoidance. Newborn screening prevents no births; it supports earlier treatment.</ToolNote>
        <ToolNote title="What access changes">Current, expanded-access and idealized scenarios separate technical applicability from realized reach.</ToolNote>
        </ReaderTools>
      <InlineAnalysis
        views={[['prevention', 'Open existing-medicine model'], ['realized', 'Compare predicted vs realized impact']]}
        active={active}
        onOpen={onOpen}
        data={data}
        state={state}
        update={update}
      />
      <NextStep from="impact-now" />
    </StorySection>
  );
}

function EditingFrontierSection({
  data,
  residual,
  includeContested,
  active,
  onOpen,
  state,
  update,
}: {
  data: AllData;
  residual: AllData['residual']['by_contested']['with_contested'];
  includeContested: boolean;
  active: string;
  onOpen: (id: string) => void;
  state: UrlState;
  update: (patch: UrlState) => void;
}) {
  const strictShare = residual.uniquely_editable_share_of_serious.strict;
  const futureShare = residual.uniquely_editable_share_of_serious.permissive;
  return (
    <StorySection id="editing-frontier" number="03" eyebrow="Translational frontier" title="Where could editing do something selection cannot?">
      <p className="story-prose">
        For most couples at risk, embryo selection can find an unaffected embryo to transfer. For a small
        number it cannot — every embryo they could produce would inherit the condition. That is the one
        situation where editing offers something selection does not, and it is the figure below. Even
        there, three further things must be true before editing helps anyone, and only the first two can
        currently be given a number.
      </p>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Editing-only prevention</p>
          <p className="mt-2 text-5xl font-semibold tracking-tight text-slate-950">{fmtCompact(residual.s1_total.median)}</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">estimated births per year from reproductive configurations in which no unaffected embryo can be selected</p>
          <p className="mt-2 text-xs text-slate-400">95% UI {formatInterval(residual.s1_total, fmtCompact)}</p>
          <p className="mt-5 text-xs text-slate-500">Congenital deafness is {includeContested ? 'included' : 'excluded'} in this headline because its classification as a prevention target is ethically contested.</p>
        </div>
        <div className="border-t border-slate-200 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="text-sm font-semibold text-slate-900">Four gates separate need from clinical use</p>
          <ol className="mt-4 space-y-3">
            {data.editingTech.gates.map((gate, i) => (
              <li key={gate.key} className="grid grid-cols-[1.5rem_1fr_auto] items-start gap-3 text-sm">
                <span className="font-mono text-xs text-slate-400">{i + 1}</span>
                <div>
                  <p className="font-medium text-slate-900">{gate.label}</p>
                  {<p className="mt-1 text-xs leading-5 text-slate-500">{gate.detail}</p>}
                </div>
                <GateStatus status={gate.status} />
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
        <ResidualCard title="Current-evidence scenario" total={residual.uniquely_editable_total.strict} share={strictShare} note="Present comparative scale; complex-disease contribution is highly uncertain." />
        <ResidualCard title="Future-capacity exploratory scenario" total={residual.uniquely_editable_total.permissive} share={futureShare} note="Boundary analysis in which a larger complex-disease role is assumed." />
      </div>
      <ReaderTools>
        <ToolNote title="How to read the complement">“Not uniquely dependent on germline editing” does not mean “preventable by existing medicine.” Existing pathways prevent, detect, treat or mitigate different outcomes.</ToolNote>
        <ToolNote title="Independent gates">Selection failure establishes need for a different reproductive route; it does not establish molecular tractability, embryo performance or safety.</ToolNote>
        </ReaderTools>
      <InlineAnalysis
        views={[['residual', 'Open editing residual'], ['editing-tech', 'Inspect editing technology gates']]}
        active={active}
        onOpen={onOpen}
        data={data}
        state={state}
        update={update}
      />
      <NextStep from="editing-frontier" />
    </StorySection>
  );
}

function SelectionSection({
  data,
  point,
  curveIndex,
  setCurveIndex,
  active,
  onOpen,
  state,
  update,
}: {
  data: AllData;
  point: AllData['embryos']['curve'][number];
  curveIndex: number;
  setCurveIndex: (i: number) => void;
  active: string;
  onOpen: (id: string) => void;
  state: UrlState;
  update: (patch: UrlState) => void;
}) {
  return (
    <StorySection id="selection-correction" number="04" eyebrow="Reproductive burden" title="Selection gets hard before it gets impossible." tint>
      <p className="story-prose">
        Embryo selection picks from what a couple already has; it does not change anything. So when
        unaffected embryos are rare, a couple may need many embryos, or repeated IVF cycles, to find one.
        Move the slider below: as unaffected embryos get rarer, the number of affected embryos passed over
        for each unaffected one climbs steeply — long before it becomes impossible. That is a real cost,
        and a different argument from &ldquo;selection cannot work at all&rdquo;.
      </p>
      <div className="mt-9 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Interactive selection burden</p>
            <p className="mt-2 text-sm text-slate-600">Move through the precomputed values of the unaffected-embryo fraction, <em>u</em>.</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold tracking-tight text-slate-950">u = {point.u.toFixed(2)}</p>
            <p className="text-xs text-slate-500">{Math.round(point.u * 100)}% unaffected embryos</p>
          </div>
        </div>
        <input aria-label="Unaffected embryo fraction" className="mt-8 w-full accent-blue-700" type="range" min={0} max={Math.max(0, data.embryos.curve.length - 1)} step={1} value={curveIndex} onChange={(e) => setCurveIndex(Number(e.target.value))} />
        <div className="mt-1 flex justify-between text-[11px] text-slate-400"><span>Unaffected embryos common</span><span>Unaffected embryos rare</span></div>
        <div className="mt-8 grid gap-6 border-t border-slate-200 pt-7 sm:grid-cols-3">
          <InteractiveMetric value={formatDecimal(point.selection_affected_discarded)} label="affected-genotype embryos not selected per unaffected embryo" />
          <InteractiveMetric value={formatDecimal(point.selection_blastocysts)} label="illustrative blastocysts per live birth under selection" />
          <InteractiveMetric value="0" label="genotype-based exclusions under idealized successful correction" />
        </div>
        <p className="mt-6 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">At <em>u</em> → 0, selection becomes impossible. The primary relationship is (1−u)/u. The blastocyst comparison additionally assumes a 45% live-birth rate per transfer and is illustrative.</p>
      </div>
      <ReaderTools>
        <ToolNote title="What is being counted">“Not selected for transfer” is not synonymous with “destroyed.” Actual embryo disposition is not modeled.</ToolNote>
        <ToolNote title="What correction does not solve">The idealized correction comparison does not model editing failure, mosaicism, unintended changes, developmental attrition or safety-related loss.</ToolNote>
        </ReaderTools>
      <InlineAnalysis
        views={[['embryos', 'Open full selection-versus-correction analysis']]}
        active={active}
        onOpen={onOpen}
        data={data}
        state={state}
        update={update}
      />
      <NextStep from="selection-correction" />
    </StorySection>
  );
}

function FutureSection({ data, active, onOpen, state, update }: { data: AllData; active: string; onOpen: (id: string) => void; state: UrlState; update: (patch: UrlState) => void }) {
  const present = data.multifactorial.frontier.present;
  const future = data.multifactorial.frontier.near_future;
  const n = data.multifactorial.n_diseases;
  return (
    <StorySection id="future-impact" number="05" eyebrow="Future impact" title="What if the technology gets much better?">
      <p className="story-prose">
        Common diseases are a different problem entirely. Their risk is spread across thousands of
        variants, so changing any one of them barely moves anything. Whether editing ever becomes relevant
        here depends on three things improving at once: knowing which variants actually cause disease,
        having enough embryos to choose between, and being able to change many sites at a time. The
        scenarios below are what-ifs, not forecasts.
      </p>
      <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
        <FrontierAxis number="1" title="Causal knowledge" body="Which variants are causal, directionally beneficial and sufficiently free of adverse pleiotropic effects?" />
        <FrontierAxis number="2" title="Embryos available" body="Larger embryo sets can increase the power of selection without changing a genome directly." />
        <FrontierAxis number="3" title="Editable loci" body="Multiplex editing changes a different constraint: how many variants can be altered directly." />
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Modeled frontier</p>
          <div className="mt-4 space-y-6">
            <FrontierCount label="Current-capacity scenario" editing={`${present.editing_viable} / ${n}`} selection={`${present.selection_viable_or_marginal} / ${n}`} />
            <FrontierCount label="Future high-capacity scenario" editing={`${future.editing_viable} / ${n}`} selection={`${future.selection_viable_or_marginal} / ${n}`} />
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">These are model-threshold results, not clinical-readiness claims.</p>
        </div>
        <div className="border-t border-slate-200 pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">The interpretation frontier is moving too.</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">Sequence-to-function resources such as AlphaGenome Atlas can improve variant prioritization and functional interpretation. That can extend diagnosis, screening and PGT-M without itself establishing that a variant can be corrected in an embryo or that correction is safe.</p>
          <a href={ALPHAGENOME_URL} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-semibold text-blue-700 hover:text-blue-900">AlphaGenome Atlas context ↗</a>
        </div>
      </div>
      <ReaderTools>
        <ToolNote title="How to read the high-capacity scenario">It is a boundary analysis of improved technical capability, not a forecast that 200 embryos or ten reliable germline edits will become clinically available.</ToolNote>
        <ToolNote title="Interpretation is not intervention">Better causal inference can improve target identification while correction, embryo performance and safety remain separate constraints.</ToolNote>
        </ReaderTools>
      <InlineAnalysis
        views={[['multifactorial', 'Open polygenic frontier'], ['editing-tech', 'Inspect editing technologies']]}
        active={active}
        onOpen={onOpen}
        data={data}
        state={state}
        update={update}
      />
      <NextStep from="future-impact" />
    </StorySection>
  );
}

function PolicySection({ data, active, onOpen, state, update }: { data: AllData; active: string; onOpen: (id: string) => void; state: UrlState; update: (patch: UrlState) => void }) {
  return (
    <StorySection id="policy" number="06" eyebrow="Ethics & policy" title="So what should follow?" tint>
      <p className="story-prose">
        The numbers settle nothing on their own, but they do sort the questions into different kinds.
        Scaling what already works is a question about money and delivery. Editing for the couples
        selection cannot help is a question about safety and evidence. Common-disease editing is a question
        about a technology that does not yet exist. Treating all three as one debate is what makes the
        argument go wrong.
      </p>
      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        <PolicyStep n="1" title="Scale present impact" body="Expand access to established screening, reproductive, diagnostic and therapeutic pathways that can improve outcomes now." />
        <PolicyStep n="2" title="Develop the justified frontier" body="Create a transparent, tightly governed research pathway for severe indications in which germline editing has strong incremental medical value." />
        <PolicyStep n="3" title="Prepare for future impact" body="Study causal genomics, polygenic intervention, embryo technologies, pleiotropy and governance before capability outruns institutions." />
      </div>
      <div className="mt-12 grid gap-7 border-t border-slate-200 pt-8 md:grid-cols-2">
        <Principle title="Selection-First" body="When embryo selection can achieve the same medically important outcome with substantially lower risk and acceptable reproductive burden, editing should have to demonstrate why it is preferable." />
        <Principle title="Somatic-First" body="When treatment of the future person can provide comparable benefit without making a heritable change, germline intervention should require additional justification." />
      </div>
      <ReaderTools>
        <ToolNote title="Pathways are not morally interchangeable">Carrier screening, PGT-M, prenatal diagnosis, newborn screening, somatic treatment and germline correction can reach outcomes through different reproductive and clinical pathways.</ToolNote>
        <ToolNote title="Two forms of arbitrage">Regulatory arbitrage moves work toward looser oversight. Ethical arbitrage borrows the urgency of a strongly justified use to support a weaker application.</ToolNote>
        </ReaderTools>
      <InlineAnalysis
        views={[['ethics', 'Open ethics & policy'], ['beyond', 'Open resistance & enhancement'], ['allocation', 'Open exploratory costs']]}
        active={active}
        onOpen={onOpen}
        data={data}
        state={state}
        update={update}
      />
      <NextStep from="policy" />
    </StorySection>
  );
}

function MethodsSection({
  data,
  active,
  onOpen,
  state,
  update,
}: {
  data: AllData;
  active: string;
  onOpen: (id: string) => void;
  state: UrlState;
  update: (patch: UrlState) => void;
}) {
  const views = ALL_VIEWS.filter((view) => view.id !== 'overview').map(
    (view) => [view.id, view.label] as [string, string],
  );
  return (
    <StorySection id="methods" number="07" eyebrow="Methods & evidence" title="Where these numbers come from.">
      <p className="story-prose">
        Every figure above is a middle estimate with a range around it, because most of the inputs are
        themselves uncertain. Tick <strong>Show uncertainty</strong> at the top of the page to see the
        ranges everywhere. Nothing is calculated in your browser: the page reads fixed, versioned results
        produced by a pipeline you can run yourself.
      </p>
      <div className="mt-9 grid gap-5 sm:grid-cols-3">
        <EvidenceStat label="Monte Carlo draws" value={fmtInt(data.meta.n_draws)} />
        <EvidenceStat label="Curated core diseases" value={fmtInt(data.library.rollup.tiers.core.n_diseases)} />
        <EvidenceStat label="Analysis commit" value={data.meta.commit.slice(0, 8)} mono />
      </div>
      <div className="mt-10 border-t border-slate-200 pt-6 text-xs leading-5 text-slate-500">
        Uncertainty intervals are propagated model uncertainty, not confidence intervals in the
        statistical-estimation sense. The curated disease catalogue is a lower bound rather than the
        denominator itself. Current-evidence and future-capacity editing scenarios are separate
        scenarios, not ends of one interval.
      </div>
      <InlineAnalysis
        views={views}
        active={active}
        onOpen={onOpen}
        data={data}
        state={state}
        update={update}
      />
      <NextStep from="methods" />
    </StorySection>
  );
}

function AnalysisView({ id, data, state, update }: { id: string; data: AllData; state: UrlState; update: (patch: UrlState) => void }) {
  if (id === 'overview') return <Overview data={data} state={state} update={update} />;
  if (id === 'denominator') return <Denominator data={data} state={state} update={update} />;
  if (id === 'library') return <Library data={data} state={state} update={update} />;
  if (id === 'prevention') return <Prevention data={data} state={state} update={update} />;
  if (id === 'realized') return <Realized data={data} state={state} update={update} />;
  if (id === 'residual') return <Residual data={data} state={state} update={update} />;
  if (id === 'embryos') return <Embryos data={data} state={state} update={update} />;
  if (id === 'editing-tech') return <EditingTech data={data} state={state} update={update} />;
  if (id === 'multifactorial') return <Multifactorial data={data} state={state} update={update} />;
  if (id === 'ethics') return <EthicsPolicy data={data} state={state} update={update} />;
  if (id === 'beyond') return <Beyond data={data} state={state} update={update} />;
  if (id === 'allocation') return <Allocation data={data} />;
  if (id === 'funding') return <ImpactFunding data={data} state={state} update={update} />;
  if (id === 'perspectives') return <Perspectives data={data} state={state} update={update} />;
  if (id === 'methods') return <Methods data={data} state={state} update={update} />;
  // Unknown ids are a bug, not a view: rendering a fallback would hide a broken link.
  return null;
}

function AssumptionsDrawer({
  open,
  severity,
  attribution,
  pndOn,
  includeContested,
  changed,
  update,
  onClose,
}: {
  open: boolean;
  severity: SeverityDef;
  attribution: Attribution;
  pndOn: boolean;
  includeContested: boolean;
  changed: number;
  update: (patch: UrlState) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Analysis assumptions">
      <button className="absolute inset-0 bg-slate-950/25" aria-label="Close assumptions" onClick={onClose} />
      <aside className="relative z-10 h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Reader controls</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Assumptions</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Change contestable choices and see the relevant figures respond. The same state carries into every deep analysis.</p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-800" aria-label="Close">×</button>
        </div>
        <div className="mt-8 space-y-8">
          <ControlGroup label="What counts as serious disease?">
            <Segmented value={severity} options={[[ 'def_a', 'Narrow' ], [ 'def_b', 'Main' ], [ 'def_c', 'Broad' ]]} onChange={(value) => update({ severity: value })} />
          </ControlGroup>
          <ControlGroup label="How much multifactorial disease is attributed to genetics?">
            <Segmented value={attribution} options={[[ 'inclusive', 'Inclusive' ], [ 'heritability_weighted', 'Heritability-weighted' ], [ 'exclusive', 'Narrow' ]]} onChange={(value) => update({ attribution: value })} />
          </ControlGroup>
          <ControlGroup label="Affected-birth avoidance track">
            <ToggleLine checked={pndOn} onChange={(checked) => update({ pnd: checked ? '' : 'off' })} title="Count prenatal diagnosis" detail="Counts affected-birth reduction only when followed by a reproductive decision not to continue an affected pregnancy." />
          </ControlGroup>
          <ControlGroup label="Editing-only prevention headline">
            <ToggleLine checked={includeContested} onChange={(checked) => update({ deaf: checked ? '1' : '' })} title="Include congenital deafness" detail="Shown separately because classifying congenital deafness as a disease-prevention target is ethically contested." />
          </ControlGroup>
        </div>
        <div className="mt-10 border-t border-slate-200 pt-5">
          <button type="button" onClick={() => update({ severity: 'def_b', attribution: 'inclusive', pnd: '', deaf: '' })} disabled={changed === 0} className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 enabled:hover:border-blue-400 enabled:hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
            Reset to paper defaults{changed ? ` (${changed} changed)` : ''}
          </button>
        </div>
      </aside>
    </div>
  );
}

function StorySection({ id, number, eyebrow, title, tint = false, children }: { id: string; number: string; eyebrow: string; title: string; tint?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-20 border-b border-slate-200 ${tint ? 'bg-slate-50/70' : 'bg-white'}`}>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="grid gap-5 lg:grid-cols-[8rem_1fr]">
          <div className="flex items-center gap-3 self-start pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 lg:block"><span className="font-mono">{number}</span><span className="lg:mt-2 lg:block">{eyebrow}</span></div>
          <div><h2 className="max-w-4xl text-3xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-4xl sm:leading-tight">{title}</h2><div className="mt-6">{children}</div></div>
        </div>
      </div>
    </section>
  );
}

function ReaderTools({ children }: { children: React.ReactNode }) {
  return (
    <details className="group mt-10 border-t border-slate-200 pt-5">
      <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 hover:text-blue-700">
        <span className="group-open:hidden">Why this matters · how it is estimated +</span>
        <span className="hidden group-open:inline">Hide supporting detail −</span>
      </summary>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </details>
  );
}

/**
 * Opens a full analysis view **in place**, directly under the section that raised the question.
 * The reader never leaves the argument, so there is no separate place the analysis lives.
 */
function InlineAnalysis({
  views,
  active,
  onOpen,
  data,
  state,
  update,
}: {
  views: [string, string][];
  active: string;
  onOpen: (id: string) => void;
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}) {
  const open = views.find(([id]) => id === active);
  return (
    <div className="mt-8 border-t border-slate-200 pt-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Go deeper
        </span>
        {views.map(([id, label]) => {
          const isOpen = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onOpen(isOpen ? '' : id)}
              aria-expanded={isOpen}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                isOpen
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700'
              }`}
            >
              {label}
              {isOpen ? ' −' : ' +'}
            </button>
          );
        })}
      </div>
      {open && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-6">
          <AnalysisView id={open[0]} data={data} state={state} update={update} />
          <button
            type="button"
            onClick={() => onOpen('')}
            className="mt-6 text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            Close {open[1].toLowerCase()} −
          </button>
        </div>
      )}
    </div>
  );
}

function ToolNote({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="border-l border-slate-300 pl-4 text-xs leading-5 text-slate-600"><p className="font-semibold text-slate-900">{title}</p><p className="mt-1">{children}</p></div>;
}

function Horizon({ kicker, title, body, anchor }: { kicker: string; title: string; body: string; anchor: string }) {
  return <a href={`#${anchor}`} className="group bg-white p-5 transition-colors hover:bg-blue-50/40 sm:p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-700">{kicker}</p><p className="mt-2 text-base font-semibold text-slate-950 group-hover:text-blue-800">{title}</p><p className="mt-2 text-xs leading-5 text-slate-500">{body}</p></a>;
}

function HeroStat({ value, label, interval }: { value: string; label: string; interval?: string }) {
  return <div><p className="tnum text-2xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">{label}</p>{interval && <p className="mt-1 text-[11px] text-slate-400">95% UI {interval}</p>}</div>;
}

function FlowRow({ label, value, sub, width, tone }: { label: string; value: string; sub: string; width: number; tone: 'slate' | 'blue' }) {
  return <div><div className="mb-2 flex items-end justify-between gap-4"><p className="text-sm font-medium text-slate-700">{label}</p><p className="tnum text-lg font-semibold text-slate-950">{value}</p></div><div className="h-3 rounded-full bg-slate-100"><div className={`h-3 min-w-[0.4rem] rounded-full ${tone === 'blue' ? 'bg-blue-700' : 'bg-slate-800'}`} style={{ width: `${Math.min(100, Math.max(0.8, width))}%` }} /></div><p className="mt-1.5 text-[11px] text-slate-400">{sub}</p></div>;
}

function MiniResult({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="flex items-baseline justify-between gap-4 border-t border-slate-200 pt-3"><span className="text-slate-600">{label}</span><span className="text-right"><strong className="tnum font-semibold text-slate-950">{value}</strong><span className="mt-0.5 block text-[11px] text-slate-400">{detail}</span></span></div>;
}

function CoverageBar({ label, stat, note }: { label: string; stat: Stat | null; note: string }) {
  const pct = stat?.median ?? 0;
  return <div className="grid gap-2 sm:grid-cols-[12rem_1fr_4.5rem] sm:items-center"><div><p className="text-sm font-medium text-slate-800">{label}</p><p className="text-[11px] text-slate-400">{note}</p></div><div className="h-8 overflow-hidden rounded-md bg-white ring-1 ring-inset ring-slate-200"><div className="h-full bg-blue-700" style={{ width: `${Math.min(100, pct * 100)}%` }} /></div><div className="sm:text-right"><p className="tnum text-lg font-semibold text-slate-950">{stat ? fmtPct(stat.median, 1) : '—'}</p>{stat && <p className="text-[10px] text-slate-400">{formatInterval(stat, (n) => fmtPct(n, 0))}</p>}</div></div>;
}

function GateStatus({ status }: { status: 'quantified' | 'not_established' | 'unquantified' }) {
  const text = status === 'quantified' ? 'quantified' : status === 'not_established' ? 'not established' : 'unquantified';
  const cls = status === 'quantified' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500';
  return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${cls}`}>{text}</span>;
}

function ResidualCard({ title, total, share, note }: { title: string; total: Stat; share: Stat; note: string }) {
  return <div className="bg-white p-6"><p className="text-xs font-semibold text-slate-600">{title}</p><div className="mt-4 flex items-end justify-between gap-4"><div><p className="tnum text-4xl font-semibold tracking-tight text-slate-950">{fmtPct(share.median, 2)}</p><p className="mt-1 text-xs text-slate-500">of serious genetic-disease burden</p></div><p className="tnum text-sm font-medium text-slate-700">{fmtCompact(total.median)}/yr</p></div><div className="mt-5 h-2 rounded-full bg-slate-100"><div className="h-2 min-w-[3px] rounded-full bg-blue-700" style={{ width: `${Math.max(0.3, share.median * 100)}%` }} /></div><p className="mt-3 text-[11px] leading-5 text-slate-500">{fmtPct(1 - share.median, 2)} not uniquely dependent on germline editing in this scenario. {note}</p></div>;
}

function InteractiveMetric({ value, label }: { value: string; label: string }) {
  return <div><p className="tnum text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{label}</p></div>;
}

function FrontierAxis({ number, title, body }: { number: string; title: string; body: string }) {
  return <div className="bg-white p-5 sm:p-6"><p className="font-mono text-xs text-blue-700">{number}</p><p className="mt-3 text-base font-semibold text-slate-950">{title}</p><p className="mt-2 text-xs leading-5 text-slate-500">{body}</p></div>;
}

function FrontierCount({ label, editing, selection }: { label: string; editing: string; selection: string }) {
  return <div><p className="text-xs font-semibold text-slate-600">{label}</p><div className="mt-2 grid grid-cols-2 gap-3"><div className="border-t-2 border-blue-700 pt-2"><p className="tnum text-2xl font-semibold text-slate-950">{editing}</p><p className="text-[11px] text-slate-500">editing meets model viability threshold</p></div><div className="border-t-2 border-slate-400 pt-2"><p className="tnum text-2xl font-semibold text-slate-950">{selection}</p><p className="text-[11px] text-slate-500">selection viable or marginal</p></div></div></div>;
}

function PolicyStep({ n, title, body }: { n: string; title: string; body: string }) {
  return <div><div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 font-mono text-xs text-white">{n}</div><h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></div>;
}

function Principle({ title, body }: { title: string; body: string }) {
  return <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">{title}</p><p className="mt-2 text-sm leading-6 text-slate-700">{body}</p></div>;
}

function EvidenceStat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="border-t border-slate-300 pt-3"><p className={`${mono ? 'font-mono' : 'tnum'} text-xl font-semibold text-slate-950`}>{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>;
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <fieldset><legend className="mb-3 text-sm font-semibold text-slate-900">{label}</legend>{children}</fieldset>;
}

function Segmented({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <div className="grid gap-1 rounded-lg bg-slate-100 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>{options.map(([key, label]) => <button key={key} type="button" onClick={() => onChange(key)} className={`rounded-md px-2 py-2 text-[11px] font-semibold leading-4 ${value === key ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>)}</div>;
}

function ToggleLine({ checked, onChange, title, detail }: { checked: boolean; onChange: (checked: boolean) => void; title: string; detail: string }) {
  return <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-blue-700" /><span><span className="block text-sm font-medium text-slate-800">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span></span></label>;
}

function formatInterval(stat: Stat, formatter: (n: number) => string): string {
  return `${formatter(stat.ci95[0])}–${formatter(stat.ci95[1])}`;
}

function formatDecimal(n: number): string {
  if (n >= 10) return n.toFixed(0);
  if (n >= 1) return n.toFixed(1).replace(/\.0$/, '');
  return n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function severityLabel(value: SeverityDef): string {
  return value === 'def_a' ? 'Narrow' : value === 'def_b' ? 'Main (paper default)' : 'Broad';
}

function attributionLabel(value: Attribution): string {
  if (value === 'inclusive') return 'Inclusive (paper default)';
  if (value === 'heritability_weighted') return 'Heritability-weighted';
  return 'Narrow / high-penetrance attribution';
}
