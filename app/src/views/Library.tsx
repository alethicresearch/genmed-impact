import { Fragment, useMemo, useState } from 'react';
import {
  AllData,
  Disease,
  PreventionCategory,
  TreatmentIntent,
  ToolKey,
  fmtCompact,
  fmtInt,
  fmtPct,
} from '../data';
import { UrlState } from '../urlState';
import { Card, SectionHeading, Select } from '../components/ui';
import { SourceNote, SourcesProvider, SourcesList } from '../components/SourceNote';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

// AXIS 1 — Prevention (before birth), by which tool.
const PREVENTION_STYLE: Record<PreventionCategory, { cls: string; short: string }> = {
  preventable: { cls: 'bg-emerald-100 text-emerald-800', short: 'Preventable' },
  detectable_only: { cls: 'bg-amber-100 text-amber-800', short: 'Detectable only' },
  not_preventable: { cls: 'bg-slate-200 text-slate-600', short: 'Not preventable' },
};
// AXIS 2 — Treatment intent (the end it serves).
const INTENT_STYLE: Record<TreatmentIntent, { cls: string; short: string }> = {
  curative: { cls: 'bg-emerald-100 text-emerald-800', short: 'Curative' },
  disease_modifying: { cls: 'bg-sky-100 text-sky-800', short: 'Disease-modifying' },
  palliative: { cls: 'bg-amber-100 text-amber-800', short: 'Palliative' },
  none: { cls: 'bg-slate-200 text-slate-600', short: 'No treatment' },
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
    state.libsort === 'name' || state.libsort === 'prevention' || state.libsort === 'intent'
      ? state.libsort
      : 'births';
  const prevFilter = state.prev || 'all';
  const intentFilter = state.intent || 'all';
  const txFilter = state.tx || 'all';
  // Default to the curated core so the long tail doesn't overwhelm the first interaction.
  const tierFilter = state.tier === 'rare' || state.tier === 'all' ? state.tier : 'core';

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
      if (tierFilter !== 'all' && d.tier !== tierFilter) return false;
      if (cat !== 'all' && d.category !== cat) return false;
      if (inh !== 'all' && d.inheritance !== inh) return false;
      if (sev !== 'all' && d.severity !== sev) return false;
      if (prevFilter !== 'all' && d.prevention.category !== prevFilter) return false;
      if (intentFilter !== 'all' && d.treatment.intent !== intentFilter) return false;
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
    const PREV_RANK: Record<PreventionCategory, number> = {
      preventable: 0,
      detectable_only: 1,
      not_preventable: 2,
    };
    const INTENT_RANK: Record<TreatmentIntent, number> = {
      curative: 0,
      disease_modifying: 1,
      palliative: 2,
      none: 3,
    };
    rows = rows.slice().sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'prevention')
        return (
          PREV_RANK[a.prevention.category] - PREV_RANK[b.prevention.category] ||
          b.affected_births_per_year - a.affected_births_per_year
        );
      if (sort === 'intent')
        return (
          INTENT_RANK[a.treatment.intent] - INTENT_RANK[b.treatment.intent] ||
          b.affected_births_per_year - a.affected_births_per_year
        );
      return b.affected_births_per_year - a.affected_births_per_year;
    });
    return rows;
  }, [lib.diseases, q, cat, inh, sev, tool, prevFilter, intentFilter, txFilter, tierFilter, sort]);

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
  const prevOptions = [
    { value: 'all', label: 'All (prevention)' },
    ...lib.rollup.prevention.order.map((s) => ({
      value: s,
      label: lib.rollup.prevention.distribution[s].label,
    })),
  ];
  const intentOptions = [
    { value: 'all', label: 'All (treatment intent)' },
    ...lib.rollup.treatment_intent.order.map((s) => ({
      value: s,
      label: lib.rollup.treatment_intent.distribution[s].label,
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
          title="Which diseases are included, and what can medicine do for each?"
          subtitle="The disease catalogue is the condition-level evidence beneath the population estimates: genetic cause, inheritance, frequency, reproductive options, screening, and treatment."
        />
        <p className="text-sm leading-relaxed text-slate-700">
          The analysis includes a curated core used for the bottom-up burden estimates and an
          additional Orphanet-derived rare-disease tier that broadens coverage. For each
          condition, the catalogue records the available evidence about its genetic basis and
          the medical pathways that can alter the relevant outcome.
        </p>
        <p className="text-sm leading-relaxed text-slate-700">
          The rare-disease tier has undergone less manual review than the curated core. It
          should therefore be read as an expanding research catalogue rather than a complete or
          equally curated census of serious genetic disease.
        </p>

        {/* Rollup strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RollupTile label="Affected births represented in curated core / yr">
            <span className="tnum text-2xl font-bold text-slate-900">
              {fmtCompact(rollup.total_affected_births_per_year)}
            </span>
            <span className="block text-xs text-slate-500">
              over {rollup.n_diseases} core diseases (lower bound) · {rollup.n_diseases_all} in
              catalogue incl. rare tier
            </span>
          </RollupTile>
          <RollupTile label="≥1 reproductive pathway technically applicable">
            <span className="tnum text-2xl font-bold text-slate-900">
              {fmtPct(rollup.share_addressable_by_reproductive_tool, 0)}
            </span>
            <span className="block text-xs text-slate-500">
              {fmtCompact(rollup.births_addressable_by_reproductive_tool)}/yr
            </span>
          </RollupTile>
          <RollupTile label="Eligible for newborn screening + early treatment / yr">
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

        {/* Tier segment — curated core vs Orphanet-derived rare tail */}
        <TierSegment
          tiers={rollup.tiers}
          value={tierFilter}
          onChange={(v) => update({ tier: v })}
        />

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              label="Reproductive pathway"
              value={tool}
              options={toolOptions}
              onChange={(v) => update({ tool: v })}
            />
            <Select
              id="prev"
              label="Prevention"
              value={prevFilter}
              options={prevOptions}
              onChange={(v) => update({ prev: v })}
            />
            <Select
              id="intent"
              label="Treatment intent"
              value={intentFilter}
              options={intentOptions}
              onChange={(v) => update({ intent: v })}
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
              <span className="font-semibold text-slate-900">{filtered.length}</span> shown ·{' '}
              tier: <span className="font-medium">{tierFilter}</span> ({tierFilter === 'core'
                ? rollup.tiers.core.n_diseases
                : tierFilter === 'rare'
                ? rollup.tiers.rare.n_diseases
                : rollup.tiers.all.n_diseases}{' '}
              diseases)
            </p>
            <Select
              id="libsort"
              label="Sort by"
              value={sort}
              options={[
                { value: 'births', label: 'Affected births (desc)' },
                { value: 'prevention', label: 'Prevention' },
                { value: 'intent', label: 'Treatment intent' },
                { value: 'name', label: 'Name (A–Z)' },
              ]}
              onChange={(v) => update({ libsort: v })}
            />
          </div>
        </Card>

        {/* Table */}
        <p className="text-xs text-slate-500">
          Treatment intent: curative eliminates the disease; disease-modifying alters its course
          with ongoing care; palliative relieves symptoms. Rare-tier rows are rule-mapped
          pending clinical review. Germline editing is analyzed separately and appears on
          neither axis.
        </p>
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
                  title="Prevention before birth: can an affected birth be avoided (carrier screening / embryo selection), only detected prenatally, or neither?"
                >
                  Prevention
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-center font-medium"
                  title="For a child born affected: the END of the best existing treatment — curative, disease-modifying, or palliative — and its type. Germline editing is a distinct intervention, not shown here."
                >
                  Treatment
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

function PreventionBadge({ d }: { d: Disease }) {
  const p = d.prevention;
  const style = PREVENTION_STYLE[p.category];
  const by = p.by.length ? ` (${p.by.join(' · ')})` : '';
  return (
    <span
      className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${style.cls}`}
      title={`${p.label}${by ? ' — by ' + p.by.join(', ') : ''}`}
    >
      {style.short}
      {p.by.length > 0 && <span className="ml-1 font-normal opacity-70">{p.by.join('·')}</span>}
    </span>
  );
}

function TreatmentBadge({ d }: { d: Disease }) {
  const t = d.treatment;
  const style = INTENT_STYLE[t.intent];
  const modality = TREATMENT_SHORT[t.modality] ?? t.label;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${style.cls}`}
      title={`${t.intent_label}${t.intent_curated ? '' : ' (default from treatment type — pending review)'}${
        t.modality !== 'none' && t.modality !== 'unknown' ? ' · ' + t.label : ''
      }${t.note ? ' — ' + t.note : ''}. Germline editing is a distinct intervention, not shown here.`}
    >
      {style.short}
      {t.modality !== 'none' && t.modality !== 'unknown' && (
        <span className="font-normal opacity-70">· {modality}</span>
      )}
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
          {d.tier === 'rare' && (
            <span
              className="ml-1.5 inline-block rounded bg-slate-100 px-1 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wide text-slate-500"
              title="Rare-disease tier: Orphanet-derived, interventions assigned by rule (not hand-curated)."
            >
              rule-mapped
            </span>
          )}
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
          <PreventionBadge d={d} />
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
          <span className="font-medium text-slate-600">Prevention: </span>
          <span className="text-slate-700">
            {d.prevention.label}
            {d.prevention.by.length ? ` — by ${d.prevention.by.join(', ')}` : ''}
          </span>
        </p>
        <p>
          <span className="font-medium text-slate-600">Treatment (if born affected): </span>
          <span className="text-slate-700">
            <strong>{d.treatment.intent_label}</strong>
            {d.treatment.modality !== 'none' && d.treatment.modality !== 'unknown'
              ? ` — ${d.treatment.label}`
              : ''}
          </span>
          {!d.treatment.intent_curated && (
            <span className="block text-xs text-slate-400">rule-mapped intent</span>
          )}
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
      </div>
    </div>
  );
}

function TierSegment({
  tiers,
  value,
  onChange,
}: {
  tiers: AllData['library']['rollup']['tiers'];
  value: string;
  onChange: (v: string) => void;
}) {
  const opts: { key: string; label: string; n: number; sub: string }[] = [
    { key: 'core', label: 'Curated core', n: tiers.core.n_diseases, sub: 'manually reviewed' },
    { key: 'rare', label: 'Rare-disease tier', n: tiers.rare.n_diseases, sub: 'Orphanet-derived · expanding' },
    { key: 'all', label: 'All', n: tiers.all.n_diseases, sub: 'full catalogue' },
  ];
  const citedAll = tiers.all.cited_incidence_share_by_count;
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Catalogue tier</p>
          <p className="text-xs text-slate-500">
            The curated core supports bottom-up burden estimates. The Orphanet-derived tier
            broadens disease coverage and will be progressively reviewed.{' '}
            {fmtPct(citedAll, 0)} of the full catalogue rests on a cited incidence.
          </p>
        </div>
        <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
          {opts.map((o) => {
            const active = value === o.key;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => onChange(o.key)}
                className={`flex flex-col items-center px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active ? 'bg-accent text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
                title={o.sub}
              >
                <span className="font-medium">
                  {o.label} <span className="tnum opacity-80">· {o.n}</span>
                </span>
                <span className={`text-[10px] ${active ? 'text-white/80' : 'text-slate-400'}`}>
                  {o.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
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
