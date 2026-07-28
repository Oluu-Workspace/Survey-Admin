import type { SurveyQuestion } from './questions';
import { downloadText, openHtmlInNewTabOrDownload, type OpenHtmlReportResult } from './download';

export type ResponseLike = {
  id: string;
  agent_id: string;
  status?: string;
  created_at?: string;
  submitted_at?: string;
  location?: { ward?: string; village?: string };
  answers?: Record<string, unknown>;
  respondent?: { name?: string; phone_number?: string; phoneNumber?: string };
  respondent_code?: string;
  duration_seconds?: number;
  gps_accuracy_m?: number;
  validation_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
};

const EXCLUDED = new Set(['flagged', 'rejected', 'invalid', 'duplicate']);

export function isExcluded(r: ResponseLike) {
  return EXCLUDED.has((r.status || '').toLowerCase());
}

export function respondentCode(r: ResponseLike, index: number) {
  if (r.respondent_code) return r.respondent_code;
  // Prefer anonymized code — never surface name/phone in reports
  const hash = r.id?.slice(0, 4)?.toUpperCase() || String(index + 1).padStart(4, '0');
  return `R-${hash}`;
}

export function analyticsBundle(
  questions: SurveyQuestion[],
  responses: ResponseLike[],
  agentName: (id: string) => string,
) {
  const excluded = responses.filter(isExcluded);
  const included = responses.filter((r) => !isExcluded(r));
  const today = new Date().toDateString();
  const todayCount = included.filter(
    (r) => new Date(r.created_at || r.submitted_at || 0).toDateString() === today,
  ).length;

  const approved = included.filter((r) =>
    ['approved', 'validated', 'submitted'].includes((r.status || 'submitted').toLowerCase()),
  ).length;
  const flagged = excluded.length;

  // Completion: share of required questions answered across included
  const required = questions.filter((q) => q.required);
  let answeredRequired = 0;
  let requiredSlots = 0;
  for (const r of included) {
    for (const q of required) {
      requiredSlots += 1;
      const val = r.answers?.[q.id];
      if (val !== undefined && val !== null && String(val).trim() !== '') answeredRequired += 1;
    }
  }
  const completionRate = requiredSlots ? Math.round((answeredRequired / requiredSlots) * 100) : 100;

  const durations = included
    .map((r) => r.duration_seconds)
    .filter((d): d is number => typeof d === 'number' && d > 0);
  const avgDuration = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  const gpsOutliers = included.filter(
    (r) => typeof r.gps_accuracy_m === 'number' && r.gps_accuracy_m > 50,
  ).length;

  const byVillage: Record<string, number> = {};
  const byWard: Record<string, number> = {};
  const byAgent: Record<string, { count: number; flagged: number }> = {};

  for (const r of responses) {
    const ward = r.location?.ward || 'Unknown ward';
    const village = r.location?.village || 'Unknown village';
    if (!byAgent[r.agent_id]) byAgent[r.agent_id] = { count: 0, flagged: 0 };
    if (isExcluded(r)) {
      byAgent[r.agent_id].flagged += 1;
    } else {
      byWard[ward] = (byWard[ward] || 0) + 1;
      byVillage[village] = (byVillage[village] || 0) + 1;
      byAgent[r.agent_id].count += 1;
    }
  }

  const perQuestion = questions.map((q) => {
    const values = included
      .map((r) => r.answers?.[q.id])
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== '');

    if (q.type === 'number') {
      const nums = values.map(Number).filter((n) => !Number.isNaN(n));
      const bins: Record<string, number> = {};
      if (nums.length) {
        const lo = Math.min(...nums);
        const hi = Math.max(...nums);
        if (hi === lo) {
          bins[String(Math.round(lo))] = nums.length;
        } else {
          const step = (hi - lo) / 5;
          const labels: { a: number; b: number; lab: string }[] = [];
          for (let i = 0; i < 5; i++) {
            const a = lo + i * step;
            const b = i === 4 ? hi : lo + (i + 1) * step;
            labels.push({
              a,
              b,
              lab: `${Math.round(a).toLocaleString()}–${Math.round(b).toLocaleString()}`,
            });
          }
          for (const n of nums) {
            let placed = false;
            for (let i = 0; i < labels.length; i++) {
              const { a, b, lab } = labels[i];
              if ((n >= a && n < b) || (i === labels.length - 1 && n <= b)) {
                bins[lab] = (bins[lab] || 0) + 1;
                placed = true;
                break;
              }
            }
            if (!placed) bins.Other = (bins.Other || 0) + 1;
          }
        }
      }
      const binTotal = Object.values(bins).reduce((a, b) => a + b, 0) || 1;
      const sorted = [...nums].sort((a, b) => a - b);
      return {
        id: q.id,
        label: q.label,
        type: q.type,
        kind: 'number' as const,
        chart: 'histogram' as const,
        count: nums.length,
        min: nums.length ? Math.min(...nums) : null,
        max: nums.length ? Math.max(...nums) : null,
        mean: nums.length
          ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
          : null,
        median: nums.length ? sorted[Math.floor(sorted.length / 2)] : null,
        distribution: Object.entries(bins).map(([option, count]) => ({
          option,
          count,
          pct: Math.round((count / binTotal) * 100),
        })),
      };
    }

    if (
      q.type === 'single_choice' ||
      q.type === 'multiple_choice' ||
      q.type === 'yes_no'
    ) {
      const dist: Record<string, number> = {};
      for (const v of values) {
        const parts = Array.isArray(v) ? v : [v];
        for (const p of parts) {
          const key = String(p);
          dist[key] = (dist[key] || 0) + 1;
        }
      }
      const ordered: [string, number][] = [];
      for (const opt of q.options || []) {
        if (opt in dist) {
          ordered.push([opt, dist[opt]]);
          delete dist[opt];
        }
      }
      for (const [k, c] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
        ordered.push([k, c]);
      }
      const total = ordered.reduce((a, [, c]) => a + c, 0) || 1;
      return {
        id: q.id,
        label: q.label,
        type: q.type,
        kind: 'choice' as const,
        chart: (ordered.length <= 5 ? 'donut' : 'bar') as const,
        count: values.length,
        distribution: ordered.map(([option, count]) => ({
          option,
          count,
          pct: Math.round((count / total) * 100),
        })),
      };
    }

    return {
      id: q.id,
      label: q.label,
      type: q.type,
      kind: 'text' as const,
      chart: 'none' as const,
      count: values.length,
      distribution: [],
    };
  });

  return {
    totalIncluded: included.length,
    totalExcluded: excluded.length,
    todayCount,
    approved,
    flagged,
    completionRate,
    avgDuration,
    gpsOutliers,
    byVillage,
    byWard,
    byAgent: Object.entries(byAgent).map(([id, v]) => ({
      id,
      name: agentName(id),
      count: v.count,
      flagged: v.flagged,
      flagRate: v.count + v.flagged ? Math.round((v.flagged / (v.count + v.flagged)) * 100) : 0,
    })),
    perQuestion,
    exclusionNote: `${excluded.length} submission(s) excluded from totals (flagged, invalid, or duplicate).`,
  };
}

