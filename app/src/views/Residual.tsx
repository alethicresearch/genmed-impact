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
        title="Residual explorer"
        subtitle="S1: monogenic couples with no selectable unaffected embryo (editing is the only preventive option). S2: complex-disease cases uniquely reachable only by editing."
      />
      <Explainer
        whatThisShows="The two narrow situations where germline editing is genuinely the only option: couples for whom every embryo would be affected (S1), and complex-disease edits with no better alternative (S2)."
        howToRead="S1 is built up disease by disease from allele frequencies and couple types; the congenital-deafness toggle shows how one contested inclusion shifts the total. S2 is shown under a strict and a permissive definition side by side."
        whatItDetermines="The size of the genuinely editing-unique residual — the numerator that the whole 'how much does editing add?' question turns on."
      />

      {/* Contested toggle + its effect on the headline */}
      <Card className="border-amber-300 bg-amber-50/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Toggle
              label="Include congenital deafness in S1 (contested)"
              checked={includeContested}
              onChange={(v) => update({ deaf: v ? '1' : '0' })}
            />
            <p className="mt-1 max-w-2xl text-xs text-slate-600">
              Congenital deafness is the largest single S1 contributor, but many in the Deaf
              community do not regard it as a disease to prevent. Toggling it changes S1 by a
              median of{' '}
              <strong className="tnum">{fmtInt(r.s1_contested_delta.median)}</strong> births/yr:
              about <strong className="tnum">{fmtInt(s1Excl.median)}</strong> excluding it vs{' '}
              <strong className="tnum">{fmtInt(s1Incl.median)}</strong> including it. The headline
              uses the excluding-deafness figure.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              S1 total ({includeContested ? 'incl.' : 'excl.'} deafness)
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
        <h3 className="text-base font-semibold text-slate-900">S1 — residual by condition</h3>
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
                <td className="px-3 py-2">S1 total ({includeContested ? 'incl.' : 'excl.'} contested)</td>
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
          S1 — by World Bank income group
        </h3>
        <p className="mt-1 max-w-3xl text-xs text-slate-600">{r.s1_by_region_note}</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">S1 residual births per year by income group</caption>
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th scope="col" className="px-3 py-2 text-left font-medium">Income group</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  S1 ({includeContested ? 'incl.' : 'excl.'} deafness), median
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
          <h3 className="text-base font-semibold text-slate-900">S2 — strict</h3>
          <p className="mt-1 text-sm text-slate-600">
            Complex-disease cases uniquely reachable only by editing, strict criteria.
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
          <h3 className="text-base font-semibold text-slate-900">S2 — permissive</h3>
          <p className="mt-1 text-sm text-slate-600">Under permissive criteria for complex-disease editing.</p>
          <p className="mt-4 text-2xl">
            <StatValue stat={r.s2.permissive} kind="int" showCi />
            <span className="tnum text-base font-normal text-slate-500"> births / yr</span>
          </p>
        </Card>
      </div>

      {/* Uniquely-editable summary (reacts to the contested toggle) */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-slate-900">
          Uniquely-editable summary{' '}
          <span className="text-sm font-normal text-slate-500">
            (S1 {includeContested ? 'incl.' : 'excl.'} deafness + S2)
          </span>
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Mini label="Uniquely editable — strict" stat={variant.uniquely_editable_total.strict} kind="int" />
          <Mini label="Uniquely editable — permissive" stat={variant.uniquely_editable_total.permissive} kind="int" />
          <Mini label="Addressable share (permissive)" stat={variant.addressable_share_of_serious.permissive} kind="pct" decimals={1} />
          <Mini label="UE share of serious — strict" stat={variant.uniquely_editable_share_of_serious.strict} kind="pct" decimals={3} />
          <Mini label="UE share of serious — permissive" stat={variant.uniquely_editable_share_of_serious.permissive} kind="pct" decimals={2} />
          <Mini label="Addressable share (strict)" stat={variant.addressable_share_of_serious.strict} kind="pct" decimals={2} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          These are <strong>derived ratios</strong>, not new inputs. “Uniquely editable” = S1 +
          S2 (above). “UE share” divides that by the serious-disease total; “addressable share” is
          1 − UE share. Strict and permissive differ only in how generously the S2 term is credited
          to editing.
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
