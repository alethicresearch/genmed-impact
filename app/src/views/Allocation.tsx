import { useRef } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AllData, Stat, fmtInt, fmtMoney, fmtCompact } from '../data';
import StatValue from '../components/StatValue';
import { Card, SectionHeading, ExportSvgButton } from '../components/ui';
import { ShowDataToggle } from '../components/DataTable';
import Explainer from '../components/Explainer';
import { exportContainerSvg } from '../svgExport';

interface Props {
  data: AllData;
}

export default function Allocation({ data }: Props) {
  const a = data.allocation;
  const svgRef = useRef<HTMLDivElement>(null);

  const costBirth = [
    { label: 'Screening — $/birth prevented', stat: a.cost_per_birth_prevented.screening_program, color: '#2563eb' },
    { label: 'Editing — $/birth prevented', stat: a.cost_per_birth_prevented.editing_program, color: '#b45309' },
  ];
  const costDaly = [
    { label: 'Screening — $/DALY averted', stat: a.cost_per_daly_averted.screening_program, color: '#2563eb' },
    { label: 'Editing — $/DALY averted', stat: a.cost_per_daly_averted.editing_program, color: '#b45309' },
  ];
  const allRows = [...costBirth, ...costDaly];

  const budgets = Object.entries(a.budget_buys);

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Scale versus frontier R&D: what different investments accomplish"
        subtitle="An exploratory comparison of what funding buys as scaled screening programs versus a germline-editing program."
      />
      <div className="rounded-lg border border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">Exploratory cost scenario — not yet a paper result.</p>
        <p className="mt-1">
          The editing-program cost basis and several other cost anchors here are provisional and
          await stronger sourcing, so the numbers below indicate rough orders of magnitude only.
          Note also a conceptual limit: broad screening infrastructure and frontier editing R&amp;D
          do not compete to prevent the same cases — screening scales across the preventable
          majority, while an editing program would serve the narrow population no other tool
          reaches. Read this as “what different investments accomplish,” not as a ranking of
          substitutes.
        </p>
      </div>
      <Explainer
        whatThisShows="What a dollar buys under each strategy: the cost to prevent one affected birth, and the cost to avert one DALY (a year of healthy life lost), for scaled screening versus an editing program."
        howToRead="Bars are on a log scale — each step is 10× — so further left is far cheaper; the whiskers are 95% uncertainty intervals. The budget panel translates this into what $1B, $5B, or $10B a year would buy each way."
        whatItDetermines="A first-pass sense of how the two kinds of investment differ in scale — to be firmed up when the provisional cost inputs are replaced with sourced anchors."
      />

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Cost-effectiveness (log scale, USD)
          </h3>
          <ExportSvgButton onClick={() => exportContainerSvg(svgRef.current, 'allocation-cost.svg')} />
        </div>
        <div ref={svgRef}>
          <LogBars rows={allRows} />
        </div>
        <ShowDataToggle
          caption="Cost-effectiveness values"
          columns={[
            { key: 'metric', header: 'Metric' },
            { key: 'median', header: 'Median (USD)', align: 'right' },
            { key: 'ci', header: '95% uncertainty interval', align: 'right' },
          ]}
          rows={allRows.map((r) => ({
            metric: r.label,
            median: fmtMoney(r.stat.median),
            ci: `${fmtMoney(r.stat.ci95[0])}–${fmtMoney(r.stat.ci95[1])}`,
          }))}
        />
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-2 text-base font-semibold text-slate-900">Cost per birth prevented</h3>
          <dl className="space-y-2">
            {costBirth.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between">
                <dt className="text-sm text-slate-600">{r.label.replace(' — $/birth prevented', '')}</dt>
                <dd className="text-lg"><StatValue stat={r.stat} kind="money" showCi /></dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card>
          <h3 className="mb-2 text-base font-semibold text-slate-900">Cost per DALY averted</h3>
          <dl className="space-y-2">
            {costDaly.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between">
                <dt className="text-sm text-slate-600">{r.label.replace(' — $/DALY averted', '')}</dt>
                <dd className="text-lg"><StatValue stat={r.stat} kind="money" showCi /></dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-base font-semibold text-slate-900">
          What an annual budget buys — births prevented / year
        </h3>
        <BudgetBars budgets={budgets} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Births prevented per year by budget and program</caption>
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th scope="col" className="px-3 py-2 text-left font-medium">Budget / yr</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Screening births prevented</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Editing births prevented</th>
                <th
                  scope="col"
                  className="px-3 py-2 text-right font-medium"
                  title="How many times more affected births the same budget prevents via screening than via editing"
                >
                  Screening ÷ editing
                </th>
              </tr>
            </thead>
            <tbody>
              {budgets.map(([budget, v]) => (
                <tr key={budget} className="border-b border-slate-100">
                  <td className="px-3 py-1.5 font-medium">{budget}</td>
                  <td className="tnum px-3 py-1.5 text-right" title={`95% uncertainty interval ${fmtInt(v.screening_births_prevented.ci95[0])}–${fmtInt(v.screening_births_prevented.ci95[1])}`}>
                    {fmtInt(v.screening_births_prevented.median)}
                  </td>
                  <td className="tnum px-3 py-1.5 text-right" title={`95% uncertainty interval ${fmtInt(v.editing_births_prevented.ci95[0])}–${fmtInt(v.editing_births_prevented.ci95[1])}`}>
                    {fmtInt(v.editing_births_prevented.median)}
                  </td>
                  <td className="tnum px-3 py-1.5 text-right text-slate-500">
                    {(v.screening_births_prevented.median / v.editing_births_prevented.median).toFixed(0)}×
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

interface Row {
  label: string;
  stat: Stat;
  color: string;
}

// Horizontal log-scale bars with CrI whiskers, inline SVG.
function LogBars({ rows }: { rows: Row[] }) {
  const W = 820;
  const rowH = 46;
  const gap = 16;
  const labelW = 250;
  const padR = 30;
  const plotL = labelW;
  const plotW = W - labelW - padR;
  const H = rows.length * (rowH + gap) + 40;

  const allVals = rows.flatMap((r) => [r.stat.ci95[0], r.stat.median, r.stat.ci95[1]]).filter((v) => v > 0);
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const lo = Math.pow(10, Math.floor(Math.log10(minV)));
  const hi = Math.pow(10, Math.ceil(Math.log10(maxV)));
  const logLo = Math.log10(lo);
  const logHi = Math.log10(hi);
  const x = (v: number) => plotL + ((Math.log10(Math.max(v, lo)) - logLo) / (logHi - logLo)) * plotW;

  const ticks: number[] = [];
  for (let e = logLo; e <= logHi + 1e-9; e++) ticks.push(Math.pow(10, e));

  return (
    <svg
      role="img"
      aria-label="Cost-effectiveness log-scale bars with uncertainty-interval whiskers"
      viewBox={`0 0 ${W} ${H}`}
      className="mt-3 w-full"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={20} y2={H - 20} stroke="#e2e8f0" />
          <text x={x(t)} y={H - 6} fontSize={10} textAnchor="middle" fill="#94a3b8">
            ${fmtCompact(t)}
          </text>
        </g>
      ))}
      {rows.map((r, i) => {
        const y = 20 + i * (rowH + gap);
        const cy = y + rowH / 2;
        const xMed = x(r.stat.median);
        const xLo = x(r.stat.ci95[0]);
        const xHi = x(r.stat.ci95[1]);
        return (
          <g key={r.label}>
            <text x={0} y={cy - 2} fontSize={12} fontWeight={600} fill="#334155">
              {r.label}
            </text>
            <text x={0} y={cy + 14} fontSize={11} fill="#64748b">
              {fmtMoney(r.stat.median)}
            </text>
            {/* bar from lo tick to median */}
            <rect x={plotL} y={cy - 9} width={Math.max(xMed - plotL, 1)} height={18} rx={2} fill={r.color} opacity={0.85} />
            {/* whisker */}
            <line x1={xLo} x2={xHi} y1={cy} y2={cy} stroke="#0f172a" strokeWidth={1.5} />
            <line x1={xLo} x2={xLo} y1={cy - 6} y2={cy + 6} stroke="#0f172a" strokeWidth={1.5} />
            <line x1={xHi} x2={xHi} y1={cy - 6} y2={cy + 6} stroke="#0f172a" strokeWidth={1.5} />
            <circle cx={xMed} cy={cy} r={3.5} fill="#0f172a" />
          </g>
        );
      })}
    </svg>
  );
}

function BudgetBars({
  budgets,
}: {
  budgets: Array<[string, { screening_births_prevented: Stat; editing_births_prevented: Stat }]>;
}) {
  const chartData = budgets.map(([budget, v]) => ({
    budget,
    Screening: Math.round(v.screening_births_prevented.median),
    Editing: Math.round(v.editing_births_prevented.median),
  }));
  return (
    <div style={{ width: '100%', height: 260 }} aria-hidden="true">
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="budget" tick={{ fontSize: 12, fill: '#475569' }} />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(v: number) => fmtCompact(v)}
            width={56}
          />
          <Tooltip
            formatter={(v: number) => fmtInt(v)}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Screening" fill="#2563eb" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Editing" fill="#b45309" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
