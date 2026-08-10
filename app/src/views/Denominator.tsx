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
import StatValue from '../components/StatValue';
import { Card, SectionHeading, Segmented, ExportSvgButton } from '../components/ui';
import { ShowDataToggle } from '../components/DataTable';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';
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

const SEVERITY_OPTS = [
  { value: 'def_a', label: 'def_a (narrow)' },
  { value: 'def_b', label: 'def_b (default)' },
  { value: 'def_c', label: 'def_c (broad)' },
];
const ATTR_OPTS = [
  { value: 'inclusive', label: 'inclusive' },
  { value: 'heritability_weighted', label: 'heritability-weighted' },
  { value: 'exclusive', label: 'exclusive' },
];

export default function Denominator({ data, state, update }: Props) {
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
  const addressableStrict = data.residual.addressable_share_of_serious.strict;

  const svgRef = useRef<HTMLDivElement>(null);

  const birthsSrc = provSource(data, ['births', 'global_per_year']);
  const monoSrc = provSource(data, ['burden', 'monogenic_serious_per_1000']);
  const multiSrc = provSource(data, ['burden', 'multifactorial_serious_per_1000']);

  return (
    <SourcesProvider>
    <div className="space-y-6">
      <SectionHeading
        title="The denominator, defined"
        subtitle="From all births to the sliver uniquely reachable only by germline editing. Change the severity definition or attribution stance to see every number move."
      />

      <div className="flex flex-wrap gap-6">
        <Segmented
          label="Severity definition"
          ariaLabel="Severity definition"
          value={severity}
          options={SEVERITY_OPTS}
          onChange={(v) => update({ severity: v })}
        />
        <Segmented
          label="Attribution stance"
          ariaLabel="Attribution stance"
          value={attribution}
          options={ATTR_OPTS}
          onChange={(v) => update({ attribution: v })}
        />
      </div>

      {/* Headline */}
      <Card className="border-accent/40 bg-accent-soft/40">
        <p className="text-sm text-slate-600">Headline (strict S2 criteria, default assumptions)</p>
        <p className="mt-1 text-xl font-semibold text-slate-900">
          ~<StatValue stat={addressableStrict} kind="pct" decimals={1} /> of serious genetic
          disease is addressable by existing tools
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Only{' '}
          <StatValue stat={ueStrictShareOfSerious} kind="pct" decimals={2} showCi /> of serious
          cases (strict) —{' '}
          <StatValue stat={ueStrict} kind="int" showCi /> births/yr — are{' '}
          <em>uniquely</em> editable. Under permissive S2 that rises to{' '}
          <StatValue stat={uePermShareOfSerious} kind="pct" decimals={2} /> (
          <StatValue stat={uePermissive} kind="compact" />
          /yr).
        </p>
      </Card>

      {/* Cascade */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Unit cascade</h3>
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

        <IconArray seriousShare={seriousShare} monoShare={monoShare} />

        <ShowDataToggle
          caption="Denominator cascade values"
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
              stage: 'Uniquely editable (strict)',
              count: fmtInt(ueStrict.median),
              share: `${fmtPct(ueStrictShareOfSerious.median, 2)} of serious`,
            },
            {
              stage: 'Uniquely editable (permissive)',
              count: fmtInt(uePermissive.median),
              share: `${fmtPct(uePermShareOfSerious.median, 2)} of serious`,
            },
          ]}
        />
      </Card>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Births / year">
          <StatValue stat={data.summary.births_per_year} kind="compact" showCi />
          <SourceNote source={birthsSrc.source || 'UN World Population Prospects 2024'} doi={birthsSrc.doi} />
        </MetricCard>
        <MetricCard label="Serious genetic disease / year">
          <StatValue stat={cell.total_serious} kind="compact" showCi />
          <SourceNote source={monoSrc.source || 'Modell & Darlison 2008'} doi={monoSrc.doi} detail="serious single-gene rate" />
        </MetricCard>
        <MetricCard label="Serious share of births">
          <StatValue stat={cell.serious_share_of_births} kind="pct" decimals={2} showCi />
          <SourceNote source="Derived: serious total ÷ annual births" doi={null} />
        </MetricCard>
        <MetricCard label="Monogenic / multifactorial">
          <span className="tnum text-lg font-semibold">
            {fmtCompact(monogenic)} / {fmtCompact(multifactorial)}
          </span>
          <SourceNote source={multiSrc.source || 'March of Dimes 2006; WHO congenital anomalies'} doi={multiSrc.doi} detail="multifactorial serious rate" />
        </MetricCard>
      </div>

      <p className="text-xs text-slate-500">
        Note: monogenic and multifactorial counts, total serious, and the serious share of
        births come directly from <code>burden.json.grid[{severity}][{attribution}]</code>.
        Shares shown here are ratios of those precomputed medians. The uniquely-editable
        residual is reported at the model's default assumptions.
      </p>

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
  const H = 5 * (rowH + gap) + 10;

  // Serious split row (monogenic vs multifactorial) drawn at full serious width.
  const seriousW = barW * p.seriousShare;
  const monoW = seriousW * p.monoShare;

  // Editable residual relative to serious.
  const strictFracOfSerious = p.ueStrict / p.totalSerious;
  const permFracOfSerious = p.uePermissive / p.totalSerious;

  return (
    <svg
      role="img"
      aria-label="Proportional cascade from all births to uniquely-editable residual"
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

      {/* Editable residual rows */}
      {[
        { label: 'Uniquely editable (permissive)', frac: permFracOfSerious, color: '#f59e0b', count: p.uePermissive },
        { label: 'Uniquely editable (strict)', frac: strictFracOfSerious, color: '#b45309', count: p.ueStrict },
      ].map((r, idx) => {
        const y = (3 + idx) * (rowH + gap);
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

// A 10xN icon array making the serious-share and monogenic split tangible.
function IconArray({ seriousShare, monoShare }: { seriousShare: number; monoShare: number }) {
  const total = 1000; // dots, each = 0.1% of births
  const seriousDots = Math.round(seriousShare * total);
  const monoDots = Math.round(seriousDots * monoShare);
  const cols = 50;
  const rows = total / cols;
  const size = 11;
  const r = 3.2;
  const W = cols * size;
  const H = rows * size;
  const dots = [];
  for (let i = 0; i < total; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    let fill = '#e2e8f0'; // unaffected
    if (i < monoDots) fill = '#2563eb';
    else if (i < seriousDots) fill = '#93c5fd';
    dots.push(
      <circle key={i} cx={col * size + size / 2} cy={row * size + size / 2} r={r} fill={fill} />
    );
  }
  return (
    <div className="mt-5">
      <p className="mb-1 text-xs text-slate-500">
        Each dot = 0.1% of births ({total} dots). Blue = monogenic serious, light blue =
        multifactorial serious, grey = unaffected.
      </p>
      <svg
        role="img"
        aria-label={`Icon array: ${seriousDots} of 1000 births have serious genetic disease`}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxWidth: 560 }}
      >
        {dots}
      </svg>
    </div>
  );
}
