import { ReactNode } from 'react';

// A section's opening: a lead paragraph in the reading flow, followed by two short bullets
// covering how to read the figures and what they let you conclude. Written as prose rather
// than a labelled panel, so a section reads like part of a paper.

interface Props {
  /** The lead paragraph — what this section is about. */
  whatThisShows: ReactNode;
  /** How to interpret the marks/numbers on screen. */
  howToRead: ReactNode;
  /** What question this section lets the reader answer. */
  whatItDetermines: ReactNode;
  /** Retained for compatibility; the lead is always visible. */
  defaultOpen?: boolean;
}

export default function Explainer({ whatThisShows, howToRead, whatItDetermines }: Props) {
  return (
    <div className="space-y-2.5">
      <p className="text-[15px] leading-7 text-slate-700">{whatThisShows}</p>
      <ul className="space-y-1.5">
        <Point label="Reading it">{howToRead}</Point>
        <Point label="What it tells you">{whatItDetermines}</Point>
      </ul>
    </div>
  );
}

function Point({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-[14px] leading-6 text-slate-600">
      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
      <span>
        <span className="font-medium text-slate-700">{label}. </span>
        {children}
      </span>
    </li>
  );
}
