import { useRef } from 'react';
import {
  AllData,
  Attribution,
  SeverityDef,
  fmtCompact,
  fmtInt,
  fmtPct,
} from '../data';
import { UrlState } from '../urlState';
import { useViewNav } from '../viewNav';
import StatValue from '../components/StatValue';
import { Card, SectionHeading, Segmented, ExportSvgButton } from '../components/ui';
import { ShowDataToggle } from '../components/DataTable';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';
import { InlineLink } from '../components/prose';
import { exportContainerSvg } from '../svgExport';

// Read a {source, doi} leaf from provenance constants without letting an object reach a child.
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

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

// Public-facing labels for the model's internal definitions (def_a/b/c and the
// attribution stances) — the internal ids stay in Methods for reproducibility.
// Note the "exclusive" stance is a NARROW attribution (a small, strongly genetic/familial
// component), not literally zero.
const SEVERITY_OPTS = [
  { value: 'def_a', label: 'Narrow' },
  { value: 'def_b', label: 'Main (default)' },
  { value: 'def_c', label: 'Broad' },
];
const ATTR_OPTS = [
  { value: 'inclusive', label: 'Broad attribution' },
  { value: 'heritability_weighted', label: 'Heritability-weighted' },
  { value: 'exclusive', label: 'Narrow genetic attribution' },
];
const ATTR_HELP: Record<string, string> = {
  inclusive: 'Count the full modeled multifactorial disease category.',
  heritability_weighted: 'Attribute only the estimated genetic share.',
  exclusive: 'Count only a small, strongly genetic/familial component.',
};

