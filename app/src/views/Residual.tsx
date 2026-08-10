import { AllData, ContestedKey, Stat, fmtInt } from '../data';
import { UrlState } from '../urlState';
import StatValue from '../components/StatValue';
import { Card, SectionHeading, Toggle } from '../components/ui';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';
import Explainer from '../components/Explainer';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

export default function Residual({ data, state, update }: Props) {
  const r = data.residual;

  // Contested toggle (URL param `deaf`, default included). Congenital deafness is the single
  // largest S1 contributor but its inclusion is contested; the model exposes both variants.
  const includeContested = (state.deaf ?? '1') !== '0';
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
        subtitle="Two narrow situations: families where no unaffected embryo can be selected, and complex disease where editing might outperform every alternative. (Internally these are the S1 and S2 residuals.)"
      />
      <Explainer
        whatThisShows="The two narrow situations where germline editing would be genuinely the only option: couples for whom every embryo would carry the condition (no unaffected embryo can be selected — S1), and complex-disease cases where editing might add something unavailable through selection or treatment (S2)."
        howToRead="The no-selectable-embryo population is built up disease by disease from allele frequencies and couple types; the congenital-deafness toggle shows how one contested inclusion shifts the total. The complex-disease term is shown under a current-evidence and an optimistic upper-bound definition side by side."
        whatItDetermines="The size of the population that uniquely needs germline editing — the group for whom the case for a governed research pathway is strongest."
      />

      {/* Contested toggle + its effect on the headline */}
      <Card className="border-amber-300 bg-amber-50/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Toggle
              label="Include congenital deafness among the no-selectable-embryo conditions? (contested)"
              checked={includeContested}
              onChange={(v) => update({ deaf: v ? '1' : '0' })}
            />
            <p className="mt-1 max-w-2xl text-xs text-slate-600">
              Congenital deafness is the largest single contributor to this population, but many
              in the Deaf community do not regard it as a disease to prevent. Toggling it changes
              the total by a median of{' '}
              <strong className="tnum">{fmtInt(r.s1_contested_delta.median)}</strong> births/yr:
              about <strong className="tnum">{fmtInt(s1Excl.median)}</strong> excluding it vs{' '}
              <strong className="tnum">{fmtInt(s1Incl.median)}</strong> including it. The headline
              uses the excluding-deafness figure.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              No selectable embryo, total ({includeContested ? 'incl.' : 'excl.'} deafness)
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
          Which conditions leave families without a selectable embryo?
        </h3>
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
        <p className="mt-1 max-w-3xl text-xs text-slate-600">{r.s1_by_region_note}</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">S1 residual births per year by income group</caption>
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th scope="col" className="px-3 py-2 text-left font-medium">Income group</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  No selectable embryo ({includeContested ? 'incl.' : 'excl.'} deafness), median
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">95% CrI</th>
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

      {/* S2 strict vs permissive */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-slate-900">
            Complex disease — current-evidence case
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Complex-disease cases uniquely reachable only by editing, crediting only what is
            established today (internally: S2, strict).
          </p>
          {strictEmpty ? (
            <div className="mt-4">
              <p className="text-2xl font-semibold text-slate-900">≈ empty set</p>
              <p className="mt-1 text-sm text-slate-600">
                Median <StatValue stat={r.s2.strict} kind="int" /> births / yr — indistinguishable
                from zero.{' '}
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
          <h3 className="text-base font-semibold text-slate-900">
            Complex disease — optimistic upper bound
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Crediting a more optimistic future role for complex-disease editing (internally: S2,
            permissive).
          </p>
          <p className="mt-4 text-2xl">
            <StatValue stat={r.s2.permissive} kind="int" showCi />
            <span className="tnum text-base font-normal text-slate-500"> births / yr</span>
          </p>
        </Card>
      </div>

      {/* Uniquely-editable summary (reacts to the contested toggle) */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-slate-900">
          Editing-only total{' '}
          <span className="text-sm font-normal text-slate-500">
            (no-selectable-embryo {includeContested ? 'incl.' : 'excl.'} deafness + complex-disease
            term)
          </span>
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Mini label="Editing-only births/yr — current evidence" stat={variant.uniquely_editable_total.strict} kind="int" />
          <Mini label="Editing-only births/yr — optimistic upper bound" stat={variant.uniquely_editable_total.permissive} kind="int" />
          <Mini label="Editing-only share of serious — current evidence" stat={variant.uniquely_editable_share_of_serious.strict} kind="pct" decimals={3} />
          <Mini label="Editing-only share of serious — optimistic upper bound" stat={variant.uniquely_editable_share_of_serious.permissive} kind="pct" decimals={2} />
          <Mini label="Not editing-dependent — current evidence" stat={variant.addressable_share_of_serious.strict} kind="pct" decimals={2} />
          <Mini label="Not editing-dependent — optimistic upper bound" stat={variant.addressable_share_of_serious.permissive} kind="pct" decimals={1} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          These are <strong>derived ratios</strong>, not new inputs. “Editing-only” = the
          no-selectable-embryo population plus the complex-disease term (above). The share divides
          that by the serious-disease total; “not editing-dependent” is 1 − that share. The two
          definitions differ only in how generously the complex-disease term is credited to
          editing.
        </p>
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
