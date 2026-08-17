import { useState } from 'react';
import { AllData, EditingCondition, Tractability, fmtInt, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { Card, SectionHeading } from '../components/ui';
import { InlineLink } from '../components/prose';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

const TRACT_COLOR: Record<Tractability, string> = {
  base_editable: '#059669',
  prime_only: '#d97706',
  no_current_route: '#94a3b8',
};

const GATE_STATUS_STYLE: Record<string, { cls: string; label: string }> = {
  quantified: { cls: 'bg-emerald-100 text-emerald-800', label: 'Quantified' },
  not_established: { cls: 'bg-amber-100 text-amber-800', label: 'Not established' },
  unquantified: { cls: 'bg-slate-200 text-slate-600', label: 'Unquantified' },
};

export default function EditingTech({ data, update }: Props) {
  const e = data.editingTech;
  const [openMatrix, setOpenMatrix] = useState(false);
  const [openCond, setOpenCond] = useState<string | null>(null);

  const headline = e.conditions.filter((c) => !c.contested);
  const maxBirths = Math.max(...headline.map((c) => c.s1_births_per_year), 1);

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Which editing technology, and for which variants?"
        subtitle="“Editing” is not one capability. What a family would need depends on the kind of variant they carry — and for some, no current platform can make the change at all."
      />

      <p className="max-w-3xl text-[15px] leading-7 text-slate-700">
        Elsewhere this analysis asks whether embryo selection can help a couple. That is only the
        first of four things that must be true before germline editing helps anyone. Separating
        them matters, because collapsing them produces the familiar claim that editing
        &ldquo;could&rdquo; serve every family selection cannot — which holds only if the other
        three are assumed away.
      </p>

      {/* THE ORGANISING DEVICE: four gates, narrowing */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">
          Four things must all be true
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Each gate narrows the population. Only the first two can currently be given a number;
          the last two are open questions, and saying so is more useful than filling them in.
        </p>

        <ol className="mt-4 space-y-3">
          {e.gates.map((g, i) => {
            const quantified = g.status === 'quantified';
            const value =
              g.key === 'selection_fails'
                ? e.s1_total_headline
                : g.key === 'correction_route'
                ? e.s1_with_correction_route
                : null;
            const width =
              value != null ? Math.max(6, (value / e.s1_total_headline) * 100) : 100;
            const st = GATE_STATUS_STYLE[g.status];
            return (
              <li key={g.key} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    <span className="mr-2 text-slate-400">{i + 1}</span>
                    {g.label}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
                <p className="mt-0.5 text-sm italic text-slate-600">{g.question}</p>

                {/* the narrowing bar */}
                <div className="mt-2 h-7 w-full overflow-hidden rounded bg-slate-100">
                  {value != null ? (
                    <div
                      className="flex h-full items-center justify-end bg-accent px-2 text-xs font-semibold text-white"
                      style={{ width: `${width}%` }}
                    >
                      {fmtInt(value)} / yr
                    </div>
                  ) : (
                    <div
                      className="flex h-full items-center px-2 text-xs font-medium text-slate-500"
                      style={{
                        background:
                          'repeating-linear-gradient(45deg,#e2e8f0,#e2e8f0 6px,#f1f5f9 6px,#f1f5f9 12px)',
                      }}
                    >
                      no established basis for a number
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">{g.detail}</p>
                {quantified && g.key === 'selection_fails' && (
                  <p className="mt-1 text-xs">
                    <InlineLink onClick={() => update({ tab: 'residual' })}>
                      How this population is calculated
                    </InlineLink>
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </Card>

      {/* Gate 2 in detail */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">
          Gate 2: what kind of change would have to be made?
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Platforms are not interchangeable. Base editing swaps one base for another but only
          within a chemical family; prime editing can write new sequence; nothing on the shelf
          restores a deleted gene or shortens a repeat. So the variant a family carries decides
          which platform, if any, is even relevant.
        </p>

        <div className="mt-4 space-y-2">
          {(Object.keys(e.by_tractability) as Tractability[]).map((t) => {
            const v = e.by_tractability[t];
            const share = v.births_per_year / e.s1_total_headline;
            return (
              <div key={t}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-slate-700">{v.label}</span>
                  <span className="tnum font-semibold text-slate-900">
                    {fmtInt(v.births_per_year)} / yr
                    <span className="ml-1 font-normal text-slate-400">
                      ({fmtPct(share, 0)})
                    </span>
                  </span>
                </div>
                <div className="mt-0.5 h-4 w-full overflow-hidden rounded bg-slate-100">
                  <div
                    className="h-full"
                    style={{ width: `${share * 100}%`, backgroundColor: TRACT_COLOR[t] }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-3 rounded border border-amber-300 bg-amber-50/60 p-3 text-sm leading-6 text-slate-700">
          The most mature editing platform — base editing — is relevant to{' '}
          <strong>{fmtPct(e.by_tractability.base_editable.births_per_year / e.s1_total_headline, 0)}</strong>{' '}
          of this population. The largest single group is sickle cell disease, whose variant is a
          transversion that standard base editors cannot make, and the second largest is
          chromosomal rearrangement, where there is no sequence to correct at all.
        </p>
      </Card>

      {/* Per condition */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">Condition by condition</h3>
        <p className="mt-1 text-sm text-slate-600">
          Bars are the share of the population where selection fails. Click any row for the
          molecular detail and its source.
        </p>
        <div className="mt-3 space-y-1.5">
          {headline.map((c) => (
            <ConditionRow
              key={c.condition}
              c={c}
              maxBirths={maxBirths}
              open={openCond === c.condition}
              onToggle={() =>
                setOpenCond(openCond === c.condition ? null : c.condition)
              }
            />
          ))}
        </div>
        {e.meta.headline_excludes_contested.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Excludes {e.meta.headline_excludes_contested.join(', ')} — contested as a target and
            left out of the headline throughout this project, as on the residual view.
          </p>
        )}
      </Card>

      {/* Addition is not editing */}
      <Card className="border-violet-300 bg-violet-50/40">
        <h3 className="text-base font-semibold text-slate-900">
          Adding a gene is not correcting one
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          The approved therapies people have in mind when they say &ldquo;gene therapy&rdquo; are
          mostly not editing. Zolgensma delivers a working copy of <em>SMN1</em> without touching
          the faulty sequence; Casgevy does edit, but it disrupts a different gene to raise fetal
          haemoglobin rather than repairing the sickle variant. Spinal muscular atrophy makes the
          distinction concrete: about 95% of cases are a deleted gene, which no platform can
          restore — which is precisely why the treatment that works is addition.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          This matters for the argument because an added copy is not heritable correction. It
          treats the person in front of you; it does nothing for the embryo case.
        </p>
      </Card>

      {/* Reference matrix — progressive disclosure */}
      <Card>
        <button
          type="button"
          aria-expanded={openMatrix}
          onClick={() => setOpenMatrix((v) => !v)}
          className="text-sm font-semibold text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {openMatrix ? 'Hide' : 'Show'} the platform reference — what each can and cannot do ▾
        </button>
        {openMatrix && (
          <div className="mt-3 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">Which platform can address which variant class</caption>
                <thead>
                  <tr className="border-b border-slate-300 text-left text-slate-600">
                    <th scope="col" className="px-2 py-2 font-medium">Variant class</th>
                    <th scope="col" className="px-2 py-2 font-medium">
                      Platform that could make the change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(e.variant_classes).map(([k, vc]) => {
                    const plats = e.capability[k] || [];
                    return (
                      <tr key={k} className="border-b border-slate-100 align-top">
                        <td className="px-2 py-2">
                          <span className="font-medium text-slate-900">{vc.label}</span>
                          <span className="block text-xs leading-5 text-slate-500">
                            {vc.detail}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          {plats.length ? (
                            <span className="flex flex-wrap gap-1">
                              {plats.map((p) => (
                                <span
                                  key={p}
                                  className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800"
                                >
                                  {e.platforms[p]?.label ?? p}
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                              None
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              {Object.entries(e.platforms).map(([k, p]) => (
                <div key={k} className="rounded border border-slate-200 p-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-semibold text-slate-900">{p.label}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        p.edits_genome
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p.edits_genome ? 'edits the genome' : 'does not edit the genome'}
                    </span>
                    <span className="text-xs text-slate-400">{p.maturity}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{p.mechanism}</p>
                  <p className="mt-1 text-xs text-slate-500">Examples: {p.examples}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    In embryos: {p.germline_status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Caveats */}
      <Card className="bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-900">What this does and does not claim</h3>
        <ul className="mt-2 space-y-1.5">
          {e.meta.caveats.map((c) => (
            <li key={c} className="flex gap-2.5 text-[13px] leading-6 text-slate-600">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-6 text-slate-600">
          <InlineLink onClick={() => update({ tab: 'residual' })}>
            Where the underlying population comes from
          </InlineLink>
          {' · '}
          <InlineLink onClick={() => update({ tab: 'methods' })}>
            Sources and assumptions
          </InlineLink>
        </p>
      </Card>
    </div>
  );
}

function ConditionRow({
  c,
  maxBirths,
  open,
  onToggle,
}: {
  c: EditingCondition;
  maxBirths: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded border border-slate-200">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="w-full px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-slate-900">
            <span
              aria-hidden="true"
              className={`mr-1.5 inline-block text-xs text-slate-400 transition-transform ${
                open ? 'rotate-90' : ''
              }`}
            >
              ▶
            </span>
            {c.condition}
          </span>
          <span className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">{c.variant_class_label}</span>
            <span
              className="rounded px-1.5 py-0.5 font-medium text-white"
              style={{ backgroundColor: TRACT_COLOR[c.tractability] }}
            >
              {c.tractability === 'base_editable'
                ? 'mature platform'
                : c.tractability === 'prime_only'
                ? 'prime editing only'
                : 'no route'}
            </span>
            <span className="tnum w-16 text-right font-semibold text-slate-900">
              {fmtInt(c.s1_births_per_year)}
            </span>
          </span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded bg-slate-100">
          <div
            className="h-full"
            style={{
              width: `${(c.s1_births_per_year / maxBirths) * 100}%`,
              backgroundColor: TRACT_COLOR[c.tractability],
            }}
          />
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[13px] leading-6 text-slate-700">{c.explanation}</p>
          <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span>
              Confidence in this classification: <strong>{c.confidence}</strong>
            </span>
            {c.heterogeneous && (
              <span>Gene is allelically heterogeneous — one class is an approximation</span>
            )}
            {c.citation && <span>Source: {c.citation}</span>}
          </p>
        </div>
      )}
    </div>
  );
}
