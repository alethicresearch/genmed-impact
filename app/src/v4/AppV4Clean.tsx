import { useEffect } from 'react';
import AppV4 from './AppV4';

const HIDE_EXACT = new Set([
  'Analysis and manuscript remain under development.',
  'Or open the full analysis →',
  'Deep analysis',
  'Reader controls',
  'The whole analysis is available from the story, not somewhere else.',
  'The landing page foregrounds the argument; every underlying analytical view remains directly inspectable here. The browser loads committed, versioned outputs rather than recomputing epidemiology client-side.',
  'Each opens as a full research workspace over the same data and assumptions.',
]);

function cleanMeta(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('p, span, button, a, h2, div').forEach((el) => {
    const text = el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (HIDE_EXACT.has(text)) el.style.display = 'none';
  });

  // Remove the version/"research companion" badge as a unit, including its separator dot.
  root.querySelectorAll<HTMLElement>('div').forEach((el) => {
    const text = el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (text === 'Research companion v4') el.style.display = 'none';
  });
}

export default function AppV4Clean() {
  useEffect(() => {
    cleanMeta(document);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            cleanMeta(node);
            const text = node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
            if (HIDE_EXACT.has(text) || text === 'Research companion v4') node.style.display = 'none';
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <AppV4 />;
}
