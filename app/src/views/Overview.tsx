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

  const addressable = data.summary.addressable_share_of_serious.permissive;
  const editableTotal = data.summary.uniquely_editable_total.permissive;
  const editableShare = data.summary.uniquely_editable_share_of_serious.permissive;

  const burden = data.summary.burden_default;

  return (
    <SourcesProvider>
      <article className="mx-auto max-w-2xl space-y-10 pb-4">
        <p className="text-[15px] leading-7 text-slate-600">
          An interactive companion to the paper. It maps every serious genetic disease to what
          medicine can already do about it, and isolates the narrow place where germline editing
          does something no existing tool can.
        </p>

        <KeyTakeaways data={data} update={update} />

        <section className="space-y-3">
          <H>Serious genetic disease is common at birth</H>
          <Lead>
            About <Big><StatValue stat={burden.total_serious} kind="compact" /></Big> children are
            born each year with a serious genetic disease —{' '}
            {fmtPct(burden.serious_share_of_births.median, 0)} of all births. Roughly{' '}
            {fmtCompact(burden.monogenic.median)} have a single-gene (monogenic) condition and{' '}
            {fmtCompact(burden.multifactorial.median)} a multifactorial one. Every figure here
            carries its uncertainty; hover any number for its 95% interval.
            <SourceNote source={monoSrc.source || 'Modell & Darlison 2008'} doi={monoSrc.doi} detail="serious monogenic rate" />
            <SourceNote source={multiSrc.source || 'March of Dimes; WHO congenital anomalies'} doi={multiSrc.doi} detail="serious multifactorial rate" />
            <SourceNote source={birthsSrc.source || 'UN World Population Prospects 2024'} doi={birthsSrc.doi} detail="annual births" />
          </Lead>
        </section>

        <section className="space-y-3">
          <H>Almost all of it is already addressable — but by what?</H>
          <Lead>
            “Addressable” hides two different things, so we keep them apart. Some disease is{' '}
            <em>prevented before birth</em>, by carrier screening or embryo selection. The rest is
            met <em>after birth by treatment</em> — and treatment ranges from a cure, to lifelong
            management, to palliation, which are worlds apart. Germline editing is none of these.
          </Lead>
          <Figure
            label="Two axes: prevention, and treatment"
            caption="Click any band to open those diseases in the library. Bars are by affected births in the core catalogue."
            moreLabel="Open the disease library"
            onMore={() => update({ tab: 'library' })}
          >
            <CapabilitySplit data={data} update={update} />
          </Figure>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MiniStat
              tone="emerald"
              value={fmtPct(addressable.median, 1)}
              label="addressable by the existing stack"
              sub={`95% CrI ${fmtPct(addressable.ci95[0], 0)}–${fmtPct(addressable.ci95[1], 0)} — prevented before birth, or treated after it`}
            />
            <MiniStat
              tone="violet"
              value={`~${fmtPct(editableShare.median, 1)}`}
              label="uniquely needs germline editing"
              sub={`about ${fmtCompact(editableTotal.median)} births / yr — reachable by no existing tool, so germline editing is the only genetic-medicine option (not “no option”)`}
            />
          </div>
        </section>

        <section className="space-y-3">
          <H>In principle is not in practice — the gap is access</H>
          <AccessGap data={data} update={update} />
        </section>

        <section className="space-y-3">
          <H>Where the impact is</H>
          <Lead>
            The tools that already exist can, in principle, prevent or treat the overwhelming
            majority of serious genetic disease — but today they reach only a fraction of the people
            who need them. The largest gains come from closing that access gap by scaling the
            existing tools worldwide. Germline editing stays genuinely useful, but for a narrow
            residual — a specialised role, not the centre of gravity.
          </Lead>
          <div className="flex flex-wrap gap-2 text-xs">
            <NavChip onClick={() => update({ tab: 'library' })}>Browse the disease library →</NavChip>
            <NavChip onClick={() => update({ tab: 'prevention' })}>Prevention, by tool →</NavChip>
            <NavChip onClick={() => update({ tab: 'residual' })}>
              The editing residual →
            </NavChip>
          </div>
        </section>

        <section className="space-y-3">
          <H>Beyond prevention: correction → augmentation</H>
          <Lead>
            Preventing disease sits at the start of a longer trajectory. The same technologies can{' '}
            <em>correct</em> a pathogenic variant — restoring a genome to a healthy baseline — and
            correction shades into <em>augmenting</em> a trait beyond the typical range, and,
            some argue, onward toward “perfection.” Where prevention ends, and whether the burden of
            disease justifies moving along that line, is what the resistance and enhancement
            questions turn on.
          </Lead>
          <Trajectory update={update} />
        </section>

        <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            About the numbers &amp; uncertainty
          </summary>
          <div className="mt-2 space-y-2 text-[13px] leading-6 text-slate-600">
            <p>
              Two estimates run in parallel. A catalogue of {fmtInt(rollup.n_diseases_all)} diseases
              ({fmtInt(rollup.n_diseases)} high-burden core + {fmtInt(rollup.tiers.rare.n_diseases)}{' '}
              rare) is summed disease-by-disease; a parametric model samples cited rates and
              assumptions to give the totals with credible intervals. The catalogue sum
              ({fmtCompact(rollup.total_affected_births_per_year)}/yr over the core) is a floor that
              rises toward the modelled total ({fmtCompact(burden.total_serious.median)}/yr). What
              counts as “serious” and how disease is attributed to genetics are adjustable in
              “The burden”; every number responds.
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

// The findings up front, each linking to the section that establishes it.
function KeyTakeaways({
  data,
  update,
}: {
  data: AllData;
  update: (patch: UrlState) => void;
}) {
  const burden = data.summary.burden_default;
  const addressable = data.summary.addressable_share_of_serious.permissive;
  const editableTotal = data.summary.uniquely_editable_total.permissive;
  const editableShare = data.summary.uniquely_editable_share_of_serious.permissive;
  const cur = data.prevention['Global']?.['current']?.['monogenic']?.['pnd_on'];
  const ideal = data.prevention['Global']?.['ideal']?.['monogenic']?.['pnd_on'];

  const items: { text: ReactNode; go?: () => void }[] = [
    {
      text: (
        <>
          <strong>{fmtCompact(burden.total_serious.median)} children a year</strong> are born with a
          serious genetic disease — {fmtPct(burden.serious_share_of_births.median, 0)} of all births.
        </>
      ),
      go: () => update({ tab: 'denominator' }),
    },
    {
      text: (
        <>
          <strong>{fmtPct(addressable.median, 0)}</strong> of it is addressable by tools that already
          exist — prevented before birth, or treated after it.
        </>
      ),
      go: () => update({ tab: 'library' }),
    },
    {
      text: (
        <>
          Only <strong>~{fmtPct(editableShare.median, 1)}</strong> (about{' '}
          {fmtCompact(editableTotal.median)} births a year) is reachable by no existing tool — the
          narrow place where germline editing is the only genetic-medicine option.
        </>
      ),
      go: () => update({ tab: 'residual' }),
    },
    cur && ideal
      ? {
          text: (
            <>
              The real gap is <strong>access, not biology</strong>: for single-gene disease, full
              coverage would prevent {fmtPct(ideal.total_averted_birth_fraction.median, 0)} of
              affected births but today&apos;s coverage prevents{' '}
              {fmtPct(cur.total_averted_birth_fraction.median, 0)}.
            </>
          ),
          go: () => update({ tab: 'prevention' }),
        }
      : { text: <>The real gap is access, not biology.</>, go: () => update({ tab: 'prevention' }) },
    {
      text: (
        <>
          Beyond preventing disease, <strong>resistance and enhancement</strong> are different
          questions — and cannot borrow the case for prevention.
        </>
      ),
      go: () => update({ tab: 'enhancement' }),
    },
  ];

  return (
    <aside className="rounded-lg border border-slate-300 bg-slate-50 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Key takeaways
      </h2>
      <ul className="mt-3 space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2.5 text-[15px] leading-6 text-slate-700">
            <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>
              {it.text}
              {it.go && (
                <button
                  type="button"
                  onClick={it.go}
                  className="ml-1 whitespace-nowrap text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  see →
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
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
        title="Prevention — before birth, by which tool"
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

// Preventable-in-principle vs prevented-in-practice, for the clearest case (monogenic, global).
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
            At <strong>full coverage</strong>, the existing tools would prevent about{' '}
            <strong>{fmtPct(inPrinciple, 0)}</strong> of affected births.
          </>,
          <>
            At <strong>today&apos;s coverage</strong>, they actually prevent about{' '}
            <strong>{fmtPct(inPractice, 0)}</strong>.
          </>,
          <>
            The difference — <strong>{fmtPct(gap, 0)}</strong> — is not a limit of biology. It is
            unmet <strong>access</strong>, closed by scaling the same tools, not by editing.
          </>,
        ]}
      />
      <Figure
        label="Preventable in principle vs prevented in practice"
        caption="Single-gene disease, global. Multifactorial disease has a lower biological ceiling; both classes, all regions, and the step-by-step tool breakdown are in the next section."
        moreLabel="Open prevention"
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

// The purpose × mechanism progression: the trajectory some argue runs from preventing disease
// through resistance to enhancement — with germline editing entering at correction.
function Trajectory({ update }: { update: (patch: UrlState) => void }) {
  const stops = [
    {
      purpose: 'Prevention',
      mech: 'Selection & correction',
      desc: 'Avoid or cure serious disease. Where almost all the burden — and the justification — sits.',
      go: () => update({ tab: 'prevention' }),
      tone: 'emerald' as const,
    },
    {
      purpose: 'Resistance',
      mech: 'Correction',
      desc: 'Blunt a common risk (infection, cardiovascular, ageing). Usually already met by drugs or public-health tools.',
      go: () => update({ tab: 'resistance' }),
      tone: 'sky' as const,
    },
    {
      purpose: 'Enhancement',
      mech: 'Augmentation',
      desc: 'Push a trait beyond the typical range — and, some argue, toward “perfection.” A different question from disease.',
      go: () => update({ tab: 'enhancement' }),
      tone: 'violet' as const,
    },
  ];
  const toneCls: Record<string, string> = {
    emerald: 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400',
    sky: 'border-sky-200 bg-sky-50/50 hover:border-sky-400',
    violet: 'border-violet-200 bg-violet-50/50 hover:border-violet-400',
  };
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {stops.map((s, i) => (
        <button
          key={s.purpose}
          type="button"
          onClick={s.go}
          className={`rounded-lg border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${toneCls[s.tone]}`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {i + 1} · {s.mech}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">{s.purpose} →</p>
          <p className="mt-1 text-xs leading-snug text-slate-600">{s.desc}</p>
        </button>
      ))}
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

function NavChip({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {children}
    </button>
  );
}
