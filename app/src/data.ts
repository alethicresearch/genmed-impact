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

export type Tier = 'core' | 'rare';

export interface Disease {
  id: string;
  name: string;
  tier: Tier;
  confidence: 'curated' | 'automated';
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
  prevention: DiseasePrevention;
  treatment: DiseaseTreatment;
  reach: DiseaseReach;
}

export type PreventionCategory = 'preventable' | 'detectable_only' | 'not_preventable';
export type TreatmentIntent = 'curative' | 'disease_modifying' | 'palliative' | 'none';

export interface DiseasePrevention {
  category: PreventionCategory;
  label: string;
  by: ToolKey[]; // which reproductive tools apply — the "by what"
  avoidable: boolean;
  prenatal_detectable: boolean;
}

export interface DiseaseReach {
  addressable_by_existing_tools: boolean;
  editing_relevant_residual: boolean;
}

export interface DiseaseTreatment {
  modality: string;
  label: string;
  intent: TreatmentIntent;
  intent_label: string;
  intent_curated: boolean;
  disease_modifying: boolean;
  note: string | null;
}

export interface TreatmentBucket {
  label: string;
  disease_modifying: boolean;
  n_diseases: number;
  births: number;
}

export interface TreatmentModalities {
  order: string[];
  distribution: Record<string, TreatmentBucket>;
  note: string;
}

export interface AxisBucket {
  label: string;
  n_diseases: number;
  births: number;
}

export interface PreventionSummary {
  order: PreventionCategory[];
  distribution: Record<PreventionCategory, AxisBucket>;
  preventable_births: number;
  preventable_share: number;
  per_tool_births: Record<'CS' | 'PGT' | 'PND', number>;
  definition: string;
}

export interface TreatmentIntentSummary {
  order: TreatmentIntent[];
  distribution: Record<TreatmentIntent, AxisBucket>;
  n_curated: number;
  definition: string;
}

export interface ReachSummary {
  addressable_by_existing_tools_births: number;
  addressable_by_existing_tools_share: number;
  editing_relevant_residual_births: number;
  definition: string;
}

export interface TierSummary {
  n_diseases: number;
  affected_births_per_year: number;
  n_cited_incidence: number;
  cited_incidence_share_by_count: number;
  cited_incidence_share_by_births: number;
  prevention_counts: Record<PreventionCategory, number>;
  treatment_intent_counts: Record<TreatmentIntent, number>;
  n_addressable_by_existing_tools: number;
}

export interface Tiers {
  core: TierSummary;
  rare: TierSummary;
  all: TierSummary;
  note: string;
}

export interface LibraryRollup {
  n_diseases: number;
  n_diseases_all: number;
  tiers: Tiers;
  total_affected_births_per_year: number;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  births_addressable_by_reproductive_tool: number;
  share_addressable_by_reproductive_tool: number;
  births_nbs_mitigable: number;
  births_editing_unique: number;
  per_tool_addressable_births: Record<ToolKey, number>;
  prevention: PreventionSummary;
  treatment_intent: TreatmentIntentSummary;
  treatment_modalities: TreatmentModalities;
  reach: ReachSummary;
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

export interface EmbryoCurvePoint {
  u: number;
  selection_affected_discarded: number;
  selection_blastocysts: number;
  editing_affected_discarded: number;
  editing_blastocysts: number;
}

export interface Embryos {
  params: { blastocysts_per_ivf_cycle: number; live_birth_rate_per_transfer: number };
  per_inheritance: Record<
    string,
    { unaffected_embryo_fraction: number; affected_embryos_discarded_per_child: number; note: string | null }
  >;
  curve: EmbryoCurvePoint[];
  aggregate: {
    pgt_addressable_affected_births_per_year: number;
    affected_embryos_discarded_selection_strategy: number;
    affected_embryos_discarded_editing_strategy: number;
    note: string;
  };
  note: string;
}

// ---- Impact-funding opportunities (precomputed by the pipeline) ----

export type MarketKey = 'impact_now' | 'translational' | 'future';
export type Grade = 'High' | 'Moderate' | 'Low';

export interface OpportunityContributor {
  disease: string;
  disease_id: string;
  impact_per_year: number;
}

export interface Opportunity {
  id: string;
  market: MarketKey;
  kind?: 'shared_programme' | 'targeted_programme';
  title: string;
  detail?: string;
  region?: string;
  tool?: string;
  intervention?: string;
  disease?: string;
  disease_id?: string;
  outcome_unit: string;
  served_unit?: string;
  n_conditions_covered?: number;
  top_conditions?: OpportunityContributor[];
  affected_births_region_per_year?: number;
  current_coverage?: number;
  target_coverage?: number;
  coverage_gain?: number;
  attributable_fraction?: number;
  people_served?: number;
  unit_cost?: number;
  funding_requested: number;
  expected_impact_per_year: number;
  expected_impact_low?: number;
  expected_impact_high?: number;
  cost_per_outcome: number;
  evidence: Grade;
  uncertainty: Grade;
  equity: Grade;
  incidence_basis?: string;
  incidence_source?: string;
  effectiveness_source?: string | null;
  overlaps_with?: string;
  assumptions: string[];
  // research markets only
  p_technical?: number;
  p_translation?: number;
  addressable_burden_per_year?: number;
  horizon_years?: number;
}

export interface MarketSummary {
  label: string;
  question: string;
  n: number;
  funding_requested: number;
  outcome_unit: string;
  best_cost_per_outcome: number | null;
  best_cost_per_outcome_title: string | null;
  impacts_are_additive: boolean;
}

export interface Opportunities {
  meta: {
    default_pool_usd: number;
    identity: string;
    note: string;
    caveats: string[];
  };
  markets: Record<MarketKey, MarketSummary>;
  opportunities: Opportunity[];
}

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
  embryos: Embryos;
  opportunities: Opportunities;
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
    embryos,
    opportunities,
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
    getJson<Embryos>('embryos'),
    getJson<Opportunities>('opportunities'),
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
    embryos,
    opportunities,
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
  return `95% uncertainty interval ${fmtInt(s.ci95[0])}–${fmtInt(s.ci95[1])}`;
}

export function crPct(s: Stat, decimals = 1): string {
  return `95% uncertainty interval ${fmtPct(s.ci95[0], decimals)}–${fmtPct(s.ci95[1], decimals)}`;
}

export function crMoney(s: Stat): string {
  return `95% uncertainty interval ${fmtMoney(s.ci95[0])}–${fmtMoney(s.ci95[1])}`;
}
