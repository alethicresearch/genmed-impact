import { ReactNode } from 'react';
import { AllData, DiseaseClass, fmtCompact, fmtInt, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { SourcesProvider, SourcesList } from '../components/SourceNote';
import { Figure, EpistemicTag, EpistemicKind } from '../components/prose';

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
        {/* The research question, then the medical context that motivates it. */}
        <section className="space-y-3">
          <p className="text-xl font-semibold leading-8 tracking-tight text-slate-900">
            Where, if anywhere, does germline embryo editing provide a medical option that
            existing genetic medicine cannot?
          </p>
          <Lead>
            Genetic medicine already includes carrier screening, embryo testing, prenatal
            diagnosis, newborn screening, and increasingly effective treatments after birth.
            Germline embryo editing is often discussed as another way to prevent genetic
            disease. But whether editing is medically needed depends first on what these
            existing approaches can already accomplish.
          </Lead>
          <Lead>
            We therefore ask a comparative question: across serious genetic disease, what can
            existing medicine prevent, detect, or treat; where is access rather than technology
            the main limitation; and what remains for which germline editing could provide
            something medically distinct?
          </Lead>
          <Lead>
            To answer this, we assembled a disease-by-intervention catalogue linking{' '}
            {fmtInt(rollup.n_diseases_all)} genetic conditions to their genes or loci,
            inheritance, frequency, reproductive options, screening pathways, and treatments.
            We combine this disease-level evidence with global population and disease-burden
            data to estimate the scale of serious monogenic and multifactorial disease and to
            model how different medical pathways change that burden.
          </Lead>
          <Lead>
            The analysis proceeds in three stages. First, we estimate how much serious genetic
            disease there is. Second, we ask what existing medicine can already do and how much
            of its potential is limited by access. Third, we examine what remains,
            distinguishing the small set of reproductive situations in which embryo selection
            cannot produce an unaffected embryo from the much more speculative possibility of
            editing common complex disease.
          </Lead>

          {/* Source families, compact — each row links into Methods. */}
          <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-[13px] leading-6">
            <SourceRow label="Population & burden" items="GBD 2023 · UN WPP 2024 · WHO" onGo={() => update({ tab: 'methods' })} />
            <SourceRow label="Genetics & disease" items="Orphanet · gnomAD · published literature" onGo={() => update({ tab: 'methods' })} />
            <SourceRow label="Access & geography" items="World Bank · UNAIDS · national program evidence" onGo={() => update({ tab: 'methods' })} />
          </div>
        </section>

        <Findings data={data} update={update} />

        {/* Overall synthesis — combines non-equivalent components, and says so */}
        <section className="space-y-3">
          <H>Overall</H>
          <Lead>
            Across the full modeled burden, the current-evidence analysis identifies an
            editing-relevant residual of approximately{' '}
            {fmtCompact(editableTotal.strict.median)} cases per year, or{' '}
            {fmtPct(editableShare.strict.median, 2)} of modeled serious genetic disease. Under
            the optimistic complex-disease scenario, this rises to approximately{' '}
            {fmtCompact(editableTotal.permissive.median)} cases per year, or{' '}
            {fmtPct(editableShare.permissive.median, 1)}.
          </Lead>
          <Lead>
            These totals combine two fundamentally different quantities: a small editing-only
            prevention population within monogenic disease and a separate potential editing
            advantage in complex disease. They are combined for scale, but should never be
            interpreted as the same type of medical need.
          </Lead>
          <Lead>
            Conversely, saying that most modeled serious genetic disease is not uniquely
            dependent on germline editing does not mean that the same proportion is preventable
            by existing medicine. Existing pathways prevent, detect, treat, or mitigate
            different outcomes, and their real-world reach depends heavily on access.
          </Lead>
          <AccessGap data={data} update={update} />
        </section>

        <section className="space-y-3">
          <H>Why this comparison matters</H>
          <Lead>
            Claims about germline editing are often made at the level of “preventing genetic
            disease” as a whole. But the medical justification for a new heritable intervention
            depends on the alternative available in the particular case. If an established
            pathway can achieve the same medically important outcome with lower risk, that
            matters. If no such pathway exists, that matters too.
          </Lead>
          <Lead>
            The purpose of this project is therefore not to argue that germline editing is
            either broadly necessary or broadly unnecessary. It is to identify where its
            incremental medical value is strongest, where it is weak, and which apparent gaps
            are actually problems of access to medicine that already exists. What we think
            follows for research and regulation is in{' '}
            <NavInline onClick={() => update({ tab: 'ethics' })}>Ethics &amp; policy</NavInline>.
          </Lead>
        </section>

        <KeyDefinitions />

        <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            About the numbers &amp; uncertainty
          </summary>
          <div className="mt-2 space-y-2 text-[13px] leading-6 text-slate-600">
            <p>
              Two estimates run in parallel. A growing curated catalogue of{' '}
              {fmtInt(rollup.n_diseases_all)} diseases ({fmtInt(rollup.n_diseases)} high-burden
              core + {fmtInt(rollup.tiers.rare.n_diseases)} rare) — not an exhaustive universe —
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
  const burden = data.summary.burden_default;
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
      title: 'Serious genetic disease is not one homogeneous category',
      kinds: ['model'],
      body: (
        <>
          Under the default analysis, approximately{' '}
          {fmtCompact(burden.total_serious.median)} cases of serious disease with a substantial
          genetic contribution are attributed to each annual global birth cohort. About{' '}
          {fmtCompact(burden.monogenic.median)} are monogenic, while approximately{' '}
          {fmtCompact(burden.multifactorial.median)} are multifactorial or partly genetic under
          the broad attribution assumption. These two categories should not be interpreted in
          the same way: monogenic disease is primarily attributable to pathogenic variation in a
          single gene, whereas multifactorial disease reflects genetic susceptibility together
          with environmental and other influences — so the multifactorial estimate changes
          substantially when the genetic-attribution assumption changes.
        </>
      ),
      goLabel: 'Explore the disease burden',
      go: () => update({ tab: 'denominator' }),
    },
    {
      title:
        'For monogenic disease, existing reproductive medicine has broad technical reach — but current access is incomplete',
      kinds: ['model'],
      body: (
        <>
          For many monogenic disorders, carrier screening and reproductive planning, IVF with
          PGT-M, and prenatal diagnosis followed by a reproductive decision can reduce affected
          births.
          {cur && ideal ? (
            <>
              {' '}
              Under the model&apos;s current coverage assumptions, about{' '}
              {fmtPct(cur.total_averted_birth_fraction.median, 0)} of monogenic affected births
              are avoided; under idealized full coverage, this rises to approximately{' '}
              {fmtPct(ideal.total_averted_birth_fraction.median, 1)}.
            </>
          ) : null}{' '}
          This is a result about monogenic affected-birth avoidance, not about all serious
          genetic disease. Newborn screening and postnatal treatment are evaluated separately
          because they mitigate disease after birth rather than preventing an affected birth.
        </>
      ),
      goLabel: 'See what existing medicine can do',
      go: () => update({ tab: 'prevention' }),
    },
    {
      title:
        'A small monogenic population remains where embryo selection cannot produce an unaffected embryo',
      kinds: ['model'],
      body: (
        <>
          Broad technical reach does not mean embryo selection works in every reproductive
          configuration. For some parental genetic combinations, every embryo is expected to
          inherit the targeted disease-causing genotype. PGT-M can identify those embryos, but
          it cannot select an unaffected embryo if none exists. Under the primary analysis, we
          estimate approximately {fmtCompact(s1Total.median)} births per year in these
          no-selectable-unaffected-embryo configurations. This is the study&apos;s
          editing-only prevention population: cases in which successful germline editing could
          provide a preventive option that embryo selection cannot.
        </>
      ),
      goLabel: 'See when embryo selection is not enough',
      go: () => update({ tab: 'residual' }),
    },
    {
      title:
        'Multifactorial disease presents a different — and much more uncertain — case for editing',
      kinds: ['model'],
      body: (
        <>
          Common complex diseases do not usually present a situation in which germline editing
          is the only available option. Their risk is distributed across many genetic variants
          and non-genetic influences, while prevention and treatment may act through entirely
          different pathways. The relevant question is therefore whether editing could provide
          additional risk reduction beyond existing alternatives. Under current-evidence
          assumptions, the model identifies little additional population-level contribution. A
          substantially larger contribution appears only under an optimistic modeled scenario
          that assumes favorable genetic architecture and much greater technical capacity. That
          scenario is a possibility explored by the model, not a forecast.
        </>
      ),
      goLabel: 'Explore complex disease',
      go: () => update({ tab: 'multifactorial' }),
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

// ---- typographic primitives ----
function H({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xl font-semibold tracking-tight text-slate-900">{children}</h2>
  );
}
function Lead({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-7 text-slate-700">{children}</p>;
}
function NavInline({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {children}
    </button>
  );
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
