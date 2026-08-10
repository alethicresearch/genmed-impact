import { ReactNode } from 'react';
import { AllData, DiseaseClass, fmtCompact, fmtInt, fmtPct } from '../data';
import { UrlState } from '../urlState';
import StatValue from '../components/StatValue';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';
import { Figure } from '../components/prose';

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
        {/* The research question, first. */}
        <section className="space-y-3">
          <p className="text-xl font-semibold leading-8 tracking-tight text-slate-900">
            Which genetic diseases actually require embryo editing — and which can already be
            addressed in other ways?
          </p>
          <p className="text-[15px] leading-7 text-slate-600">
            This project maps serious genetic disease to the tools medicine already has,
            estimates where those tools fall short, and asks where germline embryo editing could
            add a genuinely unique medical benefit. It then examines what that means for access,
            research priorities, and regulation. Everything on this page is backed by a
            reproducible model; every number carries its source and uncertainty, and the deeper
            sections let you inspect and change the assumptions.
          </p>
        </section>

        <Findings data={data} update={update} />

        <section className="space-y-3">
          <H>How much serious genetic disease is there?</H>
          <Lead>
            In each year&apos;s global birth cohort, an estimated{' '}
            <Big><StatValue stat={burden.total_serious} kind="compact" /></Big> people —{' '}
            {fmtPct(burden.serious_share_of_births.median, 0)} of roughly 135M births — either
            have, or will go on to develop, a serious disease with a substantial genetic
            contribution. The two parts of that total behave very differently: about{' '}
            {fmtCompact(burden.monogenic.median)} have a single-gene (monogenic) condition,
            usually apparent at or before birth, while about{' '}
            {fmtCompact(burden.multifactorial.median)} carry a multifactorial risk — conditions
            such as heart disease or diabetes that involve many genes together with environment
            and often appear only decades later. Click any number for its 95% uncertainty
            interval.
            <SourceNote source={monoSrc.source || 'Modell & Darlison 2008'} doi={monoSrc.doi} detail="serious monogenic rate" />
            <SourceNote source={multiSrc.source || 'March of Dimes; WHO congenital anomalies'} doi={multiSrc.doi} detail="serious multifactorial rate" />
            <SourceNote source={birthsSrc.source || 'UN World Population Prospects 2024'} doi={birthsSrc.doi} detail="annual births" />
          </Lead>
        </section>

        <section className="space-y-3">
          <H>Most of it is not uniquely dependent on germline editing</H>
          <Lead>
            For nearly all of that burden, at least one existing genetic-medicine pathway
            applies. But those pathways do different things, so we keep the questions separate:
            how much disease could be <em>prevented before birth</em> (carrier screening with
            reproductive planning, IVF with embryo selection, prenatal diagnosis followed by a
            reproductive decision) — and, for a child born affected, how much can be{' '}
            <em>treated after birth</em>, from cure through lifelong management to palliation.
            Germline editing is none of these; it is counted only where no existing pathway
            reaches.
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
          <H>How large is the editing-only remainder? It depends what you credit</H>
          <Lead>
            The share of serious genetic disease reachable <em>only</em> by germline editing
            depends on one modeling choice: how much future benefit to credit editing for
            common complex diseases, where nothing is established today. We report both ends
            rather than choosing silently.
          </Lead>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MiniStat
              tone="emerald"
              value={`~${fmtPct(editableShare.strict.median, 2)}`}
              label="Current-evidence case"
              sub={`about ${fmtCompact(editableTotal.strict.median)} births/yr — essentially the families for whom embryo selection cannot produce an unaffected embryo, with no established complex-disease role`}
            />
            <MiniStat
              tone="violet"
              value={`~${fmtPct(editableShare.permissive.median, 1)}`}
              label="Optimistic upper bound"
              sub={`about ${fmtCompact(editableTotal.permissive.median)} births/yr — additionally crediting editing with a future role in a few complex diseases where it could in principle outperform selection`}
            />
          </div>
          <Lead>
            Across these definitions the central conclusion is unchanged: germline editing is
            relevant to a small minority of the modeled burden — but the size of that minority
            depends strongly on how much future complex-disease editing is credited. The
            remaining {'≈'}98–99.8% is not uniquely dependent on editing; how much of it
            each pathway actually prevents or mitigates is worked through in{' '}
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
            what the epidemiology supports. Both make responsible governance harder: regulators
            respond with blanket prohibitions, while the largest real opportunity — extending
            existing genetic medicine to the people it does not yet reach — goes underfunded.
            This analysis is meant to put numbers under that debate: what existing medicine can
            already do, where editing is genuinely unique, and why prevention, resistance, and
            enhancement must be argued separately. What we think should follow, including a
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

// The three findings of the paper, given equal weight up front.
function Findings({
  data,
  update,
}: {
  data: AllData;
  update: (patch: UrlState) => void;
}) {
  const editableShare = data.summary.uniquely_editable_share_of_serious;
  const cur = data.prevention['Global']?.['current']?.['monogenic']?.['pnd_on'];
  const ideal = data.prevention['Global']?.['ideal']?.['monogenic']?.['pnd_on'];

  const findings: { title: string; body: ReactNode; goLabel: string; go: () => void }[] = [
    {
      title: 'Existing genetic medicine has enormous unrealized reach',
      body: (
        <>
          Most modeled serious genetic-disease burden is not uniquely dependent on germline
          editing — existing screening, reproductive, diagnostic, and therapeutic pathways apply
          to nearly all of it
          {cur && ideal ? (
            <>
              , yet today&apos;s coverage prevents only about{' '}
              {fmtPct(cur.total_averted_birth_fraction.median, 0)} of preventable single-gene
              births where full coverage could prevent{' '}
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
      title: 'Germline editing nevertheless has a narrow, real medical role',
      body: (
        <>
          Between ~{fmtPct(editableShare.strict.median, 2)} and ~
          {fmtPct(editableShare.permissive.median, 1)} of the burden — depending on how much
          future complex-disease editing is credited — is reachable by no existing tool. For
          some families, embryo selection cannot produce an unaffected embryo at all. These
          cases are the strongest argument for a carefully governed research pathway, not for a
          blanket ban.
        </>
      ),
      goLabel: 'Where editing adds value',
      go: () => update({ tab: 'residual' }),
    },
    {
      title: 'Prevention, resistance, and enhancement are separate questions',
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
          <button
            type="button"
            onClick={f.go}
            className="mt-1.5 text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {f.goLabel} →
          </button>
        </div>
      ))}
    </aside>
  );
}

// ---- interactive-paper typographic primitives ----
function H({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xl font-semibold tracking-tight text-slate-900">{children}</h2>
  );
}
function Lead({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-7 text-slate-700">{children}</p>;
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
