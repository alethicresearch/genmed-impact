import { createContext, useContext, ReactNode } from 'react';
import { UrlState } from './urlState';

/**
 * How an analysis view asks to open another analysis view.
 *
 * The same views are embedded by several shells, and each routes differently: the original
 * research page keys the active view on `tab`, while the story pages open one inline and key it
 * on `open`. A view cannot know which it is inside, so it must not write the routing key itself —
 * doing so is what left every cross-view link dead outside the original page.
 */
export type GoToView = (id: string, extra?: UrlState) => void;

const ViewNavContext = createContext<GoToView | null>(null);

export function ViewNavProvider({ go, children }: { go: GoToView; children: ReactNode }) {
  return <ViewNavContext.Provider value={go}>{children}</ViewNavContext.Provider>;
}

/**
 * Returns the navigator supplied by the host shell. Falls back to `tab` routing, which is what
 * the original research page uses, so that page needs no provider and keeps working unchanged.
 */
export function useViewNav(update: (patch: UrlState) => void): GoToView {
  const provided = useContext(ViewNavContext);
  return provided ?? ((id, extra) => update({ tab: id, ...(extra ?? {}) }));
}
