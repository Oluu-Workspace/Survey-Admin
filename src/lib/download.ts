/** Reliable browser file download (works in Safari / strict policies). */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function downloadText(content: string, filename: string, mime: string, utf8Bom = false) {
  const body = utf8Bom ? `\uFEFF${content}` : content;
  downloadBlob(new Blob([body], { type: mime }), filename);
}

export type OpenHtmlReportResult =
  | { mode: 'window' }
  | { mode: 'download'; filename: string };

/** Open HTML report in new tab, or download .html if popups are blocked. */
export function openHtmlInNewTabOrDownload(html: string, baseFilename: string): OpenHtmlReportResult {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (w) {
    window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return { mode: 'window' };
  }
  const safe = baseFilename.replace(/[^\w.-]+/g, '_').slice(0, 80) || 'report';
  downloadBlob(blob, `${safe}.html`);
  URL.revokeObjectURL(url);
  return { mode: 'download', filename: `${safe}.html` };
}
