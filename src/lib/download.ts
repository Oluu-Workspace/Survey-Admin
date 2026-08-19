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

function printHtmlInIframe(html: string) {
  // Render the report into an offscreen iframe and trigger the browser print dialog.
  // Users can then choose "Save as PDF" from the print dialog.
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.srcdoc = html;
  document.body.appendChild(iframe);

  const cleanup = () => {
    try {
      iframe.remove();
    } catch {
      // ignore
    }
  };

  // onload is not guaranteed across all browsers with srcdoc; keep a fallback timeout.
  const tryPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Cleanup after print dialog has been opened.
      window.setTimeout(cleanup, 60_000);
    } catch {
      cleanup();
    }
  };

  iframe.onload = () => {
    window.setTimeout(tryPrint, 50);
  };
  window.setTimeout(tryPrint, 500);
}

/** Open HTML report in new tab, or download .html if popups are blocked. */
export function openHtmlInNewTabOrDownload(html: string, baseFilename: string): OpenHtmlReportResult {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (w) {
    window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return { mode: 'window' };
  }
  URL.revokeObjectURL(url);
  // Popups blocked: open print dialog instead of downloading raw HTML.
  printHtmlInIframe(html);
  return { mode: 'window' };
}
