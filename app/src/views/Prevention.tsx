import { useRef } from 'react';
import {
  AllData,
  DiseaseClass,
  PndKey,
  PreventionLeaf,
  Stat,
  ToolKey,
  fmtInt,
  fmtPct,
} from '../data';
import { UrlState } from '../urlState';
import StatValue from '../components/StatValue';
import Term from '../components/Term';
import { Card, SectionHeading, Select, Segmented, Toggle, ExportSvgButton } from '../components/ui';
import { ShowDataToggle } from '../components/DataTable';
import { exportContainerSvg } from '../svgExport';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

const REGIONS = ['Global', 'High income', 'Upper-middle income', 'Lower-middle income', 'Low income'];
const SCENARIOS = [
  { value: 'current', label: 'Current coverage' },
  { value: 'achievable_2035', label: 'Expanded-access 2035 scenario' },
  { value: 'ideal', label: 'Full coverage (ideal)' },
];
const CLASSES = [
  { value: 'monogenic', label: 'Single-gene (monogenic)' },
  { value: 'multifactorial', label: 'Multifactorial' },
];

// Birth track uses CS/PGT/PND (NBS is 0 by design). Burden track adds NBS.
const BIRTH_TOOLS: ToolKey[] = ['CS', 'PGT', 'PND'];
const BURDEN_TOOLS: ToolKey[] = ['CS', 'PGT', 'PND', 'NBS'];
const TOOL_COLOR: Record<ToolKey, string> = {
  CS: '#2563eb',
  PGT: '#0891b2',
  PND: '#7c3aed',
  NBS: '#059669',
};
// Public-facing pathway names. None of these "prevents disease" by itself: each is a test plus
// the decision or therapy that follows it, and the copy keeps that visible.
const TOOL_LABEL: Record<ToolKey, string> = {
  CS: 'Carrier screening + reproductive planning',
  PGT: 'IVF + PGT-M embryo selection',
  PND: 'Prenatal diagnosis + reproductive decision',
  NBS: 'Newborn screening + early treatment',
};

