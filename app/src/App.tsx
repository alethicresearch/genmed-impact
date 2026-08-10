import { useEffect, useState } from 'react';
import { AllData, loadAll } from './data';
import { useUrlState } from './urlState';
import Tabs, { TabDef } from './components/Tabs';
import Overview from './views/Overview';
import Library from './views/Library';
import Denominator from './views/Denominator';
import Prevention from './views/Prevention';
import Multifactorial from './views/Multifactorial';
import Embryos from './views/Embryos';
import Residual from './views/Residual';
import Beyond from './views/Beyond';
import EthicsPolicy from './views/EthicsPolicy';
import Allocation from './views/Allocation';
import Methods from './views/Methods';

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
    label: 'Disease map',
    views: [
      { id: 'denominator', label: 'How much serious genetic disease is there?' },
      { id: 'library', label: 'The disease catalogue' },
    ],
  },
  {
    id: 'sec-existing',
    label: 'Existing options',
    views: [{ id: 'prevention', label: 'What current medicine can do' }],
  },
  {
    id: 'sec-editing',
    label: 'Where editing adds value',
    views: [
      { id: 'residual', label: 'When editing is the only option' },
      { id: 'multifactorial', label: 'Could editing help complex disease?' },
    ],
  },
  {
    id: 'sec-ethics',
    label: 'Ethics & policy',
    views: [
      { id: 'ethics', label: 'What should follow' },
      { id: 'embryos', label: 'The embryo trade-off' },
      { id: 'beyond', label: 'Beyond disease prevention' },
      { id: 'allocation', label: 'Cost scenario (exploratory)' },
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
  title  = {Genetic Disease and What Medicine Can Do:
            a genetic-disease {\\texttimes} genetic-medicine impact library
            and reproducible burden pipeline},
  author = {Ghose, Sankalpa and Wallach, D. A. and Singer, Peter and Savulescu, Julian},
  year   = {2026},
  url    = {https://github.com/alethicresearch/genmed-impact},
  note   = {Version 0.1.0. Code Apache-2.0; curated data CC-BY-4.0.}
}`;

export default function App() {
  const [data, setData] = useState<AllData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, update] = useUrlState({ tab: 'overview' });

  useEffect(() => {
    loadAll()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const requested = LEGACY_TABS[state.tab] ?? state.tab;
  const activeView = ALL_VIEWS.some((v) => v.id === requested) ? requested : 'overview';
  const activeSection = sectionOf(activeView);

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
    <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 pb-16 pt-6">
      <header className="mb-5 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => update({ tab: 'overview' })}
          title="Back to overview"
          className="rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 hover:text-accent">
            Genetic Disease and What Medicine Can Do
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
            ↗ Data archive
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
          {activeSection.views.length > 1 && (
            <SubNav
              views={activeSection.views}
              active={activeView}
              onPick={(id) => update({ tab: id })}
            />
          )}
          <main className="mt-5 flex-1">
            <div
              role="tabpanel"
              id={`panel-${activeSection.id}`}
              aria-labelledby={`tab-${activeSection.id}`}
            >
              {activeView === 'overview' && (
                <Overview data={data} state={state} update={update} />
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
              {activeView === 'methods' && (
                <Methods data={data} state={state} update={update} />
              )}
            </div>
          </main>

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
