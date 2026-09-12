import { ReactNode, useEffect, useId, useRef, useState } from 'react';
import { GLOSSARY } from '../glossary';

// An inline glossary term. The definition must be reachable without a mouse: hovering shows it
// (title), and clicking or tapping reveals it inline, so touch and keyboard readers get the same
// explanation. The full glossary is also rendered as a reference list in the Methods view.

interface Props {
  /** Key into GLOSSARY. Falls back to the visible text if omitted. */
  k?: string;
  children: ReactNode;
}

export default function Term({ k, children }: Props) {
  const key = k ?? (typeof children === 'string' ? children : '');
  const def = GLOSSARY[key] ?? '';
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (!def) return <>{children}</>;

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        title={def}
        className="cursor-help border-b border-dotted border-slate-400 text-left font-[inherit] text-[inherit] leading-[inherit] hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {children}
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-0 top-full z-40 mt-1 block w-64 rounded-md border border-slate-200 bg-white p-2.5 text-xs font-normal leading-5 text-slate-700 shadow-lg"
        >
          {def}
        </span>
      )}
    </span>
  );
}
