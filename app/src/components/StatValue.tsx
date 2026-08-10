import { Stat, fmtInt, fmtCompact, fmtPct, fmtMoney, crInt, crPct, crMoney } from '../data';

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
      return `95% CrI ${fmtCompact(stat.ci95[0])}–${fmtCompact(stat.ci95[1])}`;
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
 * Displays a Stat's median with its 95% credible interval available on hover
 * (title attribute) and optionally inline.
 */
export default function StatValue({
  stat,
  kind = 'int',
  decimals = 1,
  showCi = false,
  className = '',
}: Props) {
  const median = formatMedian(stat, kind, decimals);
  const title = ciString(stat, kind, decimals);
  return (
    <span className={`tnum ${className}`} title={title}>
      <span className="font-semibold">{median}</span>
      {showCi && (
        <span className="ml-1 text-xs font-normal text-slate-500">
          (95% CrI {ciInline(stat, kind, decimals)})
        </span>
      )}
    </span>
  );
}
