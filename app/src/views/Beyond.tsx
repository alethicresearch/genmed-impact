import { AllData } from '../data';
import { UrlState } from '../urlState';
import StatValue from '../components/StatValue';
import { Card } from '../components/ui';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';
import { Reading, PH, Lead, Caption } from '../components/prose';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

// Beyond disease prevention — resistance and enhancement, treated together because the point
// they establish is the same: neither inherits the medical justification for preventing
// serious inherited disease. They are examined here to show why the paper keeps the three
// domains apart, not because they form a natural progression.
export default function Beyond({ data, update }: Props) {
  const r = data.resistance;
  return (
    <SourcesProvider>
      <Reading>
        <p className="text-[15px] leading-7 text-slate-600">
          The analysis so far concerns preventing or treating serious inherited disease. Two
          further uses of germline editing are often discussed alongside it:{' '}
          <em>resistance</em> — editing a healthy genome to blunt a common risk such as infection
          or cardiovascular disease — and <em>enhancement</em> — pushing a trait beyond the
          typical range. This section examines both. Its conclusion is structural: these are
          different questions with different justifications, and the case for preventing
          catastrophic disease does not transfer to them. That is why the paper treats
          prevention, resistance, and enhancement as separate categories rather than points on
          one path.
        </p>

        <section className="space-y-3">
          <PH>Resistance: does an edit add anything existing medicine does not?</PH>
          <Lead>
            For each proposed resistance edit, the relevant comparison is with the drugs and
            public-health tools that already target the same risk. Of the three most-discussed
            candidates, only HIV reduces to a residual birth count; for the others no comparable
            single number exists, and the panels below say so rather than estimating one.
          </Lead>

          <div className="grid grid-cols-1 gap-4">
            {/* HIV */}
            <Card>
              <h3 className="text-base font-semibold text-slate-900">HIV (CCR5)</h3>
              <dl className="mt-3 space-y-3">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Vertical infections / year
                  </dt>
                  <dd className="mt-0.5 text-lg">
                    <StatValue stat={r.hiv.vertical_infections_per_year} kind="int" showCi />
                    <SourceNote
                      source="UNAIDS 2023 — new vertical (mother-to-child) HIV infections"
                      doi={null}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Residual after existing prevention (PMTCT)
                  </dt>
                  <dd className="mt-0.5 text-lg">
                    <StatValue stat={r.hiv.residual_after_pmtct} kind="int" showCi />
                    <span className="block text-xs font-normal text-slate-500">
                      after prevention of mother-to-child transmission (PMTCT), which stops
                      &gt;98% of cases where implemented
                    </span>
                    <SourceNote
                      source="WHO — PMTCT prevents >98% of vertical HIV transmission where implemented"
                      doi={null}
                    />
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-slate-600">{r.hiv.note}</p>
            </Card>

            {/* Cardiovascular */}
            <Card>
              <h3 className="text-base font-semibold text-slate-900">
                Cardiovascular risk (e.g. PCSK9)
              </h3>
              <p className="mt-3 inline-block rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                No single birth count
              </p>
              <p className="mt-3 text-sm text-slate-600">{r.cardiovascular.note}</p>
            </Card>

            {/* Neurodegeneration */}
            <Card className="border-amber-300 bg-amber-50">
              <h3 className="text-base font-semibold text-slate-900">
                Neurodegeneration (e.g. APOE)
              </h3>
              <p className="mt-3 text-2xl font-semibold text-amber-800">Not computable</p>
              <p className="mt-3 text-sm text-slate-700">{r.neurodegeneration.note}</p>
            </Card>
          </div>
          <Lead>
            In each case an alternative already exists that reaches more people at lower cost and
            risk than a germline edit could. Resistance editing may merit research on its own
            terms, but it cannot be justified by the burden of untreated inherited disease — the
            burden sits elsewhere, and the alternatives are not exhausted.
          </Lead>
        </section>

        <section className="space-y-3">
          <PH>Enhancement: a different question, not a further step</PH>
          <Lead>
            Enhancement means raising a trait — cognition, height, longevity — beyond the typical
            range, rather than preventing or curing disease. Preventing serious disease removes
            suffering that would otherwise fall on a specific child; enhancement redistributes
            relative advantage. The two call on different ethical arguments, and only the first
            carries the public-health justification that drives the rest of this analysis. The
            paper's position is that enhancement must be argued for, or against, on its own
            terms.
          </Lead>
        </section>

        <section className="space-y-3">
          <PH>The continuum argument, and where it stops</PH>
          <Lead>
            There is a genuine biological continuum from disease to trait. On the{' '}
            <button
              type="button"
              onClick={() => update({ tab: 'multifactorial' })}
              className="font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              liability-threshold model
            </button>{' '}
            everyone carries a continuous genetic load, and “disease” is the far tail past a
            threshold. From this some argue that if medicine already acts to lower risk along
            that continuum, shifting the whole distribution — enhancing everyone — is more of the
            same. The inference does not hold: a continuum in biology is not a continuum in
            justification. Below the threshold the goal is preventing serious illness in an
            identifiable future person; beyond it, changing a population's traits is a contested
            social project that medicine's mandate does not settle.
          </Lead>
        </section>

        <section className="space-y-3">
          <PH>Feasibility is a separate constraint</PH>
          <Lead>
            Independently of whether it is desirable, enhancement of complex traits is largely
            out of reach on current science. The traits usually proposed are{' '}
            <strong>massively polygenic</strong> — thousands of variants of tiny effect —
            strongly environment-dependent, and predicted by scores whose accuracy does not
            transfer well across ancestries. Editing a handful of loci cannot move such a trait
            far, and embryo selection is bounded by the number of embryos an IVF cycle yields.
            The same architecture ceiling that limits editing for common <em>disease</em> limits
            it further for enhancement.
          </Lead>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => update({ tab: 'multifactorial' })}
              className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              See the polygenicity ceiling →
            </button>
          </div>
          <Caption>
            Genetic architecture of complex traits: Turkheimer 2000; Plomin &amp; von Stumm 2018.
            Cross-ancestry portability of polygenic scores: Martin et al. 2019.
          </Caption>
        </section>

        <section className="space-y-3">
          <PH>No burden denominator applies here</PH>
          <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4">
            <p className="text-sm leading-7 text-slate-700">
              Every disease-facing section of this analysis reduces to a number of affected
              births or cases. Resistance mostly does not, and enhancement does not at all: there
              is no disease burden being averted. That absence is itself a finding. Whatever case
              exists for these uses of editing, it belongs to a separate debate about risk,
              advantage, and fairness — and should be assessed there, not carried by the case for
              preventing disease. What this separation implies for regulation is taken up in{' '}
              <button
                type="button"
                onClick={() => update({ tab: 'ethics' })}
                className="font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                What should follow
              </button>
              .
            </p>
          </div>
        </section>

        <SourcesList title="Sources" />
      </Reading>
    </SourcesProvider>
  );
}
