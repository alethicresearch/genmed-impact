import { AllData, ContestedKey, Stat, fmtInt } from '../data';
import { UrlState } from '../urlState';
import { useViewNav } from '../viewNav';
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
  const go = useViewNav(update);
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
        title="When choosing between embryos is not enough"
        subtitle="For most single-gene conditions, testing embryos during IVF can find one free of the condition. For some couples it cannot: because of the particular combination the parents carry, every embryo would inherit it."
      />
      <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
        <Term k="PGT">Embryo testing during IVF</Term> lets a couple choose an embryo without the
        condition — but it only picks from the embryos that exist, it does not change any of them.
        That works whenever some of a couple&apos;s embryos would be unaffected. It stops working
        when the particular combination the two parents carry means every embryo would inherit the
        condition: the test still finds it, but there is nothing healthy left to choose.
      </p>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
        This is the one situation where a successful edit could create an option that choosing
        cannot. The figure below estimates how often it happens worldwide.
      </p>
      <div className="max-w-3xl rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm leading-6 text-slate-700">
        <p>
          Choosing gets costly before it gets impossible. When no unaffected embryo exists it is simply out — that is the population counted below. When unaffected embryos are merely rare, testing still works, but a couple may need many embryos or several IVF rounds to find one. That is a real burden, and it shifts the comparison without on its own justifying an edit.</p>
        <button
          type="button"
          onClick={() => go('embryos')}
          className="mt-1.5 text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          See the full choosing-versus-editing comparison →
        </button>
      </div>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
        A small number of families is not the same as a weak case. These situations are rare across a population, yet for the family in front of you the condition is severe and nothing else available would achieve the same thing.
      </p>

      <div className="max-w-3xl rounded-md border border-slate-200 bg-slate-50/70 p-3">
        <p className="text-sm leading-relaxed text-slate-700">
          Having no embryo to choose does not mean editing would work. It is the first of four conditions that all have to hold, and the next one is molecular: some method has to exist that can make the specific change this fault requires. For roughly a quarter of these couples, none does.</p>
        <button
          type="button"
          onClick={() => go('editing-tech')}
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
              label="Include congenital deafness in this figure"
              checked={includeContested}
              onChange={(v) => update({ deaf: v ? '1' : '0' })}
            />
            <p className="mt-1">
              <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900">
                Contested: is this a condition to prevent?
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-600">
              One judgement call moves this number a lot. Whether congenital deafness should be treated as something to prevent is genuinely contested, so the main figure leaves it out (<span className="tnum">{fmtInt(s1Excl.median)}</span> births/yr); the toggle shows
              how the estimate changes if it is included (
              <span className="tnum">{fmtInt(s1Incl.median)}</span>).
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Births a year to couples for whom every embryo would inherit the condition
              ({includeContested ? 'including' : 'excluding'} deafness)
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              <StatValue stat={s1Total} kind="int" showCi />
              <span className="tnum text-base font-normal text-slate-500"> / yr</span>
            </p>
            
            <SourceNote
              source="Calculated: for each condition, how many couples would have no unaffected embryo, from how common the variant is, how often it causes disease, survival to reproductive age, whether partners are likely to share it, and marriage between relatives (see the table below)"
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
                        onClick={() => go('library', { tier: 'all', libq: libName })}
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
          Regional figures use local birth numbers and local rates of marriage between relatives, but still apply worldwide averages for how common each variant is, so treat the regional split as indicative rather than as population-specific genetics.</p>
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
            On today’s evidence, common disease adds very little to this total — and what it does add is highly uncertain.
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
        <InlineLink onClick={() => go('multifactorial')}>
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
          <InlineLink onClick={() => go('multifactorial')}>
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
