import { ReactNode, useState } from 'react';

// A collapsible "About this view" panel. Three short labeled parts teach the
// reader what a view shows, how to read it, and what it lets them determine.
// Placed at the top of each view under the section heading. Open by default on
// the Overview, collapsed elsewhere.

interface Props {
  /** What the view displays. */
  whatThisShows: ReactNode;
  /** How to interpret the marks/numbers on screen. */
  howToRead: ReactNode;
  /** What question the view lets the reader answer. */
  whatItDetermines: ReactNode;
  /** Start expanded (default true on Overview, false elsewhere). */
  defaultOpen?: boolean;
}

export default function Explainer({
  whatThisShows,
  howToRead,
  whatItDetermines,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/50">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-sky-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span
          aria-hidden="true"
          className={`inline-block text-xs text-sky-500 transition-transform ${
            open ? 'rotate-90' : ''
          }`}
        >
          ▶
        </span>
        About this view
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-4 px-4 pb-4 md:grid-cols-3">
          <Part label="What this shows">{whatThisShows}</Part>
          <Part label="How to read it">{howToRead}</Part>
          <Part label="What it determines">{whatItDetermines}</Part>
        </div>
      )}
    </div>
  );
}

function Part({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-700">{children}</p>
    </div>
  );
}
