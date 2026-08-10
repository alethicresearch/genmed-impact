import { useCallback, useEffect, useState } from 'react';

// URL-serializable app state. A single flat record of string keys is written
// to the query string with URLSearchParams + history.replaceState so any view
// is shareable, and hydrated back on load.

export type UrlState = Record<string, string>;

export function readUrl(): UrlState {
  const params = new URLSearchParams(window.location.search);
  const out: UrlState = {};
  params.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

export function writeUrl(state: UrlState): void {
  const params = new URLSearchParams();
  Object.entries(state).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, v);
  });
  const qs = params.toString();
  const url = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
  window.history.replaceState(null, '', url);
}

// Hook that keeps a single state record synced to the URL query string.
export function useUrlState(defaults: UrlState): [
  UrlState,
  (patch: UrlState) => void
] {
  const [state, setState] = useState<UrlState>(() => {
    const fromUrl = readUrl();
    return { ...defaults, ...fromUrl };
  });

  useEffect(() => {
    writeUrl(state);
  }, [state]);

  const update = useCallback((patch: UrlState) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  return [state, update];
}
