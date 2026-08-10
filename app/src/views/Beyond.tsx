import { AllData } from '../data';
import { UrlState } from '../urlState';
import StatValue from '../components/StatValue';
import { Card } from '../components/ui';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';
import { Reading, PH, Lead, Caption, Claim, InlineLink } from '../components/prose';

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
          The impact framework does not stop at disease prevention. The same technological
          advances that could make polygenic disease editing more consequential may eventually
          make resistance and enhancement more technically plausible. That makes it important
          to distinguish <strong>technical continuity from ethical continuity</strong>: the
          medical argument for correcting a severe inherited disorder does not automatically
          apply to every possible use of germline editing.
        </p>
        <p className="text-[15px] leading-7 text-slate-600">
          Resistance would alter an otherwise healthy embryo to reduce a future risk such as HIV
          infection or cardiovascular disease. Enhancement would alter traits beyond the
          prevention of disease. In both cases, the relevant alternatives, expected benefits,
          and ethical questions differ from the{' '}
          <InlineLink onClick={() => update({ tab: 'residual' })}>
            no-alternative monogenic cases identified in the main analysis
          </InlineLink>
          .
        </p>

        <section className="space-y-3">
          <PH>Resistance: what would editing add beyond existing prevention?</PH>
          <Lead>
            A resistance edit should be compared with the interventions that already reduce the
            same risk. If effective prevention or treatment exists, a germline intervention
            requires evidence of an additional benefit large enough to justify its additional
            uncertainty and heritability.
          </Lead>

          <div className="grid grid-cols-1 gap-4">
            {/* HIV */}
            <Card>
              <h3 className="text-base font-semibold text-slate-900">HIV (CCR5)</h3>
              <p className="mt-2 text-sm text-slate-600">
                CCR5 is often discussed because some naturally occurring variants reduce
                susceptibility to HIV. But mother-to-child transmission can already be prevented
                at very high rates where prevention programmes are fully implemented. The
                relevant question is therefore not whether HIV can be prevented, but whether
                germline editing adds meaningful benefit beyond closing the remaining
                prevention and treatment gap.
              </p>
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
            </Card>

            {/* Cardiovascular */}
            <Card>
              <h3 className="text-base font-semibold text-slate-900">
                Cardiovascular risk (e.g. PCSK9)
              </h3>
              <p className="mt-3 inline-block rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                No comparable population estimate in this model
              </p>
              <p className="mt-3 text-sm text-slate-600">
                PCSK9 illustrates a genetically validated pathway for reducing LDL cholesterol
                and cardiovascular risk. But drugs and somatic interventions can target the same
                pathway. This analysis therefore does not identify a distinct population for
                whom germline PCSK9 editing is medically necessary.
              </p>
            </Card>

            {/* Neurodegeneration */}
            <Card className="border-amber-300 bg-amber-50">
              <h3 className="text-base font-semibold text-slate-900">
                Neurodegeneration (e.g. APOE)
              </h3>
              <p className="mt-3 text-2xl font-semibold text-amber-800">Not estimated</p>
              <p className="mt-3 text-sm text-slate-700">
                APOE illustrates a different problem: a strong genetic association does not
                imply a simple beneficial edit. The gene has multiple biological effects, so
                changing one risk relationship may create others.
              </p>
            </Card>
          </div>
          <Claim kind="interpretation">
            For each proposed resistance intervention, established preventive or therapeutic
            alternatives already exist. The current analysis does not establish that a germline
            edit would provide a superior overall balance of benefit, reach, cost, and risk. A
            germline resistance intervention would therefore require its own evidence of added
            value rather than inheriting the justification for preventing severe monogenic
            disease.
          </Claim>
        </section>

        <section className="space-y-3">
          <PH>Enhancement asks a different question</PH>
          <Claim kind="interpretation">
            Enhancement concerns traits such as cognition, height, athletic ability, or
            longevity rather than preventing a serious inherited disorder. Its potential
            benefits may be absolute, positional, or both, and its evaluation requires questions
            about autonomy, fairness, distribution, social pressure, and effects on future
            generations that are not captured by the disease-burden model used here.
          </Claim>
        </section>

        <section className="space-y-3">
          <PH>Biological continuity does not settle the ethical question</PH>
          <Lead>
            Disease risk and many human traits exist on biological continua. That does not mean
            the justification for intervention is continuous as well. We argue that preventing
            serious disease in an identifiable future person and deliberately shifting traits
            beyond a disease threshold require different ethical arguments.
          </Lead>
        </section>

        <section className="space-y-3">
          <PH>Complex-trait enhancement is also technically constrained</PH>
          <Lead>
            Most proposed enhancement traits are highly polygenic and strongly influenced by
            environment. Their genetic effects are spread across many variants, and polygenic
            predictions often perform differently across ancestries. The same problems of
            polygenicity, causal uncertainty, pleiotropy, ancestry portability, and
            environmental influence make complex-trait enhancement technically demanding as
            well.
          </Lead>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => update({ tab: 'multifactorial' })}
              className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Explore the polygenic frontier →
            </button>
          </div>
          <Caption>
            Genetic architecture of complex traits: Turkheimer 2000; Plomin &amp; von Stumm 2018.
            Cross-ancestry portability of polygenic scores: Martin et al. 2019.
          </Caption>
        </section>


        <SourcesList title="Sources" />
      </Reading>
    </SourcesProvider>
  );
}
