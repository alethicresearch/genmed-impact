import { ReactNode, useState } from 'react';

export interface Column {
  key: string;
  header: string;
  align?: 'left' | 'right';
}

interface Props {
  caption: string;
  columns: Column[];
  rows: Array<Record<string, ReactNode>>;
}

/**
 * A real <table> fallback for a chart. Rendered inside a <details>-style
 * toggle via ShowDataToggle below, but usable standalone.
 */
export function DataTable({ caption, columns, rows }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-slate-300 text-slate-600">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`px-3 py-2 font-medium ${
                  c.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`tnum px-3 py-1.5 ${
                    c.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A "Show data" button that toggles a DataTable fallback for the adjacent
 * chart. Every chart in the app pairs with one of these for accessibility.
 */
export function ShowDataToggle({
  caption,
  columns,
  rows,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="no-print rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {open ? 'Hide data' : 'Show data'}
      </button>
      {open && (
        <div className="mt-2 rounded border border-slate-200 bg-white p-2">
          <DataTable caption={caption} columns={columns} rows={rows} />
        </div>
      )}
    </div>
  );
}
