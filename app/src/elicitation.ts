import { useCallback, useEffect, useState } from 'react';

/**
 * Shared state for the allocation exercise: how a visitor would spend the pool, how they weight
 * the dimensions of value, and which vantage point they are answering from.
 *
 * This is an elicitation instrument. Answers accumulate in the visitor's own browser as they
 * work; nothing leaves it unless they explicitly consent and submit, in which case the response
 * goes to the host's form handler. Exporting the record instead transmits nothing. The UI states
 * which of the two is happening, because being vague about where the data goes would be worse
 * than collecting none.
 */

const STORAGE_KEY = 'genmed-impact.elicitation.v1';

/** Vantage points a respondent might answer from. Free text is allowed via `other_detail`. */
export const RESPONDENT_TYPES = [
  { value: '', label: 'Not stated' },
  { value: 'clinician', label: 'Clinician / clinical geneticist' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'funder', label: 'Funder / grantmaker' },
  { value: 'bioethicist', label: 'Bioethicist / philosopher' },
  { value: 'patient_family', label: 'Patient, family member or advocate' },
  { value: 'policy', label: 'Policy / regulation' },
  { value: 'public', label: 'Member of the public' },
  { value: 'other', label: 'Other' },
];

export interface ElicitationState {
  respondentType: string;
  otherDetail: string;
  /** Dimension key → 0-100 slider position. Empty until the visitor changes something. */
  weights: Record<string, number>;
  /** This respondent values distant payoffs (mirrors the translational profile's inversion). */
  valuesDistantPayoffs: boolean;
  /** Opportunity id → dollars committed. */
  allocation: Record<string, number>;
}

const EMPTY: ElicitationState = {
  respondentType: '',
  otherDetail: '',
  weights: {},
  valuesDistantPayoffs: false,
  allocation: {},
};

function read(): ElicitationState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ElicitationState>;
    return {
      respondentType: parsed.respondentType ?? '',
      otherDetail: parsed.otherDetail ?? '',
      weights: parsed.weights ?? {},
      valuesDistantPayoffs: parsed.valuesDistantPayoffs ?? false,
      allocation: parsed.allocation ?? {},
    };
  } catch {
    return EMPTY;
  }
}

// One in-memory copy shared by every hook instance, so the funding view and the perspectives
// view stay in sync without threading state through the whole app.
let current: ElicitationState | null = null;
const listeners = new Set<(s: ElicitationState) => void>();

function setAll(next: ElicitationState) {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode); in-memory state still works for this session */
  }
  listeners.forEach((fn) => fn(next));
}

export function useElicitation() {
  if (current === null) current = read();
  const [state, setState] = useState<ElicitationState>(current);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const patch = useCallback((p: Partial<ElicitationState>) => {
    setAll({ ...(current as ElicitationState), ...p });
  }, []);

  const setAllocation = useCallback((id: string, amount: number) => {
    const cur = current as ElicitationState;
    const next = { ...cur.allocation };
    if (amount <= 0) delete next[id];
    else next[id] = amount;
    setAll({ ...cur, allocation: next });
  }, []);

  const clearAllocation = useCallback(() => {
    setAll({ ...(current as ElicitationState), allocation: {} });
  }, []);

  const setWeight = useCallback((dimension: string, value: number) => {
    const cur = current as ElicitationState;
    setAll({ ...cur, weights: { ...cur.weights, [dimension]: value } });
  }, []);

  const resetWeights = useCallback(() => {
    setAll({ ...(current as ElicitationState), weights: {}, valuesDistantPayoffs: false });
  }, []);

  const reset = useCallback(() => setAll(EMPTY), []);

  return { state, patch, setAllocation, clearAllocation, setWeight, resetWeights, reset };
}

/** Score an opportunity's precomputed dimension scores under a set of 0-100 slider weights. */
export function scoreWithWeights(
  dimensions: Record<string, number>,
  weights: Record<string, number>,
  invertImmediacy: boolean
): number {
  const keys = Object.keys(dimensions);
  const used = keys.map((k) => (weights[k] ?? 0));
  const total = used.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  let s = 0;
  keys.forEach((k, i) => {
    let x = dimensions[k];
    if (k === 'immediacy' && invertImmediacy) x = 1 - x;
    s += used[i] * x;
  });
  return (100 * s) / total;
}

export const FORM_NAME = 'allocation-response';

/**
 * Submit a response to Netlify Forms.
 *
 * Netlify captures a urlencoded POST to any path on the site as long as `form-name` matches a
 * form it detected at build time (the stub in index.html). There is no server code here; if the
 * site is hosted anywhere without that handler the POST will fail, which is why the caller must
 * surface the error rather than report a success it cannot verify.
 */
export async function submitResponse(fields: Record<string, string>): Promise<void> {
  const body = new URLSearchParams({ 'form-name': FORM_NAME, ...fields }).toString();
  const res = await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`Submission failed (${res.status}). Your response was not recorded.`);
  }
}

/** Flatten a response into the fields declared on the Netlify form stub. */
export function responseFields(
  state: ElicitationState,
  meta: { commit: string },
  allocationDetail: { id: string; title: string; market: string; amount_usd: number }[]
): Record<string, string> {
  return {
    respondent_type: state.respondentType || 'not_stated',
    respondent_other: state.respondentType === 'other' ? state.otherDetail : '',
    consent: 'yes',
    pipeline_commit: meta.commit,
    total_committed_usd: String(
      allocationDetail.reduce((a, b) => a + b.amount_usd, 0)
    ),
    values_distant_payoffs: String(state.valuesDistantPayoffs),
    weights_json: JSON.stringify(state.weights),
    allocation_json: JSON.stringify(allocationDetail),
  };
}

/** The exportable record. Includes provenance so a response is interpretable later. */
export function buildResponse(
  state: ElicitationState,
  meta: { commit: string; poolUsd: number },
  allocationDetail: { id: string; title: string; market: string; amount_usd: number }[]
) {
  return {
    instrument: 'genmed-impact allocation elicitation',
    version: 1,
    recorded_at: new Date().toISOString(),
    pipeline_commit: meta.commit,
    respondent: {
      type: state.respondentType || null,
      other_detail: state.respondentType === 'other' ? state.otherDetail || null : null,
    },
    weights: Object.keys(state.weights).length ? state.weights : null,
    values_distant_payoffs: state.valuesDistantPayoffs,
    pool_usd: meta.poolUsd,
    total_committed_usd: allocationDetail.reduce((a, b) => a + b.amount_usd, 0),
    allocation: allocationDetail,
    note:
      'Recorded in the respondent’s own browser. Exporting this record does not transmit it; ' +
      'it is sent only if the respondent consents and submits.',
  };
}