export default function Prevention({ data, state, update }: Props) {
  const region = REGIONS.includes(state.region || '') ? state.region : 'Global';
  const scenario = SCENARIOS.some((s) => s.value === state.scenario)
    ? state.scenario
    : 'current';
  const cls = (CLASSES.some((c) => c.value === state.cls) ? state.cls : 'monogenic') as DiseaseClass;
  const pndOn = state.pnd !== 'off';
  const track = state.track === 'burden' ? 'burden' : 'birth';
  const coverage = clamp(parseFloat(state.cov ?? '1'), 0, 1) || 1;

  const pndKey: PndKey = pndOn ? 'pnd_on' : 'pnd_off';
  const leaf: PreventionLeaf | undefined =
    data.prevention[region!]?.[scenario!]?.[cls]?.[pndKey];

  const svgRef = useRef<HTMLDivElement>(null);

  if (!leaf) {
    return <p className="text-sm text-red-700">No data for this selection.</p>;
  }

  const tools = track === 'burden' ? BURDEN_TOOLS : BIRTH_TOOLS;
  const avertedMap =
    track === 'burden' ? leaf.averted_burden_fraction : leaf.averted_birth_fraction;
  const residualStat = track === 'burden' ? leaf.residual_burden_fraction : leaf.residual_birth_fraction;
  const totalAverted =
    track === 'burden' ? leaf.total_averted_burden_fraction : leaf.total_averted_birth_fraction;

  // Full-coverage remainder: what is still NOT prevented for this class even at ideal
  // coverage — beyond the modeled pathways. (Not the same as editing-addressable: whether
  // editing can reach any of it is established separately in the residual analysis.)
  const idealLeaf = data.prevention[region!]?.['ideal']?.[cls]?.[pndKey];
  const floorFrac = idealLeaf
    ? track === 'burden'
      ? idealLeaf.residual_burden_fraction.median
      : idealLeaf.residual_birth_fraction.median
    : undefined;

  // Illustrative coverage scaling of displayed averted fractions (display-only).
  const scale = coverage;
  const scaledAverted = tools.map((t) => ({ tool: t, frac: avertedMap[t].median * scale }));
  const totalScaled = scaledAverted.reduce((a, b) => a + b.frac, 0);
  const residualScaled = Math.max(0, 1 - totalScaled);
  const isIllustrative = coverage !== 1;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Impact now: what can existing genetic medicine achieve?"
        subtitle="Established genetic medicine already changes outcomes through reproductive planning, embryo selection, prenatal diagnosis, early detection, and treatment. The model asks both what these pathways can achieve in principle and how much of that potential reaches patients today."
      />
      <p className="text-sm leading-relaxed text-slate-700">
        <Term k="carrier screening">Carrier screening</Term> + reproductive planning can
        identify couples at risk before pregnancy. IVF with <Term k="PGT">PGT-M</Term> can
        allow selection of an embryo without the targeted disease genotype.{' '}
        <Term k="prenatal diagnosis">Prenatal diagnosis</Term> can identify an affected
        pregnancy, but it changes the number of affected births only if followed by a
        reproductive decision not to continue that pregnancy.{' '}
        <Term k="newborn screening">Newborn screening</Term> acts after birth by enabling
        earlier treatment.
      </p>
      <p className="text-sm leading-relaxed text-slate-700">
        Because these outcomes are not equivalent, the model reports them on two separate
        tracks:{' '}
        <strong>
          <Term k="affected-birth avoidance">affected births avoided</Term>
        </strong>{' '}
        and{' '}
        <strong>
          <Term k="burden mitigation">disease burden mitigated after birth</Term>
        </strong>
        .
      </p>

      <p className="text-xs leading-5 text-slate-500">
        This part of the analysis is strongest for monogenic disease, where inheritance and
        reproductive options can be modeled relatively directly. Multifactorial disease is also
        shown, but its attribution and intervention pathways are more assumption-sensitive and
        should not be interpreted as equivalent evidence.
      </p>

      <div className="flex flex-wrap items-end gap-5">
        <Select
          id="region"
          label="Region"
          value={region!}
          options={REGIONS.map((r) => ({ value: r, label: r }))}
          onChange={(v) => update({ region: v })}
        />
        <Select
          id="scenario"
          label="Scenario"
          value={scenario!}
          options={SCENARIOS}
          onChange={(v) => update({ scenario: v })}
        />
        <Segmented
          label="Disease class"
          value={cls}
          options={CLASSES}
          onChange={(v) => update({ cls: v })}
        />
        <Segmented
          label="Track"
          value={track}
          options={[
            { value: 'birth', label: 'Affected births avoided' },
            { value: 'burden', label: 'Burden mitigated after birth' },
          ]}
          onChange={(v) => update({ track: v })}
        />
      </div>
      <div className="rounded border border-slate-200 bg-slate-50 p-3">
        <Toggle
          label="Count prenatal diagnosis followed by pregnancy termination as reducing affected births?"
          checked={pndOn}
          onChange={(v) => update({ pnd: v ? 'on' : 'off' })}
        />
        <p className="mt-1 pl-6 text-xs leading-5 text-slate-600">
          Prenatal diagnosis is a diagnostic test, not itself a preventive intervention. In the
          affected-birth analysis it is counted only when an affected diagnosis is followed by
          pregnancy termination. Because that assumption is ethically consequential, results can
          be viewed with it included or excluded.
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            {track === 'burden' ? 'Averted burden' : 'Averted births'} — {region}, {scenario},{' '}
            {cls}
          </h3>
          <ExportSvgButton
            onClick={() => exportContainerSvg(svgRef.current, 'prevention-waterfall.svg')}
          />
        </div>
        <div ref={svgRef}>
          <Waterfall
            steps={scaledAverted}
            residual={residualScaled}
            floor={floorFrac}
            colors={TOOL_COLOR}
          />
        </div>
        <ToolLegend tools={tools} />
        {floorFrac !== undefined && scenario !== 'ideal' && (
          <p className="mt-1 text-xs text-slate-600">
            Dashed line: the modeled remainder ({fmtPct(floorFrac, 1)}) under idealized full
            coverage. Within this model, the gap between current coverage and the dashed line
            reflects the additional impact obtainable by expanding coverage of technically
            applicable pathways. The portion below the line remains beyond those modeled
            pathways and is examined separately in the germline-editing analysis.
          </p>
        )}
        <div className="mt-2">
          <button
            type="button"
            onClick={() => update({ tab: 'residual' })}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Next: where can editing provide a distinct or substantially less burdensome route? →
          </button>
        </div>

        {/* Exploratory control, off the default reading path — it rescales the display and is
            explicitly not a model output. */}
        <details className="mt-3" open={isIllustrative}>
          <summary className="cursor-pointer text-xs font-medium text-slate-500">
            Advanced / exploratory controls
          </summary>
          <label htmlFor="cov" className="mt-2 flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">
              Illustrative coverage multiplier: {fmtPct(coverage, 0)}
              {isIllustrative && (
                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                  illustrative — not a model output
                </span>
              )}
            </span>
            <input
              id="cov"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={coverage}
              onChange={(e) => update({ cov: e.target.value })}
              aria-label="Illustrative coverage multiplier"
              className="w-64"
            />
            <span className="text-xs text-slate-500">
              Linearly scales the displayed averted fractions as an illustration only. Leave at
              100% to show the precomputed scenario.
            </span>
          </label>
        </details>

        <ShowDataToggle
          caption="Prevention waterfall values"
          columns={[
            { key: 'stage', header: 'Stage' },
            { key: 'averted', header: 'Averted fraction (median)', align: 'right' },
            { key: 'ci', header: '95% uncertainty interval', align: 'right' },
          ]}
          rows={[
            { stage: 'Baseline', averted: '100%', ci: '—' },
            ...tools.map((t) => ({
              stage: `− ${TOOL_LABEL[t]}`,
              averted: fmtPct(avertedMap[t].median * scale, 2),
              ci: `${fmtPct(avertedMap[t].ci95[0], 2)}–${fmtPct(avertedMap[t].ci95[1], 2)}`,
            })),
            {
              stage: 'Not prevented at this coverage',
              averted: fmtPct(isIllustrative ? residualScaled : residualStat.median, 2),
              ci: isIllustrative
                ? '—'
                : `${fmtPct(residualStat.ci95[0], 2)}–${fmtPct(residualStat.ci95[1], 2)}`,
            },
            {
              stage: 'Total averted',
              averted: fmtPct(isIllustrative ? totalScaled : totalAverted.median, 2),
              ci: isIllustrative
                ? '—'
                : `${fmtPct(totalAverted.ci95[0], 2)}–${fmtPct(totalAverted.ci95[1], 2)}`,
            },
          ]}
        />
      </Card>

      {/* Absolute counts */}
      <Card>
        <h3 className="mb-2 text-base font-semibold text-slate-900">
          Absolute births — {region}, {scenario}, {cls}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CountCard label="Class births / yr" stat={leaf.class_births} />
          <CountCard label="Not-prevented births / yr at this coverage" stat={leaf.residual_birth_count} />
          <CountCard
            label="PND + termination counted as reducing births"
            valueOverride={pndOn ? 'Yes' : 'No'}
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Averted birth counts by tool</caption>
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th scope="col" className="px-3 py-2 text-left font-medium">Pathway</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Averted births / yr (median)</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">95% uncertainty interval</th>
              </tr>
            </thead>
            <tbody>
              {(['CS', 'PGT', 'PND', 'NBS'] as ToolKey[]).map((t) => {
                const s = leaf.averted_birth_count[t];
                return (
                  <tr key={t} className="border-b border-slate-100">
                    <td className="px-3 py-1.5">
                      {TOOL_LABEL[t]}
                      {t === 'NBS' && (
                        <span className="ml-2 text-xs text-slate-500">(0 by design — mitigates burden after birth, never births)</span>
                      )}
                    </td>
                    <td className="tnum px-3 py-1.5 text-right">{fmtInt(s.median)}</td>
                    <td className="tnum px-3 py-1.5 text-right text-slate-500">
                      {fmtInt(s.ci95[0])}–{fmtInt(s.ci95[1])}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-slate-500">
        Newborn screening enables earlier treatment rather than preventing a birth, so its
        averted-birth share is zero and it appears only in the burden track. Each scenario's
        coverage and effectiveness are already included in the figures shown.
      </p>
    </div>
  );
}

// Maps the chart's short pathway codes to their full public-facing names.
function ToolLegend({ tools }: { tools: ToolKey[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
      {tools.map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: TOOL_COLOR[t] }}
          />
          <span className="font-medium">{t}</span> = {TOOL_LABEL[t]}
        </span>
      ))}
    </div>
  );
}

