import { AllData, ContestedKey, Stat, fmtInt } from '../data';
import { UrlState } from '../urlState';
import StatValue from '../components/StatValue';
import Term from '../components/Term';
import { InlineLink } from '../components/prose';
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

  // Resolve an S1 condition label to its library catalogue entry (labels differ slightly,
  // e.g. "Huntington's disease" vs "Huntington disease"), so a condition links straight to
  // its pre-filtered library record — and only when the record actually exists.
  const libNames = data.library.diseases.map((d) => d.name);
  const libraryNameFor = (condition: string): string | undefined => {
    const stem = condition.split('(')[0].replace(/'s\b/g, '').trim().toLowerCase();
    return libNames.find((n) => {
      const ln = n.toLowerCase();
      return ln.includes(stem) || stem.includes(ln.split('(')[0].trim());
    });
  };

  return (
    <SourcesProvider>
    <div className="space-y-6">
      <SectionHeading
        title="The translational frontier: when embryo selection is not enough"
        subtitle="For most monogenic conditions, PGT-M can identify an unaffected embryo for transfer. In some reproductive configurations, however, every embryo is expected to inherit the targeted disease-causing genotype."
      />
      <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
        <Term k="PGT">PGT-M</Term> can choose among embryos, but it cannot change an
        embryo&apos;s genotype. If a couple is expected to produce some affected and some
        unaffected embryos, selection can usually identify an unaffected embryo for transfer.
        When the parental genetic combination means every embryo is expected to inherit the
        disease-causing genotype, PGT-M can identify the genotype but cannot provide an
        unaffected embryo.
      </p>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
        We call this <strong>editing-only prevention</strong>: a successful germline edit
        could, in principle, create a preventive option that selection cannot. The estimate
        below quantifies how often reproductive configurations in which no unaffected embryo
        can be selected are expected to occur worldwide.
      </p>
      <div className="max-w-3xl rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm leading-6 text-slate-700">
        <p>
          Selection can become burdensome before it becomes impossible. When no unaffected
          embryo exists, selection is biologically impossible — the population estimated below.
          When unaffected embryos are merely rare, PGT-M remains technically possible but may
          require many embryos or repeated IVF cycles; that changes the proportionality
          comparison without by itself justifying editing.
        </p>
        <button
          type="button"
          onClick={() => update({ tab: 'embryos' })}
          className="mt-1.5 text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          See the selection-versus-correction analysis →
        </button>
      </div>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
        Population impact and individual clinical justification are different questions: a rare
        reproductive configuration can still provide a strong rationale for research when the
        condition is severe and no existing pathway achieves the same medically important
        outcome.
      </p>

      <div className="max-w-3xl rounded-md border border-slate-200 bg-slate-50/70 p-3">
        <p className="text-sm leading-relaxed text-slate-700">
          Selection failing does not mean editing would work. It is the first of four conditions
          that must all hold, and the next one is molecular: a platform has to exist that can
          make the specific change the variant requires. For roughly a quarter of this
          population, none does.
        </p>
        <button
          type="button"
          onClick={() => update({ tab: 'editing-tech' })}
          className="mt-1.5 text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          See which technology each variant would need →
        </button>
      </div>

      {/* Contested toggle + its effect on the headline */}
      <Card className="border-amber-300 bg-amber-50/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Toggle
              label="Include congenital deafness in the editing-only prevention estimate"
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
              Estimated births per year from reproductive configurations in which no
              unaffected embryo can be selected ({includeContested ? 'incl.' : 'excl.'} deafness)
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
          Conditions contributing to the estimate
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
              {conditions.map(([name, s]) => {
                const libName = libraryNameFor(name);
                return (
                <tr key={name} className="border-b border-slate-100">
                  <td className="px-3 py-1.5">
                    {libName ? (
                      <InlineLink
                        onClick={() => update({ tab: 'library', tier: 'all', libq: libName })}
                      >
                        {name}
                      </InlineLink>
                    ) : (
                      name
                    )}
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
                );
              })}
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

      {/* S1 by income group — exploratory, collapsed by default */}
      <details className="rounded-lg border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-base font-semibold text-slate-900">
          Exploratory geographic distribution
        </summary>
        <p className="mt-1 max-w-3xl text-xs text-slate-600">
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
      </details>

      {/* Beyond the near-term frontier: polygenic disease */}
      <div>
        <h3 className="text-base font-semibold text-slate-900">
          Complex disease beyond the near-term frontier
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
          <p className="text-sm font-semibold text-slate-900">
            Current-evidence population-scaling scenario
          </p>
          {strictEmpty ? (
            <p className="mt-2 text-xl font-semibold text-slate-900">
              ≈ 0 at the median{' '}
              <span className="tnum text-sm font-normal text-slate-500">
                (95% UI {r.s2.strict.ci95[0].toFixed(1)}–{fmtInt(r.s2.strict.ci95[1])} births/yr)
              </span>
            </p>
          ) : (
            <p className="mt-2 text-xl">
              <StatValue stat={r.s2.strict} kind="int" showCi />
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Under current-evidence assumptions, the modeled complex-disease contribution to the
            editing-relevant residual is small and highly uncertain.
          </p>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-slate-900">
            Future-capacity exploratory population-scaling scenario
          </p>
          <p className="mt-2 text-xl">
            <StatValue stat={r.s2.permissive} kind="int" showCi />
            <span className="tnum text-sm font-normal text-slate-500"> births / yr</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            An exploratory scaling of the multifactorial burden, not a forecast — and not the
            direct sum of the disease-specific liability-threshold analysis.
          </p>
        </Card>
      </div>
      <p className="text-sm">
        <InlineLink onClick={() => update({ tab: 'multifactorial' })}>
          Explore the full polygenic analysis →
        </InlineLink>
      </p>

      {/* Uniquely-editable summary (reacts to the contested toggle) */}
      <Card>
        <h3 className="mb-1 text-base font-semibold text-slate-900">
          Combined editing-relevant scenarios{' '}
          <span className="text-sm font-normal text-slate-500">
            ({includeContested ? 'incl.' : 'excl.'} deafness)
          </span>
        </h3>
        <p className="mb-3 text-sm text-slate-600">
          To compare the scale of germline editing&apos;s modeled role with the wider
          genetic-disease burden, we combine the no-selectable-embryo population with the{' '}
          <InlineLink onClick={() => update({ tab: 'multifactorial' })}>
            exploratory complex-disease advantage
          </InlineLink>{' '}
          into an <strong>editing-relevant residual</strong>. The components describe different
          forms of medical value: the first is a reproductive configuration in which editing
          provides a route unavailable through embryo selection; the second is a possible
          incremental advantage whose size depends strongly on assumptions about future
          complex-disease editing. Combining them allows comparison of scale; reporting them
          separately preserves their clinical and ethical meaning.
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
        <StatValue stat={stat} kind={kind} decimals={decimals} />
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
