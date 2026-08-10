import { AllData, fmtCompact, fmtInt } from '../data';
import { UrlState } from '../urlState';
import { Card, SectionHeading } from '../components/ui';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';
import { Claim } from '../components/prose';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

// Curated per-inheritance descriptions (the typical at-risk couple each row models).
const INHERITANCE_NOTE: Record<string, string> = {
  autosomal_recessive: 'both parents carriers → 1/4 of embryos affected',
  autosomal_dominant: 'affected heterozygous × unaffected → 1/2 affected',
  x_linked_recessive: 'carrier mother; unaffected embryos selectable (may also select sex)',
  x_linked_dominant: 'affected parent → ~1/2 affected',
  chromosomal: 'euploid fraction (aneuploidy / translocation segregation), age-dependent',
  multifactorial: 'no single-locus target; selection is polygenic (see complex-disease analysis)',
};

export default function Embryos({ data }: Props) {
  const e = data.embryos;
  const agg = e.aggregate;
  const bl = e.params.blastocysts_per_ivf_cycle;

  return (
    <SourcesProvider>
    <div className="space-y-6">
      <SectionHeading
        title="The embryo trade-off"
        subtitle="An idealized comparison of embryo selection and successful correction on one ethically relevant dimension: how many embryos with the targeted genotype remain candidates for transfer."
      />
      <p className="text-sm leading-relaxed text-slate-700">
        Embryo selection and successful editing differ in what happens to embryos carrying the
        targeted genotype. This idealized comparison estimates the number of affected-genotype
        embryos not selected for transfer per unaffected child as unaffected embryos become
        rarer.
      </p>
      <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4 text-sm leading-6 text-slate-700">
        <strong>This is an idealized comparison.</strong> In the strategy modeled here, PGT avoids
        transfer of embryos with the targeted genotype, whereas successful correction would retain
        that embryo as a candidate for transfer. The comparison does not model editing failure,
        mosaicism, safety-related embryo loss, or the additional embryos a real clinical program
        might require — all of which would raise the editing side above zero. “Not selected for
        transfer” is used as the analytic term because it describes the modeled decision, not the
        eventual disposition of any embryo.
      </div>
      <Claim kind="interpretation">
        On this one dimension, successful correction can compare favorably with selection — and
        increasingly so as unaffected embryos become rarer. Whether that makes editing ethically
        preferable overall is a separate judgment that also depends on safety, feasibility, and
        the considerations in Ethics &amp; policy.
      </Claim>

      {/* Curve */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">
          How embryo selection changes as unaffected embryos become rarer
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Affected embryos not selected for transfer, per unaffected child. As unaffected embryos
          get rarer (moving right), the selection figure climbs steeply and diverges at the limit
          where no unaffected embryo exists; idealized correction stays at zero.
        </p>
        <CurveChart e={data.embryos} />
      </Card>

      {/* Per-inheritance table */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">By inheritance mode</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Embryo selection cost by inheritance mode</caption>
            <thead>
              <tr className="border-b border-slate-300 text-left text-slate-600">
                <th scope="col" className="px-3 py-2 font-medium">Inheritance (typical at-risk couple)</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Unaffected fraction u</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Not selected for transfer / child (selection)
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Idealized successful editing</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(e.per_inheritance).map(([k, v]) => (
                <tr key={k} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-1.5 text-slate-700">
                    {k.replace(/_/g, ' ')}
                    {INHERITANCE_NOTE[k] && (
                      <span className="block text-xs text-slate-400">{INHERITANCE_NOTE[k]}</span>
                    )}
                  </td>
                  <td className="tnum px-3 py-1.5 text-right">{v.unaffected_embryo_fraction.toFixed(2)}</td>
                  <td className="tnum px-3 py-1.5 text-right font-semibold text-rose-700">
                    {v.affected_embryos_discarded_per_child.toFixed(2)}
                  </td>
                  <td className="tnum px-3 py-1.5 text-right text-emerald-700">0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          The unaffected-embryo fraction <em>u</em> is the Mendelian expectation for a typical
          at-risk couple of each inheritance mode (e.g. ¾ for a recessive carrier × carrier cross);
          not-selected-per-child is (1−u)/u.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Zero means zero genotype-based exclusions by construction; editing failure, mosaicism,
          developmental attrition, and safety-related embryo loss are not modeled.
        </p>
      </Card>

      {/* Illustrative population scaling — advanced, off the default reading path */}
      <details className="rounded-lg border border-slate-300 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
          Illustrative scaling — advanced (not an estimate of actual annual embryo disposition)
        </summary>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          This counterfactual applies the per-child Mendelian ratio to the catalogue&apos;s
          affected-birth count. It does not model uptake of IVF, number of cycles, embryo
          attrition, clinical practice, cryopreservation, donation, or ultimate embryo
          disposition.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Affected births addressable by embryo selection / yr
          </p>
          <p className="tnum mt-1 text-2xl font-bold text-slate-900">
            {fmtCompact(agg.pgt_addressable_affected_births_per_year)}
          </p>
          <p className="text-xs text-slate-500">
            summed over the monogenic core-catalogue diseases where PGT applies — the population this
            whole comparison is about
          </p>
          <SourceNote
            source="Derived: Σ (affected births × PGT-applicable) over the monogenic core catalogue"
            doi={null}
          />
        </Card>
        <Card className="border-rose-200 bg-rose-50/50">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Affected embryos not selected for transfer / yr — <strong>selection</strong> strategy
          </p>
          <p className="tnum mt-1 text-2xl font-bold text-rose-700">
            {fmtCompact(agg.affected_embryos_discarded_selection_strategy)}
          </p>
          <p className="text-xs text-slate-500">
            to reach those births by choosing unaffected embryos: Σ (1−u)/u × addressable births
          </p>
          <SourceNote
            source={`Derived from the per-inheritance unaffected-embryo fraction u and ~${bl} blastocysts per IVF cycle (table below)`}
            doi={null}
          />
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Idealized successful correction — embryos not selected for transfer / yr
          </p>
          <p className="tnum mt-1 text-xl font-bold text-emerald-700">
            {fmtInt(agg.affected_embryos_discarded_editing_strategy)} disease-genotype exclusions
            <span className="font-normal"> — by construction</span>
          </p>
          <p className="text-xs text-slate-500">
            zero by construction in this idealized model — a successfully corrected embryo remains
            a transfer candidate (editing failure and safety-related loss are not modeled)
          </p>
        </Card>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Real programs use a mix of pathways and coverage is far below 100%, so this is a scale
          contrast, not a forecast. Prenatal diagnosis is a separate moral category — termination
          of an affected pregnancy, not embryo non-selection — and is tracked separately in the
          prevention model.
        </p>
      </details>

      <SourcesList title="Derivations" />
    </div>
    </SourcesProvider>
  );
}

function CurveChart({ e }: { e: AllData['embryos'] }) {
  const W = 760;
  const H = 300;
  const padL = 52;
  const padR = 20;
  const padT = 16;
  const padB = 44;
  const pts = e.curve.slice().sort((a, b) => b.u - a.u); // u high → low (left → right)
  const maxY = Math.max(...pts.map((p) => p.selection_affected_discarded), 5);
  const n = pts.length;
  const x = (i: number) => padL + (i / (n - 1)) * (W - padL - padR);
  const y = (v: number) => H - padB - (v / maxY) * (H - padT - padB);

  const selPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.selection_affected_discarded)}`).join(' ');
  const editY = y(0);

  return (
    <div className="mt-3 overflow-x-auto">
      <svg role="img" aria-label="Selection embryo cost vs unaffected fraction" viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 560 }}>
        {/* axes */}
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#cbd5e1" />
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#cbd5e1" />
        {/* editing line (flat at 0) */}
        <line x1={padL} y1={editY} x2={W - padR} y2={editY} stroke="#059669" strokeWidth={2} />
        <text x={W - padR} y={editY - 6} fontSize={11} textAnchor="end" fill="#059669">
          Idealized successful correction: 0 genotype-based exclusions
        </text>
        {/* selection curve */}
        <path d={selPath} fill="none" stroke="#e11d48" strokeWidth={2.5} />
        {pts.map((p, i) => (
          <g key={p.u}>
            <circle cx={x(i)} cy={y(p.selection_affected_discarded)} r={3} fill="#e11d48" />
            <text x={x(i)} y={H - padB + 14} fontSize={10} textAnchor="middle" fill="#64748b">
              {p.u.toFixed(2)}
            </text>
          </g>
        ))}
        <text x={x(n - 1)} y={y(pts[n - 1].selection_affected_discarded) - 8} fontSize={11} textAnchor="end" fill="#e11d48">
          Selection = (1−u)/u → ∞ when no unaffected embryo exists
        </text>
        {/* y ticks */}
        {[0, Math.round(maxY / 2), Math.round(maxY)].map((v) => (
          <text key={v} x={padL - 6} y={y(v) + 3} fontSize={10} textAnchor="end" fill="#64748b">
            {v}
          </text>
        ))}
        <text x={(padL + W - padR) / 2} y={H - 6} fontSize={11} textAnchor="middle" fill="#334155">
          Fraction of embryos unaffected (u) — rarer →
        </text>
        <text x={14} y={(padT + H - padB) / 2} fontSize={11} textAnchor="middle" fill="#334155" transform={`rotate(-90 14 ${(padT + H - padB) / 2})`}>
          Not selected for transfer / child
        </text>
      </svg>
    </div>
  );
}
