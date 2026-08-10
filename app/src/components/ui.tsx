import { ReactNode } from 'react';

// Small sober UI primitives shared across views.

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

interface SelectProps {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}

export function Select({ id, label, value, options, onChange }: SelectProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface SegmentedProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
  ariaLabel?: string;
}

export function Segmented({ label, value, options, onChange, ariaLabel }: SegmentedProps) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <div
        role="group"
        aria-label={ariaLabel || label}
        className="inline-flex overflow-hidden rounded border border-slate-300"
      >
        {options.map((o, i) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                i > 0 ? 'border-l border-slate-300' : ''
              } ${
                active
                  ? 'bg-accent text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-400 text-accent focus:ring-accent"
      />
      <span className="font-medium text-slate-700">{label}</span>
    </label>
  );
}

export function ExportSvgButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="no-print rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      Export SVG
    </button>
  );
}
