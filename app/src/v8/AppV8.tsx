import { useEffect, useRef, useState } from 'react';
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

type Mode = 'story' | 'explore';

type Assumptions = {
  severity: SeverityDef;
  attribution: Attribution;
  pndCounts: boolean;
  includeContested: boolean;
};

const DEFAULTS: Assumptions = {
  severity: 'def_b',
  attribution: 'inclusive',
  pndCounts: true,
  includeContested: false,
};

const REPO_URL = 'https://github.com/alethicresearch/genmed-impact';
const ALPHAGENOME_URL =
  'https://deepmind.google/blog/alphagenome-atlas-a-predictive-map-of-every-possible-dna-letter-change-in-the-human-genome/';

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

/** Human names for the embedded analyses, used on the panel triggers. */
const VIEW_TITLES: Record<string, string> = {
  overview: 'Overview of the argument',
  denominator: 'The burden model',
  library: 'The disease catalogue',
  prevention: 'What existing medicine achieves',
  realized: 'Predicted against realised impact',
  residual: 'Where selection is not enough',
  embryos: 'Selection versus correction',
  'editing-tech': 'Editing technology and variant classes',
  multifactorial: 'The polygenic frontier',
  ethics: 'Ethics and policy',
  beyond: 'Resistance and enhancement',
  allocation: 'Exploratory costs',
  funding: 'Funding opportunities',
  perspectives: 'Whose values?',
  methods: 'Methods, data and provenance',
};

function AnalysisView({ id, data, state, update }: { id: string; data: AllData; state: UrlState; update: (p: UrlState) => void }) {
  const common = { data, state, update };
  if (id === 'overview') return <Overview {...common} />;
  if (id === 'denominator') return <Denominator {...common} />;
  if (id === 'library') return <Library {...common} />;
  if (id === 'prevention') return <Prevention {...common} />;
  if (id === 'realized') return <Realized {...common} />;
  if (id === 'residual') return <Residual {...common} />;
  if (id === 'embryos') return <Embryos {...common} />;
  if (id === 'editing-tech') return <EditingTech {...common} />;
  if (id === 'multifactorial') return <Multifactorial {...common} />;
  if (id === 'ethics') return <EthicsPolicy {...common} />;
  if (id === 'beyond') return <Beyond {...common} />;
  if (id === 'allocation') return <Allocation data={data} />;
  if (id === 'funding') return <ImpactFunding {...common} />;
  if (id === 'perspectives') return <Perspectives {...common} />;
  if (id === 'methods') return <Methods {...common} />;
  return null;
}

export default function AppV8() {
  const [data, setData] = useState<AllData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('story');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULTS);
  const [curveIndex, setCurveIndex] = useState(2);
  const [state, update] = useUrlState({});
  const panel = state.panel && VIEW_TITLES[state.panel] ? state.panel : '';
  const onPanel = (view: string) => update({ panel: view });

  useEffect(() => {
    document.title = 'Reframing Genetic Editing in Terms of Medical Impact — v8';
    loadAll()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-700">Data load error</p>
        <p className="mt-3 text-slate-700">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="py-24 text-center text-sm text-slate-500">Loading analysis…</div>;
  }

  const burden = data.burden.grid[assumptions.severity][assumptions.attribution];
  const pndKey: PndKey = assumptions.pndCounts ? 'pnd_on' : 'pnd_off';
  const preventionGlobal = data.prevention.Global;
  const currentPrevention = preventionGlobal?.current?.monogenic?.[pndKey];
  const expandedPrevention = preventionGlobal?.achievable_2035?.monogenic?.[pndKey];
  const idealPrevention = preventionGlobal?.ideal?.monogenic?.[pndKey];

  const residualKey = assumptions.includeContested ? 'with_contested' : 'without_contested';
  const residual = data.residual.by_contested[residualKey];
  const strictShare = residual.uniquely_editable_share_of_serious.strict;
  const futureShare = residual.uniquely_editable_share_of_serious.permissive;
  const strictTotal = residual.uniquely_editable_total.strict;
  const futureTotal = residual.uniquely_editable_total.permissive;

  const curve = data.embryos.curve;
  const point = curve[Math.min(curveIndex, Math.max(0, curve.length - 1))];

  const changed = countChanged(assumptions);

  return (
    <UncertaintyProvider on={state.unc === '1'}>
    <ViewNavProvider go={(id, extra) => update({ panel: id, ...(extra ?? {}) })}>
    <div className="min-h-screen bg-white text-slate-950">
      <Hero
        burden={burden.total_serious}
        currentPrevention={currentPrevention?.total_averted_birth_fraction ?? null}
        idealPrevention={idealPrevention?.total_averted_birth_fraction ?? null}
        s1={residual.s1_total}
        mode={mode}
        onMode={setMode}
        onAssumptions={() => setDrawerOpen(true)}
        changed={changed}
      />

      <JourneyNav onAssumptions={() => setDrawerOpen(true)} changed={changed} />

      <main>
        <BurdenSection
          data={data}
          burden={burden}
          assumptions={assumptions}
          mode={mode}
          onAssumptions={() => setDrawerOpen(true)}
          panel={panel}
        onPanel={onPanel}
        state={state}
        update={update}
        />

        <ExistingMedicineSection
          analysisData={data}
          current={currentPrevention?.total_averted_birth_fraction ?? null}
          expanded={expandedPrevention?.total_averted_birth_fraction ?? null}
          ideal={idealPrevention?.total_averted_birth_fraction ?? null}
          currentBurden={currentPrevention?.total_averted_burden_fraction ?? null}
          assumptions={assumptions}
          mode={mode}
          panel={panel}
        onPanel={onPanel}
        state={state}
        update={update}
        />

        <EditingFrontierSection
          data={data}
          s1={residual.s1_total}
          strictShare={strictShare}
          futureShare={futureShare}
          strictTotal={strictTotal}
          futureTotal={futureTotal}
          assumptions={assumptions}
          mode={mode}
          panel={panel}
        onPanel={onPanel}
        state={state}
        update={update}
        />

        <SelectionSection
          data={data}
          point={point}
          curveIndex={curveIndex}
          setCurveIndex={setCurveIndex}
          mode={mode}
          panel={panel}
        onPanel={onPanel}
        state={state}
        update={update}
        />

        <FutureSection data={data} mode={mode} panel={panel} onPanel={onPanel} state={state} update={update} />
        <PolicySection
          analysisData={data}
          mode={mode}
          panel={panel}
          onPanel={onPanel}
          state={state}
          update={update}
        />
        <MethodsSection data={data} assumptions={assumptions} panel={panel} onPanel={onPanel} state={state} update={update} />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Analysis commit <span className="font-mono text-slate-700">{data.meta.commit}</span> · model{' '}
            {data.meta.spec_version} · {fmtInt(data.meta.n_draws)} Monte Carlo draws
          </p>
          <div className="flex gap-4">
            <a className="hover:text-blue-700" href={REPO_URL} target="_blank" rel="noreferrer">
              Repository ↗
            </a>
            <a className="hover:text-blue-700" href="#methods">
              Methods &amp; data
            </a>
          </div>
        </div>
      </footer>

      <AssumptionsDrawer
        open={drawerOpen}
        assumptions={assumptions}
        setAssumptions={setAssumptions}
        onClose={() => setDrawerOpen(false)}
        changed={changed}
      />
    </div>
    </ViewNavProvider>
    </UncertaintyProvider>
  );
}

