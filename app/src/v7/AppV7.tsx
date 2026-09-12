import { useEffect, useState } from 'react';
import { AllData, loadAll, fmtCompact, fmtPct } from '../data';
import { useUrlState } from '../urlState';
import { UncertaintyProvider } from '../uncertaintyMode';
import Tabs, { TabDef } from '../components/Tabs';
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

// Two-layer navigation. The top level is the argument in six steps; specialized analyses
// live inside sections as sub-views instead of competing as equal tabs. Each sub-view keeps
// its own stable `tab` id so existing shared URLs continue to work.
interface ViewDef {
  id: string;
  /** Short label used in the sub-navigation pills and prev/next journey. */
  label: string;
}
interface SectionDef {
  id: string;
  label: string;
  views: ViewDef[];
}

const SECTIONS: SectionDef[] = [
  { id: 'sec-overview', label: 'Overview', views: [{ id: 'overview', label: 'Overview' }] },
  {
    id: 'sec-map',
    label: 'Disease burden',
    views: [
      { id: 'denominator', label: 'Burden estimate' },
      { id: 'library', label: 'Disease catalogue' },
    ],
  },
  {
    id: 'sec-existing',
    label: 'Existing medicine',
    views: [{ id: 'prevention', label: 'Impact now' }],
  },
  {
    id: 'sec-editing',
    label: 'Role of editing',
    views: [
      { id: 'residual', label: 'When selection is not enough' },
      { id: 'embryos', label: 'Selection vs correction' },
      { id: 'editing-tech', label: 'Which technology?' },
      { id: 'multifactorial', label: 'Polygenic frontier' },
    ],
  },
  {
    id: 'sec-ethics',
    label: 'Ethics & policy',
    views: [
      { id: 'ethics', label: 'Policy implications' },
      { id: 'beyond', label: 'Resistance & enhancement' },
      { id: 'allocation', label: 'Exploratory costs' },
    ],
  },
  {
    id: 'sec-funding',
    label: 'Impact funding',
    views: [
      { id: 'funding', label: 'Opportunities' },
      { id: 'perspectives', label: 'Whose values?' },
      { id: 'realized', label: 'Predicted vs realized' },
    ],
  },
  {
    id: 'sec-methods',
    label: 'Methods & data',
    views: [{ id: 'methods', label: 'Methods & data' }],
  },
];

// Old view ids from previously shared URLs → their current home.
const LEGACY_TABS: Record<string, string> = {
  resistance: 'beyond',
  enhancement: 'beyond',
};

const ALL_VIEWS: ViewDef[] = SECTIONS.flatMap((s) => s.views);

function sectionOf(viewId: string): SectionDef {
  return SECTIONS.find((s) => s.views.some((v) => v.id === viewId)) ?? SECTIONS[0];
}

// ---- Research-artifact masthead metadata ----
const REPO_URL = 'https://github.com/alethicresearch/genmed-impact';
const DATA_ARCHIVE_URL = `${REPO_URL}/tree/main/results`;

const BIBTEX = `@software{genmed_impact,
  title  = {Reframing Genetic Editing in Terms of Medical Impact},
  author = {{Authors to be listed at manuscript submission}},
  year   = {2026},
  url    = {https://github.com/alethicresearch/genmed-impact},
  note   = {Version 0.1.0. Code Apache-2.0; curated data CC-BY-4.0.}
}`;


/**
 * The entry landing: what the project is, in three claims and three numbers. Shown above the
 * Overview only — every other tab is an analysis view and gets the compact masthead alone.
 */
