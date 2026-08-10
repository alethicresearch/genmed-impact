import { ReactNode } from 'react';

// Shared typographic primitives for the prose-led "interactive paper" views.

export function Reading({ children }: { children: ReactNode }) {
  return <article className="mx-auto max-w-2xl space-y-10 pb-4">{children}</article>;
}

export function PH({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-semibold tracking-tight text-slate-900">{children}</h2>;
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-7 text-slate-700">{children}</p>;
}

export function Caption({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-5 text-slate-500">{children}</p>;
}

/**
 * A chart embedded in the reading flow: label, the figure itself, a caption, and — when the
 * chart has a fuller interactive version elsewhere — a click-through. The whole figure is the
 * affordance, so a reader can click the chart itself to go deeper.
 */
export function Figure({
  label,
  caption,
  moreLabel = 'Explore in full',
  onMore,
  children,
}: {
  label: string;
  caption?: ReactNode;
  moreLabel?: string;
  onMore?: () => void;
  children: ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <figcaption className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </figcaption>
        {onMore && (
          <span className="whitespace-nowrap text-xs font-medium text-accent group-hover:underline">
            {moreLabel} →
          </span>
        )}
      </div>
      <div className="mt-2">{children}</div>
      {caption && <p className="mt-2 text-xs leading-5 text-slate-500">{caption}</p>}
    </>
  );

  if (!onMore) {
    return (
      <figure className="rounded-lg border border-slate-200 bg-white p-4">{body}</figure>
    );
  }
  return (
    <figure
      className="group rounded-lg border border-slate-200 bg-white p-4 transition hover:border-accent focus-within:border-accent"
      role="group"
    >
      {body}
      <button
        type="button"
        onClick={onMore}
        className="mt-3 w-full rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {moreLabel} →
      </button>
    </figure>
  );
}
