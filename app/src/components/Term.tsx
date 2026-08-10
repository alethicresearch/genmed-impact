import { ReactNode } from 'react';
import { GLOSSARY } from '../glossary';

// An inline glossary term. Renders its children with a dotted underline and
// exposes the shared plain-language definition on hover (title attribute).
// The full glossary is also rendered as a reference list in the Methods view.

interface Props {
  /** Key into GLOSSARY. Falls back to the visible text if omitted. */
  k?: string;
  children: ReactNode;
}

export default function Term({ k, children }: Props) {
  const key = k ?? (typeof children === 'string' ? children : '');
  const def = GLOSSARY[key] ?? '';
  return (
    <abbr
      title={def || undefined}
      className="cursor-help border-b border-dotted border-slate-400 no-underline"
    >
      {children}
    </abbr>
  );
}