function Landing({ data, onGo }: { data: AllData; onGo: (tab: string) => void }) {
  const burden = data.summary.burden_default.total_serious;
  const s1 = data.summary.s1_total;
  const cur = data.prevention.Global?.current?.monogenic?.pnd_on?.total_averted_birth_fraction;
  const ideal = data.prevention.Global?.ideal?.monogenic?.pnd_on?.total_averted_birth_fraction;
  return (
    <section className="mb-6 border-b border-slate-200 pb-6">
      <p className="max-w-[34rem] text-[1.0625rem] leading-[1.6] text-slate-600">
        Most debate about genetic medicine is about editing embryos. This asks a plainer question:
        where would it actually help, and what already works without it?
      </p>

      <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
        <Horizon
          kicker="What we can do today"
          title="The tools already exist. Most families cannot get them."
          body="Carrier testing, choosing between IVF embryos, prenatal tests and treatment at birth are all established medicine. What limits them is who can reach them."
          onClick={() => onGo('prevention')}
        />
        <Horizon
          kicker="Where editing would be new"
          title="Some couples have no healthy embryo to choose from"
          body="For a few thousand couples a year, every embryo they could conceive would inherit the condition. Choosing between embryos cannot help them, and editing is the only route that could."
          onClick={() => onGo('residual')}
        />
        <Horizon
          kicker="The longer term"
          title="Common illnesses work in a different way"
          body="Risk for conditions like heart disease is spread across thousands of small genetic differences at once, so changing any one of them barely moves it."
          onClick={() => onGo('multifactorial')}
        />
      </div>

      <div className="mt-6 grid gap-6 border-t border-slate-200 pt-5 sm:grid-cols-3">
        <HeroStat
          value={fmtCompact(burden.median)}
          label="births a year with serious genetic disease"
          interval={`${fmtCompact(burden.ci95[0])}–${fmtCompact(burden.ci95[1])}`}
        />
        <HeroStat
          value={cur && ideal ? `${fmtPct(cur.median, 1)} → ${fmtPct(ideal.median, 1)}` : '—'}
          label="of single-gene cases could be avoided with today’s access — nearly all of them if everyone could reach it"
        />
        <HeroStat
          value={fmtCompact(s1.median)}
          label="births a year where no unaffected embryo could be selected"
          interval={`${fmtCompact(s1.ci95[0])}–${fmtCompact(s1.ci95[1])}`}
        />
      </div>
    </section>
  );
}

function Horizon({ kicker, title, body, onClick }: { kicker: string; title: string; body: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group bg-white p-5 text-left transition-colors hover:bg-accent-soft/40">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">{kicker}</p>
      <p className="mt-2 text-base font-semibold text-slate-900 group-hover:text-accent">{title}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{body}</p>
    </button>
  );
}

function HeroStat({ value, label, interval }: { value: string; label: string; interval?: string }) {
  return (
    <div>
      <p className="tnum text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">{label}</p>
      {interval && <p className="mt-1 text-[11px] text-slate-400">95% uncertainty interval {interval}</p>}
    </div>
  );
}

