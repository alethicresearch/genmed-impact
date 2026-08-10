// Typed fetch layer + data-contract types.
// This module NEVER computes epidemiology. It loads precomputed JSON and
// exposes it with types. The only arithmetic anywhere in the app is display
// recombination of already-computed medians (e.g. deriving a share for a bar).

export interface Stat {
  median: number;
  mean: number;
  ci95: [number, number];
}

export interface Meta {
  n_draws: number;
  seed: number;
  commit: string;
  spec_version: string;
  default_assumptions: {
    severity: string;
    attribution: string;
    scenario: string;
    pnd_counts: boolean;
  };
}

export interface BurdenBlock {
  monogenic: Stat;
  multifactorial: Stat;
  total_serious: Stat;
  monogenic_share_of_serious: Stat;
  multifactorial_share_of_serious: Stat;
  serious_share_of_births: Stat;
}

export interface StrictPermissive {
  strict: Stat;
  permissive: Stat;
}

export interface Summary {
  meta: Meta;
  births_per_year: Stat;
  burden_default: BurdenBlock;
  uniquely_editable_total: StrictPermissive;
  uniquely_editable_share_of_serious: StrictPermissive;
  addressable_share_of_serious: StrictPermissive;
  s1_total: Stat;
  s2: StrictPermissive;
}

export interface BurdenGridCell {
  monogenic: Stat;
  multifactorial: Stat;
  total_serious: Stat;
  serious_share_of_births: Stat;
}

export type SeverityDef = 'def_a' | 'def_b' | 'def_c';
export type Attribution = 'inclusive' | 'heritability_weighted' | 'exclusive';

export interface Burden {
  default: BurdenBlock & { serious_share_of_births: Stat };
  grid: Record<SeverityDef, Record<Attribution, BurdenGridCell>>;
}

export type ContestedKey = 'with_contested' | 'without_contested';

export interface ContestedVariant {
  s1_total: Stat;
  uniquely_editable_total: StrictPermissive;
  uniquely_editable_share_of_serious: StrictPermissive;
  addressable_share_of_serious: StrictPermissive;
}

export interface Residual {
  s1_total: Stat;
  s1_total_without_contested: Stat;
  s1_contested_delta: Stat;
  contested_conditions: string[];
  s1_by_condition: Record<string, Stat & { contested?: boolean }>;
  s1_by_region: Record<string, Record<ContestedKey, Stat>>;
  s1_by_region_note: string;
  s2: StrictPermissive;
  uniquely_editable_total: StrictPermissive;
  uniquely_editable_share_of_serious: StrictPermissive;
  uniquely_editable_share_of_births: StrictPermissive;
  addressable_share_of_serious: StrictPermissive;
  by_contested: Record<ContestedKey, ContestedVariant>;
}

export type ToolKey = 'CS' | 'PGT' | 'PND' | 'NBS';

export interface PreventionLeaf {
  averted_birth_fraction: Record<ToolKey, Stat>;
  averted_burden_fraction: Record<ToolKey, Stat>;
  residual_birth_fraction: Stat;
  residual_burden_fraction: Stat;
  total_averted_birth_fraction: Stat;
  total_averted_burden_fraction: Stat;
  averted_birth_count: Record<ToolKey, Stat>;
  residual_birth_count: Stat;
  class_births: Stat;
}

export type DiseaseClass = 'monogenic' | 'multifactorial';
export type PndKey = 'pnd_on' | 'pnd_off';

export type Prevention = Record<
  string,
  Record<string, Record<DiseaseClass, Record<PndKey, PreventionLeaf>>>
>;

export interface Resistance {
  hiv: {
    vertical_infections_per_year: Stat;
    residual_after_pmtct: Stat;
    note: string;
  };
  cardiovascular: { note: string };
  neurodegeneration: { computable: false; note: string };
}

export interface Allocation {
  cost_per_birth_prevented: { screening_program: Stat; editing_program: Stat };
  cost_per_daly_averted: { screening_program: Stat; editing_program: Stat };
  budget_buys: Record<
    string,
    { screening_births_prevented: Stat; editing_births_prevented: Stat }
  >;
}

export interface TornadoRow {
  parameter: string;
  low: number;
  high: number;
  base: number;
  detail: string;
}

export interface Sensitivity {
  tornado: TornadoRow[];
}

export interface ProvenanceLeaf {
  value?: number | string;
  low?: number;
  high?: number;
  source?: string;
  doi?: string;
  table_or_page?: string;
  retrieved?: string;
  note?: string;
  [k: string]: unknown;
}

export interface Provenance {
  constants: Record<string, unknown>;
  conditions: Record<string, unknown>;
  regions: Record<string, unknown>;
}

// ---- Disease Library (precomputed seed catalogue) ----

export type IncidenceBasis = 'cited' | 'textbook_estimate' | 'order_of_magnitude';

export interface Intervention {
  applicable: boolean;
  note: string;
}

export interface Disease {
  id: string;
  name: string;
  category: string;
  genes: string[];
  inheritance: string;
  omim: string;
  orphanet: string;
  severity: string;
  onset: string;
  incidence_per_100k: number;
  incidence_basis: IncidenceBasis;
  incidence_source: string;
  incidence_doi: string | null;
  affected_births_per_year: number;
  interventions: Record<ToolKey, Intervention>;
  addressable_by_reproductive_tool: boolean;
  nbs_mitigable: boolean;
  editing_unique: boolean;
  editing_note: string;
  notes: string | null;
  status: DiseaseStatus;
}

