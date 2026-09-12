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
import { useUrlState } from '../urlState';
import { UncertaintyProvider } from '../uncertaintyMode';
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

type ViewDef = {
  id: string;
  label: string;
  short: string;
};

type GroupDef = {
  label: string;
  views: ViewDef[];
};

const GROUPS: GroupDef[] = [
  {
    label: 'Orientation',
    views: [{ id: 'overview', label: 'Overview', short: 'The argument and headline findings' }],
  },
  {
    label: 'Disease burden',
    views: [
      { id: 'denominator', label: 'Burden estimate', short: 'How much serious genetic disease?' },
      { id: 'library', label: 'Disease catalogue', short: 'Conditions, interventions and sources' },
    ],
  },
  {
    label: 'Impact now',
    views: [
      { id: 'prevention', label: 'Existing medicine', short: 'Screening, selection, diagnosis and treatment' },
      { id: 'realized', label: 'Predicted vs realized', short: 'Back-check modeled impact against programs' },
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
      { id: 'beyond', label: 'Resistance & enhancement', short: 'Distinct medical and ethical justifications' },
      { id: 'allocation', label: 'Exploratory costs', short: 'Provisional cost scenarios' },
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
    views: [{ id: 'methods', label: 'Methods & data', short: 'Assumptions, uncertainty, provenance and data' }],
  },
];

const ALL_VIEWS = GROUPS.flatMap((g) => g.views);
const VIEW_IDS = new Set(ALL_VIEWS.map((v) => v.id));

export default function AppV3() {
  const [data, setData] = useState<AllData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, update] = useUrlState({ tab: 'overview' });
  const [curveIndex, setCurveIndex] = useState(2);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = 'Reframing Genetic Medicine in Terms of Impact — v3';
    loadAll()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const activeView = VIEW_IDS.has(state.tab) ? state.tab : 'overview';
  const uncertaintyOn = state.unc === '1';

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeView]);

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
  const residual = data.residual.by_contested[includeContested ? 'with_contested' : 'without_contested'];
  const preventionGlobal = data.prevention.Global;
  const current = preventionGlobal?.current?.monogenic?.[pndKey];
  const expanded = preventionGlobal?.achievable_2035?.monogenic?.[pndKey];
  const ideal = preventionGlobal?.ideal?.monogenic?.[pndKey];
  const curve = data.embryos.curve;
  const point = curve[Math.min(curveIndex, Math.max(0, curve.length - 1))];

  const selectView = (id: string) => {
    update({ tab: id });
    window.setTimeout(() => {
      document.getElementById('analysis-explorer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  return (
    <UncertaintyProvider on={uncertaintyOn}>
      <div className="min-h-screen bg-white text-slate-950">
        <Hero
          data={data}
          burden={burden.total_serious}
          current={current?.total_averted_birth_fraction ?? null}
          ideal={ideal?.total_averted_birth_fraction ?? null}
          s1={residual.s1_total}
          onExplore={() => document.getElementById('analysis-explorer')?.scrollIntoView({ behavior: 'smooth' })}
        />

        <StickyNav />

        <main>
          <ArgumentMap onOpen={selectView} />
          <BurdenStory data={data} burden={burden} severity={severity} attribution={attribution} update={update} onOpen={selectView} />
          <ImpactNowStory current={current} expanded={expanded} ideal={ideal} pndOn={pndOn} update={update} onOpen={selectView} />
          <EditingStory data={data} residual={residual} includeContested={includeContested} update={update} onOpen={selectView} />
          <SelectionStory data={data} point={point} curveIndex={curveIndex} setCurveIndex={setCurveIndex} onOpen={selectView} />
          <FutureStory data={data} onOpen={selectView} />
          <AnalysisMap data={data} onOpen={selectView} />

          <section id="analysis-explorer" className="scroll-mt-16 border-t border-slate-200 bg-slate-50/70 py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-5">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Complete analysis</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-4xl">
                  Every analysis in one research page
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  The narrative above foregrounds the main argument. This explorer contains the full disease catalogue,
                  prevention model, editing technology analysis, polygenic scenarios, costs, funding analysis,
                  value-perspective analysis, retrospective validation, methods, provenance and uncertainty — without
                  leaving v3.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-2 border-y border-slate-200 py-3 text-xs">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 lg:hidden"
                >
                  {sidebarOpen ? 'Hide analyses' : 'Choose analysis'}
                </button>
                <label className="ml-auto flex cursor-pointer items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={uncertaintyOn}
                    onChange={(e) => update({ unc: e.target.checked ? '1' : '' })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                  />
                  Show 95% uncertainty intervals
                </label>
              </div>

              <div className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
                <ExplorerNav
                  active={activeView}
                  open={sidebarOpen}
                  onSelect={selectView}
                />
                <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
                  <AnalysisView id={activeView} data={data} state={state} update={update} />
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Analysis commit <span className="font-mono text-slate-700">{data.meta.commit}</span> · model{' '}
              {data.meta.spec_version} · {fmtInt(data.meta.n_draws)} Monte Carlo draws
            </p>
            <div className="flex flex-wrap gap-4">
              <a className="hover:text-blue-700" href={`${REPO_URL}/tree/main/results`} target="_blank" rel="noreferrer">
                Results & data ↗
              </a>
              <a className="hover:text-blue-700" href={REPO_URL} target="_blank" rel="noreferrer">
                Repository ↗
              </a>
            </div>
          </div>
        </footer>
      </div>
    </UncertaintyProvider>
  );
}

function Hero({
  data,
  burden,
  current,
  ideal,
  s1,
  onExplore,
}: {
  data: AllData;
  burden: Stat;
  current: Stat | null;
  ideal: Stat | null;
  s1: Stat;
  onExplore: () => void;
}) {
  return (
    <header className="border-b border-slate-200 bg-[radial-gradient(circle_at_80%_0%,#dbeafe_0%,transparent_34%),linear-gradient(180deg,#f8fbff_0%,#ffffff_72%)]">
      <div className="mx-auto max-w-7xl px-5 pb-14 pt-9 sm:pt-14">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          <span>Research companion · v3</span>
          <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 normal-case tracking-normal text-slate-600">
            Complete analysis integrated
          </span>
        </div>
        <div className="mt-12 max-w-5xl">
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[4rem] lg:leading-[1.02]">
            Reframing Genetic Medicine in Terms of Impact
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
            What can genetic medicine achieve now? Where does germline editing add something distinct? How could
            that change as causal knowledge, reproductive technologies and editing capacity improve?
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
          <HeroStat value={fmtCompact(burden.median)} label="modeled serious genetic-disease burden per annual birth cohort" detail={formatInterval(burden, fmtCompact)} />
          <HeroStat
            value={current && ideal ? `${fmtPct(current.median, 1)} → ${fmtPct(ideal.median, 1)}` : '—'}
            label="monogenic affected-birth avoidance: current coverage → idealized full coverage"
          />
          <HeroStat value={fmtCompact(s1.median)} label="births/year where no unaffected embryo can be selected" detail={formatInterval(s1, fmtCompact)} />
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-4 text-sm">
          <a href="#argument" className="rounded-full bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-blue-700">
            Follow the argument ↓
          </a>
          <button onClick={onExplore} className="font-semibold text-blue-700 hover:text-blue-900">
            Open complete analysis ↓
          </button>
          <span className="text-slate-400">Analysis and manuscript remain under development.</span>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Pipeline: {data.meta.spec_version} · seed {data.meta.seed} · {fmtInt(data.meta.n_draws)} draws
        </p>
      </div>
    </header>
  );
}

function StickyNav() {
  const items = [
    ['#argument', 'Argument'],
    ['#burden', 'Burden'],
    ['#impact-now', 'Impact now'],
    ['#editing', 'Editing frontier'],
    ['#selection', 'Selection vs correction'],
    ['#future', 'Future impact'],
    ['#analysis-map', 'Analysis map'],
    ['#analysis-explorer', 'Complete analysis'],
  ];
  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur no-print">
      <nav className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-5 py-3 text-xs font-medium text-slate-500" aria-label="Research page">
        {items.map(([href, label]) => (
          <a key={href} href={href} className="min-w-max hover:text-blue-700">{label}</a>
        ))}
      </nav>
    </div>
  );
}

function ArgumentMap({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <StorySection id="argument" eyebrow="The argument" title="Three horizons, one impact framework">
      <p className="story-prose">
        Genetic medicine should be evaluated by what it can accomplish, for whom, with what alternatives, and at
        what level of technological maturity. That produces three linked questions rather than a single verdict on
        germline editing.
      </p>
      <div className="mt-9 grid gap-4 lg:grid-cols-3">
        <HorizonCard
          number="01"
          kicker="Impact now"
          title="Scale what already works"
          body="Established screening, reproductive, diagnostic and therapeutic tools already have large potential impact. The main present constraint is often implementation and access."
          onClick={() => onOpen('prevention')}
        />
        <HorizonCard
          number="02"
          kicker="Translational frontier"
          title="Identify where editing is distinct"
          body="The clearest present rationale begins where embryo selection cannot achieve the medically relevant outcome, then becomes a proportionality question as selection becomes burdensome."
          onClick={() => onOpen('residual')}
        />
        <HorizonCard
          number="03"
          kicker="Future impact"
          title="Track a moving frontier"
          body="Improved causal inference, embryo availability and multiplex editing could expand the role of germline intervention, especially for complex disease."
          onClick={() => onOpen('multifactorial')}
        />
      </div>
    </StorySection>
  );
}

function BurdenStory({
  data,
  burden,
  severity,
  attribution,
  update,
  onOpen,
}: {
  data: AllData;
  burden: AllData['burden']['grid'][SeverityDef][Attribution];
  severity: SeverityDef;
  attribution: Attribution;
  update: (patch: Record<string, string>) => void;
  onOpen: (id: string) => void;
}) {
  const monoShare = burden.monogenic.median / burden.total_serious.median;
  const multiShare = burden.multifactorial.median / burden.total_serious.median;
  return (
    <StorySection id="burden" eyebrow="Disease burden" title="Start with the burden, not the technology">
      <p className="story-prose">
        The denominator is deliberately exposed. The model starts with annual global births, estimates serious
        monogenic disease, and then varies how broadly multifactorial disease is counted and attributed to genetics.
      </p>

      <div className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <ControlSelect label="Severity definition" value={severity} onChange={(v) => update({ severity: v })} options={[
          ['def_a', 'Narrow'], ['def_b', 'Main (default)'], ['def_c', 'Broad'],
        ]} />
        <ControlSelect label="Multifactorial attribution" value={attribution} onChange={(v) => update({ attribution: v })} options={[
          ['inclusive', 'Broad'], ['heritability_weighted', 'Heritability-weighted'], ['exclusive', 'Narrow genetic'],
        ]} />
        <Metric label="Annual global births" value={fmtCompact(data.summary.births_per_year.median)} />
        <Metric label="Serious genetic disease" value={fmtCompact(burden.total_serious.median)} detail={fmtPct(burden.serious_share_of_births.median, 2)} />
      </div>

      <div className="mt-7">
        <div className="flex h-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <div className="flex items-center bg-blue-700 px-4 text-xs font-semibold text-white" style={{ width: `${monoShare * 100}%` }}>
            {monoShare > 0.1 ? 'Monogenic' : ''}
          </div>
          <div className="flex items-center justify-end bg-blue-100 px-4 text-xs font-semibold text-blue-950" style={{ width: `${multiShare * 100}%` }}>
            Multifactorial
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <MiniMetric label="Serious monogenic" value={fmtCompact(burden.monogenic.median)} detail={formatInterval(burden.monogenic, fmtCompact)} />
          <MiniMetric label="Serious multifactorial / partly genetic" value={fmtCompact(burden.multifactorial.median)} detail={formatInterval(burden.multifactorial, fmtCompact)} />
        </div>
      </div>

      <StoryActions actions={[
        ['Open burden model', () => onOpen('denominator')],
        ['Open disease catalogue', () => onOpen('library')],
      ]} />
    </StorySection>
  );
}

function ImpactNowStory({
  current,
  expanded,
  ideal,
  pndOn,
  update,
  onOpen,
}: {
  current: AllData['prevention'][string][string]['monogenic'][PndKey] | undefined;
  expanded: AllData['prevention'][string][string]['monogenic'][PndKey] | undefined;
  ideal: AllData['prevention'][string][string]['monogenic'][PndKey] | undefined;
  pndOn: boolean;
  update: (patch: Record<string, string>) => void;
  onOpen: (id: string) => void;
}) {
  const scenarios = [
    ['Current modeled coverage', current],
    ['Expanded-access 2035', expanded],
    ['Idealized full coverage', ideal],
  ] as const;
  return (
    <StorySection id="impact-now" eyebrow="Impact now" title="Existing genetic medicine already changes outcomes at scale">
      <p className="story-prose">
        Carrier screening, IVF with PGT-M, prenatal diagnosis and newborn screening are not morally or clinically
        interchangeable. The model therefore separates affected-birth avoidance from postnatal disease-burden
        mitigation and shows how much additional impact comes from broader coverage.
      </p>
      <div className="mt-7 flex items-center gap-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-slate-700">
          <input type="checkbox" checked={pndOn} onChange={(e) => update({ pnd: e.target.checked ? '' : 'off' })} className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500" />
          Include prenatal diagnosis + reproductive decision in affected-birth avoidance
        </label>
      </div>
      <div className="mt-7 space-y-5">
        {scenarios.map(([label, leaf]) => {
          const value = leaf?.total_averted_birth_fraction.median ?? 0;
          const burden = leaf?.total_averted_burden_fraction.median ?? 0;
          return (
            <div key={label}>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <p className="mt-1 text-xs text-slate-500">Disease burden mitigated: {fmtPct(burden, 1)}</p>
                </div>
                <span className="tnum text-xl font-semibold text-slate-950">{fmtPct(value, 1)}</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-700" style={{ width: `${Math.min(100, value * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <StoryActions actions={[
        ['Explore existing medicine', () => onOpen('prevention')],
        ['Compare predicted vs realized', () => onOpen('realized')],
      ]} />
    </StorySection>
  );
}

function EditingStory({
  data,
  residual,
  includeContested,
  update,
  onOpen,
}: {
  data: AllData;
  residual: AllData['residual']['by_contested'][keyof AllData['residual']['by_contested']];
  includeContested: boolean;
  update: (patch: Record<string, string>) => void;
  onOpen: (id: string) => void;
}) {
  const gates = data.editingTech.gates;
  const tract = data.editingTech.by_tractability;
  return (
    <StorySection id="editing" eyebrow="Translational frontier" title="Selection failing is the first gate, not the last">
      <p className="story-prose">
        The near-term editing case begins with reproductive configurations in which no unaffected embryo can be
        selected. That is a distinct medical problem. But selection failure alone does not establish that correction
        is technically possible, works in an embryo, or is safe enough to justify use.
      </p>
      <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={includeContested} onChange={(e) => update({ deaf: e.target.checked ? '1' : '0' })} className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500" />
        Include congenital deafness in the editing-only prevention estimate
      </label>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Metric label="No selectable unaffected embryo" value={fmtCompact(residual.s1_total.median)} detail={`${formatInterval(residual.s1_total, fmtCompact)} / year`} />
        <Metric label="Current-evidence editing-relevant scenario" value={fmtPct(residual.uniquely_editable_share_of_serious.strict.median, 2)} detail={fmtCompact(residual.uniquely_editable_total.strict.median)} />
        <Metric label="Future-capacity exploratory scenario" value={fmtPct(residual.uniquely_editable_share_of_serious.permissive.median, 2)} detail={fmtCompact(residual.uniquely_editable_total.permissive.median)} />
      </div>

      <div className="mt-9 grid gap-3 md:grid-cols-4">
        {gates.map((gate, i) => (
          <div key={gate.key} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Gate {i + 1}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${gate.status === 'quantified' ? 'bg-blue-700' : 'bg-slate-300'}`} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-950">{gate.label}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{gate.question}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-900">Among the headline S1 population, Gate 2 already divides the field</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MiniMetric label={tract.base_editable.label} value={fmtCompact(tract.base_editable.births_per_year)} />
          <MiniMetric label={tract.prime_only.label} value={fmtCompact(tract.prime_only.births_per_year)} />
          <MiniMetric label={tract.no_current_route.label} value={fmtCompact(tract.no_current_route.births_per_year)} />
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">This is molecular tractability only. Embryo performance and safety remain separate, unresolved gates.</p>
      </div>

      <StoryActions actions={[
        ['Open editing-only prevention', () => onOpen('residual')],
        ['Open technology gates', () => onOpen('editing-tech')],
      ]} />
    </StorySection>
  );
}

function SelectionStory({
  data,
  point,
  curveIndex,
  setCurveIndex,
  onOpen,
}: {
  data: AllData;
  point: AllData['embryos']['curve'][number];
  curveIndex: number;
  setCurveIndex: (i: number) => void;
  onOpen: (id: string) => void;
}) {
  const u = point?.u ?? 0.5;
  return (
    <StorySection id="selection" eyebrow="Reproductive burden" title="Selection becomes burdensome before it becomes impossible">
      <p className="story-prose">
        If the expected unaffected-embryo fraction is <em>u</em>, selection implies an expected{' '}
        <span className="font-mono text-sm text-slate-700">(1−u)/u</span> affected-genotype embryos not selected for
        transfer per unaffected embryo obtained. The relationship rises sharply as unaffected embryos become rare.
      </p>
      <div className="mt-8 grid gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Expected unaffected-embryo fraction</p>
              <p className="mt-1 text-xs text-slate-500">Move across the precomputed selection curve.</p>
            </div>
            <span className="tnum text-3xl font-semibold tracking-tight">{fmtPct(u, 0)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, data.embryos.curve.length - 1)}
            step={1}
            value={curveIndex}
            onChange={(e) => setCurveIndex(Number(e.target.value))}
            className="mt-5 w-full accent-blue-700"
          />
          <div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>More unaffected embryos</span><span>Fewer unaffected embryos</span></div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <MiniMetric label="Affected-genotype embryos not selected per unaffected embryo" value={fmtNumber(point?.selection_affected_discarded ?? 0)} />
          <MiniMetric label="Expected blastocysts under selection" value={fmtNumber(point?.selection_blastocysts ?? 0)} detail={`Idealized correction: ${fmtNumber(point?.editing_blastocysts ?? 0)}`} />
        </div>
      </div>
      <p className="mt-4 max-w-3xl text-xs leading-5 text-slate-500">
        Idealized successful correction has zero genotype-based exclusions by construction. That does not mean zero attrition: editing failure, mosaicism, unintended changes and developmental loss remain outside this simple comparison.
      </p>
      <StoryActions actions={[[ 'Open full selection-vs-correction analysis', () => onOpen('embryos') ]]} />
    </StorySection>
  );
}

function FutureStory({ data, onOpen }: { data: AllData; onOpen: (id: string) => void }) {
  const present = data.multifactorial.frontier.present;
  const future = data.multifactorial.frontier.near_future;
  return (
    <StorySection id="future" eyebrow="Future impact" title="The future frontier moves along three different axes">
      <p className="story-prose">
        Polygenic intervention becomes more consequential only if several constraints move together. Better variant
        interpretation can improve the knowledge side without implying that correction is possible or safe.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <AxisCard number="01" title="Causal knowledge" body="Which variants are genuinely causal, directionally beneficial and sufficiently free of adverse pleiotropy?" />
        <AxisCard number="02" title="Embryos available for selection" body="More embryos can increase the power of selection, including through future reproductive technologies such as IVG." />
        <AxisCard number="03" title="Loci that can be edited" body="Multiplex capacity, molecular tractability, embryo performance and safety determine what correction could actually achieve." />
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <Metric label="Current-capacity scenario" value={`${present.editing_viable}/${data.multifactorial.n_diseases}`} detail="modeled complex-disease exemplars where editing meets the viability threshold" />
        <Metric label="Future high-capacity scenario" value={`${future.editing_viable}/${data.multifactorial.n_diseases}`} detail="modeled exemplars under the future-capacity assumptions" />
      </div>
      <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
        <p className="text-sm font-semibold text-blue-950">AlphaGenome illustrates movement on the interpretation axis — not the correction axis.</p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-900/75">
          Genome-wide sequence-to-function prediction can improve prioritization and molecular interpretation of variants.
          It does not establish trait-level causal effect, provide liability variance, make a molecular correction feasible,
          demonstrate embryo performance, or resolve safety. The analysis therefore cites this frontier without using its predictions as model inputs.
        </p>
        <a href={ALPHAGENOME_URL} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-blue-700 hover:text-blue-900">AlphaGenome Atlas context ↗</a>
      </div>
      <StoryActions actions={[[ 'Open polygenic frontier', () => onOpen('multifactorial') ]]} />
    </StorySection>
  );
}

function AnalysisMap({ data, onOpen }: { data: AllData; onOpen: (id: string) => void }) {
  const items = [
    ['library', 'Disease catalogue', `${fmtInt(data.library.rollup.n_diseases_all)} conditions`, 'Inspect genetic basis, severity, incidence, screening, reproductive pathways and treatment.'],
    ['beyond', 'Resistance & enhancement', 'Separate questions', 'Keep disease prevention, resistance and non-disease enhancement analytically and ethically distinct.'],
    ['allocation', 'Exploratory costs', 'Provisional', 'Inspect the cost assumptions without treating them as core results.'],
    ['funding', 'Impact funding', `${fmtInt(data.opportunities.opportunities.length)} opportunities`, 'Compare implementation and research opportunities under the model’s funding framework.'],
    ['perspectives', 'Whose values?', `${fmtInt(data.perspectives.meta.n_perspectives)} perspectives`, 'See where different normative weighting schemes converge or disagree.'],
    ['realized', 'Predicted vs realized', `${fmtInt(data.retroactive.validation.length)} validation cases`, 'Compare model expectations with observed program outcomes where retrospective checks are available.'],
    ['methods', 'Methods, uncertainty & sources', `${fmtInt(data.meta.n_draws)} draws`, 'Audit assumptions, provenance, uncertainty, normative choices and model construction.'],
  ];
  return (
    <StorySection id="analysis-map" eyebrow="Beyond the headline" title="The analysis is broader than the central editing comparison">
      <p className="story-prose">
        v3 keeps the main argument legible while bringing the supporting analyses into the same page. Each module below opens directly in the complete analysis explorer.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([id, title, meta, body]) => (
          <button key={id} onClick={() => onOpen(id)} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">{meta}</p>
            <p className="mt-2 text-base font-semibold text-slate-950 group-hover:text-blue-800">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
            <span className="mt-4 inline-block text-xs font-semibold text-blue-700">Open analysis →</span>
          </button>
        ))}
      </div>
    </StorySection>
  );
}

function ExplorerNav({ active, open, onSelect }: { active: string; open: boolean; onSelect: (id: string) => void }) {
  return (
    <aside className={`${open ? 'block' : 'hidden'} lg:block`}>
      <div className="lg:sticky lg:top-14 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pr-3">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{group.label}</p>
            <div className="space-y-1">
              {group.views.map((view) => {
                const selected = active === view.id;
                return (
                  <button
                    key={view.id}
                    onClick={() => onSelect(view.id)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition ${selected ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-white hover:text-blue-800'}`}
                  >
                    <span className="block text-sm font-semibold">{view.label}</span>
                    <span className={`mt-0.5 block text-[11px] leading-4 ${selected ? 'text-slate-300' : 'text-slate-400'}`}>{view.short}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function AnalysisView({ id, data, state, update }: { id: string; data: AllData; state: Record<string, string>; update: (patch: Record<string, string>) => void }) {
  if (id === 'overview') return <Overview data={data} state={state} update={update} />;
  if (id === 'library') return <Library data={data} state={state} update={update} />;
  if (id === 'denominator') return <Denominator data={data} state={state} update={update} />;
  if (id === 'prevention') return <Prevention data={data} state={state} update={update} />;
  if (id === 'multifactorial') return <Multifactorial data={data} state={state} update={update} />;
  if (id === 'residual') return <Residual data={data} state={state} update={update} />;
  if (id === 'editing-tech') return <EditingTech data={data} state={state} update={update} />;
  if (id === 'embryos') return <Embryos data={data} state={state} update={update} />;
  if (id === 'beyond') return <Beyond data={data} state={state} update={update} />;
  if (id === 'ethics') return <EthicsPolicy data={data} state={state} update={update} />;
  if (id === 'allocation') return <Allocation data={data} />;
  if (id === 'funding') return <ImpactFunding data={data} state={state} update={update} />;
  if (id === 'perspectives') return <Perspectives data={data} state={state} update={update} />;
  if (id === 'realized') return <Realized data={data} state={state} update={update} />;
  if (id === 'methods') return <Methods data={data} state={state} update={update} />;
  return <Overview data={data} state={state} update={update} />;
}

function StorySection({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 border-b border-slate-100 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p>
        <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-4xl">{title}</h2>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

function HorizonCard({ number, kicker, title, body, onClick }: { number: string; kicker: string; title: string; body: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group rounded-2xl border border-slate-200 bg-white p-6 text-left hover:border-blue-300 hover:shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.13em]"><span className="text-blue-700">{kicker}</span><span className="text-slate-300">{number}</span></div>
      <p className="mt-4 text-xl font-semibold tracking-tight text-slate-950 group-hover:text-blue-800">{title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-500">{body}</p>
      <span className="mt-5 inline-block text-xs font-semibold text-blue-700">Explore →</span>
    </button>
  );
}

function AxisCard({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold text-blue-700">{number}</p>
      <p className="mt-2 text-base font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function HeroStat({ value, label, detail }: { value: string; label: string; detail?: string }) {
  return (
    <div className="bg-white p-5 sm:p-6">
      <p className="tnum text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-5 text-slate-600">{label}</p>
      {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium leading-4 text-slate-500">{label}</p>
      <p className="tnum mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      {detail && <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p>}
    </div>
  );
}

function MiniMetric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs leading-4 text-slate-500">{label}</p>
      <p className="tnum mt-1 text-lg font-semibold text-slate-950">{value}</p>
      {detail && <p className="mt-1 text-[11px] leading-4 text-slate-400">{detail}</p>}
    </div>
  );
}

function ControlSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function StoryActions({ actions }: { actions: [string, () => void][] }) {
  return (
    <div className="mt-7 flex flex-wrap gap-4 text-sm">
      {actions.map(([label, action]) => (
        <button key={label} onClick={action} className="font-semibold text-blue-700 hover:text-blue-900">{label} →</button>
      ))}
    </div>
  );
}

function formatInterval(stat: Stat, fmt: (n: number) => string): string {
  return `95% interval ${fmt(stat.ci95[0])}–${fmt(stat.ci95[1])}`;
}

function fmtNumber(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 100) return fmtInt(n);
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(2).replace(/\.00$/, '');
}
