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
import { Card, SectionHeading, Select, Segmented, Toggle, ExportSvgButton } from '../components/ui';
import { ShowDataToggle } from '../components/DataTable';
import Explainer from '../components/Explainer';
import { exportContainerSvg } from '../svgExport';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

const REGIONS = ['Global', 'High income', 'Upper-middle income', 'Lower-middle income', 'Low income'];
const SCENARIOS = [
  { value: 'current', label: 'current' },
  { value: 'achievable_2035', label: 'achievable 2035' },
  { value: 'ideal', label: 'ideal' },
];
const CLASSES = [
  { value: 'monogenic', label: 'monogenic' },
  { value: 'multifactorial', label: 'multifactorial' },
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

  // Illustrative coverage scaling of displayed averted fractions (display-only).
  const scale = coverage;
  const scaledAverted = tools.map((t) => ({ tool: t, frac: avertedMap[t].median * scale }));
  const totalScaled = scaledAverted.reduce((a, b) => a + b.frac, 0);
  const residualScaled = Math.max(0, 1 - totalScaled);
  const isIllustrative = coverage !== 1;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Prevention waterfall"
        subtitle="From a 100% baseline, each tool averts a share of the selected class. Fractions already encode coverage × effectiveness for the chosen scenario."
      />
      <Explainer
        whatThisShows="How much of a disease class's affected births the four existing tools prevent under a given real-world coverage scenario, applied one after another: carrier screening, then embryo testing, then prenatal diagnosis, then newborn screening."
        howToRead="Start at 100%. Each step removes a share of what is still left, so the bar shrinks toward what is still not prevented. Change the region, coverage scenario, and disease class. The 'averted births' and 'averted burden' tracks differ because newborn screening treats disease rather than preventing the birth."
        whatItDetermines="How far the existing toolkit actually gets under today's access — and therefore how much headroom there is to prevent more by SCALING the same tools."
      />

      <TwoResidualsCallout data={data} update={update} region={region!} cls={cls} scenario={scenario!} />

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
            { value: 'birth', label: 'Averted births' },
            { value: 'burden', label: 'Averted burden (+NBS)' },
          ]}
          onChange={(v) => update({ track: v })}
        />
        <div className="pb-1">
          <Toggle label="PND counts" checked={pndOn} onChange={(v) => update({ pnd: v ? 'on' : 'off' })} />
        </div>
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
            colors={TOOL_COLOR}
          />
        </div>

        <div className="mt-3">
          <label htmlFor="cov" className="flex flex-col gap-1 text-sm">
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
        </div>

        <ShowDataToggle
          caption="Prevention waterfall values"
          columns={[
            { key: 'stage', header: 'Stage' },
            { key: 'averted', header: 'Averted fraction (median)', align: 'right' },
            { key: 'ci', header: '95% CrI', align: 'right' },
          ]}
          rows={[
            { stage: 'Baseline', averted: '100%', ci: '—' },
            ...tools.map((t) => ({
              stage: `− ${t}`,
              averted: fmtPct(avertedMap[t].median * scale, 2),
              ci: `${fmtPct(avertedMap[t].ci95[0], 2)}–${fmtPct(avertedMap[t].ci95[1], 2)}`,
            })),
            {
              stage: 'Not prevented (coverage gap)',
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
          <CountCard label="Not-prevented births / yr (coverage gap)" stat={leaf.residual_birth_count} />
          <CountCard
            label="PND counts toward births"
            valueOverride={pndOn ? 'Yes' : 'No'}
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Averted birth counts by tool</caption>
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th scope="col" className="px-3 py-2 text-left font-medium">Tool</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Averted births / yr (median)</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">95% CrI</th>
              </tr>
            </thead>
            <tbody>
              {(['CS', 'PGT', 'PND', 'NBS'] as ToolKey[]).map((t) => {
                const s = leaf.averted_birth_count[t];
                return (
                  <tr key={t} className="border-b border-slate-100">
                    <td className="px-3 py-1.5">
                      {t}
                      {t === 'NBS' && (
                        <span className="ml-2 text-xs text-slate-500">(0 by design — mitigates burden, not births)</span>
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
        NBS averts burden, not births — its averted-birth fraction is 0 by design and it appears
        only in the burden track. Coverage and effectiveness for the chosen scenario are already
        baked into the fractions; the app does not recompute them.
      </p>
    </div>
  );
}

// Names the two very different "residuals" so the ~65% coverage gap here is never read as the
// ~1.7% editing-only residual on the Overview/Residual tabs.
function TwoResidualsCallout({
  data,
  update,
  region,
  cls,
  scenario,
}: {
  data: AllData;
  update: (patch: UrlState) => void;
  region: string;
  cls: DiseaseClass;
  scenario: string;
}) {
  const leaf = data.prevention[region]?.[scenario]?.[cls]?.['pnd_on'];
  const coverageGap = leaf ? leaf.residual_birth_fraction.median : undefined;
  const editingShare = data.summary.uniquely_editable_share_of_serious.permissive.median;

  return (
    <Card className="border-amber-300 bg-amber-50/50">
      <h3 className="text-sm font-semibold text-slate-900">
        Two different “residuals” — don't confuse them
      </h3>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded border border-amber-200 bg-white p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
            Not yet prevented at this coverage
          </p>
          <p className="tnum mt-1 text-2xl font-bold text-slate-900">
            {coverageGap !== undefined ? fmtPct(coverageGap, 0) : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            The <strong>coverage / access gap</strong> — affected births the existing tools would
            prevent but don't reach today ({scenario} coverage, {region}, {cls}). This is unmet
            <em> access</em>, not unmet biology: it closes by <strong>scaling the same four
            tools</strong>, and shrinks toward the floor on the right as coverage improves.
          </p>
        </div>
        <div className="rounded border border-violet-200 bg-white p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-800">
            Uniquely needs germline editing
          </p>
          <p className="tnum mt-1 text-2xl font-bold text-slate-900">~{fmtPct(editingShare, 1)}</p>
          <p className="mt-1 text-xs text-slate-600">
            The <strong>in-principle</strong> residual — what no existing tool could reach even at
            full coverage. This is the “narrow” number on the Overview, and it does not move
            when coverage changes.{' '}
            <button
              type="button"
              onClick={() => update({ mode: 'detailed', tab: 'residual' })}
              className="font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              See the Residual tab →
            </button>
          </p>
        </div>
      </div>
    </Card>
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
  colors: Record<ToolKey, string>;
}

// Waterfall as inline SVG: start at 100%, subtract each tool's averted fraction.
function Waterfall({ steps, residual, colors }: WaterfallProps) {
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
    </svg>
  );
}
