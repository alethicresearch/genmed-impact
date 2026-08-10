import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Data-source footnotes.
//
// <SourcesProvider> wraps a page. Inside it, <SourceNote source="..." doi="..." />
// renders a small superscript marker (ⓘ) that (a) shows the source on hover via the
// title attribute, (b) anchor-links to a numbered entry in the page's <SourcesList />,
// and (c) registers the source so the list can render every dataset cited on the page.
// Sources are de-duplicated by (source|doi); the marker never needs to know its number.

export interface SourceEntry {
  slug: string;
  source: string;
  doi?: string | null;
}

interface RegistryValue {
  register: (entry: SourceEntry) => void;
  entries: SourceEntry[];
}

const SourceRegistry = createContext<RegistryValue | null>(null);

// Stable, deterministic slug from the source text (+ doi) so the same citation
// always resolves to the same anchor across renders.
function slugify(source: string, doi?: string | null): string {
  const key = `${source}|${doi || ''}`;
  let h = 5381;
  for (let i = 0; i < key.length; i++) {
    h = (h * 33) ^ key.charCodeAt(i);
  }
  return 'src-' + (h >>> 0).toString(36);
}

export function SourcesProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<SourceEntry[]>([]);
  const register = useCallback((entry: SourceEntry) => {
    setEntries((prev) =>
      prev.some((e) => e.slug === entry.slug) ? prev : [...prev, entry]
    );
  }, []);
  const value = useMemo(() => ({ register, entries }), [register, entries]);
  return <SourceRegistry.Provider value={value}>{children}</SourceRegistry.Provider>;
}

// True when a DOI-ish string is a linkable URL (http…) or a bare DOI (10.…).
function doiHref(doi?: string | null): string | null {
  if (!doi) return null;
  const s = String(doi).trim();
  if (s.startsWith('http')) return s;
  if (s.startsWith('10.')) return 'https://doi.org/' + s;
  return null;
}

interface SourceNoteProps {
  source: string;
  doi?: string | null;
  /** Optional extra hover text (e.g. an incidence basis) appended to the title. */
  detail?: string;
}

export function SourceNote({ source, doi, detail }: SourceNoteProps) {
  const reg = useContext(SourceRegistry);
  const slug = slugify(source, doi);
  useEffect(() => {
    reg?.register({ slug, source, doi });
  }, [reg, slug, source, doi]);

  const title = [source, doi ? `DOI/URL: ${doi}` : null, detail]
    .filter(Boolean)
    .join(' — ');

  return (
    <sup className="ml-0.5 text-[0.7em] leading-none">
      <a
        href={`#${slug}`}
        title={title}
        aria-label={`Source: ${source}`}
        className="text-accent no-underline hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        &#9432;
      </a>
    </sup>
  );
}

// Renders the collected sources for the surrounding provider as a numbered list.
export function SourcesList({ title = 'Sources & notes' }: { title?: string }) {
  const reg = useContext(SourceRegistry);
  const entries = reg?.entries ?? [];
  if (entries.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <ol className="mt-2 space-y-1.5 text-xs text-slate-600">
        {entries.map((e, i) => {
          const href = doiHref(e.doi);
          return (
            <li key={e.slug} id={e.slug} className="scroll-mt-20">
              <span className="mr-1 font-semibold text-slate-500">{i + 1}.</span>
              {e.source}
              {href && (
                <>
                  {' '}
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {e.doi}
                  </a>
                </>
              )}
              {!href && e.doi && <span className="text-slate-400"> · {e.doi}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
