import { ReactNode } from 'react';
import { AllData, DiseaseClass, fmtCompact, fmtInt, fmtPct } from '../data';
import { UrlState } from '../urlState';
import StatValue from '../components/StatValue';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';
import { Figure, EpistemicTag, EpistemicKind } from '../components/prose';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

// Safely read a {source, doi} leaf from the provenance constants tree.
function provSource(
  data: AllData,
  path: string[]
): { source: string; doi: string | null } {
  let node: unknown = data.provenance.constants;
  for (const k of path) {
    if (node && typeof node === 'object' && k in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[k];
    } else {
      node = undefined;
      break;
    }
  }
  const rec = (node && typeof node === 'object' ? node : {}) as Record<string, unknown>;
  return {
    source: typeof rec.source === 'string' ? rec.source : '',
    doi: typeof rec.doi === 'string' ? rec.doi : null,
  };
}

export default function Overview({ data, update }: Props) {
  const rollup = data.library.rollup;
  const monoSrc = provSource(data, ['burden', 'monogenic_serious_per_1000']);
  const multiSrc = provSource(data, ['burden', 'multifactorial_serious_per_1000']);
  const birthsSrc = provSource(data, ['births', 'global_per_year']);

  const editableShare = data.summary.uniquely_editable_share_of_serious;
  const editableTotal = data.summary.uniquely_editable_total;
  const burden = data.summary.burden_default;

  return (
    <SourcesProvider>
      <article className="space-y-10 pb-4">
        {/* 1. The research question, then the problem statement — before any findings. */}
        <section className="space-y-3">
          <p className="text-xl font-semibold leading-8 tracking-tight text-slate-900">
            Where does germline embryo editing add medical value that existing genetic medicine
            cannot?
          </p>
          <Lead>
            Debate over human germline genome editing is often framed at the level of the
            technology itself: whether heritable editing should be prohibited, permitted, or
            developed as a means of preventing genetic disease. But the medical case for editing
            depends on a prior empirical question: which serious genetic diseases can already be
            prevented, detected, or treated using existing medicine, and which leave a residual
            need that germline editing could uniquely or substantially address?
          </Lead>
          <Lead>
            This study investigates that question by combining disease-level genetic data,
            global disease-burden evidence, intervention mapping, and population modeling.
          </Lead>
        </section>

        <WhatWeBuilt data={data} update={update} />

        <HowAnalysisWorks />

        <HowToUse update={update} />

        <Findings data={data} update={update} />

        <KeyDefinitions />

        <section className="space-y-3">
          <H>How much serious genetic disease is there?</H>
          <Lead>
            Using the paper&apos;s default definitions, the model attributes an estimated{' '}
            <Big><StatValue stat={burden.total_serious} kind="compact" /></Big> cases per annual
            global birth cohort ({fmtPct(burden.serious_share_of_births.median, 0)} of roughly{' '}
            {fmtCompact(data.summary.births_per_year.median)} births) to serious disease with a
            substantial genetic contribution. About {fmtCompact(burden.monogenic.median)} are
            assigned to serious monogenic disease — conditions primarily caused by pathogenic
            variation in a single gene, whose clinical onset ranges from congenital disease to
            adulthood. The remaining {fmtCompact(burden.multifactorial.median)} represent the
            model&apos;s inclusive attribution of serious multifactorial or partly genetic
            disease. Because multifactorial disease reflects both genetic and non-genetic
            causes, this second quantity depends strongly on how genetic attribution is defined;
            readers can vary that assumption in the Disease map. Click any number for its 95%
            uncertainty interval.
            <SourceNote source={monoSrc.source || 'Modell & Darlison 2008'} doi={monoSrc.doi} detail="serious monogenic rate" />
            <SourceNote source={multiSrc.source || 'March of Dimes; WHO congenital anomalies'} doi={multiSrc.doi} detail="serious multifactorial rate" />
            <SourceNote source={birthsSrc.source || 'UN World Population Prospects 2024'} doi={birthsSrc.doi} detail="annual births" />
          </Lead>
        </section>

        <section className="space-y-3">
          <H>Most of it is not uniquely dependent on germline editing</H>
          <Lead>
            For the great majority of the modeled burden, the analysis does not identify a
            unique medical requirement for germline editing. Existing reproductive, diagnostic,
            therapeutic, somatic, or public-health alternatives account for much of that
            difference — but they do not all achieve the same outcome, so we keep the questions
            separate: how much disease could be <em>prevented before birth</em> (carrier
            screening with reproductive planning, IVF with embryo selection, prenatal diagnosis
            followed by a reproductive decision) — and, for a child born affected, how much can
            be <em>treated after birth</em>, from cure through lifelong management to
            palliation.
          </Lead>
          <Figure
            label="Two separate questions: prevention, and treatment"
            caption="Which pathways could prevent an affected birth, and what treatment achieves for a child born affected. Click any band to open those diseases in the catalogue. Bars are by affected births in the curated core catalogue."
            moreLabel="Open the disease catalogue"
            onMore={() => update({ tab: 'library' })}
          >
            <CapabilitySplit data={data} update={update} />
          </Figure>
        </section>

        <section className="space-y-3">
          <H>Where could editing matter? Two different answers, kept apart</H>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MiniStat
              tone="emerald"
              value={`~${fmtCompact(data.summary.s1_total.median)}/yr`}
              label="Editing-only prevention"
              sub="births in modeled reproductive configurations where no unaffected embryo can be selected — the one population for which editing would be the only preventive option"
            />
            <MiniStat
              tone="violet"
              value={`0 → ~${fmtCompact(data.residual.s2.permissive.median)}/yr`}
              label="Potential complex-disease editing advantage"
              sub="under current evidence the modeled contribution is approximately zero; under an optimistic modeled scenario, up to this many additional cases/yr in which editing might outperform modeled alternatives"
            />
          </div>
          <Lead>
            Together these bound a broader <strong>editing-relevant</strong> population — from ~
            {fmtPct(editableShare.strict.median, 2)} of the modeled burden (about{' '}
            {fmtCompact(editableTotal.strict.median)} births/yr, current evidence) to ~
            {fmtPct(editableShare.permissive.median, 1)} (about{' '}
            {fmtCompact(editableTotal.permissive.median)}/yr, optimistic scenario). The two
            components have different evidentiary status and should not be interpreted as
            equivalent: the first is an editing-only population within the model, the second a
            hypothesized advantage. How much of the rest each existing pathway actually prevents
            or mitigates is worked through in{' '}
            <NavInline onClick={() => update({ tab: 'prevention' })}>
              Existing options
            </NavInline>
            .
          </Lead>
        </section>

        <section className="space-y-3">
          <H>What could be reached in principle is not what is reached today</H>
          <AccessGap data={data} update={update} />
        </section>

        <section className="space-y-3">
          <H>Why this matters</H>
          <Lead>
            Germline editing has entered public debate mainly through spectacle — announced
            “firsts” outside ordinary oversight, and disease-prevention claims stretched past
            what the epidemiology supports. Both risk making responsible governance harder:
            highly visible failures can strengthen pressure for blanket prohibitions, while
            disproportionate attention to frontier interventions can divert attention from the
            much larger implementation challenge around existing genetic medicine. This analysis
            is meant to put numbers under that debate: what existing medicine can already do,
            where editing would add a unique or distinct option, and why prevention, resistance,
            and enhancement must be argued separately. What we think should follow, including a
            proposed regulatory sequencing, is in{' '}
            <NavInline onClick={() => update({ tab: 'ethics' })}>Ethics &amp; policy</NavInline>.
          </Lead>
        </section>

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
              genetics are adjustable in the Disease map section; every number responds.
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

// 2. What the project actually built, with the catalogue size and source families visible
// up front — dynamic from the data wherever possible.
function WhatWeBuilt({
  data,
  update,
}: {
  data: AllData;
  update: (patch: UrlState) => void;
}) {
  const r = data.library.rollup;
  return (
    <section className="space-y-3">
      <H>What we built</H>
      <Lead>
        We constructed a structured disease-by-intervention dataset linking{' '}
        {fmtInt(r.n_diseases_all)} serious genetic conditions to their causal genes or loci,
        inheritance patterns, incidence or prevalence, and the medical interventions that can
        address them. The catalogue combines a hand-curated high-burden core (
        {fmtInt(r.n_diseases)} conditions) with a growing rare-disease tier (
        {fmtInt(r.tiers.rare.n_diseases)} conditions) derived from Orphanet and other
        genetic-disease sources.
      </Lead>
      <Lead>
        We then connect this disease map to population-level and epidemiological evidence.
        Two complementary analyses run in parallel: a <strong>bottom-up disease catalogue</strong>,
        which sums burden disease by disease, and a <strong>top-down population model</strong>,
        which estimates the broader burden of serious monogenic and multifactorial disease and
        propagates uncertainty across the assumptions that matter most.
      </Lead>
      <Lead>
        For each disease or disease class, we ask what different forms of genetic medicine can
        actually achieve: carrier screening and reproductive planning, IVF with PGT-M embryo
        selection, prenatal diagnosis and reproductive decision-making, newborn screening and
        early treatment, and postnatal therapies including somatic genetic medicine. We keep{' '}
        <strong>affected-birth avoidance</strong> separate from <strong>burden mitigation</strong>{' '}
        after birth, because these interventions do not produce the same medical or ethical
        outcome.
      </Lead>
      <Lead>
        The final step is to ask what remains. We distinguish{' '}
        <strong>editing-only prevention</strong> — reproductive situations in which no
        selectable unaffected embryo exists — from the separate and more uncertain possibility
        that germline editing could eventually provide a distinct advantage in some complex
        diseases (<strong>potential complex-disease editing advantage</strong>).
      </Lead>

      {/* Source families, compact — each row links into Methods. */}
      <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-[13px] leading-6">
        <SourceRow label="Population & burden" items="GBD 2023 · UN WPP 2024 · WHO" onGo={() => update({ tab: 'methods' })} />
        <SourceRow label="Genetics & disease" items="Orphanet · gnomAD · published literature" onGo={() => update({ tab: 'methods' })} />
        <SourceRow label="Access & geography" items="World Bank · UNAIDS · national program evidence" onGo={() => update({ tab: 'methods' })} />
      </div>

      {/* The three research layers, kept explicit — the ethical analysis is not part of the model. */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <LayerCard
          title="Disease map"
          body="What diseases exist, how common they are, how they are inherited, and what interventions apply."
        />
        <LayerCard
          title="Population model"
          body="How those disease-level observations translate into a global burden and residual under uncertainty."
        />
        <LayerCard
          title="Ethical analysis"
          body="What the empirical results imply — or do not imply — for research priorities, regulation, resistance, and enhancement."
        />
      </div>
    </section>
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

function LayerCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{body}</p>
    </div>
  );
}

// 3. The five-step research workflow — a lightweight explanatory figure, not navigation.
// Step titles align with the Methods pipeline where the two overlap.
const WORKFLOW_STEPS = [
  { title: 'Define the burden', desc: 'Estimate serious monogenic and multifactorial disease across the global birth cohort.' },
  { title: 'Build the disease map', desc: 'Link diseases to genes, inheritance, incidence, and interventions.' },
  { title: 'Map what existing medicine can do', desc: 'Separate affected-birth avoidance from postnatal treatment and mitigation.' },
  { title: 'Identify what remains', desc: 'Estimate editing-only prevention and potential complex-disease editing advantage.' },
  { title: 'Interpret the implications', desc: 'Examine access, research priorities, and ethical/regulatory consequences.' },
];

function HowAnalysisWorks() {
  return (
    <section className="space-y-3">
      <H>How the analysis works</H>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {WORKFLOW_STEPS.map((s, i) => (
          <li key={s.title} className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <span className="text-xs font-semibold text-slate-400">{i + 1}</span>
            <span className="mt-0.5 text-sm font-semibold text-slate-900">{s.title}</span>
            <span className="mt-1 text-xs leading-5 text-slate-600">{s.desc}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs leading-5 text-slate-500">
        The project moves from disease burden and intervention mapping to the residual medical
        role of germline editing. Empirical results are kept separate from ethical and policy
        interpretation.
      </p>
    </section>
  );
}

// 4. What the interactive page adds beyond the paper.
function HowToUse({ update }: { update: (patch: UrlState) => void }) {
  return (
    <section className="space-y-3">
      <H>How to use this research page</H>
      <Lead>
        This research page is the interactive companion to the paper. It exposes the analysis
        behind the headline results rather than presenting only the final estimates. Readers can
        inspect the disease catalogue, vary assumptions about disease severity and genetic
        attribution, compare current and idealized access to existing interventions, examine the
        reproductive configurations that generate the editing-only residual, explore alternative
        assumptions about complex disease, and trace model inputs back to their underlying
        sources.
      </Lead>
      <Lead>
        The purpose of the page is to make the empirical assumptions behind the argument visible
        and contestable. The paper presents the central analysis and normative argument; this
        page allows readers to inspect the underlying data, assumptions, uncertainty, and
        alternative scenarios in greater detail.
      </Lead>
      <div className="flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          onClick={() => update({ tab: 'denominator' })}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Explore the disease map →
        </button>
        <button
          type="button"
          onClick={() => update({ tab: 'methods' })}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Inspect assumptions &amp; methods →
        </button>
        <a
          href="https://github.com/alethicresearch/genmed-impact"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          View code &amp; data →
        </a>
      </div>
    </section>
  );
}

// The three findings of the paper, given equal weight up front.
function Findings({
  data,
  update,
}: {
  data: AllData;
  update: (patch: UrlState) => void;
}) {
  const editableShare = data.summary.uniquely_editable_share_of_serious;
  const s1Total = data.summary.s1_total;
  // Display-only ratio of precomputed medians: the no-selectable-embryo share of serious.
  const s1Share = s1Total.median / data.summary.burden_default.total_serious.median;
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
      title: 'Existing genetic medicine has enormous unrealized reach',
      kinds: ['model', 'interpretation'],
      body: (
        <>
          Most modeled serious genetic-disease burden does not uniquely require germline
          editing
          {cur && ideal ? (
            <>
              — yet today&apos;s coverage prevents only about{' '}
              {fmtPct(cur.total_averted_birth_fraction.median, 0)} of preventable single-gene
              births where full modeled coverage could prevent{' '}
              {fmtPct(ideal.total_averted_birth_fraction.median, 0)}
            </>
          ) : null}
          . The largest immediate opportunity is expanding access to what already works.
        </>
      ),
      goLabel: 'What current medicine can do',
      go: () => update({ tab: 'prevention' }),
    },
    {
      title: 'Germline editing nevertheless has a narrow, real potential role',
      kinds: ['model', 'policy'],
      body: (
        <>
          A small monogenic population (~{fmtPct(s1Share, 2)} of the burden, about{' '}
          {fmtCompact(s1Total.median)} births/yr) may genuinely lack an unaffected
          embryo-selection option — for these families editing would be the only preventive
          route. A separate current-evidence complex-disease term adds approximately nothing
          (combined editing-relevant residual ~{fmtPct(editableShare.strict.median, 2)}), and a
          larger role in complex disease (up to ~
          {fmtPct(editableShare.permissive.median, 1)} under an optimistic modeled scenario) is
          a possibility, not another “only option” population. Together they are the strongest
          argument for a carefully governed research pathway rather than a blanket ban.
        </>
      ),
      goLabel: 'Where editing adds value',
      go: () => update({ tab: 'residual' }),
    },
    {
      title: 'Prevention, resistance, and enhancement are separate questions',
      kinds: ['interpretation'],
      body: (
        <>
          The medical justification for preventing catastrophic inherited disease does not
          automatically extend to editing healthy embryos for resistance to common risks, or for
          enhancement. Collapsing the three into one category — for or against — is how both
          hype and blanket prohibition go wrong.
        </>
      ),
      goLabel: 'Beyond disease prevention',
      go: () => update({ tab: 'beyond' }),
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

// Item-level definitions a reader needs before the numbers — deliberately short.
function KeyDefinitions() {
  const defs: { term: string; def: string }[] = [
    {
      term: 'Addressable',
      def: 'a modeled pathway can alter the relevant outcome in principle; does not imply access, uptake, cure, or equivalence between pathways.',
    },
    {
      term: 'Editing-only prevention',
      def: 'no unaffected embryo can be selected under the modeled reproductive configuration.',
    },
    {
      term: 'Editing advantage',
      def: 'editing is modeled as potentially adding benefit beyond available alternatives; this is not the same as being the only option.',
    },
    {
      term: 'In principle vs in practice',
      def: 'technical applicability versus actual coverage and access.',
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

// ---- interactive-paper typographic primitives ----
function H({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xl font-semibold tracking-tight text-slate-900">{children}</h2>
  );
}
// Prose capped at a readable measure; figures and stat cards keep the full width.
function Lead({ children }: { children: ReactNode }) {
  return <p className="max-w-[72ch] text-[15px] leading-7 text-slate-700">{children}</p>;
}
function Big({ children }: { children: ReactNode }) {
  return <span className="text-2xl font-bold text-slate-900">{children}</span>;
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

const PREVENTION_COLORS: Record<string, string> = {
  preventable: '#059669', // emerald
  detectable_only: '#d97706', // amber
  not_preventable: '#94a3b8', // slate
};
const INTENT_COLORS: Record<string, string> = {
  curative: '#059669', // emerald
  disease_modifying: '#0284c7', // sky
  palliative: '#d97706', // amber
  none: '#94a3b8', // slate
};

// The two "by what" axes, each a clickable stacked bar that filters the library.
function CapabilitySplit({
  data,
  update,
}: {
  data: AllData;
  update: (patch: UrlState) => void;
}) {
  const r = data.library.rollup;
  return (
    <div className="space-y-4">
      <AxisBar
        title="Prevention — could an affected birth be avoided, and by which pathway"
        order={r.prevention.order}
        dist={r.prevention.distribution}
        colors={PREVENTION_COLORS}
        onPick={(k) => update({ tab: 'library', prev: k, libsort: 'births' })}
      />
      <AxisBar
        title="Treatment — for a child born affected, to what end"
        order={r.treatment_intent.order}
        dist={r.treatment_intent.distribution}
        colors={INTENT_COLORS}
        onPick={(k) => update({ tab: 'library', intent: k, libsort: 'births' })}
      />
    </div>
  );
}

function AxisBar({
  title,
  order,
  dist,
  colors,
  onPick,
}: {
  title: string;
  order: string[];
  dist: Record<string, { label: string; n_diseases: number; births: number }>;
  colors: Record<string, string>;
  onPick: (k: string) => void;
}) {
  const totalB = order.reduce((a, k) => a + dist[k].births, 0) || 1;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div
        className="mt-1 flex h-8 w-full overflow-hidden rounded"
        role="img"
        aria-label={`${title} — distribution by affected births`}
      >
        {order.map((k) => {
          const w = (dist[k].births / totalB) * 100;
          return w > 0 ? (
            <button
              key={k}
              type="button"
              onClick={() => onPick(k)}
              title={`${dist[k].label}: ${fmtInt(dist[k].births)} births/yr (${fmtPct(
                dist[k].births / totalB,
                0
              )}) · ${dist[k].n_diseases} diseases`}
              style={{ width: `${w}%`, backgroundColor: colors[k] }}
              className="h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-slate-900"
            />
          ) : null;
        })}
      </div>
      <div className="mt-1.5 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        {order.map((k) =>
          dist[k].n_diseases > 0 ? (
            <button
              key={k}
              type="button"
              onClick={() => onPick(k)}
              className="flex items-center gap-2 text-left text-xs hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span
                aria-hidden="true"
                className="inline-block h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: colors[k] }}
              />
              <span className="text-slate-700">{dist[k].label}</span>
              <span className="tnum ml-auto text-slate-500">
                {fmtCompact(dist[k].births)} · {dist[k].n_diseases}
              </span>
            </button>
          ) : null
        )}
      </div>
    </div>
  );
}

// Reachable-in-principle vs reached-in-practice, for the clearest case (monogenic, global).
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
  const inPrinciple = ideal.total_averted_birth_fraction.median; // what full coverage reaches
  const inPractice = cur.total_averted_birth_fraction.median; // what today's coverage reaches
  const gap = Math.max(0, inPrinciple - inPractice);

  return (
    <div className="space-y-3">
      <Lead>Take single-gene disease, globally:</Lead>
      <Bullets
        items={[
          <>
            At <strong>full coverage</strong>, existing pathways could prevent about{' '}
            <strong>{fmtPct(inPrinciple, 0)}</strong> of affected births.
          </>,
          <>
            At <strong>today&apos;s coverage</strong>, they actually prevent about{' '}
            <strong>{fmtPct(inPractice, 0)}</strong>.
          </>,
          <>
            The difference — <strong>{fmtPct(gap, 0)}</strong> — is cases missed because access
            is incomplete, not because the biology is out of reach. It closes by scaling the
            same tools, not by editing.
          </>,
        ]}
      />
      <Figure
        label="How much prevention is lost to incomplete access?"
        caption="Single-gene disease, global. Multifactorial disease has a lower biological ceiling; both classes, all regions, and the pathway-by-pathway breakdown are in Existing options."
        moreLabel="Open Existing options"
        onMore={() => update({ tab: 'prevention' })}
      >
        <div className="space-y-2">
          <GapBar label="Preventable in principle (full coverage)" frac={inPrinciple} color="#059669" />
          <GapBar label="Prevented in practice (today's coverage)" frac={inPractice} color="#0284c7" />
        </div>
      </Figure>
    </div>
  );
}

// Bulleted list for breaking up longer explanations.
function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-[15px] leading-6 text-slate-700">
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
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

function MiniStat({
  tone,
  value,
  label,
  sub,
}: {
  tone: 'emerald' | 'violet';
  value: string;
  label: string;
  sub: string;
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50/50'
      : 'border-violet-200 bg-violet-50/50';
  return (
    <div className={`rounded border p-3 ${cls}`}>
      <p className="tnum text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <p className="mt-0.5 text-xs text-slate-600">{sub}</p>
    </div>
  );
}