export default function AppV7() {
  const [data, setData] = useState<AllData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, update] = useUrlState({ tab: 'overview' });

  useEffect(() => {
    document.title = 'Reframing Genetic Editing in Terms of Medical Impact — v7';
    loadAll()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const requested = LEGACY_TABS[state.tab] ?? state.tab;
  const activeView = ALL_VIEWS.some((v) => v.id === requested) ? requested : 'overview';
  const activeSection = sectionOf(activeView);

  // Navigating to another view starts the reader at its top; other URL-state changes
  // (filters, toggles) keep the scroll position.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  const uncertaintyOn = state.unc === '1';
  const sectionTabs: TabDef[] = SECTIONS.map((s) => ({ id: s.id, label: s.label }));
  const onPickSection = (secId: string) => {
    const sec = SECTIONS.find((s) => s.id === secId);
    if (sec) update({ tab: sec.views[0].id });
  };

  const activeIdx = ALL_VIEWS.findIndex((v) => v.id === activeView);
  const prevView = activeIdx > 0 ? ALL_VIEWS[activeIdx - 1] : null;
  const nextView =
    activeIdx >= 0 && activeIdx < ALL_VIEWS.length - 1 ? ALL_VIEWS[activeIdx + 1] : null;

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col px-4 pb-16 pt-6">
      <header className="mb-5 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => update({ tab: 'overview' })}
          title="Back to overview"
          className="rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 hover:text-accent">
            Reframing Genetic Editing in Terms of Medical Impact
          </h1>
        </button>
        <p className="mt-2">
          <span
            className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800"
            title="The analysis and the accompanying manuscript are still under development; figures may change."
          >
            ⚠ Work in progress — analysis &amp; manuscript under development
          </span>
        </p>
        {/* hero action row (matches the alethic research-page house style) */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span
            className="inline-flex cursor-not-allowed items-center gap-1 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-400"
            title="Preprint in preparation — link coming"
          >
            ↓ Read the paper
          </span>
          <a
            href={DATA_ARCHIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-accent hover:text-accent"
          >
            ↗ Results &amp; data
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-accent hover:text-accent"
          >
            ↗ Project repo
          </a>
          <button
            type="button"
            onClick={() =>
              document.getElementById('citation')?.scrollIntoView({ behavior: 'smooth' })
            }
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-accent hover:text-accent"
          >
            Cite ↓
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          Failed to load data: {error}
        </div>
      )}

      {!error && !data && (
        <div className="py-16 text-center text-slate-500">Loading…</div>
      )}

      {data && (
        <>
          <Tabs tabs={sectionTabs} active={activeSection.id} onChange={onPickSection} />
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            {activeSection.views.length > 1 ? (
              <SubNav
                views={activeSection.views}
                active={activeView}
                onPick={(id) => update({ tab: id })}
              />
            ) : (
              <span />
            )}
            <UncertaintyToggle
              on={uncertaintyOn}
              onChange={(v) => update({ unc: v ? '1' : '' })}
              onExplain={() => update({ tab: 'methods' })}
            />
          </div>
          <UncertaintyProvider on={uncertaintyOn}>
          <main className="mt-5 flex-1">
            <div
              role="tabpanel"
              id={`panel-${activeSection.id}`}
              aria-labelledby={`tab-${activeSection.id}`}
            >
              {activeView === 'overview' && (
                <>
                  <Landing data={data} onGo={(tab) => update({ tab })} />
                  <Overview data={data} state={state} update={update} showHorizons={false} />
                </>
              )}
              {activeView === 'library' && (
                <Library data={data} state={state} update={update} />
              )}
              {activeView === 'denominator' && (
                <Denominator data={data} state={state} update={update} />
              )}
              {activeView === 'prevention' && (
                <Prevention data={data} state={state} update={update} />
              )}
              {activeView === 'multifactorial' && (
                <Multifactorial data={data} state={state} update={update} />
              )}
              {activeView === 'residual' && (
                <Residual data={data} state={state} update={update} />
              )}
              {activeView === 'editing-tech' && (
                <EditingTech data={data} state={state} update={update} />
              )}
              {activeView === 'embryos' && (
                <Embryos data={data} state={state} update={update} />
              )}
              {activeView === 'beyond' && (
                <Beyond data={data} state={state} update={update} />
              )}
              {activeView === 'ethics' && (
                <EthicsPolicy data={data} state={state} update={update} />
              )}
              {activeView === 'allocation' && <Allocation data={data} />}
              {activeView === 'funding' && (
                <ImpactFunding data={data} state={state} update={update} />
              )}
              {activeView === 'perspectives' && (
                <Perspectives data={data} state={state} update={update} />
              )}
              {activeView === 'realized' && (
                <Realized data={data} state={state} update={update} />
              )}
              {activeView === 'methods' && (
                <Methods data={data} state={state} update={update} />
              )}
            </div>
          </main>
          </UncertaintyProvider>

          <PrevNext prev={prevView} next={nextView} onGo={(id) => update({ tab: id })} />
          <CiteSection />
          <Footer commit={data.meta.commit} />
        </>
      )}
    </div>
  );
}

// "Cite this work" — BibTeX block with a copy button, matching the alethic research-page style.
function CiteSection() {
  const [copied, setCopied] = useState(false);
  return (
    <section id="citation" aria-labelledby="citation-heading" className="mt-10">
      <h2 id="citation-heading" className="text-lg font-semibold text-slate-900">
        Cite this work
      </h2>
      <div className="relative mt-3">
        <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700">
          {BIBTEX}
        </pre>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(BIBTEX).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
          aria-label="Copy BibTeX citation"
          className="absolute right-2 top-2 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
    </section>
  );
}

