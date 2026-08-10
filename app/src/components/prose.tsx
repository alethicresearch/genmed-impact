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