export type StatusKey =
  | 'preventable_treatable'
  | 'preventable'
  | 'treatable'
  | 'detectable_only'
  | 'none';

export interface DiseaseStatus {
  status: StatusKey;
  label: string;
  preventable: boolean;
  treatable: boolean;
  prenatal_detectable: boolean;
  addressable: boolean;
}

export interface StatusBucket {
  label: string;
  n_diseases: number;
  births: number;
}

export interface GeneticMedicineStatus {
  order: StatusKey[];
  distribution: Record<StatusKey, StatusBucket>;
  addressable_by_existing_tools_births: number;
  addressable_by_existing_tools_share: number;
  definition: string;
}

export interface LibraryRollup {
  n_diseases: number;
  total_affected_births_per_year: number;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  births_addressable_by_reproductive_tool: number;
  share_addressable_by_reproductive_tool: number;
  births_nbs_mitigable: number;
  births_editing_unique: number;
  per_tool_addressable_births: Record<ToolKey, number>;
  genetic_medicine_status: GeneticMedicineStatus;
  cited_incidence_share: number;
  note: string;
}

export interface Library {
  meta: { incidence_unit: string; retrieved: string; note: string };
  categories: Record<string, string>;
  diseases: Disease[];
  rollup: LibraryRollup;
}

// ---- Multifactorial viability (precomputed liability-threshold results) ----

export type PolygenicityClass =
  | 'oligogenic'
  | 'intermediate'
  | 'highly_polygenic'
  | 'massively_polygenic';

export type Verdict =
  | 'viable'
  | 'marginal'
  | 'not_viable'
  | 'not_recommended_pleiotropy';

export interface InterventionResult {
  delta: number;
  rrr: number;
  verdict: Verdict;
}

export interface MfScenario {
  label: string;
  n_embryos: number;
  n_edits: number;
  selection: InterventionResult;
  editing: InterventionResult;
}

export interface MfDisease {
  id: string;
  name: string;
  polygenicity_class: PolygenicityClass;
  heritability: number;
  lifetime_prevalence: number;
  prs_r2: number;
  oligo_editable_h2: number;
  effective_loci: number | null;
  pleiotropy_caution: boolean;
  notes: string | null;
  sources: {
    heritability: string | null;
    prs_r2: string | null;
    oligo_editable_h2: string | null;
  };
  scenarios: {
    present: MfScenario;
    near_future: MfScenario;
  };
}

export interface MfFrontierCell {
  selection_viable: number;
  selection_viable_or_marginal: number;
  editing_viable: number;
}

export interface Multifactorial {
  meta: { liability_note: string; retrieved: string };
  n_diseases: number;
  tech_scenarios: {
    present: { label: string };
    near_future: { label: string };
  };
  viability_thresholds: { viable: number; marginal: number };
  diseases: MfDisease[];
  frontier: { present: MfFrontierCell; near_future: MfFrontierCell };
  note: string;
}

export type MfScenarioKey = 'present' | 'near_future';

export interface AllData {
  meta: Meta;
  summary: Summary;
  burden: Burden;
  residual: Residual;
  prevention: Prevention;
  resistance: Resistance;
  allocation: Allocation;
  sensitivity: Sensitivity;
  provenance: Provenance;
  library: Library;
  multifactorial: Multifactorial;
}

// BASE_URL is set by Vite; with base:'./' it resolves relative to the page.
function dataUrl(name: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const sep = base.endsWith('/') ? '' : '/';
  return `${base}${sep}data/${name}.json`;
}

async function getJson<T>(name: string): Promise<T> {
  const res = await fetch(dataUrl(name));
  if (!res.ok) {
    throw new Error(`Failed to load ${name}.json (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function loadAll(): Promise<AllData> {
  const [
    meta,
    summary,
    burden,
    residual,
    prevention,
    resistance,
    allocation,
    sensitivity,
    provenance,
    library,
    multifactorial,
  ] = await Promise.all([
    getJson<Meta>('meta'),
    getJson<Summary>('summary'),
    getJson<Burden>('burden'),
    getJson<Residual>('residual'),
    getJson<Prevention>('prevention'),
    getJson<Resistance>('resistance'),
    getJson<Allocation>('allocation'),
    getJson<Sensitivity>('sensitivity'),
    getJson<Provenance>('provenance'),
    getJson<Library>('library'),
    getJson<Multifactorial>('multifactorial'),
  ]);
  return {
    meta,
    summary,
    burden,
    residual,
    prevention,
    resistance,
    allocation,
    sensitivity,
    provenance,
    library,
    multifactorial,
  };
}

// ---- Formatting helpers (display only) ----

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function fmtCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return fmtInt(n);
}

export function fmtPct(frac: number, decimals = 1): string {
  return (frac * 100).toFixed(decimals) + '%';
}

export function fmtMoney(n: number): string {
  return '$' + fmtInt(n);
}

// Compact interval string for hover/inline CrI display.
export function crInt(s: Stat): string {
  return `95% CrI ${fmtInt(s.ci95[0])}–${fmtInt(s.ci95[1])}`;
}

export function crPct(s: Stat, decimals = 1): string {
  return `95% CrI ${fmtPct(s.ci95[0], decimals)}–${fmtPct(s.ci95[1], decimals)}`;
}

export function crMoney(s: Stat): string {
  return `95% CrI ${fmtMoney(s.ci95[0])}–${fmtMoney(s.ci95[1])}`;
}