// Second navigation level: the views inside the active section, as a pill row.
function SubNav({
  views,
  active,
  onPick,
}: {
  views: ViewDef[];
  active: string;
  onPick: (id: string) => void;
}) {
  return (
    <nav aria-label="Section contents" className="no-print mt-3 flex flex-wrap gap-1.5">
      {views.map((v) => {
        const selected = v.id === active;
        return (
          <button
            key={v.id}
            type="button"
            aria-current={selected ? 'page' : undefined}
            onClick={() => onPick(v.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              selected
                ? 'border-accent bg-accent text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-accent hover:text-accent'
            }`}
          >
            {v.label}
          </button>
        );
      })}
    </nav>
  );
}

// Journey navigation — move through the argument in order, like turning pages.
/**
 * Site-wide control for showing uncertainty intervals. It changes what is displayed, never
 * what is calculated — the estimate is the same Monte-Carlo median with the checkbox in
 * either position.
 */
function UncertaintyToggle({
  on,
  onChange,
  onExplain,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  onExplain: () => void;
}) {
  return (
    <div className="no-print pt-1 text-right">
      <div className="flex items-center justify-end gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={on}
            onChange={(e) => onChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-accent focus:ring-accent"
          />
          Add uncertainty
        </label>
        {on && (
          <button
            type="button"
            onClick={onExplain}
            className="text-xs text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            How these are calculated
          </button>
        )}
      </div>
      {on && (
        // Not every figure is a modelled estimate — catalogue counts and classification
        // tallies have no interval, so this says why some pages look unchanged.
        <p className="mt-1 max-w-sm text-[11px] leading-4 text-slate-500">
          Intervals are shown wherever a figure is a modelled estimate. Counts taken straight
          from the catalogue — how many conditions fall in a category — have no interval, so
          they are unchanged.
        </p>
      )}
    </div>
  );
}

function PrevNext({
  prev,
  next,
  onGo,
}: {
  prev: ViewDef | null;
  next: ViewDef | null;
  onGo: (id: string) => void;
}) {
  if (!prev && !next) return null;
  return (
    <nav className="mt-8 flex items-stretch justify-between gap-3 border-t border-slate-200 pt-4">
      {prev ? (
        <button
          type="button"
          onClick={() => onGo(prev.id)}
          className="group flex max-w-[48%] flex-col items-start rounded-lg border border-slate-300 bg-white px-4 py-2 text-left hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="text-xs text-slate-400">← Previous</span>
          <span className="text-sm font-medium text-slate-700 group-hover:text-accent">
            {prev.label}
          </span>
        </button>
      ) : (
        <span />
      )}
      {next ? (
        <button
          type="button"
          onClick={() => onGo(next.id)}
          className="group flex max-w-[48%] flex-col items-end rounded-lg border border-slate-300 bg-white px-4 py-2 text-right hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="text-xs text-slate-400">Next →</span>
          <span className="text-sm font-medium text-slate-700 group-hover:text-accent">
            {next.label}
          </span>
        </button>
      ) : (
        <span />
      )}
    </nav>
  );
}

function Footer({ commit }: { commit: string }) {
  return (
    <footer className="mt-10 space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500">
      <p>
        Figures are model estimates shown with their uncertainty — see Methods &amp; data for
        where each number comes from.
      </p>
      <p className="text-slate-400">
        Code Apache-2.0; curated data CC-BY-4.0.{' '}
        <button
          type="button"
          onClick={() =>
            document.getElementById('citation')?.scrollIntoView({ behavior: 'smooth' })
          }
          className="hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          How to cite
        </button>{' '}
        ·{' '}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
          Source &amp; data
        </a>{' '}
        · Build <code className="font-mono">{commit}</code>
      </p>
    </footer>
  );
}
