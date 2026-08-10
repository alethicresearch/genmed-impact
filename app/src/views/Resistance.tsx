import { AllData } from '../data';
import StatValue from '../components/StatValue';
import { Card, SectionHeading } from '../components/ui';
import Explainer from '../components/Explainer';

interface Props {
  data: AllData;
}

export default function Resistance({ data }: Props) {
  const r = data.resistance;
  return (
    <div className="space-y-6">
      <SectionHeading
        title="Resistance analysis"
        subtitle="Three domains where a germline-editing case is sometimes made. Only HIV reduces to a single residual birth count; the others do not."
      />
      <Explainer
        whatThisShows="Three proposed 'resistance' edits — to HIV, cardiovascular disease, and neurodegeneration — each set against the alternatives that already exist."
        howToRead="Each panel names the existing alternative (for example, preventing mother-to-child HIV transmission) and the residual it leaves. Where the science cannot support a number, the panel says so plainly rather than inventing one."
        whatItDetermines="Whether a germline resistance edit would add anything beyond the public-health and drug options already available."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Residual after PMTCT
              </dt>
              <dd className="mt-0.5 text-lg">
                <StatValue stat={r.hiv.residual_after_pmtct} kind="int" showCi />
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
    </div>
  );
}
