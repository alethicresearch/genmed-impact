import { AllData, ContestedKey, Stat, fmtInt } from '../data';
import { UrlState } from '../urlState';
import StatValue from '../components/StatValue';
import { Card, SectionHeading, Toggle } from '../components/ui';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

export default function Residual({ data, state, update }: Props) {
  const r = data.residual;

  // Contested toggle (URL param `deaf`). Congenital deafness is the single largest S1
  // contributor but its inclusion is contested; the model exposes both variants. The DEFAULT
  // EXCLUDES it, matching the paper's headline figure — users opt in explicitly.
  const includeContested = (state.deaf ?? '0') === '1';
  const ck: ContestedKey = includeContested ? 'with_contested' : 'without_contested';
  const variant = r.by_contested[ck];

  const contestedSet = new Set(r.contested_conditions);
  const conditions = Object.entries(r.s1_by_condition)
    .filter(([name]) => includeContested || !contestedSet.has(name))
    .sort((a, b) => b[1].median - a[1].median);

  const s1Total = variant.s1_total;
  const s1Incl = r.by_contested.with_contested.s1_total;
  const s1Excl = r.by_contested.without_contested.s1_total;
  const strictEmpty = r.s2.strict.median < 1;

  return (
    <SourcesProvider>
    <div className="space-y-6">
      <SectionHeading
        title="When does embryo editing add a unique option?"
        subtitle="Two distinct questions: when is germline editing the only preventive option because no unaffected embryo can be selected, and when might editing provide an additional advantage for complex disease?"
      />
      <p className="text-sm leading-relaxed text-slate-700">
        There are two different reasons germline editing might matter. In some monogenic
        reproductive configurations, no unaffected embryo can be selected; editing would
        therefore provide a preventive option that embryo selection cannot. For complex disease,
        the question is different: whether editing might eventually offer additional risk
        reduction beyond existing alternatives.
      </p>

      {/* Contested toggle + its effect on the headline */}
      <Card className="border-amber-300 bg-amber-50/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Toggle
              label="Include congenital deafness among the no-selectable-embryo conditions? (contested)"
              checked={includeContested}
              onChange={(v) => update({ deaf: v ? '1' : '0' })}
            />
            <p className="mt-1 text-xs text-slate-600">
              Whether congenital deafness should be included as a condition to prevent is
              ethically contested. The primary analysis excludes it (
              <span className="tnum">{fmtInt(s1Excl.median)}</span> births/yr); use the toggle to
              see how its inclusion changes the estimate (
              <span className="tnum">{fmtInt(s1Incl.median)}</span>).
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Editing-only prevention, total ({includeContested ? 'incl.' : 'excl.'} deafness)
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              <StatValue stat={s1Total} kind="int" showCi />
              <span className="tnum text-base font-normal text-slate-500"> / yr</span>
            </p>
            <SourceNote
              source="Derived: Σ over S1 conditions of couples with no selectable unaffected embryo, from allele frequencies, penetrance, survival, assortative mating and consanguinity (see the by-condition table)"
              doi={null}
            />
          </div>
        </div>
      </Card>

      {/* S1 by condition */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">
          Editing-only prevention: which conditions leave families without a selectable embryo?
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">S1 residual births per year by condition</caption>
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th scope="col" className="px-3 py-2 text-left font-medium">Condition</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Births / yr (median)</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">95% uncertainty interval</th>
              </tr>
            </thead>
            <tbody>
              {conditions.map(([name, s]) => (
                <tr key={name} className="border-b border-slate-100">
                  <td className="px-3 py-1.5">
                    {name}
                    {contestedSet.has(name) && (
                      <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900">
                        contested
                      </span>
                    )}
                  </td>
                  <td className="tnum px-3 py-1.5 text-right font-semibold">
                    {s.median < 1 ? s.median.toFixed(2) : fmtInt(s.median)}
                  </td>
                  <td className="tnum px-3 py-1.5 text-right text-slate-500">{fmtCrIntSmart(s)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-300 font-semibold">
                <td className="px-3 py-2">Total ({includeContested ? 'incl.' : 'excl.'} contested)</td>
                <td className="tnum px-3 py-2 text-right">{fmtInt(s1Total.median)}</td>
                <td className="tnum px-3 py-2 text-right text-slate-500">
                  {fmtInt(s1Total.ci95[0])}–{fmtInt(s1Total.ci95[1])}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* S1 by income group */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">
          Where do these families live? — by World Bank income group
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Regional totals apply region-specific consanguinity to each region&apos;s births;
          allele frequencies are currently global, so the regional split is approximate.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">S1 residual births per year by income group</caption>
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th scope="col" className="px-3 py-2 text-left font-medium">Income group</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  No selectable embryo ({includeContested ? 'incl.' : 'excl.'} deafness), median
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">95% uncertainty interval</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(r.s1_by_region).map(([region, v]) => {
                const s = v[ck];
                return (
                  <tr key={region} className="border-b border-slate-100">
                    <td className="px-3 py-1.5">{region}</td>
                    <td className="tnum px-3 py-1.5 text-right font-semibold">{fmtInt(s.median)}</td>
                    <td className="tnum px-3 py-1.5 text-right text-slate-500">
                      {fmtInt(s.ci95[0])}–{fmtInt(s.ci95[1])}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* S2: potential editing advantage, current evidence vs optimistic scenario */}
      <div>
        <h3 className="text-base font-semibold text-slate-900">
          Potential editing advantage in complex disease
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Unlike the editing-only population above, this term does <em>not</em> mean no
          alternative exists. It asks whether editing could provide a meaningful advantage over
          selection, treatment, or prevention for common complex diseases — a modeled
          possibility, not another “only option” population.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-slate-900">
            Current-evidence complex-disease case
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Crediting only what is established today.
          </p>
          {strictEmpty ? (
            <div className="mt-4">
              <p className="text-2xl font-semibold text-slate-900">
                Approximately zero at the median
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Median <StatValue stat={r.s2.strict} kind="int" /> births / yr.{' '}
                <span className="tnum text-slate-500">
                  95% uncertainty interval {r.s2.strict.ci95[0].toFixed(1)}–{fmtInt(r.s2.strict.ci95[1])}
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
          <h3 className="text-base font-semibold text-slate-900">
            Optimistic complex-disease scenario
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            A modeled scenario crediting editing with an advantage in a few
            architecture-concentrated complex diseases. Not a forecast.
          </p>
          <p className="mt-4 text-2xl">
            <StatValue stat={r.s2.permissive} kind="int" showCi />
            <span className="tnum text-base font-normal text-slate-500"> births / yr</span>
          </p>
        </Card>
      </div>

      {/* Uniquely-editable summary (reacts to the contested toggle) */}
      <Card>
        <h3 className="mb-1 text-base font-semibold text-slate-900">
          Editing-relevant residual{' '}
          <span className="text-sm font-normal text-slate-500">
            ({includeContested ? 'incl.' : 'excl.'} deafness)
          </span>
        </h3>
        <p className="mb-3 text-sm text-slate-600">
          The two components have different evidentiary status and are reported separately.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Mini label="Editing-only prevention" stat={s1Total} kind="int" />
          <Mini label="Complex-disease advantage — current evidence" stat={r.s2.strict} kind="int" />
          <Mini label="Complex-disease advantage — optimistic scenario" stat={r.s2.permissive} kind="int" />
          <Mini label="Combined editing-relevant share — current / optimistic" stat={variant.uniquely_editable_share_of_serious.strict} kind="pct" decimals={3} secondStat={variant.uniquely_editable_share_of_serious.permissive} secondDecimals={2} />
        </div>
      </Card>

      <SourcesList title="Derivations" />
    </div>
    </SourcesProvider>
  );
}

function Mini({
  label,
  stat,
  kind,
  decimals,
  secondStat,
  secondDecimals,
}: {
  label: string;
  stat: Stat;
  kind: 'int' | 'pct';
  decimals?: number;
  secondStat?: Stat;
  secondDecimals?: number;
}) {
  return (
    <div className="rounded border border-slate-200 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg">
        <StatValue stat={stat} kind={kind} decimals={decimals} showCi={!secondStat} />
        {secondStat && (
          <>
            {' / '}
            <StatValue stat={secondStat} kind={kind} decimals={secondDecimals} />
          </>
        )}
      </p>
    </div>
  );
}

function fmtCrIntSmart(s: Stat): string {
  const lo = s.ci95[0] < 1 ? s.ci95[0].toFixed(2) : fmtInt(s.ci95[0]);
  const hi = s.ci95[1] < 1 ? s.ci95[1].toFixed(2) : fmtInt(s.ci95[1]);
  return `${lo}–${hi}`;
}
