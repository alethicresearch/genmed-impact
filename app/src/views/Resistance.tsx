import { AllData } from '../data';
import { UrlState } from '../urlState';
import StatValue from '../components/StatValue';
import { Card } from '../components/ui';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';
import { Reading, PH, Lead } from '../components/prose';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

export default function Resistance({ data, update }: Props) {
  const r = data.resistance;
  return (
    <SourcesProvider>
    <Reading>
      <p className="text-[15px] leading-7 text-slate-600">
        The next step along the trajectory is <em>resistance</em>: not preventing an inherited
        disease, but editing a healthy genome to blunt a common risk — infection, cardiovascular
        disease, the effects of ageing. The mechanism is correction, but the target is a baseline
        everyone shares. The test is simple: does a germline edit add anything the drugs and
        public-health tools we already have do not?
      </p>

      <section className="space-y-3">
        <PH>Three proposed resistance edits, each against its alternative</PH>
        <Lead>
          Only HIV reduces to a single residual birth count; for the others the honest answer is
          that no clean number exists, and each panel says so rather than inventing one.
        </Lead>

      <div className="grid grid-cols-1 gap-4">
        {/* HIV */}
        <Card>
          <h3 className="text-base font-semibold text-slate-900">HIV</h3>
          <dl className="mt-3 space-y-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Vertical infections / year
              </dt>
              <dd className="mt-0.5 text-lg">
                <StatValue stat={r.hiv.vertical_infections_per_year} kind="int" showCi />
                <SourceNote source="UNAIDS 2023 — new vertical (mother-to-child) HIV infections" doi={null} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Residual after PMTCT
              </dt>
              <dd className="mt-0.5 text-lg">
                <StatValue stat={r.hiv.residual_after_pmtct} kind="int" showCi />
                <span className="block text-xs font-normal text-slate-500">
                  after prevention of mother-to-child transmission (PMTCT), which stops &gt;98% of
                  cases where implemented
                </span>
                <SourceNote source="WHO — PMTCT prevents >98% of vertical HIV transmission where implemented" doi={null} />
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-slate-600">{r.hiv.note}</p>
        </Card>

        {/* Cardiovascular */}
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Cardiovascular</h3>
          <p className="mt-3 inline-block rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
            No single birth count
          </p>
          <p className="mt-3 text-sm text-slate-600">{r.cardiovascular.note}</p>
        </Card>

        {/* Neurodegeneration */}
        <Card className="border-amber-300 bg-amber-50">
          <h3 className="text-base font-semibold text-slate-900">Neurodegeneration</h3>
          <p className="mt-3 text-2xl font-semibold text-amber-800">Not computable</p>
          <p className="mt-3 text-sm text-slate-700">{r.neurodegeneration.note}</p>
        </Card>
      </div>
      </section>

      <section className="space-y-3">
        <PH>Where resistance sits</PH>
        <Lead>
          In every case the alternative already exists and reaches more people more cheaply than a
          germline edit could. Resistance is not where the burden is. Push one step further — from
          blunting a shared risk to augmenting a trait beyond the normal range — and the question
          stops being about disease at all.
        </Lead>
        <div>
          <button
            type="button"
            onClick={() => update({ mode: 'detailed', tab: 'enhancement' })}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            On to enhancement →
          </button>
        </div>
      </section>

      <SourcesList title="Sources" />
    </Reading>
    </SourcesProvider>
  );
}