/**
 * An analysis embedded in the story rather than linked away from it.
 *
 * The trigger reads as a considered invitation, not a footnote: it is the full width of the
 * column, states what will open, and swaps to a close control once open. The panel itself is a
 * distinct surface with its own rule and label, so the dense research view inside is visibly a
 * different register from the narrative around it — and the reader can always see where it ends.
 */
function AnalysisPanel({
  view,
  open,
  onToggle,
  data,
  state,
  update,
  invitation,
}: {
  view: string;
  open: boolean;
  onToggle: () => void;
  data: AllData;
  state: UrlState;
  update: (p: UrlState) => void;
  /** What the reader gets by opening it, in their terms. */
  invitation: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const title = VIEW_TITLES[view] ?? view;

  useEffect(() => {
    if (open && ref.current) {
      // Bring the panel's top edge to the reader rather than leaving them mid-narrative.
      const y = ref.current.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [open]);

  return (
    <div ref={ref} className="mt-10 scroll-mt-20">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-4 rounded-xl border px-5 py-4 text-left transition-colors ${
          open
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/40'
        }`}
      >
        <span>
          <span
            className={`block text-[11px] font-semibold uppercase tracking-[0.15em] ${
              open ? 'text-slate-400' : 'text-blue-700'
            }`}
          >
            {open ? 'Showing the full analysis' : 'The full analysis'}
          </span>
          <span className={`mt-1 block text-base font-semibold ${open ? 'text-white' : 'text-slate-900'}`}>
            {title}
          </span>
          {!open && <span className="mt-1 block text-xs leading-5 text-slate-500">{invitation}</span>}
        </span>
        <span
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            open ? 'border-slate-600 text-slate-200' : 'border-slate-300 text-slate-600'
          }`}
        >
          {open ? 'Close ×' : 'Open +'}
        </span>
      </button>

      {open && (
        <div className="rounded-b-xl border border-t-0 border-slate-900/15 bg-slate-50/70 px-4 pb-5 pt-6 sm:px-7 sm:pb-7">
          <div className="mx-auto max-w-5xl">
            <AnalysisView id={view} data={data} state={state} update={update} />
          </div>
          <div className="mx-auto mt-8 max-w-5xl border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onToggle}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              ← Close {title.toLowerCase()} and continue reading
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function Hero({
  burden,
  currentPrevention,
  idealPrevention,
  s1,
  mode,
  onMode,
  onAssumptions,
  changed,
}: {
  burden: Stat;
  currentPrevention: Stat | null;
  idealPrevention: Stat | null;
  s1: Stat;
  mode: Mode;
  onMode: (mode: Mode) => void;
  onAssumptions: () => void;
  changed: number;
}) {
  return (
    <header className="border-b border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_72%)]">
      <div className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>Research companion</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>v2 preview</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <ModeToggle mode={mode} onMode={onMode} />
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
            What can genetic medicine achieve now? Where does germline editing add something distinct?
            And how could that change as the technological frontier moves?
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
          <Horizon
            kicker="Impact now"
            title="Scale what already works"
            body="Established screening, reproductive, diagnostic and therapeutic tools already have large potential impact, but access remains incomplete."
            anchor="impact-now"
          />
          <Horizon
            kicker="Translational frontier"
            title="Find where editing is distinct"
            body="The strongest present case arises when no unaffected embryo can be selected; the comparison becomes more conditional as selection becomes burdensome rather than impossible."
            anchor="editing-frontier"
          />
          <Horizon
            kicker="Future impact"
            title="Track a moving frontier"
            body="Causal genomics, embryo technologies and multiplex editing can change both the reach of selection and the possible role of correction."
            anchor="future-impact"
          />
        </div>

        <div className="mt-10 grid gap-6 border-y border-slate-200 py-7 sm:grid-cols-3">
          <HeroStat
            value={fmtCompact(burden.median)}
            label="serious genetic-disease burden in the modeled annual birth cohort"
            interval={formatInterval(burden, fmtCompact)}
          />
          <HeroStat
            value={
              currentPrevention && idealPrevention
                ? `${fmtPct(currentPrevention.median, 1)} → ${fmtPct(idealPrevention.median, 1)}`
                : '—'
            }
            label="monogenic affected-birth avoidance: current modeled coverage → idealized full coverage"
          />
          <HeroStat
            value={fmtCompact(s1.median)}
            label="births per year in configurations where no unaffected embryo can be selected"
            interval={formatInterval(s1, fmtCompact)}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <a href="#burden" className="font-semibold text-blue-700 hover:text-blue-900">
            Start the analysis ↓
          </a>
          <span className="text-slate-400">Analysis and manuscript remain under development.</span>
        </div>
      </div>
    </header>
  );
}

function JourneyNav({ onAssumptions, changed }: { onAssumptions: () => void; changed: number }) {
  const items = [
    ['#burden', 'Burden'],
    ['#impact-now', 'Impact now'],
    ['#editing-frontier', 'Editing frontier'],
    ['#selection-correction', 'Selection vs correction'],
    ['#future-impact', 'Future impact'],
    ['#policy', 'Policy'],
  ];
  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur no-print">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 overflow-x-auto px-5 py-2.5">
        <nav className="flex min-w-max items-center gap-5 text-xs font-medium text-slate-500" aria-label="Analysis journey">
          {items.map(([href, label]) => (
            <a key={href} href={href} className="py-1 hover:text-blue-700">
              {label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={onAssumptions}
          className="min-w-max rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Assumptions{changed ? ` (${changed})` : ''}
        </button>
      </div>
    </div>
  );
}

function BurdenSection({
  data,
  burden,
  assumptions,
  mode,
  onAssumptions,
  panel,
  onPanel,
  state,
  update,
}: {
  data: AllData;
  burden: AllData['burden']['grid'][SeverityDef][Attribution];
  assumptions: Assumptions;
  mode: Mode;
  onAssumptions: () => void;
  panel: string;
  onPanel: (view: string) => void;
  state: UrlState;
  update: (p: UrlState) => void;
}) {
  const totalBirths = data.summary.births_per_year;
  const monoShare = burden.monogenic.median / burden.total_serious.median;
  const multiShare = burden.multifactorial.median / burden.total_serious.median;

  return (
    <StorySection id="burden" number="01" eyebrow="Disease burden" title="How large is the modeled burden of serious genetic disease?">
      <p className="story-prose">
        The analysis begins with the annual global birth cohort and separates serious genetic disease into
        monogenic and multifactorial components. The total depends especially on two contestable choices:
        what counts as serious disease, and how much multifactorial disease is attributed to genetics.
      </p>

      <div className="mt-9 space-y-5">
        <FlowRow
          label="Annual global births"
          value={fmtCompact(totalBirths.median)}
          sub={formatInterval(totalBirths, fmtCompact)}
          width={100}
          tone="slate"
        />
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
          <p className="text-sm font-semibold text-slate-900">Composition of serious genetic-disease burden</p>
          <button onClick={onAssumptions} className="text-xs font-medium text-blue-700 hover:text-blue-900">
            Change assumptions
          </button>
        </div>
        <div className="flex h-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <div className="flex items-center bg-blue-700 px-3 text-xs font-semibold text-white" style={{ width: `${monoShare * 100}%` }}>
            {monoShare > 0.12 ? 'Monogenic' : ''}
          </div>
          <div className="flex items-center justify-end bg-blue-100 px-3 text-xs font-semibold text-blue-950" style={{ width: `${multiShare * 100}%` }}>
            Multifactorial
          </div>
        </div>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <MiniResult
            label="Serious monogenic"
            value={fmtCompact(burden.monogenic.median)}
            detail={formatInterval(burden.monogenic, fmtCompact)}
          />
          <MiniResult
            label="Serious multifactorial / partly genetic"
            value={fmtCompact(burden.multifactorial.median)}
            detail={formatInterval(burden.multifactorial, fmtCompact)}
          />
        </div>
      </div>

      <ReaderTools mode={mode}>
        <ToolNote title="Why this matters">
          Population scale is only one dimension of impact, but it sets the denominator against which the reach of existing medicine and editing-relevant scenarios are compared.
        </ToolNote>
        <ToolNote title="How this was estimated">
          The top-down burden model propagates uncertainty across monogenic and multifactorial components. Current selection: severity <code>{assumptions.severity}</code>, attribution <code>{assumptions.attribution}</code>.
        </ToolNote>
      </ReaderTools>
      <AnalysisPanel
        view="denominator"
        open={panel === 'denominator'}
        onToggle={() => onPanel(panel === 'denominator' ? '' : 'denominator')}
        data={data}
        state={state}
        update={update}
        invitation="Change what counts as serious disease, or how much multi-cause disease counts as genetic, and watch the total move."
      />
    </StorySection>
  );
}

function ExistingMedicineSection({
  current,
  expanded,
  ideal,
  currentBurden,
  assumptions,
  mode,
  panel,
  onPanel,
  analysisData,
  state,
  update,
}: {
  current: Stat | null;
  expanded: Stat | null;
  ideal: Stat | null;
  currentBurden: Stat | null;
  assumptions: Assumptions;
  mode: Mode;
  panel: string;
  onPanel: (view: string) => void;
  analysisData: AllData;
  state: UrlState;
  update: (p: UrlState) => void;
}) {
  const rows = [
    { label: 'Current modeled coverage', stat: current, note: 'what current access and uptake achieve in the model' },
    { label: 'Expanded-access scenario', stat: expanded, note: 'a modeled 2035 expansion of coverage' },
    { label: 'Idealized full coverage', stat: ideal, note: 'technical potential under full modeled coverage' },
  ];

  return (
    <StorySection id="impact-now" number="02" eyebrow="Impact now" title="How much can established genetic medicine already achieve?" tint>
      <p className="story-prose">
        Carrier screening, PGT-M and prenatal diagnosis can reduce affected births; newborn screening and treatment can reduce disease burden after birth. These outcomes are kept separate because they are clinically and ethically different.
      </p>

      <div className="mt-9 space-y-5">
        {rows.map((row) => (
          <CoverageBar key={row.label} label={row.label} stat={row.stat} note={row.note} />
        ))}
      </div>

      <div className="mt-8 border-l-2 border-blue-600 pl-5">
        <p className="text-sm font-semibold text-slate-900">The implementation gap is part of the impact question.</p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Under current modeled coverage, monogenic affected-birth avoidance is far below the model's idealized full-coverage potential. This is why scaling established genetic medicine remains a major present-impact opportunity.
        </p>
        {currentBurden && (
          <p className="mt-2 text-xs text-slate-500">
            Including modeled postnatal burden mitigation, current coverage reaches {fmtPct(currentBurden.median, 1)} of monogenic burden on this track.
          </p>
        )}
      </div>

      <ReaderTools mode={mode}>
        <ToolNote title="Important distinction">
          Prenatal diagnosis reduces affected births in the model only when followed by a reproductive decision not to continue an affected pregnancy. Newborn screening prevents no births; it supports earlier treatment.
        </ToolNote>
        <ToolNote title="Current assumption">
          Prenatal diagnosis is {assumptions.pndCounts ? 'included' : 'excluded'} in the affected-birth avoidance track. This choice can be changed in the assumptions drawer.
        </ToolNote>
      </ReaderTools>
      <AnalysisPanel
        view="prevention"
        open={panel === 'prevention'}
        onToggle={() => onPanel(panel === 'prevention' ? '' : 'prevention')}
        data={analysisData}
        state={state}
        update={update}
        invitation="See each tool separately — carrier testing, embryo testing, prenatal diagnosis, newborn treatment — and what access costs each of them."
      />
    </StorySection>
  );
}

function EditingFrontierSection({
  data,
  s1,
  strictShare,
  futureShare,
  strictTotal,
  futureTotal,
  assumptions,
  mode,
  panel,
  onPanel,
  state,
  update,
}: {
  data: AllData;
  s1: Stat;
  strictShare: Stat;
  futureShare: Stat;
  strictTotal: Stat;
  futureTotal: Stat;
  assumptions: Assumptions;
  mode: Mode;
  panel: string;
  onPanel: (view: string) => void;
  state: UrlState;
  update: (p: UrlState) => void;
}) {
  return (
    <StorySection
      id="editing-frontier"
      number="03"
      eyebrow="Translational frontier"
      title="Where does germline editing add something distinct?"
    >
      <p className="story-prose">
        The clearest present case occurs when embryo selection cannot achieve the desired outcome because no unaffected embryo exists. A second, more conditional case arises when selection remains possible but becomes unusually burdensome. Complex disease adds a different question: whether editing could eventually provide meaningful incremental benefit beyond alternatives.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Editing-only prevention</p>
          <p className="mt-2 text-5xl font-semibold tracking-tight text-slate-950">{fmtCompact(s1.median)}</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            estimated births per year from reproductive configurations in which no unaffected embryo can be selected
          </p>
          <p className="mt-2 text-xs text-slate-400">95% UI {formatInterval(s1, fmtCompact)}</p>
          <p className="mt-5 text-xs text-slate-500">
            Congenital deafness is {assumptions.includeContested ? 'included' : 'excluded'} in this headline because its classification as a prevention target is ethically contested.
          </p>
        </div>

        <div className="border-t border-slate-200 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="text-sm font-semibold text-slate-900">Four gates separate need from clinical use</p>
          <ol className="mt-4 space-y-3">
            {data.editingTech.gates.map((gate, i) => (
              <li key={gate.key} className="grid grid-cols-[1.5rem_1fr_auto] items-start gap-3 text-sm">
                <span className="font-mono text-xs text-slate-400">{i + 1}</span>
                <div>
                  <p className="font-medium text-slate-900">{gate.label}</p>
                  {mode === 'explore' && <p className="mt-1 text-xs leading-5 text-slate-500">{gate.detail}</p>}
                </div>
                <GateStatus status={gate.status} />
              </li>
            ))}
          </ol>
          <p className="mt-5 text-xs leading-5 text-slate-500">
            The analysis quantifies where selection fails and whether a molecular correction route exists in principle. Embryo performance and safety remain independent gates.
          </p>
        </div>
      </div>

      <div className="mt-12 border-t border-slate-200 pt-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Comparative scale</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">The editing-relevant residual changes with the technology scenario.</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            For comparison with the wider disease burden, the model combines the no-selectable-embryo population with an exploratory complex-disease advantage term. The components remain clinically and ethically distinct.
          </p>
        </div>

        <div className="mt-7 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
          <ResidualCard
            title="Current-evidence scenario"
            total={strictTotal}
            share={strictShare}
            complement={1 - strictShare.median}
            note="Present comparative scale; complex-disease contribution is highly uncertain."
          />
          <ResidualCard
            title="Future-capacity exploratory scenario"
            total={futureTotal}
            share={futureShare}
            complement={1 - futureShare.median}
            note="Boundary analysis in which a larger complex-disease role is assumed."
          />
        </div>
      </div>

      <ReaderTools mode={mode}>
        <ToolNote title="How to read the complement">
          “Not uniquely dependent on germline editing” does not mean “preventable by existing medicine.” Existing pathways prevent, detect, treat or mitigate different outcomes.
        </ToolNote>
        <ToolNote title="Why combine the scenarios">
          Combining S1 and the exploratory complex-disease term permits comparison of scale; reporting them separately preserves their clinical and ethical meaning.
        </ToolNote>
      </ReaderTools>
      <AnalysisPanel
        view="residual"
        open={panel === 'residual'}
        onToggle={() => onPanel(panel === 'residual' ? '' : 'residual')}
        data={data}
        state={state}
        update={update}
        invitation="The condition-by-condition working behind this figure, and the assumptions you can change."
      />
    </StorySection>
  );
}

function SelectionSection({
  data,
  point,
  curveIndex,
  setCurveIndex,
  mode,
  panel,
  onPanel,
  state,
  update,
}: {
  data: AllData;
  point: AllData['embryos']['curve'][number];
  curveIndex: number;
  setCurveIndex: (i: number) => void;
  mode: Mode;
  panel: string;
  onPanel: (view: string) => void;
  state: UrlState;
  update: (p: UrlState) => void;
}) {
  return (
    <StorySection
      id="selection-correction"
      number="04"
      eyebrow="Reproductive burden"
      title="Selection becomes more burdensome before it becomes impossible."
      tint
    >
      <p className="story-prose">
        PGT-M selects among embryos; successful correction would alter an embryo that otherwise might not be selected. When unaffected embryos are common, selection is comparatively efficient. As they become rare, the number of affected-genotype embryos not selected per unaffected embryo rises sharply.
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

        <input
          aria-label="Unaffected embryo fraction"
          className="mt-8 w-full accent-blue-700"
          type="range"
          min={0}
          max={Math.max(0, data.embryos.curve.length - 1)}
          step={1}
          value={curveIndex}
          onChange={(e) => setCurveIndex(Number(e.target.value))}
        />
        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
          <span>Unaffected embryos common</span>
          <span>Unaffected embryos rare</span>
        </div>

        <div className="mt-8 grid gap-6 border-t border-slate-200 pt-7 sm:grid-cols-3">
          <InteractiveMetric
            value={formatDecimal(point.selection_affected_discarded)}
            label="affected-genotype embryos not selected per unaffected embryo"
          />
          <InteractiveMetric
            value={formatDecimal(point.selection_blastocysts)}
            label="illustrative blastocysts per live birth under selection"
          />
          <InteractiveMetric
            value="0"
            label="genotype-based exclusions under idealized successful correction"
          />
        </div>

        <div className="mt-7 flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl">
            At <em>u</em> → 0, selection becomes impossible. The primary relationship is (1−u)/u. The blastocyst comparison additionally assumes a 45% live-birth rate per transfer and is illustrative.
          </p>
          <span className="min-w-max font-medium text-slate-700">u = 0 → selection impossible</span>
        </div>
      </div>

      <ReaderTools mode={mode}>
        <ToolNote title="What is being counted">
          “Not selected for transfer” is not synonymous with “destroyed.” Actual embryo disposition — cryopreservation, donation, research donation or discard — is not modeled.
        </ToolNote>
        <ToolNote title="What correction does not solve">
          The idealized correction comparison sets genotype-based exclusions to zero by construction; it does not model editing failure, mosaicism, unintended changes, developmental attrition or safety-related loss.
        </ToolNote>
      </ReaderTools>
      <AnalysisPanel
        view="embryos"
        open={panel === 'embryos'}
        onToggle={() => onPanel(panel === 'embryos' ? '' : 'embryos')}
        data={data}
        state={state}
        update={update}
        invitation="Move through the full curve, and see what each extra IVF round buys a couple."
      />
    </StorySection>
  );
}

function FutureSection({ data, mode, panel, onPanel, state, update }: { data: AllData; mode: Mode; panel: string; onPanel: (v: string) => void; state: UrlState; update: (p: UrlState) => void }) {
  const present = data.multifactorial.frontier.present;
  const future = data.multifactorial.frontier.near_future;
  const n = data.multifactorial.n_diseases;

  return (
    <StorySection id="future-impact" number="05" eyebrow="Future impact" title="What happens if the technological frontier moves?">
      <p className="story-prose">
        Polygenic disease changes the problem. The relevant frontier depends on how well causal variants can be identified, how many embryo genomes are available for selection, and how many loci can be altered directly. Improvements can strengthen both selection and correction.
      </p>

      <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
        <FrontierAxis
          number="1"
          title="Causal knowledge"
          body="Which variants are causal, directionally beneficial and sufficiently free of adverse pleiotropic effects?"
        />
        <FrontierAxis
          number="2"
          title="Embryos available"
          body="Larger embryo sets can increase the power of selection without changing a genome directly."
        />
        <FrontierAxis
          number="3"
          title="Editable loci"
          body="Multiplex editing changes a different constraint: how many variants can be altered directly."
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Modeled frontier</p>
          <div className="mt-4 space-y-6">
            <FrontierCount
              label="Current-capacity scenario"
              editing={`${present.editing_viable} / ${n}`}
              selection={`${present.selection_viable_or_marginal} / ${n}`}
            />
            <FrontierCount
              label="Future high-capacity scenario"
              editing={`${future.editing_viable} / ${n}`}
              selection={`${future.selection_viable_or_marginal} / ${n}`}
            />
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">
            These are model-threshold results, not clinical-readiness claims. Safety, pleiotropy, effect realism and embryo performance remain separate gates.
          </p>
        </div>

        <div className="border-t border-slate-200 pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">The interpretation frontier is moving too.</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sequence-to-function resources such as AlphaGenome Atlas can improve variant prioritization and functional interpretation. That can extend diagnosis, screening and PGT-M — and may eventually inform causal inference for complex disease — without itself establishing that a variant can be corrected in an embryo or that correction is safe.
          </p>
          <a href={ALPHAGENOME_URL} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-semibold text-blue-700 hover:text-blue-900">
            AlphaGenome Atlas context ↗
          </a>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            This asymmetry matters: advances in interpretation are not advances in correction. Current sequence-to-function models also leave important trans-acting mechanisms unresolved.
          </p>
        </div>
      </div>

      <ReaderTools mode={mode}>
        <PolygenicExplore data={data} />
        <ToolNote title="How to interpret the high-capacity scenario">
          It is a boundary analysis of improved technical capability, not a forecast that 200 embryos or ten reliable germline edits will become clinically available.
        </ToolNote>
      </ReaderTools>
      <AnalysisPanel
        view="multifactorial"
        open={panel === 'multifactorial'}
        onToggle={() => onPanel(panel === 'multifactorial' ? '' : 'multifactorial')}
        data={data}
        state={state}
        update={update}
        invitation="Disease by disease, under present and future capability."
      />
    </StorySection>
  );
}

function PolicySection({ mode, panel, onPanel, analysisData, state, update }: { mode: Mode; panel: string; onPanel: (v: string) => void; analysisData: AllData; state: UrlState; update: (p: UrlState) => void }) {
  return (
    <StorySection id="policy" number="06" eyebrow="Ethics & policy" title="What follows from an impact-based framework?" tint>
      <p className="story-prose">
        The empirical picture supports different priorities at different time horizons. Population priority and individual clinical justification are related, but they are not the same question.
      </p>

      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        <PolicyStep
          n="1"
          title="Scale present impact"
          body="Expand access to established screening, reproductive, diagnostic and therapeutic pathways that can improve outcomes now."
        />
        <PolicyStep
          n="2"
          title="Develop the justified frontier"
          body="Create a transparent, tightly governed research pathway for severe indications in which germline editing has strong incremental medical value."
        />
        <PolicyStep
          n="3"
          title="Prepare for future impact"
          body="Study causal genomics, polygenic intervention, embryo technologies, pleiotropy and governance before capability outruns institutions."
        />
      </div>

      <div className="mt-12 grid gap-7 border-t border-slate-200 pt-8 md:grid-cols-2">
        <Principle
          title="Selection-First"
          body="When embryo selection can achieve the same medically important outcome with substantially lower risk and acceptable reproductive burden, editing should have to demonstrate why it is preferable."
        />
        <Principle
          title="Somatic-First"
          body="When treatment of the future person can provide comparable benefit without making a heritable change, germline intervention should require additional justification."
        />
      </div>
      <p className="mt-5 max-w-3xl text-xs leading-5 text-slate-500">
        These are rebuttable presumptions, not prohibitions. Selection may be impossible or unusually burdensome; somatic treatment may be less effective, lifelong, inaccessible or too late to prevent irreversible disease.
      </p>

      <ReaderTools mode={mode}>
        <ToolNote title="Pathways are not morally interchangeable">
          Carrier screening, PGT-M, prenatal diagnosis, newborn screening, somatic treatment and germline correction can sometimes be compared using a common disease outcome, but they reach that outcome through different reproductive and clinical pathways.
        </ToolNote>
        <ToolNote title="Two forms of arbitrage">
          Regulatory arbitrage moves work toward looser oversight. Ethical arbitrage borrows the moral urgency of a strongly justified use to support a weaker application.
        </ToolNote>
      </ReaderTools>
      <AnalysisPanel
        view="ethics"
        open={panel === 'ethics'}
        onToggle={() => onPanel(panel === 'ethics' ? '' : 'ethics')}
        data={analysisData}
        state={state}
        update={update}
        invitation="The proportionality argument in full, with its sequencing and its heuristics."
      />
    </StorySection>
  );
}

function MethodsSection({
  data,
  assumptions,
  panel,
  onPanel,
  state,
  update,
}: {
  data: AllData;
  assumptions: Assumptions;
  panel: string;
  onPanel: (view: string) => void;
  state: UrlState;
  update: (p: UrlState) => void;
}) {
  return (
    <StorySection id="methods" number="07" eyebrow="Methods & evidence" title="Inspect the assumptions, data and uncertainty.">
      <p className="story-prose">
        The v2 interface uses the same committed analysis outputs as the full research page. It does not recompute epidemiology in the browser. Quantitative results are generated by the pipeline and loaded from versioned JSON; contestable choices are exposed rather than silently fixed.
      </p>

      <div className="mt-9 grid gap-5 sm:grid-cols-3">
        <EvidenceStat label="Monte Carlo draws" value={fmtInt(data.meta.n_draws)} />
        <EvidenceStat label="Curated core diseases" value={fmtInt(data.library.rollup.tiers.core.n_diseases)} />
        <EvidenceStat label="Analysis commit" value={data.meta.commit.slice(0, 8)} mono />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Current reader choices</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Definition term="Severity" value={severityLabel(assumptions.severity)} />
            <Definition term="Multifactorial attribution" value={attributionLabel(assumptions.attribution)} />
            <Definition term="Prenatal diagnosis" value={assumptions.pndCounts ? 'Counted in affected-birth avoidance' : 'Excluded from affected-birth avoidance'} />
            <Definition term="Congenital deafness" value={assumptions.includeContested ? 'Included in editing-only prevention' : 'Excluded from headline editing-only prevention'} />
          </dl>
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-950">Go deeper</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(['methods', 'library', 'editing-tech', 'funding'] as const).map((v) => (
              <DeepLink
                key={v}
                title={VIEW_TITLES[v]}
                active={panel === v}
                onClick={() => onPanel(panel === v ? '' : v)}
              />
            ))}
          </div>
        </div>
      </div>
      {panel && (
        <AnalysisPanel
          view={panel}
          open
          onToggle={() => onPanel('')}
          data={data}
          state={state}
          update={update}
          invitation=""
        />
      )}

      <div className="mt-10 border-t border-slate-200 pt-6 text-xs leading-5 text-slate-500">
        <p>
          Uncertainty intervals are propagated model uncertainty, not confidence intervals in the statistical-estimation sense. The curated disease catalogue is a lower-bound validation set rather than the denominator itself. The current-evidence and future-capacity editing scenarios are separate scenarios, not endpoints of a single confidence interval.
        </p>
      </div>
    </StorySection>
  );
}

function StorySection({
  id,
  number,
  eyebrow,
  title,
  tint = false,
  children,
}: {
  id: string;
  number: string;
  eyebrow: string;
  title: string;
  tint?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-20 border-b border-slate-200 ${tint ? 'bg-slate-50/70' : 'bg-white'}`}>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="grid gap-5 lg:grid-cols-[8rem_1fr]">
          <div className="flex items-center gap-3 self-start pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 lg:block">
            <span className="font-mono">{number}</span>
            <span className="lg:mt-2 lg:block">{eyebrow}</span>
          </div>
          <div>
            <h2 className="max-w-4xl text-3xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-4xl sm:leading-tight">{title}</h2>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReaderTools({ mode, children }: { mode: Mode; children: React.ReactNode }) {
  return (
    <details open={mode === 'explore'} className="group mt-10 border-t border-slate-200 pt-5">
      <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 hover:text-blue-700">
        <span className="group-open:hidden">Why this matters · How estimated · Explore data +</span>
        <span className="hidden group-open:inline">Supporting detail −</span>
      </summary>
      <div className="mt-5 grid gap-4 md:grid-cols-3">{children}</div>
    </details>
  );
}

function ToolNote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l border-slate-300 pl-4 text-xs leading-5 text-slate-600">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

function ModeToggle({ mode, onMode }: { mode: Mode; onMode: (mode: Mode) => void }) {
  return (
    <div className="inline-flex rounded-full border border-slate-300 bg-white p-0.5">
      {(['story', 'explore'] as Mode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onMode(m)}
          className={`rounded-full px-3 py-1 font-medium capitalize ${mode === m ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-900'}`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function Horizon({ kicker, title, body, anchor }: { kicker: string; title: string; body: string; anchor: string }) {
  return (
    <a href={`#${anchor}`} className="group bg-white p-5 transition-colors hover:bg-blue-50/40 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-700">{kicker}</p>
      <p className="mt-2 text-base font-semibold text-slate-950 group-hover:text-blue-800">{title}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{body}</p>
    </a>
  );
}

function HeroStat({ value, label, interval }: { value: string; label: string; interval?: string }) {
  return (
    <div>
      <p className="tnum text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">{label}</p>
      {interval && <p className="mt-1 text-[11px] text-slate-400">95% UI {interval}</p>}
    </div>
  );
}

function FlowRow({
  label,
  value,
  sub,
  width,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  width: number;
  tone: 'slate' | 'blue';
}) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-4">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="tnum text-lg font-semibold text-slate-950">{value}</p>
      </div>
      <div className="h-3 rounded-full bg-slate-100">
        <div
          className={`h-3 min-w-[0.4rem] rounded-full ${tone === 'blue' ? 'bg-blue-700' : 'bg-slate-800'}`}
          style={{ width: `${Math.min(100, Math.max(0.8, width))}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">{sub}</p>
    </div>
  );
}

function MiniResult({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-slate-200 pt-3">
      <span className="text-slate-600">{label}</span>
      <span className="text-right">
        <strong className="tnum font-semibold text-slate-950">{value}</strong>
        <span className="mt-0.5 block text-[11px] text-slate-400">{detail}</span>
      </span>
    </div>
  );
}

function CoverageBar({ label, stat, note }: { label: string; stat: Stat | null; note: string }) {
  const pct = stat?.median ?? 0;
  return (
    <div className="grid gap-2 sm:grid-cols-[12rem_1fr_4.5rem] sm:items-center">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-400">{note}</p>
      </div>
      <div className="h-8 overflow-hidden rounded-md bg-white ring-1 ring-inset ring-slate-200">
        <div className="h-full bg-blue-700" style={{ width: `${Math.min(100, pct * 100)}%` }} />
      </div>
      <div className="sm:text-right">
        <p className="tnum text-lg font-semibold text-slate-950">{stat ? fmtPct(stat.median, 1) : '—'}</p>
        {stat && <p className="text-[10px] text-slate-400">{formatInterval(stat, (n) => fmtPct(n, 0))}</p>}
      </div>
    </div>
  );
}

function GateStatus({ status }: { status: 'quantified' | 'not_established' | 'unquantified' }) {
  const text = status === 'quantified' ? 'quantified' : status === 'not_established' ? 'not established' : 'unquantified';
  const cls = status === 'quantified' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500';
  return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${cls}`}>{text}</span>;
}

function ResidualCard({
  title,
  total,
  share,
  complement,
  note,
}: {
  title: string;
  total: Stat;
  share: Stat;
  complement: number;
  note: string;
}) {
  return (
    <div className="bg-white p-6">
      <p className="text-xs font-semibold text-slate-600">{title}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="tnum text-4xl font-semibold tracking-tight text-slate-950">{fmtPct(share.median, 2)}</p>
          <p className="mt-1 text-xs text-slate-500">of serious genetic-disease burden</p>
        </div>
        <p className="tnum text-sm font-medium text-slate-700">{fmtCompact(total.median)}/yr</p>
      </div>
      <div className="mt-5 h-2 rounded-full bg-slate-100">
        <div className="h-2 min-w-[3px] rounded-full bg-blue-700" style={{ width: `${Math.max(0.3, share.median * 100)}%` }} />
      </div>
      <p className="mt-3 text-[11px] leading-5 text-slate-500">{fmtPct(complement, 2)} not uniquely dependent on germline editing in this scenario. {note}</p>
      <p className="mt-1 text-[10px] text-slate-400">95% UI {formatInterval(share, (n) => fmtPct(n, 2))}</p>
    </div>
  );
}

function InteractiveMetric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="tnum text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{label}</p>
    </div>
  );
}

function FrontierAxis({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="bg-white p-5 sm:p-6">
      <p className="font-mono text-xs text-blue-700">{number}</p>
      <p className="mt-3 text-base font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{body}</p>
    </div>
  );
}

function FrontierCount({ label, editing, selection }: { label: string; editing: string; selection: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="border-t-2 border-blue-700 pt-2">
          <p className="tnum text-2xl font-semibold text-slate-950">{editing}</p>
          <p className="text-[11px] text-slate-500">editing meets model viability threshold</p>
        </div>
        <div className="border-t-2 border-slate-400 pt-2">
          <p className="tnum text-2xl font-semibold text-slate-950">{selection}</p>
          <p className="text-[11px] text-slate-500">selection viable or marginal</p>
        </div>
      </div>
    </div>
  );
}

function PolygenicExplore({ data }: { data: AllData }) {
  return (
    <div className="border-l border-slate-300 pl-4 text-xs leading-5 text-slate-600 md:col-span-2">
      <p className="font-semibold text-slate-900">Disease-level frontier</p>
      <div className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {data.multifactorial.diseases.map((d) => {
          const present = d.scenarios.present;
          const future = d.scenarios.near_future;
          return (
            <div key={d.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-1.5">
              <span>{d.name}</span>
              <span className="min-w-max font-mono text-[10px] text-slate-400">
                edit RRR {fmtPct(present.editing.rrr, 0)} → {fmtPct(future.editing.rrr, 0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PolicyStep({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 font-mono text-xs text-white">{n}</div>
      <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function Principle({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
    </div>
  );
}

function EvidenceStat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border-t border-slate-300 pt-3">
      <p className={`${mono ? 'font-mono' : 'tnum'} text-xl font-semibold text-slate-950`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Definition({ term, value }: { term: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-4 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{term}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function DeepLink({ title, active, onClick }: { title: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
      }`}
    >
      {title}
      <span className={active ? 'text-slate-300' : 'text-slate-400'}>{active ? '×' : '+'}</span>
    </button>
  );
}

function AssumptionsDrawer({
  open,
  assumptions,
  setAssumptions,
  onClose,
  changed,
}: {
  open: boolean;
  assumptions: Assumptions;
  setAssumptions: (next: Assumptions) => void;
  onClose: () => void;
  changed: number;
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
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Change contestable choices and see the relevant figures respond. These controls do not change the underlying source data.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-800" aria-label="Close">
            ×
          </button>
        </div>

        <div className="mt-8 space-y-8">
          <ControlGroup label="What counts as serious disease?">
            <Segmented
              value={assumptions.severity}
              options={[
                ['def_a', 'Narrow'],
                ['def_b', 'Main'],
                ['def_c', 'Broad'],
              ]}
              onChange={(value) => setAssumptions({ ...assumptions, severity: value as SeverityDef })}
            />
          </ControlGroup>

          <ControlGroup label="How much multifactorial disease is attributed to genetics?">
            <Segmented
              value={assumptions.attribution}
              options={[
                ['inclusive', 'Inclusive'],
                ['heritability_weighted', 'Heritability-weighted'],
                ['exclusive', 'Narrow'],
              ]}
              onChange={(value) => setAssumptions({ ...assumptions, attribution: value as Attribution })}
            />
          </ControlGroup>

          <ControlGroup label="Affected-birth avoidance track">
            <ToggleLine
              checked={assumptions.pndCounts}
              onChange={(checked) => setAssumptions({ ...assumptions, pndCounts: checked })}
              title="Count prenatal diagnosis"
              detail="Counts affected-birth reduction only when followed by a reproductive decision not to continue an affected pregnancy."
            />
          </ControlGroup>

          <ControlGroup label="Editing-only prevention headline">
            <ToggleLine
              checked={assumptions.includeContested}
              onChange={(checked) => setAssumptions({ ...assumptions, includeContested: checked })}
              title="Include congenital deafness"
              detail="Shown separately because classifying congenital deafness as a disease-prevention target is ethically contested."
            />
          </ControlGroup>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={() => setAssumptions(DEFAULTS)}
            disabled={changed === 0}
            className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 enabled:hover:border-blue-400 enabled:hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset to paper defaults{changed ? ` (${changed} changed)` : ''}
          </button>
          <p className="mt-3 text-[11px] leading-5 text-slate-400">
            Editing-relevant population-scaling shares are generated against the paper's default denominator and are not recomputed from the severity/attribution controls in the browser.
          </p>
        </div>
      </aside>
    </div>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-slate-900">{label}</legend>
      {children}
    </fieldset>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1 rounded-lg bg-slate-100 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`rounded-md px-2 py-2 text-[11px] font-semibold leading-4 ${value === key ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ToggleLine({
  checked,
  onChange,
  title,
  detail,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  detail: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-blue-700" />
      <span>
        <span className="block text-sm font-medium text-slate-800">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span>
      </span>
    </label>
  );
}

function formatInterval(stat: Stat, formatter: (n: number) => string): string {
  return `${formatter(stat.ci95[0])}–${formatter(stat.ci95[1])}`;
}

function formatDecimal(n: number): string {
  if (n >= 10) return n.toFixed(0);
  if (n >= 1) return n.toFixed(1).replace(/\.0$/, '');
  return n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function countChanged(a: Assumptions): number {
  return Number(a.severity !== DEFAULTS.severity) +
    Number(a.attribution !== DEFAULTS.attribution) +
    Number(a.pndCounts !== DEFAULTS.pndCounts) +
    Number(a.includeContested !== DEFAULTS.includeContested);
}

function severityLabel(v: SeverityDef): string {
  return v === 'def_a' ? 'Narrow' : v === 'def_b' ? 'Main (paper default)' : 'Broad';
}

function attributionLabel(v: Attribution): string {
  if (v === 'inclusive') return 'Inclusive (paper default)';
  if (v === 'heritability_weighted') return 'Heritability-weighted';
  return 'Narrow / high-penetrance attribution';
}