function CountCard({
  label,
  stat,
  valueOverride,
}: {
  label: string;
  stat?: Stat;
  valueOverride?: string;
}) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg">
        {valueOverride ? (
          <span className="font-semibold">{valueOverride}</span>
        ) : stat ? (
          <StatValue stat={stat} kind="int" showCi />
        ) : null}
      </p>
    </Card>
  );
}

function clamp(n: number, lo: number, hi: number) {
  if (Number.isNaN(n)) return hi;
  return Math.min(hi, Math.max(lo, n));
}

interface WaterfallProps {
  steps: Array<{ tool: ToolKey; frac: number }>;
  residual: number;
  floor?: number;
  colors: Record<ToolKey, string>;
}

// Waterfall as inline SVG: start at 100%, subtract each tool's averted fraction.
function Waterfall({ steps, residual, floor, colors }: WaterfallProps) {
  const W = 820;
  const H = 300;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 50;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const cats = ['Baseline', ...steps.map((s) => s.tool), 'Not prevented'];
  const n = cats.length;
  const bandW = plotW / n;
  const barW = bandW * 0.6;
  const y = (frac: number) => padT + (1 - frac) * plotH;

  // Running top of the remaining fraction.
  let running = 1;
  const bars: Array<{ x: number; yTop: number; h: number; color: string; label: string; value: number; isFloat: boolean }> = [];
  // Baseline full bar
  bars.push({ x: padL + 0 * bandW + (bandW - barW) / 2, yTop: y(1), h: plotH - (y(1) - padT), color: '#cbd5e1', label: 'Baseline', value: 1, isFloat: false });
  steps.forEach((s, i) => {
    const top = running;
    const bottom = running - s.frac;
    bars.push({
      x: padL + (i + 1) * bandW + (bandW - barW) / 2,
      yTop: y(top),
      h: y(bottom) - y(top),
      color: colors[s.tool],
      label: s.tool,
      value: s.frac,
      isFloat: true,
    });
    running = bottom;
  });
  // Residual final bar from 0 to residual
  bars.push({
    x: padL + (n - 1) * bandW + (bandW - barW) / 2,
    yTop: y(residual),
    h: plotH - (y(residual) - padT),
    color: '#334155',
    label: 'Not prevented',
    value: residual,
    isFloat: false,
  });

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      role="img"
      aria-label="Prevention waterfall from 100% baseline through each tool to what is not prevented at this coverage"
      viewBox={`0 0 ${W} ${H}`}
      className="mt-3 w-full"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
    >
      {gridLines.map((g) => (
        <g key={g}>
          <line x1={padL} x2={W - padR} y1={y(g)} y2={y(g)} stroke="#e2e8f0" />
          <text x={padL - 6} y={y(g) + 4} fontSize={10} textAnchor="end" fill="#94a3b8">
            {Math.round(g * 100)}%
          </text>
        </g>
      ))}
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.yTop} width={barW} height={Math.max(b.h, 1)} rx={2} fill={b.color} />
          <text
            x={b.x + barW / 2}
            y={b.yTop - 5}
            fontSize={11}
            textAnchor="middle"
            fill="#334155"
          >
            {b.isFloat ? '−' : ''}
            {fmtPct(b.value, 1)}
          </text>
          <text
            x={b.x + barW / 2}
            y={H - padB + 16}
            fontSize={11}
            textAnchor="middle"
            fill="#475569"
          >
            {b.label}
          </text>
        </g>
      ))}
      {floor !== undefined && floor >= 0 && floor <= 1 && (
        <g>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(floor)}
            y2={y(floor)}
            stroke="#6d28d9"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          <text x={padL + 4} y={y(floor) - 4} fontSize={10} fill="#6d28d9">
            Remaining after full modeled coverage ≈ {fmtPct(floor, 1)}
          </text>
        </g>
      )}
    </svg>
  );
}