export default function Denominator({ data, state, update }: Props) {
  const go = useViewNav(update);
  const severity = (state.severity as SeverityDef) || (data.meta.default_assumptions.severity as SeverityDef);
  const attribution =
    (state.attribution as Attribution) ||
    (data.meta.default_assumptions.attribution as Attribution);

  const cell = data.burden.grid[severity][attribution];
  const births = data.summary.births_per_year.median;
  const totalSerious = cell.total_serious.median;
  const monogenic = cell.monogenic.median;
  const multifactorial = cell.multifactorial.median;

  // Display recombination of precomputed medians (allowed).
  const seriousShare = totalSerious / births; // fraction of births
  const monoShare = monogenic / totalSerious;
  const multiShare = multifactorial / totalSerious;

  // Uniquely-editable residual is reported at default assumptions in residual.json.
  const ueStrict = data.residual.uniquely_editable_total.strict;
  const uePermissive = data.residual.uniquely_editable_total.permissive;
  const ueStrictShareOfSerious = data.residual.uniquely_editable_share_of_serious.strict;
  const uePermShareOfSerious = data.residual.uniquely_editable_share_of_serious.permissive;

  const svgRef = useRef<HTMLDivElement>(null);

  const birthsSrc = provSource(data, ['births', 'global_per_year']);
  const monoSrc = provSource(data, ['burden', 'monogenic_serious_per_1000']);
  const multiSrc = provSource(data, ['burden', 'multifactorial_serious_per_1000']);

  return (
    <SourcesProvider>
    <div className="space-y-6">
      <SectionHeading
        title="How much serious genetic disease is there, and how is that total built?"
        subtitle="Start from every baby born in a year, then ask how many of them have serious disease with a genetic cause. The answer turns on two judgement calls: what counts as serious, and how much multifactorial disease is attributed to genetics."
      />
      <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
        The model begins with every baby born worldwide in a year, then splits serious genetic disease into two kinds. <strong>Single-gene</strong> disease is caused by a fault in one gene — cystic fibrosis, sickle cell disease. <strong>Multifactorial</strong> disease — most heart disease, most diabetes — comes from many genes acting together with environment, development and behaviour, so genetics is one contributor among several.
      </p>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
        Counting the single-gene cases is comparatively clean. The multifactorial count is not: there is no agreed way to say how much of a disease with many causes should be put down to genetics. Rather than pick one answer and present it as fact, the model offers three and shows what each does to the total.
      </p>

      <div className="flex flex-wrap gap-6">
        <Segmented
          label="How severe does a condition have to be to count?"
          ariaLabel="Definition of serious disease"
          value={severity}
          options={SEVERITY_OPTS}
          onChange={(v) => update({ severity: v })}
        />
        <div>
          <Segmented
            label="How much multi-cause disease should count as genetic?"
            ariaLabel="Genetic attribution of multifactorial disease"
            value={attribution}
            options={ATTR_OPTS}
            onChange={(v) => update({ attribution: v })}
          />
          <p className="mt-1 max-w-md text-xs text-slate-500">{ATTR_HELP[attribution]}</p>
        </div>
      </div>
      <p className="max-w-3xl text-xs text-slate-500">
        There is no uniquely correct way to attribute multifactorial disease to genetics; this
        choice is deliberately exposed because it strongly affects the denominator.{' '}
        <InlineLink onClick={() => go('methods', { kind: 'normative' })}>
          See all normative choices in the sources table
        </InlineLink>
        .
      </p>

      {/* Exact values for the current assumption set */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Annual global births">
          <StatValue stat={data.summary.births_per_year} kind="compact" />
          <SourceNote source={birthsSrc.source || 'UN World Population Prospects 2024'} doi={birthsSrc.doi} />
        </MetricCard>
        <MetricCard label="Serious genetic disease, per year">
          <StatValue stat={cell.total_serious} kind="compact" />
          <SourceNote
            source="Derived: sum of the modeled monogenic (Modell & Darlison 2008) and multifactorial (GBD 2023; March of Dimes 2006) components at the selected severity and attribution assumptions"
            doi={null}
          />
        </MetricCard>
        <MetricCard label="Monogenic and multifactorial">
          <span className="tnum text-lg font-semibold">
            {fmtCompact(monogenic)} / {fmtCompact(multifactorial)}
          </span>
          <SourceNote
            source={`${monoSrc.source || 'Modell & Darlison 2008'} (monogenic rate); ${multiSrc.source || 'March of Dimes 2006; WHO congenital anomalies'} (multifactorial rate)`}
            doi={multiSrc.doi}
          />
        </MetricCard>
      </div>

      {/* Cascade */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            From all births to serious genetic disease
          </h3>
          <ExportSvgButton
            onClick={() => exportContainerSvg(svgRef.current, 'denominator-cascade.svg')}
          />
        </div>
        <div ref={svgRef}>
          <Cascade
            births={births}
            totalSerious={totalSerious}
            monogenic={monogenic}
            multifactorial={multifactorial}
            seriousShare={seriousShare}
            monoShare={monoShare}
            multiShare={multiShare}
            ueStrict={ueStrict.median}
            uePermissive={uePermissive.median}
          />
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          These final rows are <strong>comparative scenarios, not additional disease
          categories</strong>. They show the portion of the modeled burden for which germline
          editing may provide unique or incremental medical value under the specified
          technology assumptions.
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Editing-relevant scenario estimates use the paper&apos;s default disease-severity and
          multifactorial-attribution assumptions and therefore do not change with the controls
          above.
        </p>

        <ShowDataToggle
          caption="Burden cascade values"
          columns={[
            { key: 'stage', header: 'Stage' },
            { key: 'count', header: 'Count / yr (median)', align: 'right' },
            { key: 'share', header: 'Share', align: 'right' },
          ]}
          rows={[
            {
              stage: 'All births',
              count: fmtInt(births),
              share: '100% of births',
            },
            {
              stage: 'Serious genetic disease',
              count: fmtInt(totalSerious),
              share: `${fmtPct(seriousShare, 2)} of births`,
            },
            {
              stage: 'Monogenic',
              count: fmtInt(monogenic),
              share: `${fmtPct(monoShare, 1)} of serious`,
            },
            {
              stage: 'Multifactorial',
              count: fmtInt(multifactorial),
              share: `${fmtPct(multiShare, 1)} of serious`,
            },
            {
              stage: 'Editing-relevant scenario — current evidence (default assumptions)',
              count: fmtInt(ueStrict.median),
              share: `${fmtPct(ueStrictShareOfSerious.median, 2)} of serious`,
            },
            {
              stage: 'Editing-relevant scenario — future-capacity exploratory (default assumptions)',
              count: fmtInt(uePermissive.median),
              share: `${fmtPct(uePermShareOfSerious.median, 2)} of serious`,
            },
          ]}
        />
      </Card>

      <SourcesList />
    </div>
    </SourcesProvider>
  );
}

function MetricCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg">{children}</p>
    </Card>
  );
}

interface CascadeProps {
  births: number;
  totalSerious: number;
  monogenic: number;
  multifactorial: number;
  seriousShare: number;
  monoShare: number;
  multiShare: number;
  ueStrict: number;
  uePermissive: number;
}