export function openPrintableReport(opts: {
  surveyTitle: string;
  area: string;
  generatedAt: string;
  bundle: ReturnType<typeof analyticsBundle>;
  executiveSummary?: string[];
  conclusions?: string[];
  questionInsights?: Record<string, string>;
}): OpenHtmlReportResult {
  const { surveyTitle, area, generatedAt, bundle, executiveSummary, conclusions, questionInsights } =
    opts;
  const bars = (items: { option: string; count: number; pct: number }[]) =>
    items
      .map(
        (i) =>
          `<div class="bar-row"><div class="bar-label"><span>${escapeHtml(i.option)}</span><span class="mono">${i.count} (${i.pct}%)</span></div><div class="bar-track"><div class="bar-fill" style="width:${i.pct}%"></div></div></div>`,
      )
      .join('');

  const palette = ['#1B4D3E', '#3D6B5C', '#A67C52', '#2C4A6E', '#8B3A2F', '#5A6B7D'];
  const donut = (items: { option: string; count: number; pct: number }[]) => {
    let cursor = 0;
    const segments = items.map((item, index) => {
      const start = cursor;
      cursor += item.pct;
      return `${palette[index % palette.length]} ${start}% ${cursor}%`;
    });
    const legend = items
      .map(
        (item, index) =>
          `<div class="legend-row"><span class="swatch" style="background:${palette[index % palette.length]}"></span><span>${escapeHtml(item.option)}</span><span class="mono">${item.count} (${item.pct}%)</span></div>`,
      )
      .join('');
    const total = items.reduce((sum, item) => sum + item.count, 0);
    return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${segments.join(',')})"><div class="donut-hole"><strong class="mono">${total}</strong><span>answers</span></div></div><div class="legend">${legend}</div></div>`;
  };

  const rankedBars = (record: Record<string, number>) => {
    const entries = Object.entries(record).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
    return bars(
      entries.map(([option, count]) => ({
        option,
        count,
        pct: Math.round((count / total) * 100),
      })),
    );
  };

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(surveyTitle)} — Report</title>
<style>
  @page { margin: 18mm; }
  body { font-family: "Source Sans 3", system-ui, sans-serif; color: #1A2838; font-size: 12px; }
  h1 { font-family: "Instrument Sans", sans-serif; font-size: 22px; margin: 0 0 4px; }
  h2 { font-family: "Instrument Sans", sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; margin: 24px 0 8px; border-bottom: 1px solid #D3DAE3; padding-bottom: 4px; }
  h3 { font-family: "Instrument Sans", sans-serif; font-size: 12px; margin: 0 0 4px; }
  .meta { color: #5A6B7D; font-size: 11px; }
  .mono { font-family: "IBM Plex Mono", monospace; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .cell { border: 1px solid #D3DAE3; padding: 10px; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #5A6B7D; }
  .val { font-family: "IBM Plex Mono", monospace; font-size: 22px; margin-top: 4px; }
  .question { border: 1px solid #D3DAE3; padding: 12px; margin: 0 0 12px; break-inside: avoid; }
  .bar-row { margin: 7px 0; }
  .bar-label { display: flex; justify-content: space-between; gap: 12px; font-size: 10px; margin-bottom: 2px; }
  .bar-track { background: #E8EDF2; height: 9px; overflow: hidden; }
  .bar-fill { background: #1B4D3E; height: 100%; }
  .donut-wrap { display: flex; align-items: center; gap: 18px; margin-top: 10px; }
  .donut { width: 116px; height: 116px; border-radius: 50%; display: grid; place-items: center; flex: 0 0 auto; }
  .donut-hole { width: 64px; height: 64px; border-radius: 50%; background: #FFF; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .donut-hole strong { font-size: 17px; }
  .donut-hole span { color: #5A6B7D; font-size: 9px; }
  .legend { flex: 1; }
  .legend-row { display: grid; grid-template-columns: 9px 1fr auto; align-items: center; gap: 6px; margin: 5px 0; font-size: 10px; }
  .swatch { width: 8px; height: 8px; }
  .stats { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .stats th, .stats td { border: 1px solid #D3DAE3; padding: 6px 8px; text-align: left; }
  .stats th { background: #EEF2F5; color: #5A6B7D; font-size: 9px; text-transform: uppercase; letter-spacing: .04em; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; break-inside: avoid; }
  .note { padding: 8px 10px; background: #EEF2F5; border-left: 3px solid #1B4D3E; color: #5A6B7D; }
  @media print { .noprint { display: none; } .question { break-inside: avoid; } }
</style></head><body>
  <button class="noprint" onclick="window.print()" style="margin-bottom:16px;padding:8px 12px;background:#1B4D3E;color:#fff;border:0;cursor:pointer">Print / Save PDF</button>
  <h1>${escapeHtml(surveyTitle)}</h1>
  <div class="meta">Survey analytics and statistical report · ${escapeHtml(area || 'All areas')} · Generated ${escapeHtml(generatedAt)}</div>
  <div class="grid">
    <div class="cell"><div class="label">Included</div><div class="val">${bundle.totalIncluded}</div></div>
    <div class="cell"><div class="label">Reviewed / submitted</div><div class="val">${bundle.approved}</div></div>
    <div class="cell"><div class="label">Excluded</div><div class="val">${bundle.totalExcluded}</div></div>
    <div class="cell"><div class="label">Completion</div><div class="val">${bundle.completionRate}%</div></div>
  </div>
  <p class="note">${escapeHtml(bundle.exclusionNote)} Question distributions and statistics below use included submissions only.</p>
  <h2>Executive summary</h2>
  <ul>${(executiveSummary || [])
    .map((b) => `<li>${escapeHtml(b)}</li>`)
    .join('') || '<li class="meta">No summary generated.</li>'}</ul>
  <h2>Data quality and methodology</h2>
  <p>Required-field completion: <span class="mono">${bundle.completionRate}%</span> · Collected today: <span class="mono">${bundle.todayCount}</span>
  ${bundle.avgDuration != null ? ` · Avg interview: <span class="mono">${bundle.avgDuration}s</span>` : ''}
  ${bundle.gpsOutliers ? ` · GPS accuracy outliers (&gt;50m): <span class="mono">${bundle.gpsOutliers}</span>` : ''}
  </p>
  <p class="meta">These are descriptive statistics from the current survey dataset. Percentages may differ slightly from 100% due to rounding. This report does not claim population-level statistical significance.</p>
  <h2>Question analysis</h2>
  ${bundle.perQuestion
    .map((q) => {
      const insight = questionInsights?.[q.id];
      const insightBlock = insight
        ? `<p class="note" style="margin-top:8px"><strong>Interpretation:</strong> ${escapeHtml(insight)}</p>`
        : '';
      if (q.kind === 'choice') {
        const distribution = q.distribution || [];
        return `<section class="question"><h3>${escapeHtml(q.label)}</h3><div class="meta">n=${q.count} valid answers · categorical distribution</div>${distribution.length <= 5 ? donut(distribution) : bars(distribution)}${insightBlock}</section>`;
      }
      if (q.kind === 'number') {
        return `<section class="question"><h3>${escapeHtml(q.label)}</h3><table class="stats"><thead><tr><th>Valid n</th><th>Minimum</th><th>Mean</th><th>Median</th><th>Maximum</th></tr></thead><tbody><tr><td class="mono">${q.count}</td><td class="mono">${q.min ?? '—'}</td><td class="mono">${q.mean ?? '—'}</td><td class="mono">${q.median ?? '—'}</td><td class="mono">${q.max ?? '—'}</td></tr></tbody></table>${bars(q.distribution || [])}${insightBlock}</section>`;
      }
      return `<section class="question"><h3>${escapeHtml(q.label)}</h3><div class="meta">${q.count} text responses · review raw answers in the Data export</div>${insightBlock}</section>`;
    })
    .join('')}
  <h2>Conclusions</h2>
  <ul>${(conclusions || [])
    .map((b) => `<li>${escapeHtml(b)}</li>`)
    .join('') || '<li class="meta">See question-level interpretations above.</li>'}</ul>
  <h2>Geographic distribution</h2>
  <div class="two-col">
    <section class="question"><h3>By ward</h3>${rankedBars(bundle.byWard) || '<div class="meta">No data</div>'}</section>
    <section class="question"><h3>By village</h3>${rankedBars(bundle.byVillage) || '<div class="meta">No data</div>'}</section>
  </div>
  <h2>Field team contribution</h2>
  <table class="stats"><thead><tr><th>Agent</th><th>Included</th><th>Flagged</th><th>Flag rate</th></tr></thead><tbody>${bundle.byAgent
    .map(
      (a) =>
        `<tr><td>${escapeHtml(a.name)}</td><td class="mono">${a.count}</td><td class="mono">${a.flagged}</td><td class="mono">${a.flagRate}%</td></tr>`,
    )
    .join('') || '<tr><td colspan="4" class="meta">No data</td></tr>'}</tbody></table>
  <script>
    document.title = ${JSON.stringify(surveyTitle + ' — Report')};
    window.addEventListener('load', function () {
      setTimeout(function () { try { window.print(); } catch (e) {} }, 500);
    });
  </script>
</body></html>`;

  const safeName = (surveyTitle || 'survey').replace(/\s+/g, '_').toLowerCase();
  return openHtmlInNewTabOrDownload(html, `${safeName}_research_report`);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportResponsesCsv(
  surveyTitle: string,
  questions: SurveyQuestion[],
  responses: ResponseLike[],
) {
  const headers = [
    'respondent_code',
    'status',
    'agent_id',
    'ward',
    'village',
    'submitted_at',
    ...questions.map((q) => q.id),
  ];
  const rows = responses.map((r, i) => {
    const cells = [
      respondentCode(r, i),
      r.status || 'submitted',
      String(r.agent_id ?? ''),
      r.location?.ward || '',
      r.location?.village || '',
      r.created_at || r.submitted_at || '',
      ...questions.map((q) => {
        const v = r.answers?.[q.id];
        if (Array.isArray(v)) return v.join('; ');
        return v == null ? '' : String(v);
      }),
    ];
    return cells.map((c) => csvEscape(String(c))).join(',');
  });
  const csv = [headers.map((h) => csvEscape(h)).join(','), ...rows].join('\r\n');
  const filename = `${surveyTitle.replace(/\s+/g, '_').toLowerCase()}_data.csv`;
  downloadText(csv, filename, 'text/csv;charset=utf-8', true);
}

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
