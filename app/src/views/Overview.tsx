import { ReactNode } from 'react';
import { AllData, DiseaseClass, fmtCompact, fmtInt, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { Card } from '../components/ui';
import StatValue from '../components/StatValue';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';

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

export default function Overview({ data, state, update }: Props) {
  const mode = state.mode === 'detailed' ? 'detailed' : 'simple';
  const rollup = data.library.rollup;
  const monoSrc = provSource(data, ['burden', 'monogenic_serious_per_1000']);
  const multiSrc = provSource(data, ['burden', 'multifactorial_serious_per_1000']);
  const birthsSrc = provSource(data, ['births', 'global_per_year']);

  const addressable = data.summary.addressable_share_of_serious.permissive;
  const editableTotal = data.summary.uniquely_editable_total.permissive;
  const editableShare = data.summary.uniquely_editable_share_of_serious.permissive;

  return (
    <SourcesProvider>
      <div className="space-y-5">
        {/* Lede: the question and the one-line answer */}
        <Card>
          <p className="text-sm leading-relaxed text-slate-700">
            This page follows one argument, in four steps. Across every serious genetic disease we
            can catalogue, it asks: <strong>how much can medicine already do about it, and what is
            genuinely left only for germline editing?</strong> The short answer — almost all of it
            is addressable with tools we already have; editing is uniquely needed for a sliver; and
            the real obstacle today is <strong>access</strong>, not biology.
          </p>
        </Card>

        {/* STEP 1 — the burden */}
        <ArgumentStep n={1} title="The burden is large">
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[auto,1fr]">
            <div>
              <div className="text-3xl font-bold text-slate-900">
                <StatValue stat={data.summary.burden_default.total_serious} kind="compact" />
              </div>
              <p className="text-xs text-slate-500">children / year, 95% CrI shown on hover</p>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              About <strong>{fmtCompact(data.summary.burden_default.total_serious.median)}</strong>{' '}
              children are born each year with a serious genetic disease —{' '}
              {fmtPct(data.summary.burden_default.serious_share_of_births.median, 0)} of all births.
              Roughly {fmtCompact(data.summary.burden_default.monogenic.median)} are single-gene
              (monogenic) conditions and {fmtCompact(data.summary.burden_default.multifactorial.median)}{' '}
              are multifactorial. Every figure on this page is shown with its uncertainty.
              <SourceNote source={monoSrc.source || 'Modell & Darlison 2008'} doi={monoSrc.doi} detail="serious monogenic rate" />
              <SourceNote source={multiSrc.source || 'March of Dimes; WHO congenital anomalies'} doi={multiSrc.doi} detail="serious multifactorial rate" />
              <SourceNote source={birthsSrc.source || 'UN World Population Prospects 2024'} doi={birthsSrc.doi} detail="annual births" />
            </p>
          </div>
        </ArgumentStep>

        {/* STEP 2 — preventable in principle vs the editing-only residual */}
        <ArgumentStep
          n={2}
          title="Almost all of it is addressable by tools we already have"
        >
          <StatusSplit data={data} update={update} />
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MiniStat
              tone="emerald"
              value={fmtPct(addressable.median, 1)}
              label="addressable by existing tools"
              sub={`95% CrI ${fmtPct(addressable.ci95[0], 0)}–${fmtPct(addressable.ci95[1], 0)} — carrier screening, embryo testing, prenatal diagnosis, newborn screening, and today's therapies`}
            />
            <MiniStat
              tone="violet"
              value={`~${fmtPct(editableShare.median, 1)}`}
              label="uniquely needs germline editing"
              sub={`about ${fmtCompact(editableTotal.median)} births / yr — the only cases no existing tool can reach even in principle`}
            />
          </div>
        </ArgumentStep>

        {/* STEP 3 — the real gap is access, not biology */}
        <ArgumentStep
          n={3}
          title="“Addressable in principle” is not “prevented in practice” — the gap is access"
        >
          <AccessGap data={data} update={update} />
        </ArgumentStep>

        {/* STEP 4 — the takeaway */}
        <ArgumentStep n={4} title="So where does the impact come from?">
          <p className="text-sm leading-relaxed text-slate-700">
            Put together: the tools that already exist can, in principle, prevent or treat the
            overwhelming majority of serious genetic disease — but today they only reach a fraction
            of the people who need them. The largest gains come from{' '}
            <strong>closing that access gap by scaling the existing tools globally</strong>. Germline
            editing remains genuinely useful, but only for the narrow residual in step 2 — a small,
            specialised role, not the centre of gravity.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <NavChip onClick={() => update({ tab: 'library' })}>Browse the disease library →</NavChip>
            <NavChip onClick={() => update({ tab: 'prevention' })}>See prevention by tool →</NavChip>
            <NavChip onClick={() => update({ mode: 'detailed', tab: 'residual' })}>
              Inspect the editing residual →
            </NavChip>
          </div>
        </ArgumentStep>

        {/* Follow the argument along the paper's three axes */}
        <ArgumentAxes update={update} />

        {/* About the numbers — quiet, at the bottom */}
        <Card className="bg-slate-50">
          <details>
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              About the numbers &amp; uncertainty
            </summary>
            <div className="mt-2 space-y-2 text-xs leading-relaxed text-slate-600">
              <p>
                Two estimates run in parallel. A <strong>catalogue</strong> of{' '}
                {fmtInt(rollup.n_diseases_all)} diseases ({fmtInt(rollup.n_diseases)} high-burden core
                + {fmtInt(rollup.tiers.rare.n_diseases)} rare) is summed disease-by-disease; a{' '}
                <strong>parametric model</strong> samples cited rates and assumptions to give the
                totals with credible intervals. The catalogue sum ({fmtCompact(rollup.total_affected_births_per_year)}/yr
                over the core) is a floor that rises as the catalogue grows toward the modelled total
                ({fmtCompact(data.summary.burden_default.total_serious.median)}/yr). Two judgment
                calls — what counts as “serious” and how disease is attributed to genetics —
                are adjustable in “The burden” section; every number responds.
              </p>
              <button
                type="button"
                onClick={() => update({ mode: 'detailed', tab: 'methods' })}
                className="font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Full methods &amp; sources →
              </button>
              {mode === 'detailed' && (
                <span className="sr-only">
                  <SourcesList />
                </span>
              )}
            </div>
          </details>
        </Card>
      </div>
    </SourcesProvider>
  );
}

const STATUS_COLORS: Record<string, string> = {
  preventable_treatable: '#059669',
  preventable: '#0284c7',
  treatable: '#0d9488',
  detectable_only: '#d97706',
  none: '#94a3b8',
};

function StatusSplit({
  data,
  update,
}: {
  data: AllData;
  update: (patch: UrlState) => void;
}) {
  const s = data.library.rollup.genetic_medicine_status;
  const totalB = s.order.reduce((a, k) => a + s.distribution[k].births, 0) || 1;
  let x = 0;
  const segs = s.order.map((k) => {
    const w = (s.distribution[k].births / totalB) * 100;
    const seg = { k, x, w, ...s.distribution[k] };
    x += w;
    return seg;
  });

  return (
    <div>
      <p className="text-sm text-slate-700">
        Each disease sits in one status, set only by which interventions apply to it. The bar is by
        affected births in the core catalogue — click any band to filter the library.
      </p>
      <div
        className="mt-2 flex h-8 w-full overflow-hidden rounded"
        role="img"
        aria-label="Genetic-medicine status distribution by affected births"
      >
        {segs.map((seg) =>
          seg.w > 0 ? (
            <button
              key={seg.k}
              type="button"
              onClick={() => update({ tab: 'library', status: seg.k, libsort: 'status' })}
              title={`${seg.label}: ${fmtInt(seg.births)} births/yr (${fmtPct(
                seg.births / totalB,
                0
              )}) · ${seg.n_diseases} diseases`}
              style={{ width: `${seg.w}%`, backgroundColor: STATUS_COLORS[seg.k] }}
              className="h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-slate-900"
            />
          ) : null
        )}
      </div>
      <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {segs.map((seg) => (
          <button
            key={seg.k}
            type="button"
            onClick={() => update({ tab: 'library', status: seg.k, libsort: 'status' })}
            className="flex items-center gap-2 text-left text-xs hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: STATUS_COLORS[seg.k] }}
            />
            <span className="text-slate-700">{seg.label}</span>
            <span className="tnum ml-auto text-slate-500">
              {fmtCompact(seg.births)} · {seg.n_diseases}
            </span>
          </button>
        ))}
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
    <div>
      <p className="text-sm leading-relaxed text-slate-700">
        Take single-gene disease, globally. At <strong>full coverage</strong> the existing tools
        would prevent about <strong>{fmtPct(inPrinciple, 0)}</strong> of affected births. At{' '}
        <strong>today's coverage</strong> they actually prevent about{' '}
        <strong>{fmtPct(inPractice, 0)}</strong>. The difference —{' '}
        <strong>{fmtPct(gap, 0)}</strong> — is not a limit of biology; it is unmet{' '}
        <strong>access</strong>, closed by scaling the same tools, not by editing.
      </p>

      <div className="mt-3 space-y-2">
        <GapBar label="Preventable in principle (full coverage)" frac={inPrinciple} color="#059669" />
        <GapBar label="Prevented in practice (today's coverage)" frac={inPractice} color="#0284c7" />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Multifactorial disease has a lower biological ceiling; both classes, all regions, and the
        step-by-step tool breakdown are in the next section.{' '}
        <button
          type="button"
          onClick={() => update({ tab: 'prevention' })}
          className="font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Open Prevention →
        </button>
      </p>
    </div>
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

// The paper sorts the whole question along three axes. This is the app's map to them.
function ArgumentAxes({ update }: { update: (patch: UrlState) => void }) {
  const go = (patch: UrlState) => () => update(patch);
  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-900">Follow the argument</h3>
      <p className="mt-1 text-sm text-slate-600">
        The paper sorts every case along three axes. Use them to navigate — each chip opens the
        view that covers it.
      </p>

      <div className="mt-4 space-y-4">
        <Axis
          label="1 · Genetic architecture"
          desc="How many genes drive the disease — this sets what any intervention can reach."
          items={[
            { name: 'Monogenic', sub: 'one gene', onClick: go({ tab: 'library', cat: 'all' }) },
            { name: 'Oligogenic', sub: 'a few genes', onClick: go({ mode: 'detailed', tab: 'multifactorial' }) },
            { name: 'Highly polygenic', sub: 'many genes', onClick: go({ mode: 'detailed', tab: 'multifactorial' }) },
            { name: 'Massively polygenic', sub: 'thousands', onClick: go({ mode: 'detailed', tab: 'multifactorial' }) },
          ]}
        />
        <Axis
          label="2 · Purpose"
          desc="What the intervention is for — the paper keeps these three separate and does not let one borrow another's justification."
          items={[
            { name: 'Prevention', sub: 'avoid serious disease', onClick: go({ tab: 'prevention' }) },
            { name: 'Resistance', sub: 'blunt infection / ageing', onClick: go({ mode: 'detailed', tab: 'resistance' }) },
            { name: 'Enhancement', sub: 'boost normal traits — out of scope here', tone: 'muted' },
          ]}
        />
        <Axis
          label="3 · Mechanism"
          desc="How the change is made — only correction and augmentation involve germline editing."
          items={[
            { name: 'Selection', sub: 'choose an embryo (PGT) — no editing', onClick: go({ mode: 'detailed', tab: 'embryos' }) },
            { name: 'Correction', sub: 'edit a disease variant to normal', onClick: go({ mode: 'detailed', tab: 'residual' }) },
            { name: 'Augmentation', sub: 'edit beyond normal — enhancement', tone: 'muted' },
          ]}
        />
      </div>
    </Card>
  );
}

function Axis({
  label,
  desc,
  items,
}: {
  label: string;
  desc: string;
  items: { name: string; sub: string; onClick?: () => void; tone?: 'muted' }[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className="text-xs text-slate-500">{desc}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((it) => {
          const base =
            'rounded border px-2.5 py-1 text-left text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';
          if (!it.onClick) {
            return (
              <span
                key={it.name}
                className={`${base} border-dashed border-slate-200 bg-slate-50 text-slate-400`}
                title={it.sub}
              >
                <span className="font-medium">{it.name}</span>
                <span className="ml-1">· {it.sub}</span>
              </span>
            );
          }
          return (
            <button
              key={it.name}
              type="button"
              onClick={it.onClick}
              className={`${base} border-slate-300 bg-white text-slate-700 hover:border-accent hover:text-accent`}
            >
              <span className="font-medium">{it.name}</span>
              <span className="ml-1 text-slate-400">· {it.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ArgumentStep({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </Card>
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
