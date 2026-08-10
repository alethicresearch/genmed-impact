import { AllData, Stat, fmtInt } from '../data';
import StatValue from '../components/StatValue';
import { Card, SectionHeading } from '../components/ui';

interface Props {
  data: AllData;
}

export default function Residual({ data }: Props) {
  const r = data.residual;
  const conditions = Object.entries(r.s1_by_condition).sort(
    (a, b) => b[1].median - a[1].median
  );

  const strictEmpty = r.s2.strict.median < 1; // < 1 birth/yr → effectively empty

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Residual explorer"
        subtitle="S1: conditions where existing tools already work well but residual cases remain. S2: cases uniquely reachable only by germline editing."
      />

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">
            S1 — residual by condition
          </h3>
          <p className="text-sm text-slate-600">
            S1 total:{' '}
            <StatValue stat={r.s1_total} kind="int" showCi />
            <span className="tnum"> births / yr</span>
          </p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">S1 residual births per year by condition</caption>
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th scope="col" className="px-3 py-2 text-left font-medium">Condition</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Births / yr (median)</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">95% CrI</th>
              </tr>
            </thead>
            <tbody>
              {conditions.map(([name, s]) => (
                <tr key={name} className="border-b border-slate-100">
                  <td className="px-3 py-1.5">{name}</td>
                  <td className="tnum px-3 py-1.5 text-right font-semibold">
                    {s.median < 1 ? s.median.toFixed(2) : fmtInt(s.median)}
                  </td>
                  <td className="tnum px-3 py-1.5 text-right text-slate-500">
                    {fmtCrIntSmart(s)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-300 font-semibold">
                <td className="px-3 py-2">S1 total</td>
                <td className="tnum px-3 py-2 text-right">{fmtInt(r.s1_total.median)}</td>
                <td className="tnum px-3 py-2 text-right text-slate-500">
                  {fmtInt(r.s1_total.ci95[0])}–{fmtInt(r.s1_total.ci95[1])}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-slate-900">S2 — strict</h3>
          <p className="mt-1 text-sm text-slate-600">
            Cases uniquely reachable only by editing under strict criteria.
          </p>
          {strictEmpty ? (
            <div className="mt-4">
              <p className="text-2xl font-semibold text-slate-900">≈ empty set</p>
              <p className="mt-1 text-sm text-slate-600">
                Median{' '}
                <StatValue stat={r.s2.strict} kind="int" /> births / yr — indistinguishable from
                zero.{' '}
                <span className="tnum text-slate-500">
                  95% CrI {r.s2.strict.ci95[0].toFixed(1)}–{fmtInt(r.s2.strict.ci95[1])}
                </span>
              </p>
            </div>
          ) : (
            <p className="mt-4 text-2xl">
              <StatValue stat={r.s2.strict} kind="int" showCi />
            </p>
          )}
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-900">S2 — permissive</h3>
          <p className="mt-1 text-sm text-slate-600">
            Under permissive criteria for complex-disease editing.
          </p>
          <p className="mt-4 text-2xl">
            <StatValue stat={r.s2.permissive} kind="int" showCi />
            <span className="tnum text-base font-normal text-slate-500"> births / yr</span>
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-base font-semibold text-slate-900">
          Uniquely-editable summary
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Mini label="Uniquely editable — strict" stat={r.uniquely_editable_total.strict} kind="int" />
          <Mini label="Uniquely editable — permissive" stat={r.uniquely_editable_total.permissive} kind="int" />
          <Mini
            label="Addressable share (strict)"
            stat={r.addressable_share_of_serious.strict}
            kind="pct"
            decimals={2}
          />
          <Mini
            label="UE share of serious — strict"
            stat={r.uniquely_editable_share_of_serious.strict}
            kind="pct"
            decimals={3}
          />
          <Mini
            label="UE share of serious — permissive"
            stat={r.uniquely_editable_share_of_serious.permissive}
            kind="pct"
            decimals={2}
          />
          <Mini
            label="UE share of births — permissive"
            stat={r.uniquely_editable_share_of_births.permissive}
            kind="pct"
            decimals={3}
          />
        </div>
      </Card>
    </div>
  );
}

function Mini({
  label,
  stat,
  kind,
  decimals,
}: {
  label: string;
  stat: Stat;
  kind: 'int' | 'pct';
  decimals?: number;
}) {
  return (
    <div className="rounded border border-slate-200 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg">
        <StatValue stat={stat} kind={kind} decimals={decimals} showCi />
      </p>
    </div>
  );
}

function fmtCrIntSmart(s: Stat): string {
  const lo = s.ci95[0] < 1 ? s.ci95[0].toFixed(2) : fmtInt(s.ci95[0]);
  const hi = s.ci95[1] < 1 ? s.ci95[1].toFixed(2) : fmtInt(s.ci95[1]);
  return `${lo}–${hi}`;
}
