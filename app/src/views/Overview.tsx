import { ReactNode } from 'react';
import { AllData, DiseaseClass, fmtCompact, fmtInt, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { SourcesProvider, SourcesList } from '../components/SourceNote';
import { Figure, EpistemicTag, EpistemicKind, InlineLink, PH, Lead } from '../components/prose';

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
        {/* A. Research question + compact opening */}
        <section className="space-y-3">
          <p className="max-w-3xl text-xl font-semibold leading-8 tracking-tight text-slate-900">
            How should genetic medicine be prioritized when judged by impact rather than
            technological novelty?
          </p>
          <Lead>
            Genetic medicine is often discussed through its most spectacular technologies.
            Novel interventions attract attention because they expand the frontier of what is
            possible, but novelty is not the same as impact. This can distort priorities in two
            directions: frontier technologies can overshadow established interventions that
            remain underdeployed, while spectacular failures can provoke broad responses that
            make responsible development of valuable future applications harder.
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
            individual clinical impact, technological maturity, distributional access,
            reproductive burden, and ethical considerations. Reproductive burden refers to the
            physical, procedural, embryo-level, and pregnancy-related burdens of achieving a
            reproductive outcome.
          </Lead>
        </section>

        {/* B. The three time horizons of the impact framework */}
        <section className="space-y-2.5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Three horizons, one framework
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <HorizonCard
              title="Impact now"
              body="What can established genetic medicine already achieve, and how much of that potential is lost through incomplete access?"
            />
            <HorizonCard
              title="Translational frontier"
              body="Where can editing provide an outcome existing reproductive medicine cannot achieve, or a substantially less burdensome route? The strongest present case is when no unaffected embryo can be selected."
            />
            <HorizonCard
              title="Future impact"
              body="How could improved causal genomics, larger embryo sets, and multiplex editing change the medical role of heritable intervention?"
            />
          </div>
        </section>

        {/* C. Disease heterogeneity — part of the framework, not a finding */}
        <section className="space-y-3">
          <PH>Different diseases create different intervention problems</PH>
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
            {fmtCompact(burden.monogenic.median)} monogenic and{' '}
            {fmtCompact(burden.multifactorial.median)} multifactorial/partly genetic cases per
            annual birth cohort. The multifactorial component is strongly sensitive to the
            attribution definition.{' '}
            <InlineLink onClick={() => update({ tab: 'denominator' })}>
              See the burden model →
            </InlineLink>
          </Lead>
        </section>

        {/* D. What we find */}
        <Findings data={data} update={update} />

        {/* E. Present-impact figure */}
        <AccessGap data={data} update={update} />

        {/* F. Combined scenario estimates — secondary, for scale only */}
        <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            For scale: combined scenario estimates
          </summary>
          <div className="mt-2 max-w-3xl space-y-2 text-[14px] leading-6 text-slate-700">
            <p>
              The model also combines the no-selectable-embryo population with an exploratory
              population-scaled complex-disease term to show the relative scale of
              editing-relevant scenarios.
            </p>
            <p>
              Under the current-evidence scaling scenario, the combined estimate is
              approximately {fmtCompact(editableTotal.strict.median)} cases/year (
              {fmtPct(editableShare.strict.median, 2)}). Under the future-capacity exploratory
              scaling scenario, it rises to approximately{' '}
              {fmtCompact(editableTotal.permissive.median)}/year (
              {fmtPct(editableShare.permissive.median, 1)}).
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
              confined to the same share as technology develops.{' '}
              <InlineLink onClick={() => update({ tab: 'residual' })}>
                See the residual analysis →
              </InlineLink>
            </p>
          </div>
        </details>

        {/* G. Supporting material */}
        <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Key terms
          </summary>
          <KeyDefinitions />
        </details>

        <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            About the numbers, sources &amp; uncertainty
          </summary>
          <div className="mt-2 max-w-3xl space-y-2 text-[13px] leading-6 text-slate-600">
            <p>
              Two estimates run in parallel. A growing curated catalogue of{' '}
              <InlineLink onClick={() => update({ tab: 'library', tier: 'all' })}>
                {fmtInt(rollup.n_diseases_all)} diseases
              </InlineLink>{' '}
              ({fmtInt(rollup.n_diseases)} high-burden core +{' '}
              {fmtInt(rollup.tiers.rare.n_diseases)} rare) — not an exhaustive universe — is
              summed disease-by-disease; a parametric model samples cited rates and assumptions
              to give the totals with uncertainty intervals. The catalogue sum (
              {fmtCompact(rollup.total_affected_births_per_year)}/yr over the core) is a floor
              that rises toward the modelled total ({fmtCompact(burden.total_serious.median)}
              /yr). What counts as “serious” and how much multifactorial disease is attributed
              to genetics are adjustable in the Disease burden section; the burden totals
              respond.
            </p>
            <div className="space-y-1 text-[13px] leading-6">
              <SourceRow label="Population & burden" items="GBD 2023 · UN WPP 2024 · WHO" />
              <SourceRow label="Genetics & disease" items="Orphanet · gnomAD · published literature" />
              <SourceRow label="Access & geography" items="World Bank · UNAIDS · national program evidence" />
            </div>
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

// The four findings, each teaching the situation before naming the estimate. Bodies stay
// short — the full argument and its caveats live on the linked pages.
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
          For many well-characterized monogenic disorders, existing screening, reproductive,
          diagnostic, and treatment pathways can substantially alter outcomes.
          {cur && ideal ? (
            <>
              {' '}
              In the monogenic affected-birth model, current coverage avoids about{' '}
              {fmtPct(cur.total_averted_birth_fraction.median, 0)} of affected births,
              compared with approximately{' '}
              {fmtPct(ideal.total_averted_birth_fraction.median, 1)} under idealized full
              coverage.
            </>
          ) : null}{' '}
          This is a result about monogenic affected-birth avoidance, not all genetic disease —
          and it means much of the achievable impact depends on access, not new technology.
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
          Most monogenic reproductive risk can be addressed by selecting an unaffected embryo,
          but some parental configurations produce no unaffected embryo to select — about{' '}
          {fmtCompact(s1Total.median)} births per year in the primary analysis. These cases are
          the clearest example of editing offering something medically different, and selection
          can become unusually burdensome before it becomes impossible.
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
          Editing is rarely the only option for multifactorial disease, but it could eventually
          produce substantial risk reduction if causal variants become reliably identifiable
          and multiplex editing matures. Under current-capacity assumptions the model finds
          little practical editing advantage; under hypothetical high-capacity assumptions,
          some genetically concentrated diseases cross the modeled threshold. This is neither a
          forecast nor evidence that polygenic editing will remain medically marginal.
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
          <p className="mt-1 max-w-3xl text-[14px] leading-6 text-slate-700">{f.body}</p>
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
    <dl className="mt-2 max-w-3xl space-y-1.5">
      {defs.map((d) => (
        <div key={d.term} className="text-[13px] leading-6 text-slate-700">
          <dt className="inline font-semibold text-slate-900">{d.term}:</dt>{' '}
          <dd className="inline">{d.def}</dd>
        </div>
      ))}
    </dl>
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

function SourceRow({ label, items }: { label: string; items: string }) {
  return (
    <p className="text-slate-600">
      <span className="font-semibold text-slate-800">{label}:</span> {items}
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
        <GapBar
          label="Affected births avoided — idealized full coverage"
          frac={inPrinciple}
          color="#059669"
        />
        <GapBar
          label="Affected births avoided — current modeled coverage"
          frac={inPractice}
          color="#0284c7"
        />
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
