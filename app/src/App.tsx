import { useEffect, useState } from 'react';
import { AllData, loadAll } from './data';
import { useUrlState } from './urlState';
import Tabs, { TabDef } from './components/Tabs';
import Denominator from './views/Denominator';
import Prevention from './views/Prevention';
import Residual from './views/Residual';
import Resistance from './views/Resistance';
import Allocation from './views/Allocation';
import Methods from './views/Methods';

const TABS: TabDef[] = [
  { id: 'denominator', label: 'Denominator' },
  { id: 'prevention', label: 'Prevention' },
  { id: 'residual', label: 'Residual' },
  { id: 'resistance', label: 'Resistance' },
  { id: 'allocation', label: 'Allocation' },
  { id: 'methods', label: 'Methods & Provenance' },
];

export default function App() {
  const [data, setData] = useState<AllData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, update] = useUrlState({ tab: 'denominator' });

  useEffect(() => {
    loadAll()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const activeTab = TABS.some((t) => t.id === state.tab) ? state.tab : 'denominator';

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col px-4 pb-16 pt-6">
      <header className="mb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Serious Genetic Disease at Birth
          </h1>
          <span className="text-sm text-slate-500">
            Denominator app · precomputed epidemiology
          </span>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          A sober, GBD-style read-out of a fixed Monte-Carlo model. Every number below is
          precomputed; this page only recombines and displays medians and 95% credible
          intervals. Selections serialize to the URL for sharing.
        </p>
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
        <div className="py-16 text-center text-slate-500">Loading precomputed data…</div>
      )}

      {data && (
        <>
          <Tabs tabs={TABS} active={activeTab} onChange={(id) => update({ tab: id })} />
          <main className="mt-5 flex-1">
            <div
              role="tabpanel"
              id={`panel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
            >
              {activeTab === 'denominator' && (
                <Denominator data={data} state={state} update={update} />
              )}
              {activeTab === 'prevention' && (
                <Prevention data={data} state={state} update={update} />
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

          <Footer commit={data.meta.commit} spec={data.meta.spec_version} />
        </>
      )}
    </div>
  );
}

function Footer({ commit, spec }: { commit: string; spec: string }) {
  return (
    <footer className="mt-10 border-t border-slate-200 pt-3 text-xs text-slate-500">
      <span className="tnum">
        Pipeline commit <code className="font-mono text-slate-700">{commit}</code> · spec
        v{spec}
      </span>
      <span className="ml-2">
        · Model output is illustrative; see Methods &amp; Provenance for sources.
      </span>
    </footer>
  );
}
