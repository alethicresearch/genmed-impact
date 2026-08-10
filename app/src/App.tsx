import { useEffect, useState } from 'react';
import { AllData, loadAll } from './data';
import { useUrlState } from './urlState';
import Tabs, { TabDef } from './components/Tabs';
import { Segmented } from './components/ui';
import Overview from './views/Overview';
import Library from './views/Library';
import Denominator from './views/Denominator';
import Prevention from './views/Prevention';
import Multifactorial from './views/Multifactorial';
import Embryos from './views/Embryos';
import Residual from './views/Residual';
import Resistance from './views/Resistance';
import Allocation from './views/Allocation';
import Methods from './views/Methods';

const ALL_TABS: TabDef[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'library', label: 'Disease Library' },
  { id: 'denominator', label: 'Denominator' },
  { id: 'prevention', label: 'Prevention' },
  { id: 'multifactorial', label: 'Multifactorial' },
  { id: 'residual', label: 'Residual' },
  { id: 'embryos', label: 'Embryos' },
  { id: 'resistance', label: 'Resistance' },
  { id: 'allocation', label: 'Allocation' },
  { id: 'methods', label: 'Methods & Provenance' },
];

// ---- Research-artifact masthead metadata ----
const REPO_URL = 'https://github.com/alethicresearch/genmed-impact';
const CITATION_URL = `${REPO_URL}/blob/main/CITATION.cff`;
// Author order: SG, DAW, PS, JS. TODO: replace the first-author placeholder with the full name.
const AUTHORS = ['S. G.', 'D. A. Wallach', 'Peter Singer', 'Julian Savulescu'];
const AFFILIATION = 'Alethic Research';

// Which tab ids are visible in each mode.
const MODE_TABS: Record<string, string[]> = {
  simple: ['overview', 'library', 'prevention'],
  detailed: [
    'overview',
    'library',
    'denominator',
    'prevention',
    'multifactorial',
    'residual',
    'embryos',
    'resistance',
    'allocation',
    'methods',
  ],
};

export default function App() {
  const [data, setData] = useState<AllData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, update] = useUrlState({ tab: 'overview', mode: 'simple' });

  useEffect(() => {
    loadAll()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const mode = state.mode === 'detailed' ? 'detailed' : 'simple';
  const visibleIds = MODE_TABS[mode];
  const tabs = ALL_TABS.filter((t) => visibleIds.includes(t.id));
  const activeTab = visibleIds.includes(state.tab) ? state.tab : 'overview';

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
            <p className="mt-1 text-sm text-slate-600">
              An interactive research artifact accompanying the manuscript. Across the whole
              landscape of serious genetic disease, it maps which genes cause it, how far today's
              genetic-medicine tools reach, and the narrow residual left only for germline editing —
              every figure shown with its uncertainty and its source.
            </p>
            {/* author line + affiliation */}
            <p className="mt-2 text-sm text-slate-700">
              {AUTHORS.map((a, i) => (
                <span key={a}>
                  {i > 0 && <span className="text-slate-400"> · </span>}
                  {a}
                </span>
              ))}
              <span className="text-slate-400"> — {AFFILIATION}</span>
            </p>
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
          <Segmented
            label="Mode"
            ariaLabel="Detail mode"
            value={mode}
            options={[
              { value: 'simple', label: 'Simple' },
              { value: 'detailed', label: 'Detailed' },
            ]}
            onChange={(v) => update({ mode: v })}
          />
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
          <Tabs tabs={tabs} active={activeTab} onChange={(id) => update({ tab: id })} />
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
              {activeTab === 'resistance' && <Resistance data={data} />}
              {activeTab === 'allocation' && <Allocation data={data} />}
              {activeTab === 'methods' && (
                <Methods data={data} state={state} update={update} />
              )}
            </div>
          </main>

          <Footer commit={data.meta.commit} />
        </>
      )}
    </div>
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
        {AUTHORS.join(', ')} — {AFFILIATION}. Code Apache-2.0; curated data CC-BY-4.0.{' '}
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
