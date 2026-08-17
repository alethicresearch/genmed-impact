import { createContext, useContext, ReactNode } from 'react';

/**
 * Whether uncertainty intervals are shown alongside every figure.
 *
 * This is presentational only. The numbers are identical either way — the same Monte-Carlo
 * medians — so turning it off can never put a second set of figures on the page. Off by
 * default: a reader meeting the argument for the first time gets the estimates, and turns on
 * the intervals when they want to interrogate them.
 */
const UncertaintyContext = createContext(false);

export function UncertaintyProvider({ on, children }: { on: boolean; children: ReactNode }) {
  return <UncertaintyContext.Provider value={on}>{children}</UncertaintyContext.Provider>;
}

export function useUncertainty(): boolean {
  return useContext(UncertaintyContext);
}

/** Renders its children only when the reader has asked for uncertainty. */
export function WhenUncertain({ children }: { children: ReactNode }) {
  return useUncertainty() ? <>{children}</> : null;
}