// A proportional stacked-bar cascade drawn as inline SVG (print-friendly).
function Cascade(p: CascadeProps) {
  const W = 900;
  const rowH = 46;
  const gap = 22;
  const labelW = 210;
  const barW = W - labelW - 90;
  const rows = [
    { label: 'All births', frac: 1, color: '#cbd5e1', count: p.births },
    {
      label: 'Serious genetic disease',
      frac: p.seriousShare,
      color: '#64748b',
      count: p.totalSerious,
    },
  ];
  const dividerH = 30; // space for the "comparative editing scenarios" separator
  const H = 5 * (rowH + gap) + dividerH + 10;

  // Serious split row (monogenic vs multifactorial) drawn at full serious width.
  const seriousW = barW * p.seriousShare;
  const monoW = seriousW * p.monoShare;

  // Editable residual relative to serious.
  const strictFracOfSerious = p.ueStrict / p.totalSerious;
  const permFracOfSerious = p.uePermissive / p.totalSerious;

  return (
    <svg
      role="img"
      aria-label="From all births down to serious genetic disease, and then to the cases where editing would be the only route"
      viewBox={`0 0 ${W} ${H}`}
      className="mt-3 w-full"
      style={{ maxWidth: '100%' }}
      fontFamily="ui-sans-serif, system-ui, sans-serif"
    >
      {rows.map((r, i) => {
        const y = i * (rowH + gap);
        const w = barW * r.frac;
        return (
          <g key={r.label}>
            <text x={0} y={y + rowH / 2 - 2} fontSize={13} fontWeight={600} fill="#334155">
              {r.label}
            </text>
            <text x={0} y={y + rowH / 2 + 14} fontSize={11} fill="#64748b">
              {fmtInt(r.count)} / yr
            </text>
            <rect
              x={labelW}
              y={y}
              width={Math.max(w, 1)}
              height={rowH}
              rx={3}
              fill={r.color}
            />
            <text
              x={labelW + w + 6}
              y={y + rowH / 2 + 4}
              fontSize={11}
              fill="#334155"
            >
              {i === 0 ? '100%' : `${fmtPct(r.frac, 2)} of births`}
            </text>
          </g>
        );
      })}

      {/* Monogenic vs multifactorial split row */}
      {(() => {
        const y = 2 * (rowH + gap);
        return (
          <g>
            <text x={0} y={y + rowH / 2 - 2} fontSize={13} fontWeight={600} fill="#334155">
              Split of serious
            </text>
            <text x={0} y={y + rowH / 2 + 14} fontSize={11} fill="#64748b">
              monogenic vs multifactorial
            </text>
            <rect x={labelW} y={y} width={Math.max(monoW, 1)} height={rowH} rx={3} fill="#2563eb" />
            <rect
              x={labelW + monoW}
              y={y}
              width={Math.max(seriousW - monoW, 1)}
              height={rowH}
              rx={3}
              fill="#93c5fd"
            />
            <text x={labelW + 6} y={y + rowH / 2 + 4} fontSize={11} fill="#fff">
              Mono {fmtPct(p.monoShare, 0)}
            </text>
            <text x={labelW + monoW + 6} y={y + rowH / 2 + 4} fontSize={11} fill="#1e3a8a">
              Multi {fmtPct(p.multiShare, 0)}
            </text>
          </g>
        );
      })()}

      {/* Comparative editing scenarios — visually separated from the burden cascade */}
      {(() => {
        const base = 3 * (rowH + gap);
        return (
          <g>
            <line x1={0} x2={W} y1={base + 2} y2={base + 2} stroke="#cbd5e1" strokeDasharray="4 4" />
            <text x={0} y={base + 20} fontSize={11} fontWeight={700} fill="#92400e" letterSpacing="0.06em">
              COMPARATIVE EDITING SCENARIOS
            </text>
          </g>
        );
      })()}
      {[
        { label: 'On current evidence', frac: strictFracOfSerious, color: '#b45309', count: p.ueStrict },
        { label: 'If future capability arrives', frac: permFracOfSerious, color: '#f59e0b', count: p.uePermissive },
      ].map((r, idx) => {
        const y = (3 + idx) * (rowH + gap) + dividerH;
        const w = Math.max(seriousW * r.frac, 2);
        return (
          <g key={r.label}>
            <text x={0} y={y + rowH / 2 - 2} fontSize={13} fontWeight={600} fill="#334155">
              {r.label}
            </text>
            <text x={0} y={y + rowH / 2 + 14} fontSize={11} fill="#64748b">
              {fmtInt(r.count)} / yr
            </text>
            {/* faint serious reference bar */}
            <rect x={labelW} y={y} width={seriousW} height={rowH} rx={3} fill="#f1f5f9" />
            <rect x={labelW} y={y} width={w} height={rowH} rx={3} fill={r.color} />
            <text x={labelW + Math.max(w, seriousW) + 6} y={y + rowH / 2 + 4} fontSize={11} fill="#334155">
              {fmtPct(r.frac, 2)} of serious
            </text>
          </g>
        );
      })}
    </svg>
  );
}

