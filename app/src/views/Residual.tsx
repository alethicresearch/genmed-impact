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
        title="The translational frontier: when embryo selection is not enough"
        subtitle="For most monogenic conditions, IVF with PGT-M can select an unaffected embryo. A small number of reproductive situations are different: no unaffected embryo is expected to exist."
      />
      <p className="text-sm leading-relaxed text-slate-700">
        PGT-M can choose among embryos, but it cannot change the genotype of an embryo. If a
        couple is expected to produce some affected and some unaffected embryos, selection can
        usually identify an unaffected embryo for transfer.
      </p>
      <p className="text-sm leading-relaxed text-slate-700">
        The situation changes when the parental genetic combination means every embryo is
        expected to inherit the targeted disease-causing genotype. In that case, PGT-M can
        identify the genotype but cannot provide an unaffected embryo. A successful germline
        edit could, in principle, create a preventive option that selection cannot.
      </p>
      <p className="text-sm leading-relaxed text-slate-700">
        We call this <strong>editing-only prevention</strong>. The estimate below asks how often
        these no-selectable-unaffected-embryo reproductive configurations are expected to occur
        worldwide.
      </p>
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm leading-6 text-slate-700">
        <p>
          Selection can become burdensome before it becomes impossible. This analysis
          distinguishes two situations. In the first, no unaffected embryo exists, so selection
          is biologically impossible — the population estimated below. In the second,
          unaffected embryos exist but are rare: PGT-M remains technically possible while
          requiring many embryos or repeated IVF cycles. Poor selection prospects do not by
          themselves justify editing, but they change the proportionality comparison, because
          reproductive burden is one dimension of impact.
        </p>
        <button
          type="button"
          onClick={() => update({ tab: 'embryos' })}
          className="mt-1.5 text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          See the selection-versus-correction analysis →
        </button>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">
        This is important even though the population is small.{' '}
        <strong>Population impact and individual clinical justification are different
        questions.</strong>{' '}
        A rare reproductive configuration can provide a strong rationale for research if the
        condition is severe and no existing pathway can achieve the same medically important
        outcome.
      </p>

      {/* Contested toggle + its effect on the headline */}
      <Card className="border-amber-300 bg-amber-50/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Toggle
              label="Include congenital deafness in this prevention category"
              checked={includeContested}
              onChange={(v) => update({ deaf: v ? '1' : '0' })}
            />
            <p className="mt-1">
              <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900">
                Ethically contested classification
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-600">
              One classification has a large effect on this estimate. Whether congenital
              deafness should be treated as a condition that ought to be prevented is ethically
              contested. The primary analysis therefore excludes it (
              <span className="tnum">{fmtInt(s1Excl.median)}</span> births/yr); the toggle shows
              how the estimate changes if it is included (
              <span className="tnum">{fmtInt(s1Incl.median)}</span>).
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Estimated births each year in reproductive configurations with no selectable
              unaffected embryo ({includeContested ? 'incl.' : 'excl.'} deafness)
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              <StatValue stat={s1Total} kind="int" showCi />
              <span className="tnum text-base font-normal text-slate-500"> / yr</span>
            </p>
            <p className="text-[11px] text-slate-400">Canonical term: editing-only prevention</p>
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
          Which conditions contribute to this estimate?
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
          Where are these reproductive situations expected to occur?
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Regional estimates use regional birth totals and consanguinity assumptions, but
          currently apply global allele-frequency estimates. The geographic distribution should
          therefore be interpreted as approximate.
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

      {/* Beyond the near-term frontier: polygenic disease */}
      <div>
        <h3 className="text-base font-semibold text-slate-900">
          Beyond the near-term frontier
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          The no-selectable-embryo analysis identifies the clearest near-term indication
          because editing would supply a route that selection cannot. Polygenic disease
          represents a different part of the translational pathway. There, editing would
          compete with selection, prevention, treatment, and somatic intervention on the size
          of the <strong>incremental benefit</strong> it can deliver.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          The next analysis asks how that balance could change as the technological frontier
          moves.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-slate-900">
            Current-evidence population-scaling scenario
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Under the current-evidence assumptions, the estimated contribution is small and
            highly uncertain.
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
            Future-capacity exploratory population-scaling scenario
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            This scenario assumes that a small number of editable loci account for enough risk
            in selected complex diseases for editing to outperform modeled alternatives. It is
            an exploratory scenario, not a forecast of clinical feasibility.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            <strong>Exploratory population scaling.</strong> This quantity is generated from
            the model&apos;s assumed future complex-disease editing share; it is not the direct
            sum of the disease-specific liability-threshold analysis.
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
          Putting the two pieces together{' '}
          <span className="text-sm font-normal text-slate-500">
            ({includeContested ? 'incl.' : 'excl.'} deafness)
          </span>
        </h3>
        <p className="mb-3 text-sm text-slate-600">
          For summary purposes, we combine the no-selectable-embryo population with the
          potential complex-disease advantage into an <strong>editing-relevant residual</strong>.
          They should not be interpreted as equivalent. The first describes cases in which
          editing supplies a preventive route unavailable through embryo selection; the second
          is a hypothetical additional advantage whose size depends strongly on modeling
          assumptions.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Mini label="Editing-only prevention" stat={s1Total} kind="int" />
          <Mini label="Complex-disease scaling — current evidence" stat={r.s2.strict} kind="int" />
          <Mini label="Complex-disease scaling — future-capacity exploratory" stat={r.s2.permissive} kind="int" />
          <Mini label="Combined editing-relevant share — current / future-capacity" stat={variant.uniquely_editable_share_of_serious.strict} kind="pct" decimals={3} secondStat={variant.uniquely_editable_share_of_serious.permissive} secondDecimals={2} />
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
