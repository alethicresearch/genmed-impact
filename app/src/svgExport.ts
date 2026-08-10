// Client-side SVG export: serialize a live <svg> to a downloadable .svg Blob.

export function exportSvgElement(svg: SVGSVGElement | null, filename: string): void {
  if (!svg) return;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!clone.getAttribute('xmlns:xlink')) {
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  }
  // Give it a white background so exported charts are readable.
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', '#ffffff');
  clone.insertBefore(bg, clone.firstChild);

  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + xml], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : filename + '.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Finds the first <svg> inside a container ref and exports it. Recharts renders
 * its chart as a single <svg>, so this works for our Recharts charts and for
 * hand-written inline SVGs alike.
 */
export function exportContainerSvg(
  container: HTMLElement | null,
  filename: string
): void {
  if (!container) return;
  const svg = container.querySelector('svg');
  exportSvgElement(svg as SVGSVGElement | null, filename);
}
