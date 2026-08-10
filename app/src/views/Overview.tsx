import { ReactNode } from 'react';
import { AllData, DiseaseClass, fmtCompact, fmtInt, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { SourcesProvider, SourcesList } from '../components/SourceNote';
import { Figure, EpistemicTag, EpistemicKind, InlineLink } from '../components/prose';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

export default function Overview({ data, update }: Props) {
  const rollup = data.library.rollup;
  const burden = data.summary.burden_default;
  const editableTotal = data.summary.uniquely_editable_total;
  const editableShare = data.summary.uniquely_editable_share_of_serious;

  return (
    <SourcesProvider>
      <article className="space-y-10 pb-4">
        {/* The organizing question: impact rather than novelty. */}
        <section className="space-y-3">
          <p className="text-xl font-semibold leading-8 tracking-tight text-slate-900">
            How should genetic medicine be prioritized when judged by impact rather than
            technological novelty?
          </p>
          <Lead>
            Genetic medicine is often discussed through its most spectacular technologies.
            Novel interventions attract attention because they expand the frontier of what is
            possible. But novelty is not the same as impact. Some of the largest gains
            available today come from established screening, reproductive, diagnostic, and
            therapeutic pathways that remain unevenly deployed, while technologies with limited
            present-day application may become much more consequential as science advances.
          </Lead>
          <Lead>
            This project therefore evaluates genetic medicine across{' '}
            <strong>both present and prospective impact</strong>. We ask what existing medicine
            can already prevent, detect, or treat; where access rather than technology limits
            that impact; where germline editing provides a medically distinct option; and how
            advances in polygenic editing could change that landscape over the coming decades.
          </Lead>
          <Lead>
            Impact, in this framework, is multidimensional. It includes population impact,
            individual clinical impact, technological maturity, and distributional access —
            and also <strong>reproductive burden</strong>: the physical, procedural, and
            embryo-level burdens of achieving a reproductive outcome. Two interventions can
            achieve the same disease outcome while imposing very different reproductive
            burdens, so the route matters, not only the endpoint. Ethical acceptability is
            assessed alongside these dimensions rather than reduced to any of them.
          </Lead>
          <Lead>
            We address these questions by combining a disease-by-intervention catalogue (
            <InlineLink onClick={() => update({ tab: 'library', tier: 'all' })}>
              {fmtInt(rollup.n_diseases_all)} conditions
            </InlineLink>
            ), global disease-burden evidence,
            population modeling, an explicit analysis of reproductive configurations in which
            embryo selection fails or becomes unusually burdensome, and a genetic-architecture
            model of potential polygenic intervention.
          </Lead>

          {/* Source families, compact — each row links into Methods. */}
          <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-[13px] leading-6">
            <SourceRow label="Population & burden" items="GBD 2023 · UN WPP 2024 · WHO" onGo={() => update({ tab: 'methods' })} />
            <SourceRow label="Genetics & disease" items="Orphanet · gnomAD · published literature" onGo={() => update({ tab: 'methods' })} />
            <SourceRow label="Access & geography" items="World Bank · UNAIDS · national program evidence" onGo={() => update({ tab: 'methods' })} />
          </div>
        </section>

        <section className="space-y-3">
          <H>Why frame genetic medicine in terms of impact?</H>
          <Lead>
            Highly visible technological firsts can dominate public discussion far beyond the
            number of patients they can actually help. That creates two opposite risks:
            frontier interventions can receive disproportionate attention while established
            approaches remain underdeployed, and spectacular failures can provoke responses
            that make responsible development of genuinely valuable future applications more
            difficult.
          </Lead>
          <Lead>
            An impact framework avoids both errors. It asks what can help people{' '}
            <strong>now</strong>, where a new intervention provides a genuinely different
            medical option, and how those answers may change as technology matures.
          </Lead>
        </section>

        {/* The three time horizons of the impact framework */}
        <section className="space-y-2.5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Three horizons, one framework
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <HorizonCard
              title="Impact now"
              body="Existing carrier screening, reproductive genetics, prenatal diagnosis, newborn screening, and treatment can already alter outcomes for substantial genetic-disease burden. The important question is how much of that capability actually reaches patients."
            />
            <HorizonCard
              title="Translational frontier"
              body="Germline editing becomes medically distinctive where it provides a medically distinct or substantially less burdensome route — most clearly when no unaffected embryo can be selected for a severe monogenic disease, and more cautiously when selection remains possible but unusually burdensome."
            />
            <HorizonCard
              title="Future impact"
              body="The medical role of editing could expand as causal variants are identified more reliably and multiplex editing, embryo technologies, and risk prediction improve. Polygenic editing therefore needs to be evaluated as a developing frontier, not dismissed because it is not clinically viable today."
            />
          </div>
        </section>

        {/* Disease heterogeneity — part of the framework, not a finding */}
        <section className="space-y-3">
          <H>Different diseases create different intervention problems</H>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Monogenic disease</p>
              <p className="mt-1 text-[14px] leading-6 text-slate-700">
                A pathogenic variant in one gene may account for most of the relevant disease
                risk. This makes questions such as carrier status, affected embryos, and
                whether an unaffected embryo can be selected comparatively tractable.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Multifactorial disease</p>
              <p className="mt-1 text-[14px] leading-6 text-slate-700">
                Risk is distributed across many genetic and non-genetic influences. There is
                usually no binary “affected genotype” to remove. The relevant question becomes
                how much risk can be shifted, with how many variants, and relative to what
                alternatives.
              </p>
            </div>
          </div>
          <Lead>
            Under the broad default attribution, the population model contains approximately{' '}
            <InlineLink onClick={() => update({ tab: 'denominator' })}>
              {fmtCompact(burden.monogenic.median)} monogenic
            </InlineLink>{' '}
            and{' '}
            <InlineLink onClick={() => update({ tab: 'denominator' })}>
              {fmtCompact(burden.multifactorial.median)} multifactorial/partly genetic
            </InlineLink>{' '}
            cases per annual birth cohort. The multifactorial component is strongly sensitive
            to the attribution definition.
          </Lead>
        </section>

        <Findings data={data} update={update} />

        <AccessGap data={data} update={update} />

        {/* Combined scenario estimates — secondary, for scale only */}
        <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            For scale: combined scenario estimates
          </summary>
          <div className="mt-2 space-y-2 text-[14px] leading-6 text-slate-700">
            <p>
              The model also combines the no-selectable-embryo population with an exploratory
              population-scaled complex-disease term to show the relative scale of
              editing-relevant scenarios.
            </p>
            <p>
              Under the current-evidence scaling scenario, the combined estimate is
              approximately{' '}
              <InlineLink onClick={() => update({ tab: 'residual' })}>
                {fmtCompact(editableTotal.strict.median)} cases/year
              </InlineLink>{' '}
              ({fmtPct(editableShare.strict.median, 2)}). Under the future-capacity exploratory
              scaling scenario, it rises to approximately{' '}
              <InlineLink onClick={() => update({ tab: 'residual' })}>
                {fmtCompact(editableTotal.permissive.median)}/year
              </InlineLink>{' '}
              ({fmtPct(editableShare.permissive.median, 1)}).
            </p>
            <p>
              These figures combine <strong>different kinds of medical value</strong>: an
              only-option reproductive configuration in monogenic disease and a potential
              incremental advantage in multifactorial disease. They are useful for scale but
              are not the central conclusion of the paper, and the future figure should not be
              interpreted as a forecast or as the permanent upper limit of polygenic editing.
            </p>
            <p>
              The corresponding “not uniquely dependent on editing” percentages describe these
              particular modeled scenarios. They do not mean that the same percentage of
              disease is preventable by present medicine, nor that germline editing will remain
              confined to the same share as technology develops.
            </p>
          </div>
        </details>

        <KeyDefinitions />

        <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            About the numbers &amp; uncertainty
          </summary>
          <div className="mt-2 space-y-2 text-[13px] leading-6 text-slate-600">
            <p>
              Two estimates run in parallel. A growing curated catalogue of{' '}
              <InlineLink onClick={() => update({ tab: 'library', tier: 'all' })}>
                {fmtInt(rollup.n_diseases_all)} diseases
              </InlineLink>{' '}
              (
              <InlineLink onClick={() => update({ tab: 'library', tier: 'core' })}>
                {fmtInt(rollup.n_diseases)} high-burden core
              </InlineLink>{' '}
              +{' '}
              <InlineLink onClick={() => update({ tab: 'library', tier: 'rare' })}>
                {fmtInt(rollup.tiers.rare.n_diseases)} rare
              </InlineLink>
              ) — not an exhaustive universe —
              is summed disease-by-disease; a parametric model samples cited rates and
              assumptions to give the totals with uncertainty intervals. The catalogue sum
              ({fmtCompact(rollup.total_affected_births_per_year)}/yr over the core) is a floor
              that rises toward the modelled total ({fmtCompact(burden.total_serious.median)}/yr).
              What counts as “serious” and how much multifactorial disease is attributed to
              genetics are adjustable in the Disease burden section; the burden totals respond.
            </p>
            <button
              type="button"
              onClick={() => update({ tab: 'methods' })}
              className="font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Full methods &amp; sources →
            </button>
            <span className="sr-only">
              <SourcesList />
            </span>
          </div>
        </details>
      </article>
    </SourcesProvider>
  );
}

// The three findings, each teaching the situation before naming the estimate.
function Findings({
  data,
  update,
}: {
  data: AllData;
  update: (patch: UrlState) => void;
}) {
  const s1Total = data.summary.s1_total;
  const cur = data.prevention['Global']?.['current']?.['monogenic']?.['pnd_on'];
  const ideal = data.prevention['Global']?.['ideal']?.['monogenic']?.['pnd_on'];

  const findings: {
    title: string;
    body: ReactNode;
    kinds: EpistemicKind[];
    goLabel: string;
    go: () => void;
  }[] = [
    {
      title: 'Established genetic medicine has large unrealized impact today',
      kinds: ['model'],
      body: (
        <>
          For many well-characterized monogenic disorders, carrier screening and reproductive
          planning, IVF with PGT-M, prenatal diagnosis, newborn screening, and treatment can
          substantially alter outcomes.
          {cur && ideal ? (
            <>
              {' '}
              In the monogenic affected-birth model, current coverage avoids about{' '}
              {fmtPct(cur.total_averted_birth_fraction.median, 0)} of affected births under the
              specified assumptions, compared with approximately{' '}
              {fmtPct(ideal.total_averted_birth_fraction.median, 1)} under idealized full
              coverage.
            </>
          ) : null}{' '}
          This is a finding about monogenic affected-birth avoidance, not a claim that 99.7% of
          all genetic disease is preventable. Its importance is that a large share of currently
          achievable impact depends on implementation and access, not discovery of a new
          germline technology.
        </>
      ),
      goLabel: 'See the present impact of existing medicine',
      go: () => update({ tab: 'prevention' }),
    },
    {
      title:
        'The clearest near-term role for germline editing arises when embryo selection cannot achieve the desired outcome',
      kinds: ['model'],
      body: (
        <>
          Most monogenic reproductive risk does not require changing an embryo&apos;s genome:
          an unaffected embryo can often be selected. But some parental genetic configurations
          produce no unaffected embryo to select. Under the primary analysis, approximately{' '}
          {fmtCompact(s1Total.median)} births per year arise from these modeled configurations.
          These cases provide the clearest example of editing offering something medically
          different rather than simply another route to an outcome already available through
          selection. Selection can also become unusually burdensome before it becomes
          impossible — when unaffected embryos are rare, obtaining one may require many embryos
          or repeated IVF cycles — which changes the proportionality comparison without by
          itself justifying editing.
        </>
      ),
      goLabel: 'See the translational frontier',
      go: () => update({ tab: 'residual' }),
    },
    {
      title: 'Polygenic editing could expand the future medical role of germline intervention',
      kinds: ['model'],
      body: (
        <>
          Multifactorial disease poses a different problem. Editing is rarely the only option,
          but it could eventually produce substantial incremental risk reduction if disease
          risk can be traced to sufficiently causal and editable variants and multiplex editing
          becomes safe and precise. Under current-capacity assumptions, the model finds little
          practical editing advantage. Under the hypothetical high-capacity assumptions, some
          more genetically concentrated complex diseases cross the modeled risk-reduction
          threshold. This is not a forecast of clinical use, but neither is it evidence that
          polygenic editing will remain medically marginal.
        </>
      ),
      goLabel: 'Explore the polygenic frontier',
      go: () => update({ tab: 'multifactorial' }),
    },
    {
      title: 'Different applications require different standards of justification',
      kinds: ['interpretation'],
      body: (
        <>
          Disease prevention, disease resistance, and enhancement may use similar molecular
          technologies but pursue different ends. Their justification should therefore depend
          on medical need, alternatives, expected benefit, technological maturity, safety,
          access, and social consequences — not simply on whether the same editing mechanism is
          involved.
        </>
      ),
      goLabel: 'See the ethical framework',
      go: () => update({ tab: 'ethics' }),
    },
  ];

  return (
    <aside className="space-y-2.5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        What we find
      </h2>
      {findings.map((f, i) => (
        <div key={i} className="rounded-lg border border-slate-300 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">
            {i + 1}. {f.title}
          </p>
          <p className="mt-1 text-[14px] leading-6 text-slate-700">{f.body}</p>
          <p className="mt-2 flex flex-wrap items-center gap-1">
            {f.kinds.map((k) => (
              <EpistemicTag key={k} kind={k} />
            ))}
            <button
              type="button"
              onClick={f.go}
              className="ml-auto text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {f.goLabel} →
            </button>
          </p>
        </div>
      ))}
    </aside>
  );
}

// Item-level definitions a reader needs before the numbers — the paper's canonical terms.
// (Per the paper's reporting rule, "addressable" is never used without naming the pathway
// and the outcome, so it is not offered here as a standalone term.)
function KeyDefinitions() {
  const defs: { term: string; def: string }[] = [
    {
      term: 'Technical applicability vs actual access',
      def: 'a pathway could alter the relevant outcome in principle, versus the proportion of eligible people who can realistically obtain and use it — always analyzed separately.',
    },
    {
      term: 'Affected-birth avoidance vs burden mitigation',
      def: 'preventing an affected birth through a reproductive pathway, versus reducing disease consequences after an affected birth — two tracks that are never merged.',
    },
    {
      term: 'Editing-only prevention',
      def: 'a modeled reproductive situation in which no unaffected embryo can be selected, so editing would provide a preventive route unavailable through selection. This does not imply that no postnatal treatment exists.',
    },
    {
      term: 'Reproductive burden',
      def: 'the physical, procedural, embryo-level, and pregnancy-related burdens of achieving a reproductive outcome — IVF cycles, embryo creation and testing, genotype-based non-selection, and pregnancy decisions where relevant. Two interventions can achieve the same disease outcome with very different reproductive burdens.',
    },
    {
      term: 'Potential editing advantage → editing-relevant residual',
      def: 'a modeled situation in which editing might add benefit beyond alternatives — not the same as being the only option. Together with editing-only prevention it forms the editing-relevant residual, whose components are always reported separately.',
    },
  ];
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Key definitions
      </h2>
      <dl className="mt-2 space-y-1.5">
        {defs.map((d) => (
          <div key={d.term} className="text-[13px] leading-6 text-slate-700">
            <dt className="inline font-semibold text-slate-900">{d.term}:</dt>{' '}
            <dd className="inline">{d.def}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function HorizonCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-[14px] leading-6 text-slate-700">{body}</p>
    </div>
  );
}

// ---- typographic primitives ----
function H({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xl font-semibold tracking-tight text-slate-900">{children}</h2>
  );
}
function Lead({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-7 text-slate-700">{children}</p>;
}

function SourceRow({
  label,
  items,
  onGo,
}: {
  label: string;
  items: string;
  onGo: () => void;
}) {
  return (
    <p className="text-slate-600">
      <span className="font-semibold text-slate-800">{label}:</span> {items}{' '}
      <button
        type="button"
        onClick={onGo}
        className="ml-1 text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        sources →
      </button>
    </p>
  );
}

// What could be reached in principle vs what is reached today (monogenic, global).
function AccessGap({
  data,
  update,
}: {
  data: AllData;
  update: (patch: UrlState) => void;
}) {
  const cls: DiseaseClass = 'monogenic';
  const cur = data.prevention['Global']?.['current']?.[cls]?.['pnd_on'];
  const ideal = data.prevention['Global']?.['ideal']?.[cls]?.['pnd_on'];
  if (!cur || !ideal) return null;
  const inPrinciple = ideal.total_averted_birth_fraction.median;
  const inPractice = cur.total_averted_birth_fraction.median;

  return (
    <Figure
      label="How much prevention is lost to incomplete access?"
      caption="Single-gene disease, global. At full modeled coverage the existing pathways could prevent the upper share of affected births; today's coverage prevents the lower share. The difference is cases missed because access is incomplete, not because the biology is out of reach."
      moreLabel="See what existing medicine can do"
      onMore={() => update({ tab: 'prevention' })}
    >
      <div className="space-y-2">
        <GapBar label="Preventable in principle (full coverage)" frac={inPrinciple} color="#059669" />
        <GapBar label="Prevented in practice (today's coverage)" frac={inPractice} color="#0284c7" />
      </div>
    </Figure>
  );
}

function GapBar({ label, frac, color }: { label: string; frac: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="tnum font-medium text-slate-900">{fmtPct(frac, 0)}</span>
      </div>
      <div className="mt-0.5 h-4 w-full overflow-hidden rounded bg-slate-100">
        <div className="h-full" style={{ width: `${frac * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
