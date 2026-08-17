import { useState } from 'react';
import { Stat, fmtInt, fmtCompact, fmtPct, fmtMoney, crInt, crPct, crMoney } from '../data';
import { useUncertainty } from '../uncertaintyMode';

type Kind = 'int' | 'compact' | 'pct' | 'money';

interface Props {
  stat: Stat;
  kind?: Kind;
  decimals?: number;
  /** Show the CrI inline in parentheses instead of only on hover. */
  showCi?: boolean;
  className?: string;
}

function formatMedian(stat: Stat, kind: Kind, decimals: number): string {
  switch (kind) {
    case 'compact':
      return fmtCompact(stat.median);
    case 'pct':
      return fmtPct(stat.median, decimals);
    case 'money':
      return fmtMoney(stat.median);
    case 'int':
    default:
      return fmtInt(stat.median);
  }
}

function ciString(stat: Stat, kind: Kind, decimals: number): string {
  switch (kind) {
    case 'pct':
      return crPct(stat, decimals);
    case 'money':
      return crMoney(stat);
    case 'compact':
      return `95% uncertainty interval ${fmtCompact(stat.ci95[0])}–${fmtCompact(stat.ci95[1])}`;
    case 'int':
    default:
      return crInt(stat);
  }
}

function ciInline(stat: Stat, kind: Kind, decimals: number): string {
  switch (kind) {
    case 'pct':
      return `${fmtPct(stat.ci95[0], decimals)}–${fmtPct(stat.ci95[1], decimals)}`;
    case 'money':
      return `${fmtMoney(stat.ci95[0])}–${fmtMoney(stat.ci95[1])}`;
    case 'compact':
      return `${fmtCompact(stat.ci95[0])}–${fmtCompact(stat.ci95[1])}`;
    case 'int':
    default:
      return `${fmtInt(stat.ci95[0])}–${fmtInt(stat.ci95[1])}`;
  }
}

/**
 * Displays a Stat's median, with its 95% uncertainty interval alongside when the reader has
 * turned uncertainty on (or when a view pins it with `showCi` because the width is itself the
 * point). Otherwise the value is a click/tap toggle that reveals the interval on demand —
 * hover (title) works too, but is never the only way in, so touch readers get the same
 * information. The displayed number is the same in every case.
 */
export default function StatValue({
  stat,
  kind = 'int',
  decimals = 1,
  showCi = false,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const uncertaintyOn = useUncertainty();
  const median = formatMedian(stat, kind, decimals);
  const title = ciString(stat, kind, decimals);
  if (showCi || uncertaintyOn) {
    return (
      <span className={`tnum ${className}`} title={title}>
        <span className="font-semibold">{median}</span>
        <span className="ml-1 text-xs font-normal text-slate-500">
          (95% uncertainty interval {ciInline(stat, kind, decimals)})
        </span>
      </span>
    );
  }
  return (
    <span className={`tnum ${className}`} title={title}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${median} — show 95% uncertainty interval`}
        className="cursor-help rounded font-semibold underline decoration-dotted decoration-slate-400 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {median}
      </button>
      {open && (
        <span className="ml-1 text-xs font-normal text-slate-500">
          (95% uncertainty interval {ciInline(stat, kind, decimals)})
        </span>
      )}
    </span>
  );
}
