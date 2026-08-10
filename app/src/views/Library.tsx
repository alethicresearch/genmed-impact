import { Fragment, useMemo, useState } from 'react';
import { AllData, Disease, StatusKey, ToolKey, fmtCompact, fmtInt, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { Card, SectionHeading, Select } from '../components/ui';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';
import Explainer from '../components/Explainer';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

// Best-available ordering + colour styling for the genetic-medicine status.
const STATUS_RANK: Record<StatusKey, number> = {
  preventable_treatable: 0,
  preventable: 1,
  treatable: 2,
  detectable_only: 3,
  none: 4,
};
const STATUS_STYLE: Record<StatusKey, { cls: string; short: string }> = {
  preventable_treatable: { cls: 'bg-emerald-100 text-emerald-800', short: 'Prevent + treat' },
  preventable: { cls: 'bg-sky-100 text-sky-800', short: 'Preventable' },
  treatable: { cls: 'bg-teal-100 text-teal-800', short: 'Treatable' },
  detectable_only: { cls: 'bg-amber-100 text-amber-800', short: 'Detectable only' },
  none: { cls: 'bg-slate-200 text-slate-600', short: 'No option' },
};

// Existing post-birth treatment modality — short labels for the table. Germline editing is
// deliberately NOT here; it is a distinct kind of intervention (the residual), not a modality.
const TREATMENT_SHORT: Record<string, string> = {
  somatic_gene_cell_therapy: 'Gene/cell Rx',
  enzyme_replacement: 'ERT',
  pharmacologic: 'Drug',
  transplant: 'Transplant',
  dietary: 'Diet',
  cofactor: 'Cofactor',
  surgical: 'Surgery',
  supportive: 'Supportive',
  none: 'None',
  unknown: '—',
};

const TOOLS: ToolKey[] = ['CS', 'PGT', 'PND', 'NBS'];

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Build OMIM / Orphanet URLs only when the id is non-empty; never a broken link.
function omimHref(omim: string): string | null {
  return omim ? `https://omim.org/entry/${omim}` : null;
}
function orphanetHref(orphanet: string): string | null {
  return orphanet ? `https://www.orpha.net/en/disease/detail/${orphanet}` : null;
}

export default function Library({ data, state, update }: Props) {
  const lib = data.library;
  const rollup = lib.rollup;

  const q = state.libq || '';
  const cat = state.cat || 'all';
  const inh = state.inh || 'all';
  const sev = state.sev || 'all';
  const tool = state.tool || 'any';
  const sort =
    state.libsort === 'name' || state.libsort === 'status' ? state.libsort : 'births';
  const statusFilter = state.status || 'all';
  const txFilter = state.tx || 'all';

  const inheritances = useMemo(
    () => Array.from(new Set(lib.diseases.map((d) => d.inheritance))).sort(),
    [lib.diseases]
  );
  const severities = useMemo(
    () => Array.from(new Set(lib.diseases.map((d) => d.severity))).sort(),
    [lib.diseases]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let rows = lib.diseases.filter((d) => {
      if (cat !== 'all' && d.category !== cat) return false;
      if (inh !== 'all' && d.inheritance !== inh) return false;
      if (sev !== 'all' && d.severity !== sev) return false;
      if (statusFilter !== 'all' && d.status.status !== statusFilter) return false;
      if (txFilter !== 'all' && d.treatment.modality !== txFilter) return false;
      if (tool !== 'any') {
        if (tool === 'reproductive') {
          if (!d.addressable_by_reproductive_tool) return false;
        } else if (!d.interventions[tool as ToolKey]?.applicable) {
          return false;
        }
      }
      if (needle) {
        const hay = (
          d.name +
          ' ' +
          d.id +
          ' ' +
          d.genes.join(' ')
        ).toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    rows = rows.slice().sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'status')
        return (
          STATUS_RANK[a.status.status] - STATUS_RANK[b.status.status] ||
          b.affected_births_per_year - a.affected_births_per_year
        );
      return b.affected_births_per_year - a.affected_births_per_year;
    });
    return rows;
  }, [lib.diseases, q, cat, inh, sev, tool, statusFilter, txFilter, sort]);

  const catOptions = [
    { value: 'all', label: 'All categories' },
    ...Object.entries(lib.categories).map(([k, v]) => ({ value: k, label: v })),
  ];
  const inhOptions = [
    { value: 'all', label: 'All inheritance' },
    ...inheritances.map((v) => ({ value: v, label: titleCase(v) })),
  ];
  const sevOptions = [
    { value: 'all', label: 'All severities' },
    ...severities.map((v) => ({ value: v, label: titleCase(v) })),
  ];
  const toolOptions = [
    { value: 'any', label: 'Any / all' },
    { value: 'reproductive', label: 'Any reproductive tool' },
    { value: 'CS', label: 'Carrier screening (CS)' },
    { value: 'PGT', label: 'Embryo testing (PGT)' },
    { value: 'PND', label: 'Prenatal diagnosis (PND)' },
    { value: 'NBS', label: 'Newborn screening (NBS)' },
  ];
  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    ...lib.rollup.genetic_medicine_status.order.map((s) => ({
      value: s,
      label: lib.rollup.genetic_medicine_status.distribution[s].label,
    })),
  ];
  const txDist = lib.rollup.treatment_modalities.distribution;
  const txOptions = [
    { value: 'all', label: 'All treatment types' },
    ...lib.rollup.treatment_modalities.order
      .filter((m) => txDist[m])
      .map((m) => ({ value: m, label: txDist[m].label })),
  ];

  return (
    <SourcesProvider>
      <div className="space-y-6">
        <SectionHeading
          title="Disease Library"
          subtitle="The catalogue at the centre of the model: genetic diseases mapped to their causal genes and to the interventions that can address them. Sorted by affected births per year."
        />
        <Explainer
          whatThisShows="Every serious genetic disease in the catalogue — the gene(s) that cause it, how it is inherited, how common it is at birth, the type of existing treatment, and which reproductive tools apply."
          howToRead="Each row is one disease. Status is the best thing existing genetic medicine can do; Treatment type is the kind of existing post-birth therapy (surgery, drug, enzyme replacement, gene/cell therapy, diet…); the four right-hand columns (CS · PGT · PND · NBS) flag applicable reproductive/newborn tools. Germline editing is deliberately not a treatment type here — it is a categorically different intervention, tracked as the residual (see the Residual and Embryos tabs). Filter by treatment type to separate diseases already handled by an existing modality from those that aren't."
          whatItDetermines="How each disease is addressed today — and, by keeping editing distinct, where editing would add something existing modalities can't."
        />

        {/* Rollup strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RollupTile label="Catalogue affected births / yr">
            <span className="tnum text-2xl font-bold text-slate-900">
              {fmtCompact(rollup.total_affected_births_per_year)}
            </span>
            <span className="block text-xs text-slate-500">
              over {rollup.n_diseases} diseases (lower bound)
            </span>
          </RollupTile>
          <RollupTile label="Addressable by ≥1 reproductive tool">
            <span className="tnum text-2xl font-bold text-slate-900">
              {fmtPct(rollup.share_addressable_by_reproductive_tool, 0)}
            </span>
            <span className="block text-xs text-slate-500">
              {fmtCompact(rollup.births_addressable_by_reproductive_tool)}/yr
            </span>
          </RollupTile>
          <RollupTile label="NBS-mitigable births / yr">
            <span className="tnum text-2xl font-bold text-slate-900">
              {fmtCompact(rollup.births_nbs_mitigable)}
            </span>
            <span className="block text-xs text-slate-500">
              detectable/treatable via newborn screening
            </span>
          </RollupTile>
          <RollupTile label="By category">
            <CategoryBars
              byCategory={rollup.by_category}
              labels={lib.categories}
            />
          </RollupTile>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
            <label htmlFor="libq" className="flex flex-col gap-1 text-sm lg:col-span-1">
              <span className="font-medium text-slate-700">Search</span>
              <input
                id="libq"
                type="search"
                value={q}
                placeholder="name, gene, id…"
                onChange={(e) => update({ libq: e.target.value })}
                className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>
            <Select
              id="cat"
              label="Category"
              value={cat}
              options={catOptions}
              onChange={(v) => update({ cat: v })}
            />
            <Select
              id="inh"
              label="Inheritance"
              value={inh}
              options={inhOptions}
              onChange={(v) => update({ inh: v })}
            />
            <Select
              id="sev"
              label="Severity"
              value={sev}
              options={sevOptions}
              onChange={(v) => update({ sev: v })}
            />
            <Select
              id="tool"
              label="Addressable by"
              value={tool}
              options={toolOptions}
              onChange={(v) => update({ tool: v })}
            />
            <Select
              id="status"
              label="Genetic-medicine status"
              value={statusFilter}
              options={statusOptions}
              onChange={(v) => update({ status: v })}
            />
            <Select
              id="tx"
              label="Treatment type"
              value={txFilter}
              options={txOptions}
              onChange={(v) => update({ tx: v })}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{filtered.length}</span> of{' '}
              {lib.diseases.length} diseases
            </p>
            <Select
              id="libsort"
              label="Sort by"
              value={sort}
              options={[
                { value: 'births', label: 'Affected births (desc)' },
                { value: 'status', label: 'Genetic-medicine status' },
                { value: 'name', label: 'Name (A–Z)' },
              ]}
              onChange={(v) => update({ libsort: v })}
            />
          </div>
        </Card>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Disease library: genes, inheritance, severity, incidence and applicable
              interventions. Rows expand for detail.
            </caption>
            <thead>
              <tr className="border-b border-slate-300 text-left text-slate-600">
                <th scope="col" className="px-3 py-2 font-medium">
                  Disease
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Gene(s)
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Inheritance
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Severity
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Affected births/yr
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-center font-medium"
                  title="Genetic-medicine status: the best thing existing genetic medicine can currently do for this disease."
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-center font-medium"
                  title="Type of existing post-birth treatment for the born child. Germline editing is a distinct kind of intervention, not shown here."
                >
                  Treatment type
                </th>
                <th scope="col" className="px-3 py-2 text-center font-medium" title="Carrier screening / Embryo testing / Prenatal diagnosis / Newborn screening">
                  CS · PGT · PND · NBS
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <DiseaseRow key={d.id} d={d} categories={lib.categories} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                    No diseases match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <SourcesList title="Incidence sources" />
      </div>
    </SourcesProvider>
  );
}

function StatusBadge({ d }: { d: Disease }) {
  const st = d.status;
  const style = STATUS_STYLE[st.status];
  return (
    <span
      className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${style.cls}`}
      title={`${st.label} — the best thing existing genetic medicine can currently do for this disease.`}
    >
      {style.short}
    </span>
  );
}

function TreatmentBadge({ d }: { d: Disease }) {
  const t = d.treatment;
  const short = TREATMENT_SHORT[t.modality] ?? t.label;
  const cls = t.disease_modifying ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-500';
  return (
    <span
      className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${cls}`}
      title={`${t.label}${t.note ? ' — ' + t.note : ''}. Existing post-birth treatment type; germline editing is a distinct intervention, not shown here.`}
    >
      {short}
    </span>
  );
}

function DiseaseRow({
  d,
  categories,
}: {
  d: Disease;
  categories: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const geneLabel = categories[d.category] || titleCase(d.category);

  return (
    <Fragment>
      <tr className="border-b border-slate-100 align-top">
        <td className="px-3 py-2">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="flex items-start gap-1.5 text-left font-medium text-slate-900 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 inline-block text-xs text-slate-400 transition-transform ${
                open ? 'rotate-90' : ''
              }`}
            >
              ▶
            </span>
            <span>{d.name}</span>
          </button>
        </td>
        <td className="px-3 py-2">
          {d.genes.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {d.genes.map((g) => (
                <code
                  key={g}
                  className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700"
                >
                  {g}
                </code>
              ))}
            </span>
          ) : (
            <span className="text-xs text-slate-400" title={geneLabel}>
              — {geneLabel}
            </span>
          )}
        </td>
        <td className="px-3 py-2 text-slate-700">{titleCase(d.inheritance)}</td>
        <td className="px-3 py-2 text-slate-700">{titleCase(d.severity)}</td>
        <td className="tnum px-3 py-2 text-right text-slate-900">
          {fmtCompact(d.affected_births_per_year)}
          <SourceNote
            source={d.incidence_source}
            doi={d.incidence_doi}
            detail={`basis: ${d.incidence_basis.replace(/_/g, ' ')}`}
          />
        </td>
        <td className="px-3 py-2 text-center">
          <StatusBadge d={d} />
        </td>
        <td className="px-3 py-2 text-center">
          <TreatmentBadge d={d} />
        </td>
        <td className="px-3 py-2">
          <span className="flex items-center justify-center gap-2 font-mono text-sm">
            {TOOLS.map((t) => {
              const iv = d.interventions[t];
              const ok = iv?.applicable;
              return (
                <span
                  key={t}
                  title={`${t}: ${iv?.note || (ok ? 'applicable' : 'not applicable')}`}
                  className={ok ? 'text-emerald-600' : 'text-slate-300'}
                  aria-label={`${t} ${ok ? 'applicable' : 'not applicable'}`}
                >
                  {ok ? '✓' : '·'}
                </span>
              );
            })}
          </span>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-slate-200 bg-slate-50/60">
          <td colSpan={8} className="px-4 py-3">
            <DiseaseDetail d={d} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

function DiseaseDetail({ d }: { d: Disease }) {
  const omim = omimHref(d.omim);
  const orphanet = orphanetHref(d.orphanet);
  return (
    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
      <div className="space-y-1.5">
        <p>
          <span className="font-medium text-slate-600">OMIM: </span>
          {omim ? (
            <a
              href={omim}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              {d.omim}
            </a>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </p>
        <p>
          <span className="font-medium text-slate-600">Orphanet: </span>
          {orphanet ? (
            <a
              href={orphanet}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              {d.orphanet}
            </a>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </p>
        <p>
          <span className="font-medium text-slate-600">Onset: </span>
          <span className="text-slate-700">{titleCase(d.onset)}</span>
        </p>
        <p>
          <span className="font-medium text-slate-600">Existing treatment: </span>
          <span className="text-slate-700">
            {d.treatment.label}
            {d.treatment.note ? ` — ${d.treatment.note}` : ''}
          </span>
          <span className="block text-xs text-slate-400">
            Germline editing is a distinct kind of intervention, not an existing treatment modality.
          </span>
        </p>
        <p>
          <span className="font-medium text-slate-600">Incidence: </span>
          <span className="text-slate-700">
            {fmtInt(d.incidence_per_100k)} / 100k · {d.incidence_basis.replace(/_/g, ' ')} ·{' '}
            {d.incidence_source}
            {d.incidence_doi ? ` (${d.incidence_doi})` : ''}
          </span>
        </p>
      </div>
      <div className="space-y-1.5">
        <p className="font-medium text-slate-600">Interventions</p>
        <ul className="space-y-0.5 text-slate-700">
          {TOOLS.map((t) => {
            const iv = d.interventions[t];
            return (
              <li key={t}>
                <span className={iv?.applicable ? 'text-emerald-600' : 'text-slate-400'}>
                  {iv?.applicable ? '✓' : '·'}
                </span>{' '}
                <span className="font-mono text-xs">{t}</span> — {iv?.note || '—'}
              </li>
            );
          })}
        </ul>
        <p className="pt-1">
          <span className="font-medium text-slate-600">Editing: </span>
          <span className="text-slate-700">{d.editing_note}</span>
        </p>
        {d.notes && (
          <p>
            <span className="font-medium text-slate-600">Notes: </span>
            <span className="text-slate-700">{d.notes}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function RollupTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1">{children}</div>
    </Card>
  );
}

// Inline-SVG horizontal mini bars for the category split.
function CategoryBars({
  byCategory,
  labels,
}: {
  byCategory: Record<string, number>;
  labels: Record<string, string>;
}) {
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const rowH = 16;
  const gap = 4;
  const W = 220;
  const barX = 8;
  const barMax = W - barX - 44;
  const H = entries.length * (rowH + gap);
  const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
  return (
    <svg
      role="img"
      aria-label="Affected births by disease category"
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ maxWidth: 240 }}
    >
      {entries.map(([k, v], i) => {
        const y = i * (rowH + gap);
        const w = Math.max((v / max) * barMax, 2);
        const full = labels[k] || k;
        return (
          <g key={k}>
            <title>{`${full}: ${fmtInt(v)}/yr`}</title>
            <rect x={barX} y={y} width={w} height={rowH - 4} rx={2} fill={colors[i % colors.length]} />
            <text x={barX + w + 4} y={y + rowH - 7} fontSize={9} fill="#475569">
              {fmtCompact(v)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
