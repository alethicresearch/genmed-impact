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
  { id: 'resistance', label: 'Resistance' },
  { id: 'allocation', label: 'Allocation' },
  { id: 'methods', label: 'Methods & Provenance' },
];

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
      <header className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Serious Genetic Disease at Birth
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              An interactive look at how much serious genetic disease exists, which genes cause it,
              and how far today's genetic-medicine tools — and germline editing — can go toward
              preventing it. Explore the diseases, the interventions, and where each one reaches
              its limits.
            </p>
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
    <footer className="mt-10 border-t border-slate-200 pt-3 text-xs text-slate-500">
      <span>
        Figures are model estimates shown with their uncertainty — see Methods &amp; Sources for
        where each number comes from.
      </span>
      <span className="ml-2 text-slate-400">
        Build <code className="font-mono">{commit}</code>
      </span>
    </footer>
  );
}
