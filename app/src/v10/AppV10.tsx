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

type Assumptions = {
  severity: SeverityDef;
  attribution: Attribution;
  pndCounts: boolean;
  includeContested: boolean;
};

type ComparisonData = {
  meta: { date: string };
  realistic_ivf: {
    single_centre_pgt_m_a: {
      derived: {
        biopsied_embryos_per_stimulated_cycle: number;
        live_birth_per_stimulated_cycle: number;
        stimulated_cycles_per_live_birth: number;
        biopsied_embryos_per_live_birth: number;
        transferred_embryos_per_live_birth: number;
      };
    };
    systematic_review_pgt_m: {
      studies: number;
      birth_rate_per_cycle: number;
      birth_rate_per_cycle_ci95: [number, number];
    };
  };
  selection_burden: {
    single_criterion: {
      u: number[];
      target_based_nonselections_per_acceptable_embryo: number[];
    };
  };
  selection_correction_crossover: {
    u_grid: number[];
    c_grid: number[];
    minimum_re_over_rs_matrix: number[][];
  };
  embryo_disposition: {
    eshre_2019_2021: {
      non_genetically_transferable_embryos: number;
      cryopreserved: number;
      cryopreserved_fraction: number;
    };
  };
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

async function loadComparison(): Promise<ComparisonData> {
  const base = import.meta.env.BASE_URL || './';
  const sep = base.endsWith('/') ? '' : '/';
  const res = await fetch(`${base}${sep}data/v6_comparison.json`);
  if (!res.ok) throw new Error(`Failed to load v6_comparison.json (${res.status})`);
  return (await res.json()) as ComparisonData;
}

function AnalysisView({
  id,
  data,
  comparison,
  state,
  update,
}: {
  id: string;
  data: AllData;
  comparison: ComparisonData;
  state: UrlState;
  update: (p: UrlState) => void;
}) {
  const common = { data, state, update };
  if (id === 'overview') return <Overview {...common} />;
  if (id === 'denominator') return <Denominator {...common} />;
  if (id === 'library') return <Library {...common} />;
  if (id === 'prevention') return <Prevention {...common} />;
  if (id === 'realized') return <Realized {...common} />;
  if (id === 'residual') return <Residual {...common} />;
  if (id === 'embryos') {
    return (
      <div>
        <ComparisonEvidence comparison={comparison} compact />
        <div className="mt-8 border-t border-slate-200 pt-8">
          <Embryos {...common} />
        </div>
      </div>
    );
  }
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

export default function AppV10() {
  const [data, setData] = useState<AllData | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULTS);
  const [selectionIndex, setSelectionIndex] = useState(2);
  const [state, update] = useUrlState({});
  const panel = state.panel && VIEW_TITLES[state.panel] ? state.panel : '';
  const [trail, setTrail] = useState<string[]>([]);

  const onPanel = (view: string) => {
    setTrail([]);
    update({ panel: view });
  };
  const pushTrail = (view: string) => setTrail((t) => [...t, view]);
  const popTrail = () => setTrail((t) => t.slice(0, -1));

  useEffect(() => {
    document.title = 'Calculating the Medical Impact of Heritable Human Genome Editing — v10';
    Promise.all([loadAll(), loadComparison()])
      .then(([allData, comparisonData]) => {
        setData(allData);
        setComparison(comparisonData);
      })
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

  if (!data || !comparison) {
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
  const changed = countChanged(assumptions);

  return (
    <UncertaintyProvider on={state.unc === '1'}>
      <ViewNavProvider
        go={(id, extra) => {
          if (extra) update(extra);
          if (panel) pushTrail(id);
          else update({ panel: id, ...(extra ?? {}) });
        }}
      >
        <div className="min-h-screen bg-white text-slate-950">
          <Hero
            burden={burden.total_serious}
            currentPrevention={currentPrevention?.total_averted_birth_fraction ?? null}
            idealPrevention={idealPrevention?.total_averted_birth_fraction ?? null}
            s1={residual.s1_total}
            onAssumptions={() => setDrawerOpen(true)}
            changed={changed}
          />

          <JourneyNav />

          <main>
            <BurdenSection
              data={data}
              burden={burden}
              assumptions={assumptions}
              onAssumptions={() => setDrawerOpen(true)}
              panel={panel}
              onPanel={onPanel}
              trail={trail}
              onBack={popTrail}
              state={state}
              update={update}
              comparison={comparison}
            />

            <ExistingMedicineSection
              analysisData={data}
              current={currentPrevention?.total_averted_birth_fraction ?? null}
              expanded={expandedPrevention?.total_averted_birth_fraction ?? null}
              ideal={idealPrevention?.total_averted_birth_fraction ?? null}
              currentBurden={currentPrevention?.total_averted_burden_fraction ?? null}
              assumptions={assumptions}
              panel={panel}
              onPanel={onPanel}
              trail={trail}
              onBack={popTrail}
              state={state}
              update={update}
              comparison={comparison}
            />

            <EditingFrontierSection
              data={data}
              s1={residual.s1_total}
              strictShare={strictShare}
              futureShare={futureShare}
              strictTotal={strictTotal}
              futureTotal={futureTotal}
              assumptions={assumptions}
              panel={panel}
              onPanel={onPanel}
              trail={trail}
              onBack={popTrail}
              state={state}
              update={update}
              comparison={comparison}
            />

            <SelectionSection
              data={data}
              comparison={comparison}
              selectionIndex={selectionIndex}
              setSelectionIndex={setSelectionIndex}
              panel={panel}
              onPanel={onPanel}
              trail={trail}
              onBack={popTrail}
              state={state}
              update={update}
            />

            <FutureSection
              data={data}
              strictShare={strictShare}
              futureShare={futureShare}
              futureTotal={futureTotal}
              panel={panel}
              onPanel={onPanel}
              trail={trail}
              onBack={popTrail}
              state={state}
              update={update}
              comparison={comparison}
            />

            <PolicySection
              analysisData={data}
              panel={panel}
              onPanel={onPanel}
              trail={trail}
              onBack={popTrail}
              state={state}
              update={update}
              comparison={comparison}
            />

            <MethodsSection
              data={data}
              assumptions={assumptions}
              panel={panel}
              onPanel={onPanel}
              trail={trail}
              onBack={popTrail}
              state={state}
              update={update}
              comparison={comparison}
            />
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

function Hero({
  burden,
  currentPrevention,
  idealPrevention,
  s1,
  onAssumptions,
  changed,
}: {
  burden: Stat;
  currentPrevention: Stat | null;
  idealPrevention: Stat | null;
  s1: Stat;
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
            <span>v10</span>
          </div>
          <button
            type="button"
            onClick={onAssumptions}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-400 hover:text-blue-700"
          >
            Assumptions{changed ? ` · ${changed} changed` : ''}
          </button>
        </div>

        <div className="mt-12 max-w-4xl">
          <h1 className="text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[3.55rem] lg:leading-[1.03]">
            Calculating the Medical Impact of Heritable Human Genome Editing
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
            What can genetic medicine actually achieve, for whom and at what scale? Where does heritable editing add something distinct — and how does that comparison change as the technology moves?
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
          <Horizon
            kicker="Impact now"
            title="Start with what already works"
            body="Screening, reproductive genetics, diagnosis and treatment already change outcomes, but access remains incomplete."
            anchor="impact-now"
          />
          <Horizon
            kicker="Present frontier"
            title="Locate where editing is distinct"
            body="The strongest present case begins where no unaffected embryo can be selected, then becomes more conditional as selection burden rises."
            anchor="editing-frontier"
          />
          <Horizon
            kicker="Future impact"
            title="Let both frontiers move"
            body="Causal knowledge, embryo supply and correction capacity can strengthen selection and editing in different ways."
            anchor="future-impact"
          />
        </div>

        <div className="mt-10 grid gap-6 border-y border-slate-200 py-7 sm:grid-cols-3">
          <HeroStat
            value={fmtCompact(burden.median)}
            label="serious genetic-disease birth-cohort denominator"
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
            label="birth-equivalent configurations where no unaffected embryo can be selected"
            interval={formatInterval(s1, fmtCompact)}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <a href="#burden" className="font-semibold text-blue-700 hover:text-blue-900">
            Start the analysis ↓
          </a>
          <span className="text-slate-400">Readable summary first; the full analysis opens inline when you want it.</span>
        </div>
      </div>
    </header>
  );
}

function JourneyNav() {
  const items = [
    ['#burden', 'Scale'],
    ['#impact-now', 'Existing medicine'],
    ['#editing-frontier', 'Editing frontier'],
    ['#selection-correction', 'Selection vs correction'],
    ['#future-impact', 'Future frontier'],
    ['#policy', 'Ethics & policy'],
  ];
  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur no-print">
      <div className="mx-auto flex max-w-6xl items-center gap-5 overflow-x-auto px-5 py-2.5">
        {items.map(([href, label]) => (
          <a key={href} href={href} className="min-w-max py-1 text-xs font-medium text-slate-500 hover:text-blue-700">
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

type PanelProps = {
  panel: string;
  onPanel: (view: string) => void;
  trail: string[];
  onBack: () => void;
  state: UrlState;
  update: (p: UrlState) => void;
  comparison: ComparisonData;
};

function BurdenSection({
  data,
  burden,
  assumptions,
  onAssumptions,
  ...panelProps
}: {
  data: AllData;
  burden: AllData['burden']['grid'][SeverityDef][Attribution];
  assumptions: Assumptions;
  onAssumptions: () => void;
} & PanelProps) {
  const totalBirths = data.summary.births_per_year;
  const monoShare = burden.monogenic.median / burden.total_serious.median;
  const multiShare = burden.multifactorial.median / burden.total_serious.median;

  return (
    <StorySection id="burden" number="01" eyebrow="Medical scale" title="Put the medical problem on a common scale.">
      <p className="story-prose">
        The analysis begins with the annual global birth cohort. Under the paper's default assumptions, it contains about {fmtCompact(burden.total_serious.median)} serious genetic-disease cases on a birth-cohort reference scale: {fmtCompact(burden.monogenic.median)} serious monogenic affected births plus about {fmtCompact(burden.multifactorial.median)} serious multifactorial congenital cases.
      </p>
      <p className="story-prose mt-4">
        That second component is anchored to congenital disease measured around birth. It is not a lifetime-incidence count for coronary artery disease, type 2 diabetes, schizophrenia, depression or Alzheimer disease; those enter later as separate forward-looking polygenic examples.
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
          label="Serious genetic-disease birth-cohort denominator"
          value={fmtCompact(burden.total_serious.median)}
          sub={`${fmtPct(burden.serious_share_of_births.median, 2)} of annual births · ${formatInterval(burden.total_serious, fmtCompact)}`}
          width={Math.max(7, burden.serious_share_of_births.median * 100)}
          tone="blue"
        />
      </div>

      <div className="mt-8">
        <div className="mb-2 flex items-end justify-between gap-4">
          <p className="text-sm font-semibold text-slate-900">Composition of the default denominator</p>
          <button onClick={onAssumptions} className="text-xs font-medium text-blue-700 hover:text-blue-900">
            Change assumptions
          </button>
        </div>
        <div className="flex h-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <div className="flex items-center bg-blue-700 px-3 text-xs font-semibold text-white" style={{ width: `${monoShare * 100}%` }}>
            {monoShare > 0.12 ? 'Monogenic' : ''}
          </div>
          <div className="flex items-center justify-end bg-blue-100 px-3 text-xs font-semibold text-blue-950" style={{ width: `${multiShare * 100}%` }}>
            Multifactorial congenital
          </div>
        </div>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <MiniResult label="Serious monogenic" value={fmtCompact(burden.monogenic.median)} detail={formatInterval(burden.monogenic, fmtCompact)} />
          <MiniResult label="Serious multifactorial congenital" value={fmtCompact(burden.multifactorial.median)} detail={formatInterval(burden.multifactorial, fmtCompact)} />
        </div>
      </div>

      <ReaderTools>
        <ToolNote title="Why this matters">
          Population scale is only one dimension of impact, but it supplies the denominator against which current and future editing-relevant scenarios are compared.
        </ToolNote>
        <ToolNote title="What changes the denominator">
          Severity and genetic-attribution choices are contestable, so they remain exposed to the reader rather than hidden behind one fixed total.
        </ToolNote>
      </ReaderTools>
      <SectionPanel view="denominator" data={data} invitation="Change severity and attribution assumptions and inspect exactly how the denominator is built." {...panelProps} />
    </StorySection>
  );
}

function ExistingMedicineSection({
  current,
  expanded,
  ideal,
  currentBurden,
  assumptions,
  analysisData,
  ...panelProps
}: {
  current: Stat | null;
  expanded: Stat | null;
  ideal: Stat | null;
  currentBurden: Stat | null;
  assumptions: Assumptions;
  analysisData: AllData;
} & PanelProps) {
  const rows = [
    { label: 'Current modeled coverage', stat: current, note: 'current access and reproductive follow-through' },
    { label: 'Expanded-access scenario', stat: expanded, note: 'illustrative access expansion' },
    { label: 'Idealized full coverage', stat: ideal, note: 'technical horizon under very high modeled coverage' },
  ];

  return (
    <StorySection id="impact-now" number="02" eyebrow="Impact now" title="Calculate what established genetic medicine can already achieve." tint>
      <p className="story-prose">
        Carrier screening, PGT-M and prenatal diagnosis can contribute to affected-birth avoidance; newborn screening and treatment act later by reducing disease burden after birth. Keeping those outcomes separate prevents a common comparison error: different clinical pathways can change different things even when they address the same disease.
      </p>

      <div className="mt-9 space-y-5">
        {rows.map((row) => <CoverageBar key={row.label} label={row.label} stat={row.stat} note={row.note} />)}
      </div>

      <div className="mt-8 border-l-2 border-blue-600 pl-5">
        <p className="text-sm font-semibold text-slate-900">The implementation gap is part of the medical-impact question.</p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          The model moves from about 35.9% affected-birth avoidance at current coverage to 79.6% under expanded access and 99.7% under idealized coverage. The last number is a technical horizon, not a forecast of universal uptake.
        </p>
        {currentBurden && (
          <p className="mt-2 text-xs text-slate-500">
            Including modeled postnatal burden mitigation, current coverage reaches {fmtPct(currentBurden.median, 1)} of monogenic burden on that separate track.
          </p>
        )}
      </div>

      <ReaderTools>
        <ToolNote title="Prenatal diagnosis">
          It contributes to affected-birth avoidance only when diagnosis is followed by a reproductive decision not to continue an affected pregnancy.
        </ToolNote>
        <ToolNote title="Newborn screening">
          It prevents no affected births in this framework; its contribution is earlier diagnosis and treatment after birth.
        </ToolNote>
        <ToolNote title="Current setting">
          Prenatal diagnosis is {assumptions.pndCounts ? 'included' : 'excluded'} in the affected-birth-avoidance track and can be changed in the assumptions drawer.
        </ToolNote>
      </ReaderTools>
      <SectionPanel view="prevention" data={analysisData} invitation="See each pathway separately, including access, uptake and regional assumptions." {...panelProps} />
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
  ...panelProps
}: {
  data: AllData;
  s1: Stat;
  strictShare: Stat;
  futureShare: Stat;
  strictTotal: Stat;
  futureTotal: Stat;
  assumptions: Assumptions;
} & PanelProps) {
  return (
    <StorySection id="editing-frontier" number="03" eyebrow="Present frontier" title="Where does heritable editing actually change the outcome?">
      <p className="story-prose">
        The clearest present case is not simply “a serious genetic disease.” It is a reproductive configuration in which selection cannot provide an unaffected embryo. Excluding congenital deafness as a contested prevention category, those configurations correspond to about {fmtCompact(s1.median)} otherwise-affected births per year.
      </p>
      <p className="story-prose mt-4">
        At population scale that is small. For a family in the group, however, the marginal value can be unusually large: successful correction could in principle create a route to an unaffected child genetically related to both intended parents where selection cannot. Donor gametes, adoption and non-reproduction are genuine alternatives, but they answer a different reproductive aim.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">No selectable unaffected embryo</p>
          <p className="mt-2 text-5xl font-semibold tracking-tight text-slate-950">{fmtCompact(s1.median)}</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">birth-equivalent reproductive configurations per year</p>
          <p className="mt-2 text-xs text-slate-400">95% UI {formatInterval(s1, fmtCompact)}</p>
          <p className="mt-5 text-xs leading-5 text-slate-500">
            This is not a count of IVF cycles, couples presenting for care or everyone living with the relevant diseases. Congenital deafness is {assumptions.includeContested ? 'included' : 'excluded'} in the current headline.
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
                  <p className="mt-1 text-xs leading-5 text-slate-500">{gate.detail}</p>
                </div>
                <GateStatus status={gate.status} />
              </li>
            ))}
          </ol>
          <p className="mt-5 text-xs leading-5 text-slate-500">
            Reproductive need is the first gate. Molecular tractability, embryo performance and clinical/heritable safety remain independent questions.
          </p>
        </div>
      </div>

      <div className="mt-12 border-t border-slate-200 pt-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Comparative scale</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">The present and future scenarios are different claims, not one confidence interval.</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The strict current-evidence scenario adds only a small complex-disease component to the no-selectable-embryo population. The future-capacity scenario deliberately allows a much larger role under stronger assumptions.
          </p>
        </div>
        <div className="mt-7 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
          <ResidualCard title="Current evidence" total={strictTotal} share={strictShare} complement={1 - strictShare.median} note="Strict scenario; not equivalent to clinical readiness." />
          <ResidualCard title="Permissive future capacity" total={futureTotal} share={futureShare} complement={1 - futureShare.median} note="Assumes a 2.0% future editing-advantage fraction in the modeled multifactorial component; not a forecast." future />
        </div>
      </div>

      <ReaderTools>
        <ToolNote title="Do not misread the complement">
          The remainder is not “handled by selection.” It includes disease approached through screening, diagnosis, treatment, conventional prevention and disease that remains poorly addressable by any route.
        </ToolNote>
        <ToolNote title="A value-sensitive boundary">
          Including GJB2-associated congenital deafness adds roughly 12,320 birth-equivalent configurations, enough to more than double the primary no-selectable-embryo estimate.
        </ToolNote>
      </ReaderTools>
      <SectionPanel view="residual" data={data} invitation="Open the condition-level working, contested category and regional results." {...panelProps} />
    </StorySection>
  );
}

function SelectionSection({
  data,
  comparison,
  selectionIndex,
  setSelectionIndex,
  ...panelProps
}: {
  data: AllData;
  comparison: ComparisonData;
  selectionIndex: number;
  setSelectionIndex: (i: number) => void;
} & PanelProps) {
  const burden = comparison.selection_burden.single_criterion;
  const u = burden.u[Math.min(selectionIndex, burden.u.length - 1)];
  const nonselections = burden.target_based_nonselections_per_acceptable_embryo[Math.min(selectionIndex, burden.u.length - 1)];
  const crossover = comparison.selection_correction_crossover;
  const uIndex = crossover.u_grid.findIndex((x) => Math.abs(x - u) < 1e-9);
  const cIndex = crossover.c_grid.findIndex((x) => Math.abs(x - 0.5) < 1e-9);
  const threshold = uIndex >= 0 && cIndex >= 0 ? crossover.minimum_re_over_rs_matrix[uIndex][cIndex] : null;

  return (
    <StorySection id="selection-correction" number="04" eyebrow="Reproductive burden" title="Selection becomes more burdensome before it becomes impossible." tint>
      <p className="story-prose">
        Selection is often treated as a binary comparator: PGT is available or it is not. But the reproductive burden changes continuously. If <em>u</em> is the fraction of embryos acceptable with respect to the targeted genotype, the expected number that fail that target for every acceptable embryo is (1−u)/u.
      </p>

      <div className="mt-9 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Interactive selection burden</p>
            <p className="mt-2 text-sm text-slate-600">Move through the precomputed target-acceptable embryo fractions.</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold tracking-tight text-slate-950">u = {u.toFixed(2)}</p>
            <p className="text-xs text-slate-500">{Math.round(u * 100)}% target-acceptable embryos</p>
          </div>
        </div>

        <input
          aria-label="Target-acceptable embryo fraction"
          className="mt-8 w-full accent-blue-700"
          type="range"
          min={0}
          max={Math.max(0, burden.u.length - 1)}
          step={1}
          value={selectionIndex}
          onChange={(e) => setSelectionIndex(Number(e.target.value))}
        />
        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
          <span>Acceptable embryos common</span>
          <span>Acceptable embryos rare</span>
        </div>

        <div className="mt-8 grid gap-6 border-t border-slate-200 pt-7 sm:grid-cols-3">
          <InteractiveMetric value={formatDecimal(nonselections)} label="target-based non-selections per acceptable embryo" />
          <InteractiveMetric value={threshold === null ? '—' : fmtPct(threshold, 1)} label="minimum post-correction / selection live-birth-rate ratio for yield crossover when correction success c = 0.50" />
          <InteractiveMetric value={fmtPct(comparison.embryo_disposition.eshre_2019_2021.cryopreserved_fraction, 1)} label="of non-genetically-transferable target embryos remained cryopreserved in the ESHRE dataset" />
        </div>

        <div className="mt-7 flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl">
            Correction is placed on the same reproductive-yield scale using q = u + (1−u)c. Here q means target-acceptability after correction — not automatic transferability. Euploidy, developmental competence, editing safety and the rest of the clinical pathway still matter.
          </p>
          <span className="min-w-max font-medium text-slate-700">u → 0: selection becomes impossible</span>
        </div>
      </div>

      <ComparisonEvidence comparison={comparison} />

      <ReaderTools>
        <ToolNote title="Non-selection is not destruction">
          Genotype-based non-selection reports failure of the target criterion. Cryopreservation, donation, research donation and discard are separate disposition outcomes.
        </ToolNote>
        <ToolNote title="The crossover is narrow">
          A favorable correction crossover here concerns reproductive yield only. It is not an ethical verdict and does not incorporate mosaicism, unintended changes, developmental effects or intergenerational uncertainty.
        </ToolNote>
        <ToolNote title="Multi-criterion boundary">
          Five independent hard thresholds each met by half of embryos leave 1/32 acceptable and 31 failing at least one target per acceptable embryo. This is a toy boundary, not a model of PGT-P.
        </ToolNote>
      </ReaderTools>
      <SectionPanel view="embryos" data={data} invitation="Open the full selection-versus-correction curves and the underlying reproductive model." {...panelProps} />
    </StorySection>
  );
}

function ComparisonEvidence({ comparison, compact = false }: { comparison: ComparisonData; compact?: boolean }) {
  const pgt = comparison.realistic_ivf.single_centre_pgt_m_a.derived;
  const review = comparison.realistic_ivf.systematic_review_pgt_m;
  const disposition = comparison.embryo_disposition.eshre_2019_2021;
  return (
    <div className={compact ? '' : 'mt-9'}>
      {!compact && <p className="text-sm font-semibold text-slate-900">Empirical PGT-M anchors</p>}
      <div className={`${compact ? 'mt-1' : 'mt-4'} grid gap-5 sm:grid-cols-2 lg:grid-cols-4`}>
        <EvidenceStat label="biopsied embryos / stimulated cycle" value={pgt.biopsied_embryos_per_stimulated_cycle.toFixed(2)} />
        <EvidenceStat label="live births / stimulated cycle, single-centre cohort" value={fmtPct(pgt.live_birth_per_stimulated_cycle, 1)} />
        <EvidenceStat label="biopsied embryos / observed live birth" value={pgt.biopsied_embryos_per_live_birth.toFixed(2)} />
        <EvidenceStat label={`${review.studies}-study review: births / cycle`} value={fmtPct(review.birth_rate_per_cycle, 1)} />
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        In the ESHRE disposition dataset, {fmtInt(disposition.cryopreserved)} of {fmtInt(disposition.non_genetically_transferable_embryos)} embryos classified as non-genetically-transferable for the PGT-M/PGT-SR target remained cryopreserved ({fmtPct(disposition.cryopreserved_fraction, 1)}).
      </p>
    </div>
  );
}

function FutureSection({
  data,
  strictShare,
  futureShare,
  futureTotal,
  ...panelProps
}: {
  data: AllData;
  strictShare: Stat;
  futureShare: Stat;
  futureTotal: Stat;
} & PanelProps) {
  const present = data.multifactorial.frontier.present;
  const future = data.multifactorial.frontier.near_future;
  const n = data.multifactorial.n_diseases;

  return (
    <StorySection id="future-impact" number="05" eyebrow="Moving frontiers" title="A useful future comparison has to let both selection and correction improve.">
      <p className="story-prose">
        Common adult disease is handled separately from the birth-cohort denominator because its relevant quantity is future risk, not affected births observed around birth. Selection and editing both shift probabilities, and their relative value depends on three capabilities that can move independently.
      </p>

      <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
        <FrontierAxis number="1" title="Causal knowledge" body="Which variants matter, how much they matter and what else they do." />
        <FrontierAxis number="2" title="Embryo supply" body="How many genomes are available to choose among as reproductive technologies change." />
        <FrontierAxis number="3" title="Correction capacity" body="How many relevant variants can be altered reliably and safely." />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Disease-level model frontier</p>
          <div className="mt-4 space-y-6">
            <FrontierCount label="Current-capacity scenario" editing={`${present.editing_viable} / ${n}`} selection={`${present.selection_viable_or_marginal} / ${n}`} />
            <FrontierCount label="Future high-capacity scenario" editing={`${future.editing_viable} / ${n}`} selection={`${future.selection_viable_or_marginal} / ${n}`} />
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">These are model-threshold results, not clinical-readiness claims.</p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">Permissive future-capacity boundary</p>
          <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-1">
            <p className="tnum text-4xl font-semibold tracking-tight text-slate-950">{fmtCompact(futureTotal.median)}/yr</p>
            <p className="pb-1 text-lg font-semibold text-blue-700">{fmtPct(futureShare.median, 1)} of the default denominator</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            This scenario assigns a central 2.0% editing-advantage fraction to the modeled multifactorial birth-cohort component, with parameter bounds of 0.8–3.5%. It is a conditional boundary, not a forecast.
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            The strict current position is {fmtPct(strictShare.median, 2)}. The larger uncertainty is structural: whether the causal knowledge, multiplex correction and clinical performance assumed by the future scenario will ever exist.
          </p>
        </div>
      </div>

      <div className="mt-9 border-l-2 border-blue-600 pl-5">
        <p className="text-sm font-semibold text-slate-900">Future editing should be compared with future selection, not today's selection.</p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          In vitro maturation, in vitro gametogenesis and larger selectable embryo sets could strengthen selection at the same time that better causal genomics and multiplex editing strengthen correction. The comparator therefore moves too.
        </p>
      </div>

      <ReaderTools>
        <PolygenicExplore data={data} />
        <ToolNote title="Interpretation frontier">
          Sequence-to-function resources such as AlphaGenome can improve variant prioritization and diagnosis without establishing that a variant can be safely corrected in an embryo.
          <a href={ALPHAGENOME_URL} target="_blank" rel="noreferrer" className="mt-2 block font-semibold text-blue-700 hover:text-blue-900">AlphaGenome Atlas context ↗</a>
        </ToolNote>
      </ReaderTools>
      <SectionPanel view="multifactorial" data={data} invitation="Explore the disease-level polygenic model under present and future capability assumptions." {...panelProps} />
    </StorySection>
  );
}

function PolicySection({ analysisData, ...panelProps }: { analysisData: AllData } & PanelProps) {
  return (
    <StorySection id="policy" number="06" eyebrow="Ethics & policy" title="Calculation structures the ethical question; it does not collapse it into one score." tint>
      <p className="story-prose">
        Population impact, individual clinical need, reproductive burden, heritable risk, access, resources and future option value can point in different directions. The purpose of calculation is to show what is at stake, what the comparator is and where the normative premises enter.
      </p>

      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        <PolicyStep n="1" title="Scale present impact" body="Expand access to established screening, reproductive, diagnostic and therapeutic pathways that can improve outcomes now." />
        <PolicyStep n="2" title="Study the strongest frontier" body="Prioritize severe indications where editing has unusually strong incremental medical value, while keeping the safety threshold independent." />
        <PolicyStep n="3" title="Recalculate as capability moves" body="Reassess selection, correction, risk reduction, resistance and enhancement as causal knowledge and technologies change." />
      </div>

      <div className="mt-12 grid gap-7 border-t border-slate-200 pt-8 md:grid-cols-2">
        <Principle title="Selection-First" body="When embryo selection can achieve the same medically important outcome with substantially lower heritable risk and acceptable reproductive burden, selection has a defeasible presumption." />
        <Principle title="Somatic-First" body="When comparable benefit can be delivered to the future child without altering the heritable genome, the somatic route has a defeasible presumption." />
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">Two distinctions keep the policy argument proportional.</p>
        <div className="mt-4 grid gap-5 text-xs leading-5 text-slate-600 sm:grid-cols-2">
          <p><strong className="text-slate-900">Population priority ≠ individual clinical justification.</strong> A small eligible population can still contain cases in which the incremental value to a family is unusually high.</p>
          <p><strong className="text-slate-900">Calculated impact ≠ cost-effectiveness.</strong> The framework identifies scale, alternatives and consequences; it does not by itself establish that a research or clinical programme is the best use of resources.</p>
        </div>
      </div>

      <ReaderTools>
        <ToolNote title="Pathways are not morally interchangeable">
          Carrier screening, PGT-M, prenatal diagnosis, newborn screening, somatic treatment and germline correction can sometimes be compared on a common disease outcome, but they reach it through different reproductive and clinical pathways.
        </ToolNote>
        <ToolNote title="Do not borrow urgency">
          Preventing a lethal monogenic disorder when no unaffected embryo can be selected begins from a different baseline from HIV resistance, common-disease risk reduction or alteration of a non-disease trait.
        </ToolNote>
      </ReaderTools>
      <SectionPanel view="ethics" data={analysisData} invitation="Open the proportionality framework and the wider ethics and policy analysis." {...panelProps} />
    </StorySection>
  );
}

function MethodsSection({ data, assumptions, ...panelProps }: { data: AllData; assumptions: Assumptions } & PanelProps) {
  const { panel, onPanel, trail, onBack, state, update, comparison } = panelProps;
  return (
    <StorySection id="methods" number="07" eyebrow="Methods & evidence" title="Inspect the assumptions, data and uncertainty.">
      <p className="story-prose">
        The v10 interface reads the same committed analysis outputs used by the research repository. It does not recompute epidemiology in the browser. Quantitative results are generated by the pipeline, while contestable choices and epistemic status are exposed rather than silently fixed.
      </p>

      <div className="mt-9 grid gap-5 sm:grid-cols-4">
        <EvidenceStat label="Monte Carlo draws" value={fmtInt(data.meta.n_draws)} />
        <EvidenceStat label="Curated core diseases" value={fmtInt(data.library.rollup.tiers.core.n_diseases)} />
        <EvidenceStat label="Model specification" value={data.meta.spec_version} />
        <EvidenceStat label="Analysis commit" value={data.meta.commit.slice(0, 8)} mono />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Current reader choices</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Definition term="Severity" value={severityLabel(assumptions.severity)} />
            <Definition term="Multifactorial attribution" value={attributionLabel(assumptions.attribution)} />
            <Definition term="Prenatal diagnosis" value={assumptions.pndCounts ? 'Counted in affected-birth avoidance' : 'Excluded from affected-birth avoidance'} />
            <Definition term="Congenital deafness" value={assumptions.includeContested ? 'Included in the no-selectable headline' : 'Reported separately from the headline'} />
          </dl>
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-950">Go deeper</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(['methods', 'library', 'editing-tech', 'funding'] as const).map((v) => (
              <DeepLink key={v} title={VIEW_TITLES[v]} active={panel === v} onClick={() => onPanel(panel === v ? '' : v)} />
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
          comparison={comparison}
          state={state}
          update={update}
          invitation=""
          trail={trail}
          onBack={onBack}
        />
      )}

      <div className="mt-10 border-t border-slate-200 pt-6 text-xs leading-5 text-slate-500">
        <p>
          Uncertainty intervals are propagated model uncertainty, not a complete measure of structural or normative uncertainty. Current-evidence and future-capacity editing scenarios are separate scenarios, not endpoints of a confidence interval. The selection/correction evidence layer is dated {comparison.meta.date}.
        </p>
      </div>
    </StorySection>
  );
}

function SectionPanel({ view, data, invitation, ...props }: { view: string; data: AllData; invitation: string } & PanelProps) {
  return (
    <AnalysisPanel
      view={view}
      open={props.panel === view}
      onToggle={() => props.onPanel(props.panel === view ? '' : view)}
      data={data}
      comparison={props.comparison}
      state={props.state}
      update={props.update}
      invitation={invitation}
      trail={props.trail}
      onBack={props.onBack}
    />
  );
}

function AnalysisPanel({
  view,
  open,
  onToggle,
  data,
  comparison,
  state,
  update,
  invitation,
  trail,
  onBack,
}: {
  view: string;
  open: boolean;
  onToggle: () => void;
  data: AllData;
  comparison: ComparisonData;
  state: UrlState;
  update: (p: UrlState) => void;
  invitation: string;
  trail: string[];
  onBack: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const current = open && trail.length ? trail[trail.length - 1] : view;
  const rootTitle = VIEW_TITLES[view] ?? view;
  const currentTitle = VIEW_TITLES[current] ?? current;

  useEffect(() => {
    if (open && !trail.length && ref.current) {
      const y = ref.current.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [open, trail.length]);

  return (
    <div ref={ref} className="mt-10 scroll-mt-20">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-4 rounded-xl border px-5 py-4 text-left transition-colors ${open ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/40'}`}
      >
        <span>
          <span className={`block text-[11px] font-semibold uppercase tracking-[0.15em] ${open ? 'text-slate-400' : 'text-blue-700'}`}>
            {open ? 'Showing the full analysis' : 'The full analysis'}
          </span>
          <span className={`mt-1 block text-base font-semibold ${open ? 'text-white' : 'text-slate-900'}`}>{rootTitle}</span>
          {!open && <span className="mt-1 block text-xs leading-5 text-slate-500">{invitation}</span>}
        </span>
        <span className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${open ? 'border-slate-600 text-slate-200' : 'border-slate-300 text-slate-600'}`}>
          {open ? 'Close ×' : 'Open +'}
        </span>
      </button>

      {open && (
        <div className="rounded-b-xl border border-t-0 border-slate-900/15 bg-slate-50/70 px-4 pb-5 pt-4 sm:px-7 sm:pb-7">
          {trail.length > 0 && (
            <div className="sticky top-12 z-20 -mx-4 mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-200 bg-slate-50/95 px-4 py-2.5 text-xs backdrop-blur sm:-mx-7 sm:px-7">
              <button type="button" onClick={onBack} className="rounded border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-700">← Back</button>
              <span className="text-slate-400">{rootTitle}</span>
              {trail.slice(0, -1).map((t) => <span key={t} className="text-slate-400">› {VIEW_TITLES[t] ?? t}</span>)}
              <span className="text-slate-400">›</span>
              <span className="font-semibold text-slate-900">{currentTitle}</span>
            </div>
          )}
          <div className="mx-auto max-w-5xl">
            <AnalysisView id={current} data={data} comparison={comparison} state={state} update={update} />
          </div>
          <div className="mx-auto mt-8 flex max-w-5xl flex-wrap gap-4 border-t border-slate-200 pt-4">
            {trail.length > 0 && <button type="button" onClick={onBack} className="text-xs font-semibold text-blue-700 hover:text-blue-900">← Back to {(VIEW_TITLES[trail.length > 1 ? trail[trail.length - 2] : view] ?? view).toLowerCase()}</button>}
            <button type="button" onClick={onToggle} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Close and continue reading</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StorySection({ id, number, eyebrow, title, tint = false, children }: { id: string; number: string; eyebrow: string; title: string; tint?: boolean; children: React.ReactNode }) {
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

function ReaderTools({ children }: { children: React.ReactNode }) {
  return (
    <details className="group mt-10 border-t border-slate-200 pt-5">
      <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 hover:text-blue-700">
        <span className="group-open:hidden">Why this matters · How estimated · Explore data +</span>
        <span className="hidden group-open:inline">Supporting detail −</span>
      </summary>
      <div className="mt-5 grid gap-4 md:grid-cols-3">{children}</div>
    </details>
  );
}

function ToolNote({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="border-l border-slate-300 pl-4 text-xs leading-5 text-slate-600"><p className="font-semibold text-slate-900">{title}</p><div className="mt-1">{children}</div></div>;
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
  return <div><p className="tnum text-2xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">{label}</p>{interval && <p className="mt-1 text-[11px] text-slate-400">95% UI {interval}</p>}</div>;
}

function FlowRow({ label, value, sub, width, tone }: { label: string; value: string; sub: string; width: number; tone: 'slate' | 'blue' }) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-4"><p className="text-sm font-medium text-slate-700">{label}</p><p className="tnum text-lg font-semibold text-slate-950">{value}</p></div>
      <div className="h-3 rounded-full bg-slate-100"><div className={`h-3 min-w-[0.4rem] rounded-full ${tone === 'blue' ? 'bg-blue-700' : 'bg-slate-800'}`} style={{ width: `${Math.min(100, Math.max(0.8, width))}%` }} /></div>
      <p className="mt-1.5 text-[11px] text-slate-400">{sub}</p>
    </div>
  );
}

function MiniResult({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="flex items-baseline justify-between gap-4 border-t border-slate-200 pt-3"><span className="text-slate-600">{label}</span><span className="text-right"><strong className="tnum font-semibold text-slate-950">{value}</strong><span className="mt-0.5 block text-[11px] text-slate-400">{detail}</span></span></div>;
}

function CoverageBar({ label, stat, note }: { label: string; stat: Stat | null; note: string }) {
  const pct = stat?.median ?? 0;
  return (
    <div className="grid gap-2 sm:grid-cols-[12rem_1fr_4.5rem] sm:items-center">
      <div><p className="text-sm font-medium text-slate-800">{label}</p><p className="text-[11px] text-slate-400">{note}</p></div>
      <div className="h-8 overflow-hidden rounded-md bg-white ring-1 ring-inset ring-slate-200"><div className="h-full bg-blue-700" style={{ width: `${Math.min(100, pct * 100)}%` }} /></div>
      <div className="sm:text-right"><p className="tnum text-lg font-semibold text-slate-950">{stat ? fmtPct(stat.median, 1) : '—'}</p>{stat && <p className="text-[10px] text-slate-400">{formatInterval(stat, (n) => fmtPct(n, 0))}</p>}</div>
    </div>
  );
}

function GateStatus({ status }: { status: 'quantified' | 'not_established' | 'unquantified' }) {
  const text = status === 'quantified' ? 'quantified' : status === 'not_established' ? 'not established' : 'unquantified';
  const cls = status === 'quantified' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500';
  return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${cls}`}>{text}</span>;
}

function ResidualCard({ title, total, share, complement, note, future = false }: { title: string; total: Stat; share: Stat; complement: number; note: string; future?: boolean }) {
  return (
    <div className="bg-white p-6">
      <p className="text-xs font-semibold text-slate-600">{title}</p>
      <div className="mt-4 flex items-end justify-between gap-4"><div><p className="tnum text-4xl font-semibold tracking-tight text-slate-950">{fmtPct(share.median, future ? 1 : 2)}</p><p className="mt-1 text-xs text-slate-500">of default birth-cohort denominator</p></div><p className="tnum text-sm font-medium text-slate-700">{fmtCompact(total.median)}/yr</p></div>
      <div className="mt-5 h-2 rounded-full bg-slate-100"><div className="h-2 min-w-[3px] rounded-full bg-blue-700" style={{ width: `${Math.max(0.3, share.median * 100)}%` }} /></div>
      <p className="mt-3 text-[11px] leading-5 text-slate-500">{fmtPct(complement, future ? 1 : 2)} outside this editing-relevant scenario. {note}</p>
      <p className="mt-1 text-[10px] text-slate-400">95% UI {formatInterval(share, (n) => fmtPct(n, future ? 1 : 2))}</p>
    </div>
  );
}

function InteractiveMetric({ value, label }: { value: string; label: string }) {
  return <div><p className="tnum text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{label}</p></div>;
}

function FrontierAxis({ number, title, body }: { number: string; title: string; body: string }) {
  return <div className="bg-white p-5 sm:p-6"><p className="font-mono text-xs text-blue-700">{number}</p><p className="mt-3 text-base font-semibold text-slate-950">{title}</p><p className="mt-2 text-xs leading-5 text-slate-500">{body}</p></div>;
}

function FrontierCount({ label, editing, selection }: { label: string; editing: string; selection: string }) {
  return (
    <div><p className="text-xs font-semibold text-slate-600">{label}</p><div className="mt-2 grid grid-cols-2 gap-3"><div className="border-t-2 border-blue-700 pt-2"><p className="tnum text-2xl font-semibold text-slate-950">{editing}</p><p className="text-[11px] text-slate-500">editing meets model viability threshold</p></div><div className="border-t-2 border-slate-400 pt-2"><p className="tnum text-2xl font-semibold text-slate-950">{selection}</p><p className="text-[11px] text-slate-500">selection viable or marginal</p></div></div></div>
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
          return <div key={d.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-1.5"><span>{d.name}</span><span className="min-w-max font-mono text-[10px] text-slate-400">edit RRR {fmtPct(present.editing.rrr, 0)} → {fmtPct(future.editing.rrr, 0)}</span></div>;
        })}
      </div>
    </div>
  );
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

function Definition({ term, value }: { term: string; value: string }) {
  return <div className="grid grid-cols-[9rem_1fr] gap-4 border-b border-slate-100 pb-2"><dt className="text-slate-500">{term}</dt><dd className="font-medium text-slate-800">{value}</dd></div>;
}

function DeepLink({ title, active, onClick }: { title: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-expanded={active} className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'}`}>{title}<span className={active ? 'text-slate-300' : 'text-slate-400'}>{active ? '×' : '+'}</span></button>;
}

function AssumptionsDrawer({ open, assumptions, setAssumptions, onClose, changed }: { open: boolean; assumptions: Assumptions; setAssumptions: (next: Assumptions) => void; onClose: () => void; changed: number }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Analysis assumptions">
      <button className="absolute inset-0 bg-slate-950/25" aria-label="Close assumptions" onClick={onClose} />
      <aside className="relative z-10 h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Reader controls</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Assumptions</h2><p className="mt-2 text-sm leading-6 text-slate-500">Change contestable choices and see the relevant figures respond. These controls do not alter the underlying source data.</p></div><button type="button" onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-800" aria-label="Close">×</button></div>
        <div className="mt-8 space-y-8">
          <ControlGroup label="What counts as serious disease?"><Segmented value={assumptions.severity} options={[["def_a","Narrow"],["def_b","Main"],["def_c","Broad"]]} onChange={(value) => setAssumptions({ ...assumptions, severity: value as SeverityDef })} /></ControlGroup>
          <ControlGroup label="How much multifactorial disease is attributed to genetics?"><Segmented value={assumptions.attribution} options={[["inclusive","Inclusive"],["heritability_weighted","Heritability-weighted"],["exclusive","Narrow"]]} onChange={(value) => setAssumptions({ ...assumptions, attribution: value as Attribution })} /></ControlGroup>
          <ControlGroup label="Affected-birth avoidance track"><ToggleLine checked={assumptions.pndCounts} onChange={(checked) => setAssumptions({ ...assumptions, pndCounts: checked })} title="Count prenatal diagnosis" detail="Counts affected-birth reduction only when followed by a reproductive decision not to continue an affected pregnancy." /></ControlGroup>
          <ControlGroup label="No-selectable-unaffected-embryo headline"><ToggleLine checked={assumptions.includeContested} onChange={(checked) => setAssumptions({ ...assumptions, includeContested: checked })} title="Include congenital deafness" detail="Shown separately by default because classifying congenital deafness as a disease-prevention target is ethically contested." /></ControlGroup>
        </div>
        <div className="mt-10 border-t border-slate-200 pt-5"><button type="button" onClick={() => setAssumptions(DEFAULTS)} disabled={changed === 0} className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 enabled:hover:border-blue-400 enabled:hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40">Reset to paper defaults{changed ? ` (${changed} changed)` : ''}</button><p className="mt-3 text-[11px] leading-5 text-slate-400">Editing-relevant population shares are generated against the paper's default denominator and are not recomputed from the severity/attribution controls in the browser.</p></div>
      </aside>
    </div>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) { return <fieldset><legend className="mb-3 text-sm font-semibold text-slate-900">{label}</legend>{children}</fieldset>; }

function Segmented({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <div className="grid gap-1 rounded-lg bg-slate-100 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>{options.map(([key, label]) => <button key={key} type="button" onClick={() => onChange(key)} className={`rounded-md px-2 py-2 text-[11px] font-semibold leading-4 ${value === key ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>)}</div>;
}

function ToggleLine({ checked, onChange, title, detail }: { checked: boolean; onChange: (checked: boolean) => void; title: string; detail: string }) {
  return <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-blue-700" /><span><span className="block text-sm font-medium text-slate-800">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span></span></label>;
}

function formatInterval(stat: Stat, formatter: (n: number) => string): string { return `${formatter(stat.ci95[0])}–${formatter(stat.ci95[1])}`; }
function formatDecimal(n: number): string { if (n >= 10) return n.toFixed(0); if (n >= 1) return n.toFixed(1).replace(/\.0$/, ''); return n.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''); }
function countChanged(a: Assumptions): number { return Number(a.severity !== DEFAULTS.severity) + Number(a.attribution !== DEFAULTS.attribution) + Number(a.pndCounts !== DEFAULTS.pndCounts) + Number(a.includeContested !== DEFAULTS.includeContested); }
function severityLabel(v: SeverityDef): string { return v === 'def_a' ? 'Narrow' : v === 'def_b' ? 'Main (paper default)' : 'Broad'; }
function attributionLabel(v: Attribution): string { if (v === 'inclusive') return 'Inclusive (paper default)'; if (v === 'heritability_weighted') return 'Heritability-weighted'; return 'Narrow / high-penetrance attribution'; }
