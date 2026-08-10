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
import Resistance from './views/Resistance';
import Enhancement from './views/Enhancement';
import Allocation from './views/Allocation';
import Methods from './views/Methods';

// The views in the order they read as a paper — the user journey follows the argument.
const ALL_TABS: TabDef[] = [
  { id: 'overview', label: 'The argument' },
  { id: 'library', label: 'The disease library' },
  { id: 'denominator', label: 'The burden' },
  { id: 'prevention', label: 'What medicine prevents' },
  { id: 'residual', label: "Where editing is unique" },
  { id: 'embryos', label: 'The embryo trade-off' },
  { id: 'multifactorial', label: 'Complex disease' },
  { id: 'resistance', label: 'Resistance' },
  { id: 'enhancement', label: 'Enhancement' },
  { id: 'allocation', label: 'Where to invest' },
  { id: 'methods', label: 'Methods & sources' },
];

// ---- Research-artifact masthead metadata ----
const REPO_URL = 'https://github.com/alethicresearch/genmed-impact';
const CITATION_URL = `${REPO_URL}/blob/main/CITATION.cff`;

export default function App() {
  const [data, setData] = useState<AllData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, update] = useUrlState({ tab: 'overview' });

  useEffect(() => {
    loadAll()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const tabs = ALL_TABS;
  const activeTab = tabs.some((t) => t.id === state.tab) ? state.tab : 'overview';
  // Number the tabs so the bar reads as an ordered table of contents.
  const numberedTabs = tabs.map((t, i) => ({ ...t, label: `${i + 1}. ${t.label}` }));
  const activeIdx = tabs.findIndex((t) => t.id === activeTab);
  const prevTab = activeIdx > 0 ? tabs[activeIdx - 1] : null;
  const nextTab = activeIdx >= 0 && activeIdx < tabs.length - 1 ? tabs[activeIdx + 1] : null;

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col px-4 pb-16 pt-6">
      <header className="mb-5 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
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
            {/* artifact link row */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span
                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-slate-50 px-2 py-1 text-slate-500"
                title="Manuscript in preparation"
              >
                📄 Paper — in preparation
              </span>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 hover:border-accent hover:text-accent"
              >
                ⌥ Code &amp; data (GitHub)
              </a>
              <a
                href={CITATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 hover:border-accent hover:text-accent"
              >
                ❝ Cite
              </a>
            </div>
          </div>
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
          <Tabs tabs={numberedTabs} active={activeTab} onChange={(id) => update({ tab: id })} />
          <main className="mt-5 flex-1">
            <div
              role="tabpanel"
              id={`panel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
            >
              {activeTab === 'overview' && (
                <Overview data={data} state={state} update={update} />
              )}
              {activeTab === 'library' && (
                <Library data={data} state={state} update={update} />
              )}
              {activeTab === 'denominator' && (
                <Denominator data={data} state={state} update={update} />
              )}
              {activeTab === 'prevention' && (
                <Prevention data={data} state={state} update={update} />
              )}
              {activeTab === 'multifactorial' && (
                <Multifactorial data={data} state={state} update={update} />
              )}
              {activeTab === 'residual' && (
                <Residual data={data} state={state} update={update} />
              )}
              {activeTab === 'embryos' && (
                <Embryos data={data} state={state} update={update} />
              )}
              {activeTab === 'resistance' && (
                <Resistance data={data} state={state} update={update} />
              )}
              {activeTab === 'enhancement' && (
                <Enhancement data={data} state={state} update={update} />
              )}
              {activeTab === 'allocation' && <Allocation data={data} />}
              {activeTab === 'methods' && (
                <Methods data={data} state={state} update={update} />
              )}
            </div>
          </main>

          <PrevNext prev={prevTab} next={nextTab} onGo={(id) => update({ tab: id })} />
          <Footer commit={data.meta.commit} />
        </>
      )}
    </div>
  );
}

// Journey navigation — move through the argument in order, like turning pages.
function PrevNext({
  prev,
  next,
  onGo,
}: {
  prev: TabDef | null;
  next: TabDef | null;
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
        Figures are model estimates shown with their uncertainty — see Methods &amp; Sources for
        where each number comes from.
      </p>
      <p className="text-slate-400">
        Code Apache-2.0; curated data CC-BY-4.0.{' '}
        <a href={CITATION_URL} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
          How to cite
        </a>{' '}
        ·{' '}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
          Source &amp; data
        </a>{' '}
        · Build <code className="font-mono">{commit}</code>
      </p>
    </footer>
  );
}
