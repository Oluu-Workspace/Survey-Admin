import type { SurveyQuestion } from './questions';
import { downloadText, openHtmlInNewTabOrDownload, type OpenHtmlReportResult } from './download';
import { isTodayEAT } from './datetime';
import {
  AGE_BANDS,
  ageBand,
  isAgeNumberQuestion,
  isIdentityQuestion,
} from './chartableQuestions';

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
  const meta = (r as { metadata?: { respondent_code?: string } }).metadata;
  if (meta?.respondent_code) return meta.respondent_code;
  const hash = r.id?.slice(0, 4)?.toUpperCase() || String(index + 1).padStart(4, '0');
  return `R-${hash}`;
}

function responseDurationSeconds(r: ResponseLike): number | undefined {
  if (typeof r.duration_seconds === 'number' && r.duration_seconds > 0) return r.duration_seconds;
  const meta = (r as { metadata?: { duration_seconds?: number } }).metadata;
  if (typeof meta?.duration_seconds === 'number' && meta.duration_seconds > 0) {
    return meta.duration_seconds;
  }
  return undefined;
}

function responseGpsAccuracy(r: ResponseLike): number | undefined {
  if (typeof r.gps_accuracy_m === 'number') return r.gps_accuracy_m;
  const meta = (r as { metadata?: { gps_accuracy_m?: number } }).metadata;
  return typeof meta?.gps_accuracy_m === 'number' ? meta.gps_accuracy_m : undefined;
}

export function analyticsBundle(
  questions: SurveyQuestion[],
  responses: ResponseLike[],
  agentName: (id: string) => string,
) {
  const excluded = responses.filter(isExcluded);
  const included = responses.filter((r) => !isExcluded(r));
  const todayCount = included.filter((r) => isTodayEAT(r.created_at || r.submitted_at)).length;

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
    .map((r) => responseDurationSeconds(r))
    .filter((d): d is number => typeof d === 'number');
  const avgDuration = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  const gpsOutliers = included.filter((r) => {
    const acc = responseGpsAccuracy(r);
    return typeof acc === 'number' && acc > 50;
  }).length;

  const byVillage: Record<string, number> = {};
  const byWard: Record<string, number> = {};
  const byAgent: Record<string, { count: number; flagged: number }> = {};

  for (const r of responses) {
    const ward = r.location?.ward || 'Unknown Ward';
    const village = r.location?.village || 'Unknown Village';
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
    if (isIdentityQuestion(q)) {
      const values = included
        .map((r) => r.answers?.[q.id])
        .filter((v) => v !== undefined && v !== null && String(v).trim() !== '');
      return {
        id: q.id,
        label: q.label,
        type: q.type,
        kind: 'text' as const,
        chart: 'none' as const,
        chartable: false,
        count: values.length,
        distribution: [],
      };
    }

    const values = included
      .map((r) => r.answers?.[q.id])
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== '');

    if (q.type === 'number') {
      const nums = values.map(Number).filter((n) => !Number.isNaN(n));
      const bins: Record<string, number> = {};
      if (nums.length && isAgeNumberQuestion(q)) {
        for (const n of nums) {
          const lab = ageBand(n) || 'Other';
          bins[lab] = (bins[lab] || 0) + 1;
        }
        const ordered: [string, number][] = [];
        for (const b of AGE_BANDS) {
          if (bins[b.lab]) ordered.push([b.lab, bins[b.lab]]);
        }
        for (const [k, c] of Object.entries(bins)) {
          if (!ordered.some(([o]) => o === k)) ordered.push([k, c]);
        }
        const binTotal = ordered.reduce((a, [, c]) => a + c, 0) || 1;
        const sorted = [...nums].sort((a, b) => a - b);
        return {
          id: q.id,
          label: q.label,
          type: q.type,
          kind: 'number' as const,
          chart: 'histogram' as const,
          chartable: true,
          count: nums.length,
          min: Math.min(...nums),
          max: Math.max(...nums),
          mean: Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10,
          median: sorted[Math.floor(sorted.length / 2)],
          distribution: ordered.map(([option, count]) => ({
            option,
            count,
            pct: Math.round((count / binTotal) * 100),
          })),
        };
      }
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
        chartable: true,
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
      q.type === 'yes_no' ||
      q.type === 'rating' ||
      q.type === 'likert'
    ) {
      const isNumericScale =
        (q.type === 'rating' || q.type === 'likert') &&
        values.length > 0 &&
        values.every((v) => !Number.isNaN(Number(v)));
      if (isNumericScale) {
        const nums = values.map(Number);
        const dist: Record<string, number> = {};
        for (const n of nums) {
          const key = String(n);
          dist[key] = (dist[key] || 0) + 1;
        }
        const ordered = Object.entries(dist).sort((a, b) => Number(a[0]) - Number(b[0]));
        const total = nums.length || 1;
        return {
          id: q.id,
          label: q.label,
          type: q.type,
          kind: 'number' as const,
          chart: 'bar' as const,
          chartable: true,
          count: nums.length,
          min: Math.min(...nums),
          max: Math.max(...nums),
          mean: Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10,
          median: [...nums].sort((a, b) => a - b)[Math.floor(nums.length / 2)],
          distribution: ordered.map(([option, count]) => ({
            option,
            count,
            pct: Math.round((count / total) * 100),
          })),
        };
      }
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
      const chartable = ordered.length <= 24;
      return {
        id: q.id,
        label: q.label,
        type: q.type,
        kind: chartable ? ('choice' as const) : ('text' as const),
        chart: chartable ? ((ordered.length <= 5 ? 'donut' : 'bar') as const) : ('none' as const),
        chartable,
        count: values.length,
        distribution: chartable
          ? ordered.map(([option, count]) => ({
              option,
              count,
              pct: Math.round((count / total) * 100),
            }))
          : [],
      };
    }

    return {
      id: q.id,
      label: q.label,
      type: q.type,
      kind: 'text' as const,
      chart: 'none' as const,
      chartable: false,
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
  surveySubtitle?: string;
  area: string;
  generatedAt: string;
  bundle: ReturnType<typeof analyticsBundle>;
  executiveSummary?: string[];
  conclusions?: string[];
  questionInsights?: Record<string, string>;
  keyFindings?: Array<{
    question: string;
    leader: string;
    count: number;
    pct: number;
    runnerUp?: string;
    marginPts?: number;
    n: number;
  }>;
  trend?: { date: string; count: number }[];
  statusBreakdown?: { option: string; count: number; pct?: number }[];
  comparisons?: Array<{
    compare_by_label: string;
    question_label: string;
    rows: Array<{
      segment: string;
      total: number;
      cells: { option: string; count: number; pct: number }[];
    }>;
  }>;
  totalResponsesFetched?: number;
  analyticsFromApi?: boolean;
  filterSummary?: string;
  reportPeriod?: { title: string; value: string };
}): OpenHtmlReportResult {
  const {
    surveyTitle,
    surveySubtitle,
    area,
    generatedAt,
    bundle,
    executiveSummary,
    conclusions,
    questionInsights,
    keyFindings,
    trend,
    statusBreakdown,
    comparisons,
    totalResponsesFetched,
    analyticsFromApi: _analyticsFromApi,
    filterSummary,
    reportPeriod,
  } = opts;
  void _analyticsFromApi;
  const logoSrc =
    typeof window !== 'undefined'
      ? `${window.location.origin}/strategic-insight-logo.png`
      : '/strategic-insight-logo.png';
  const reportBundle = { ...bundle, perQuestion: bundle.perQuestion };
  const barsByPct = (items: { option: string; count: number; pct: number }[]) => {
    const safe = items.length ? items : [];
    return safe
      .map(
        (i) =>
          `<div class="bar-row"><div class="bar-label"><span>${escapeHtml(i.option)}</span><span class="mono">${i.count.toLocaleString()} (${i.pct}%)</span></div><div class="bar-track"><div class="bar-fill" style="width:${i.pct}%"></div></div></div>`,
      )
      .join('');
  };

  const barsByCount = (items: { option: string; count: number; pct: number }[]) => {
    const max = Math.max(...items.map((x) => x.count), 1);
    return items
      .map((i) => {
        const w = Math.max(0, Math.round((i.count / max) * 100));
        return `<div class="bar-row"><div class="bar-label"><span>${escapeHtml(i.option)}</span><span class="mono">${i.count.toLocaleString()} (${i.pct}%)</span></div><div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div></div>`;
      })
      .join('');
  };

  // Back-compat: older report sections call `bars(...)` expecting a percent-width bar.
  const bars = barsByPct;

  /** SVG column chart for counts or percentages (client-style comparison). */
  const columnChart = (
    items: { option: string; count: number; pct: number }[],
    metric: 'count' | 'pct',
  ) => {
    if (!items.length) return '<p class="meta">No data</p>';
    const sorted = [...items].sort((a, b) => b.count - a.count);
    const max = Math.max(...sorted.map((i) => (metric === 'count' ? i.count : i.pct)), 1);
    const w = 520;
    const h = 200;
    const padL = 36;
    const padR = 12;
    const padT = 16;
    const padB = 56;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const gap = 8;
    const barW = Math.max(12, (plotW - gap * (sorted.length - 1)) / sorted.length);
    const barsSvg = sorted
      .map((item, idx) => {
        const value = metric === 'count' ? item.count : item.pct;
        const bh = Math.max(2, (value / max) * plotH);
        const x = padL + idx * (barW + gap);
        const y = padT + plotH - bh;
        const label =
          item.option.length > 14
            ? `${escapeHtml(item.option.slice(0, 12))}…`
            : escapeHtml(item.option);
        const valueLabel = metric === 'count' ? item.count.toLocaleString() : `${item.pct}%`;
        return `<g>
          <rect x="${x}" y="${y}" width="${barW}" height="${bh}" fill="#5B9BD5" rx="2"/>
          <text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="9" fill="#1A2838">${valueLabel}</text>
          <text x="${x + barW / 2}" y="${h - 8}" text-anchor="middle" font-size="8" fill="#5A6B7D" transform="rotate(-28 ${x + barW / 2} ${h - 8})">${label}</text>
        </g>`;
      })
      .join('');
    const grid = [0.25, 0.5, 0.75, 1]
      .map((t) => {
        const y = padT + plotH * (1 - t);
        return `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="#E8EDF2" stroke-width="1"/>`;
      })
      .join('');
    return `<svg class="col-chart" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img">${grid}${barsSvg}</svg>`;
  };

  const distributionTable = (items: { option: string; count: number; pct: number }[]) => {
    const sorted = [...items].sort((a, b) => b.count - a.count);
    const body = sorted
      .map(
        (i) =>
          `<tr>
          <td>${escapeHtml(i.option)}</td>
          <td class="mono text-right">${i.count.toLocaleString()}</td>
          <td class="mono text-right">${i.pct}%</td>
        </tr>`,
      )
      .join('');
    const total = sorted.reduce((s, i) => s + i.count, 0);
    return `<table class="stats">
      <thead><tr>
        <th>Label</th><th class="text-right">Count</th><th class="text-right">Percentage (%)</th>
      </tr></thead>
      <tbody>${body}
        <tr class="total-row"><td><strong>Total</strong></td>
          <td class="mono text-right"><strong>${total.toLocaleString()}</strong></td>
          <td class="mono text-right"><strong>100%</strong></td></tr>
      </tbody></table>`;
  };

  const palette = ['#1B4D3E', '#3D6B5C', '#A67C52', '#2C4A6E', '#8B3A2F', '#5A6B7D', '#6B8F71', '#2C3E50'];

  const topNWithOther = (
    items: { option: string; count: number; pct: number }[],
    n = 8,
  ): { option: string; count: number; pct: number }[] => {
    const sorted = [...items].sort((a, b) => b.count - a.count);
    if (sorted.length <= n) return sorted;
    const head = sorted.slice(0, n);
    const rest = sorted.slice(n);
    const otherCount = rest.reduce((s, i) => s + i.count, 0);
    const total = sorted.reduce((s, i) => s + i.count, 0) || 1;
    return [
      ...head,
      { option: 'Other', count: otherCount, pct: Math.round((otherCount / total) * 100) },
    ];
  };

  const pieSvg = (
    items: { option: string; count: number; pct: number }[],
    size = 150,
    innerRatio = 0,
  ) => {
    if (!items.length) return '<p class="meta">No data</p>';
    const total = items.reduce((sum, item) => sum + item.count, 0) || 1;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 6;
    const ri = innerRatio > 0 ? r * innerRatio : 0;
    let angle = -Math.PI / 2;
    const slices = items.map((item, index) => {
      const slice = (item.count / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(angle + slice);
      const y2 = cy + r * Math.sin(angle + slice);
      const large = slice > Math.PI ? 1 : 0;
      const fill = palette[index % palette.length];
      let path: string;
      if (ri > 0) {
        const ix1 = cx + ri * Math.cos(angle);
        const iy1 = cy + ri * Math.sin(angle);
        const ix2 = cx + ri * Math.cos(angle + slice);
        const iy2 = cy + ri * Math.sin(angle + slice);
        path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ri} ${ri} 0 ${large} 0 ${ix1} ${iy1} Z`;
      } else {
        path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      }
      angle += slice;
      return `<path d="${path}" fill="${fill}" stroke="#fff" stroke-width="1"/>`;
    });
    const center =
      innerRatio > 0
        ? `<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="14" font-weight="600" fill="#1A2838">${total}</text>
           <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="8" fill="#5A6B7D">answers</text>`
        : '';
    return `<svg class="pie-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img">${slices.join('')}${center}</svg>`;
  };

  const chartLegend = (items: { option: string; count: number; pct: number }[]) =>
    items
      .map(
        (item, index) =>
          `<div class="legend-row"><span class="swatch" style="background:${palette[index % palette.length]}"></span><span>${escapeHtml(item.option)}</span><span class="mono">${item.count.toLocaleString()} (${item.pct}%)</span></div>`,
      )
      .join('');

  const pieCard = (title: string, items: { option: string; count: number; pct: number }[], donut = false) => {
    const data = topNWithOther(items);
    if (!data.length) return `<section class="mini-chart"><h3>${escapeHtml(title)}</h3><p class="meta">No data</p></section>`;
    return `<section class="mini-chart">
      <h3>${escapeHtml(title)}</h3>
      <div class="pie-card">
        ${pieSvg(data, 140, donut ? 0.52 : 0)}
        <div class="legend">${chartLegend(data)}</div>
      </div>
    </section>`;
  };

  const choiceBlock = (
    distribution: { option: string; count: number; pct: number }[],
    foot = '',
    insightBlock = '',
  ) => {
    if (!distribution.length) return `<p class="meta">No distribution data.</p>${insightBlock}`;
    const sorted = [...distribution].sort((a, b) => b.count - a.count);
    const pieData = topNWithOther(sorted, 10);
    return `
      <div class="chart-row">
        <div class="chart-panel">
          <div class="chart-title">Pie chart — share (%)</div>
          <div class="pie-card">${pieSvg(pieData, 160, 0)}<div class="legend">${chartLegend(pieData)}</div></div>
        </div>
        <div class="chart-panel">
          <div class="chart-title">Donut chart — share (%)</div>
          <div class="pie-card">${pieSvg(pieData, 160, 0.55)}<div class="legend">${chartLegend(pieData)}</div></div>
        </div>
      </div>
      <div class="chart-row">
        <div class="chart-panel">
          <div class="chart-title">Bar chart — counts</div>
          ${columnChart(sorted, 'count')}
        </div>
        <div class="chart-panel">
          <div class="chart-title">Bar chart — percentages (%)</div>
          ${columnChart(sorted, 'pct')}
        </div>
      </div>
      <div class="chart-title" style="margin-top:10px">Data table (sorted by count)</div>
      ${distributionTable(sorted)}
      ${foot}
      ${insightBlock}`;
  };

  const rankedBars = (record: Record<string, number>) => {
    const entries = Object.entries(record).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
    return barsByCount(
      entries.map(([option, count]) => ({
        option,
        count,
        pct: Math.round((count / total) * 100),
      })),
    );
  };

  const questionBlocks = reportBundle.perQuestion
    .map((q, index) => {
      const insight = questionInsights?.[q.id];
      const insightBlock = insight
        ? `<p class="note" style="margin-top:8px"><strong>Interpretation:</strong> ${escapeHtml(insight)}</p>`
        : '';
      const typeLabel = q.type ? escapeHtml(String(q.type).replace(/_/g, ' ')) : q.kind;
      const header = `<div class="q-head"><span class="q-num">Q${index + 1}</span><h3>${escapeHtml(q.label)}</h3><span class="q-type">${typeLabel}</span></div>`;

      if (!q.count) {
        return `<section class="question muted"><div class="q-head"><span class="q-num">Q${index + 1}</span><h3>${escapeHtml(q.label)}</h3></div><p class="meta">No valid answers yet.</p></section>`;
      }

      if (q.kind === 'choice') {
        const distribution = q.distribution || [];
        const foot =
          q.type === 'multiple_choice'
            ? '<p class="meta">Multiple selection — percentages are shares of all ticks, not respondents.</p>'
            : '';

        return `<section class="question">${header}
          <div class="meta">n=${q.count.toLocaleString()} · categorical · counts and % shown side by side</div>
          ${choiceBlock(distribution, foot, insightBlock)}
        </section>`;
      }
      if (q.kind === 'number') {
        const dist = q.distribution || [];
        return `<section class="question">${header}
          <div class="meta">n=${q.count.toLocaleString()} · numeric / bands</div>
          <table class="stats"><thead><tr><th>Valid n</th><th>Min</th><th>Mean</th><th>Median</th><th>Max</th></tr></thead><tbody><tr>
            <td class="mono">${q.count}</td><td class="mono">${q.min ?? '—'}</td><td class="mono">${q.mean ?? '—'}</td>
            <td class="mono">${q.median ?? '—'}</td><td class="mono">${q.max ?? '—'}</td>
          </tr></tbody></table>
          ${dist.length ? choiceBlock(dist, '', insightBlock) : insightBlock}
        </section>`;
      }
      if (q.kind === 'media' && (q.distribution?.length || 0) > 0) {
        return `<section class="question">${header}
          <div class="meta">n=${q.count.toLocaleString()} · capture status</div>
          ${choiceBlock(q.distribution || [], '', insightBlock)}
        </section>`;
      }
      if (q.kind === 'text' || q.kind === 'media') {
        const distribution = q.distribution || [];
        if (!distribution.length) {
          return `<section class="question">${header}
            <div class="meta">n=${q.count.toLocaleString()} · ${q.kind === 'media' ? 'media capture' : 'open text'}</div>
            <p class="meta">Responses recorded — no chartable distribution for this field type.</p>
            ${insightBlock}
          </section>`;
        }
        return `<section class="question">${header}
          <div class="meta">n=${q.count.toLocaleString()} · top verbatim answers (truncated)</div>
          ${choiceBlock(distribution, '', insightBlock)}
        </section>`;
      }
      if ((q.distribution?.length || 0) > 0) {
        return `<section class="question">${header}
          <div class="meta">n=${q.count.toLocaleString()} · top responses</div>
          ${choiceBlock(q.distribution || [], '', insightBlock)}
        </section>`;
      }
      return `<section class="question muted">${header}<p class="meta">No analyzable answers for this question.</p>${insightBlock}</section>`;
    })
    .filter(Boolean);

  const isUnknownPlace = (k: string) => {
    const n = k.trim().toLowerCase();
    return !n || n === 'unknown ward' || n === 'unknown village' || n === 'unknown';
  };

  const rankedTable = (record: Record<string, number>, title: string) => {
    const entries = Object.entries(record)
      .filter(([k]) => k && !isUnknownPlace(k))
      .sort((a, b) => b[1] - a[1]);
    if (!entries.length) return `<p class="meta">No ${escapeHtml(title)} data</p>`;
    const total = entries.reduce((s, [, c]) => s + c, 0) || 1;
    const rows = entries
      .map(
        ([option, count]) =>
          `<tr><td>${escapeHtml(option)}</td>
           <td class="mono text-right">${count.toLocaleString()}</td>
           <td class="mono text-right">${Math.round((count / total) * 100)}%</td></tr>`,
      )
      .join('');
    return `<table class="stats"><thead><tr><th>${escapeHtml(title)}</th><th class="text-right">Count</th><th class="text-right">Percentage (%)</th></tr></thead><tbody>${rows}</tbody></table>`;
  };

  const keyFindingsHtml =
    keyFindings && keyFindings.length
      ? `<h2>Key findings snapshot</h2>
        <p class="meta">Leading answer for each question — count and percentage.</p>
        <table class="stats"><thead><tr>
          <th>Question</th><th>Leading answer</th><th class="text-right">Count</th>
          <th class="text-right">Percentage (%)</th><th class="text-right">Responses</th>
        </tr></thead><tbody>${keyFindings
          .map(
            (f) =>
              `<tr>
                <td>${escapeHtml(f.question)}</td>
                <td><strong>${escapeHtml(f.leader)}</strong></td>
                <td class="mono text-right">${f.count.toLocaleString()}</td>
                <td class="mono text-right">${f.pct}%</td>
                <td class="mono text-right">${f.n.toLocaleString()}</td>
              </tr>`,
          )
          .join('')}</tbody></table>`
      : '';

  const trendHtml =
    trend && trend.length
      ? `<h2>Submissions over time</h2>
        <div class="chart-panel" style="max-width:520px">
          ${columnChart(
            trend.map((t) => ({ option: t.date, count: t.count, pct: 0 })),
            'count',
          )}
        </div>
        <table class="stats"><thead><tr><th>Date</th><th>Submissions</th></tr></thead><tbody>${trend
          .map((t) => `<tr><td>${escapeHtml(t.date)}</td><td class="mono">${t.count}</td></tr>`)
          .join('')}</tbody></table>`
      : '';

  const agentTotal = bundle.byAgent.reduce((s, a) => s + a.count, 0) || 1;

  const wardDist = Object.entries(bundle.byWard)
    .filter(([k]) => k && !isUnknownPlace(k))
    .map(([option, count]) => {
      const total = Object.values(bundle.byWard).reduce((s, c) => s + c, 0) || 1;
      return { option, count, pct: Math.round((count / total) * 100) };
    });
  const villageDist = Object.entries(bundle.byVillage)
    .filter(([k]) => k && !isUnknownPlace(k))
    .map(([option, count]) => {
      const total = Object.values(bundle.byVillage).reduce((s, c) => s + c, 0) || 1;
      return { option, count, pct: Math.round((count / total) * 100) };
    });
  const agentDist = bundle.byAgent
    .filter((a) => a.count > 0)
    .map((a) => ({
      option: a.name,
      count: a.count,
      pct: Math.round((a.count / agentTotal) * 100),
    }));
  const statusDist = (statusBreakdown || []).map((s) => ({
    option: s.option,
    count: s.count,
    pct: s.pct ?? 0,
  }));

  const comparisonBlocks =
    comparisons && comparisons.length
      ? (() => {
          const allComparisons = comparisons || [];
          return allComparisons
            .map((c) => {
              const activeRows = (c.rows || []).filter((row) => row.total > 0);
              if (!activeRows.length) return '';
              const headerCells = activeRows[0].cells
                .map((cell) => `<th>${escapeHtml(cell.option)}</th>`)
                .join('');
              const body = activeRows
                .map(
                  (row) =>
                    `<tr><td>${escapeHtml(row.segment)}</td>${row.cells
                      .map((cell) => `<td class="mono text-right">${cell.count.toLocaleString()} (${cell.pct}%)</td>`)
                      .join('')}</tr>`,
                )
                .join('');
              return `<section class="question"><h3>${escapeHtml(c.question_label)}</h3><table class="stats"><thead><tr><th>Segment</th>${headerCells}</tr></thead><tbody>${body}</tbody></table></section>`;
            })
            .filter(Boolean);
        })()
      : [];

  const compareLabel = comparisons?.[0]?.compare_by_label || 'segment';
  const fetchedNote =
    totalResponsesFetched != null
      ? `<p class="meta">${totalResponsesFetched.toLocaleString()} responses · ${reportBundle.perQuestion.length} questions analyzed.</p>`
      : '';

  const reportTitle = escapeHtml(surveyTitle);
  const reportDate = escapeHtml(generatedAt);
  const reportArea = escapeHtml(area || 'All areas');
  const printDateSafe = generatedAt.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const chunk = <T,>(items: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out.length ? out : [[]];
  };

  type PageSpec = { title: string; body: string };
  const pages: PageSpec[] = [];

  const filterNote = filterSummary
    ? `<p class="note"><strong>Filters applied:</strong> ${escapeHtml(filterSummary)}. Charts reflect this subset only.</p>`
    : '<p class="note">Full analysis — every survey question with available breakdowns, charts, and tables.</p>';

  const periodBlock = reportPeriod
    ? `<div class="report-scope"><div class="report-date-line"><strong>${escapeHtml(reportPeriod.title)}:</strong> ${escapeHtml(reportPeriod.value)}</div>${
        filterSummary
          ? `<div class="report-filter-line">${escapeHtml(filterSummary)}</div>`
          : ''
      }</div>`
    : '';

  pages.push({
    title: 'Cover & summary',
    body: `
      <header class="cover">
        <div class="brand">Tafiti · Research report</div>
        <h1>${reportTitle}</h1>
        ${surveySubtitle ? `<p class="sub">${escapeHtml(surveySubtitle)}</p>` : ''}
        <div class="meta">${reportArea} · Generated ${reportDate}</div>
        ${periodBlock}
        <div class="tagline powered-by">
          <span>Powered by</span>
          <img src="${logoSrc}" alt="Strategic Insight" class="powered-logo" />
        </div>
      </header>
      ${fetchedNote}
      ${filterNote}
      <div class="grid grid-3">
        <div class="cell"><div class="label">Responses</div><div class="val">${bundle.totalIncluded.toLocaleString()}</div></div>
        <div class="cell"><div class="label">Questions analyzed</div><div class="val">${reportBundle.perQuestion.length}</div></div>
        <div class="cell"><div class="label">Completion</div><div class="val">${bundle.completionRate}%</div></div>
      </div>
      <h2>Executive summary</h2>
      <ul>${(executiveSummary || [])
        .map((b) => `<li>${escapeHtml(b)}</li>`)
        .join('') || '<li class="meta">No summary generated.</li>'}</ul>
      ${keyFindingsHtml}
      <h2>How to read this report</h2>
      <ul>
        <li>Every question includes charts and tables where data allows (choice, numeric, text samples).</li>
        <li>Percentages are shares of answers for that question — read alongside counts.</li>
        <li>Identity fields show response counts; verbatim values are truncated in tables.</li>
      </ul>`,
  });

  pages.push({
    title: 'Overview charts',
    body: `
      <h2>Overview — geographic &amp; team distribution</h2>
      <p class="meta">Pie and donut charts for where data was collected and who collected it.</p>
      <div class="pie-grid">
        ${pieCard('Submissions by ward', wardDist, false)}
        ${pieCard('Submissions by ward (donut)', wardDist, true)}
        ${pieCard('Submissions by village', villageDist, false)}
        ${pieCard('Submissions by village (donut)', villageDist, true)}
      </div>
      <div class="pie-grid">
        ${statusDist.length ? pieCard('Review status', statusDist, false) : ''}
        ${statusDist.length ? pieCard('Review status (donut)', statusDist, true) : ''}
        ${pieCard('Field agents', agentDist, false)}
        ${pieCard('Field agents (donut)', agentDist, true)}
      </div>
      ${trendHtml}`,
  });

  const qChunks = chunk(questionBlocks, 1);
  qChunks.forEach((parts, i) => {
    if (!parts.length) return;
    pages.push({
      title: qChunks.length > 1 ? `Question ${i + 1} of ${qChunks.length}` : 'Question analysis',
      body: `
        <h2>Question analysis${qChunks.length > 1 ? ` — ${i + 1} of ${qChunks.length}` : ''}</h2>
        <p class="meta">Pie · donut · count bar · percentage bar · sorted data table.</p>
        ${parts.join('')}`,
    });
  });

  if (comparisonBlocks.length) {
    const cChunks = chunk(comparisonBlocks, 2);
    cChunks.forEach((parts, i) => {
      pages.push({
        title: cChunks.length > 1 ? `Cross-tabs (${i + 1}/${cChunks.length})` : 'Cross-tabs',
        body: `
          <h2>Cross-tabulation (by ${escapeHtml(compareLabel)})${cChunks.length > 1 ? ` — part ${i + 1} of ${cChunks.length}` : ''}</h2>
          ${parts.join('')}`,
      });
    });
  }

  pages.push({
    title: 'Conclusions & tables',
    body: `
      <h2>Conclusions &amp; recommendations</h2>
      <ul>${(conclusions || [])
        .map((b) => `<li>${escapeHtml(b)}</li>`)
        .join('') || '<li class="meta">See question-level interpretations above.</li>'}</ul>
      <h2>Geographic tables</h2>
      <div class="two-col">
        <section class="question"><h3>By ward</h3>${rankedTable(bundle.byWard, 'Ward')}</section>
        <section class="question"><h3>By village</h3>${rankedTable(bundle.byVillage, 'Village')}</section>
      </div>
      <h2>Field team contribution</h2>
      <table class="stats"><thead><tr><th>Agent</th><th class="text-right">Interviews</th><th class="text-right">Share %</th></tr></thead><tbody>${
        bundle.byAgent
          .filter((a) => a.count > 0)
          .map(
            (a) =>
              `<tr><td>${escapeHtml(a.name)}</td>
               <td class="mono text-right">${a.count.toLocaleString()}</td>
               <td class="mono text-right">${Math.round((a.count / agentTotal) * 100)}%</td></tr>`,
          )
          .join('') || '<tr><td colspan="3" class="meta">No data</td></tr>'
      }</tbody></table>`,
  });

  const totalPages = pages.length;
  const pagesHtml = pages
    .map(
      (p, i) => `
    <article class="report-page" data-page="${i + 1}">
      <div class="page-topbar">
        <span class="page-top-title">${reportTitle}</span>
        <span class="page-top-meta">${reportDate}</span>
      </div>
      <div class="page-banner">
        <span class="page-num-badge">Page ${i + 1} of ${totalPages}</span>
        <span class="page-section">${escapeHtml(p.title)}</span>
      </div>
      <div class="page-body">${p.body}</div>
      <footer class="page-footer">
        <span class="powered-by-inline">
          Tafiti · Powered by
          <img src="${logoSrc}" alt="Strategic Insight" class="powered-logo-sm" />
          · ${reportArea}
        </span>
        <span>${reportDate}</span>
        <span class="mono">Page ${i + 1} / ${totalPages}</span>
      </footer>
    </article>`,
    )
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${reportTitle} — Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wght@500;600;700&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet"/>
<style>
  @page {
    size: A4 landscape;
    margin: 0;
  }
  * { box-sizing: border-box; }
  body { font-family: "Source Sans 3", system-ui, sans-serif; color: #1A2838; font-size: 11px; line-height: 1.35; width: 100%; max-width: none; margin: 0; padding: 0; background: #fff; }
  .report-page {
    background: #fff;
    border: 0;
    padding: 6mm 7mm 5mm;
    margin: 0;
    width: 100%;
    page-break-after: always;
    break-after: page;
  }
  .report-page:last-of-type { page-break-after: auto; break-after: auto; }
  .page-topbar {
    display: flex; justify-content: space-between; align-items: baseline; gap: 8px;
    font-size: 9px; color: #5A6B7D; border-bottom: 1px solid #E8EDF2; padding-bottom: 4px; margin-bottom: 6px;
  }
  .page-top-title { font-family: "Instrument Sans", sans-serif; font-weight: 600; color: #1B4D3E; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .page-banner { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .page-num-badge {
    font-family: "IBM Plex Mono", monospace; font-size: 10px; font-weight: 600;
    background: #1B4D3E; color: #fff; padding: 4px 8px; letter-spacing: 0.02em;
  }
  .page-section { font-family: "Instrument Sans", sans-serif; font-size: 12px; font-weight: 600; color: #1A2838; }
  .page-footer {
    display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;
    margin-top: 10px; padding-top: 6px; border-top: 1px solid #D3DAE3;
    font-size: 9px; color: #5A6B7D;
  }
  .cover { background: linear-gradient(135deg, #1B4D3E 0%, #2d6b58 100%); color: #fff; padding: 14px 16px; margin: 0 0 10px; }
  .cover h1 { font-family: "Instrument Sans", sans-serif; font-size: 24px; margin: 0 0 6px; font-weight: 700; }
  .cover .sub { opacity: 0.92; font-size: 12px; max-width: 70em; }
  .cover .meta { color: rgba(255,255,255,0.85); font-size: 11px; margin-top: 10px; }
  .cover .report-scope { margin-top: 10px; padding: 8px 10px; background: rgba(0,0,0,0.18); border-radius: 2px; }
  .cover .report-date-line { font-size: 13px; font-weight: 600; }
  .cover .report-filter-line { font-size: 11px; opacity: 0.92; margin-top: 4px; }
  .cover .tagline.powered-by { margin-top: 12px; display: flex; align-items: center; gap: 8px; font-size: 11px; opacity: 0.95; }
  .cover .powered-logo { height: 28px; width: auto; max-width: 160px; object-fit: contain; background: #000; padding: 4px 8px; border-radius: 2px; }
  .powered-by-inline { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .powered-logo-sm { height: 16px; width: auto; max-width: 100px; object-fit: contain; background: #000; padding: 2px 4px; vertical-align: middle; }
  .brand { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.8; margin-bottom: 8px; }
  h2 { font-family: "Instrument Sans", sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin: 12px 0 6px; border-bottom: 2px solid #1B4D3E; padding-bottom: 3px; color: #1B4D3E; }
  h2:first-child { margin-top: 0; }
  h3 { font-family: "Instrument Sans", sans-serif; font-size: 12px; margin: 0; font-weight: 600; }
  .meta { color: #5A6B7D; font-size: 10px; }
  .mono { font-family: "IBM Plex Mono", monospace; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 10px 0; }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
  .cell { border: 1px solid #D3DAE3; padding: 10px; background: #fafbfc; }
  .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #5A6B7D; }
  .val { font-family: "IBM Plex Mono", monospace; font-size: 18px; margin-top: 4px; font-weight: 500; }
  .question { border: 1px solid #D3DAE3; padding: 8px 10px; margin: 0 0 8px; break-inside: avoid; page-break-inside: avoid; }
  .question.muted { opacity: 0.75; background: #f8f9fa; }
  .q-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; margin-bottom: 6px; }
  .q-num { font-family: "IBM Plex Mono", monospace; font-size: 10px; color: #1B4D3E; font-weight: 600; }
  .q-type { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #5A6B7D; margin-left: auto; }
  ul { margin: 8px 0; padding-left: 18px; }
  li { margin: 4px 0; }
  .bar-row { margin: 6px 0; }
  .bar-label { display: flex; justify-content: space-between; gap: 12px; font-size: 10px; margin-bottom: 2px; }
  .bar-track { background: #E8EDF2; height: 10px; border-radius: 2px; overflow: hidden; }
  .bar-fill { background: #1B4D3E; height: 100%; border-radius: 2px; }
  .donut-wrap { display: flex; align-items: center; gap: 18px; margin-top: 10px; }
  .donut { width: 110px; height: 110px; border-radius: 50%; display: grid; place-items: center; flex: 0 0 auto; }
  .donut-hole { width: 62px; height: 62px; border-radius: 50%; background: #FFF; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .donut-hole strong { font-size: 16px; }
  .donut-hole span { color: #5A6B7D; font-size: 9px; }
  .legend { flex: 1; min-width: 0; }
  .legend-row { display: grid; grid-template-columns: 9px 1fr auto; align-items: start; gap: 6px; margin: 5px 0; font-size: 10px; }
  .swatch { width: 8px; height: 8px; margin-top: 3px; }
  .stats { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
  .stats th, .stats td { border: 1px solid #D3DAE3; padding: 5px 8px; text-align: left; }
  .stats th { background: #EEF2F5; color: #5A6B7D; font-size: 9px; text-transform: uppercase; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; break-inside: avoid; }
  .two-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; break-inside: avoid; }
  .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 6px 0; break-inside: avoid; }
  .chart-panel { min-width: 0; border: 1px solid #E8EDF2; padding: 6px; background: #fafbfc; }
  .chart-col { min-width: 0; }
  .pie-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 6px 0 8px; }
  .mini-chart { border: 1px solid #D3DAE3; padding: 6px; break-inside: avoid; }
  .mini-chart h3 { font-size: 11px; margin: 0 0 8px; }
  .pie-card { display: flex; align-items: flex-start; gap: 12px; }
  .pie-svg { flex: 0 0 auto; }
  .chart-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #5A6B7D; margin: 0 0 6px; }
  .text-right { text-align: right; }
  .total-row td { background: #EEF2F5; }
  .col-chart { display: block; margin: 4px 0 8px; }
  .toc { font-size: 10px; color: #5A6B7D; margin: 0 0 14px; }
  .note { padding: 8px 10px; background: #EEF2F5; border-left: 3px solid #1B4D3E; color: #3d4f63; font-size: 10px; }
  .toolbar { position: sticky; top: 0; z-index: 5; background: #fff; padding: 6px 8px 8px; margin-bottom: 0; border-bottom: 1px solid #E8EDF2; }
  @media print {
    .noprint { display: none !important; }
    body { padding: 0; margin: 0; width: 100%; max-width: none; background: #fff; }
    .report-page {
      border: 0; margin: 0; padding: 6mm 7mm 5mm;
      page-break-after: always; break-after: page;
    }
    .report-page:last-of-type { page-break-after: auto; break-after: auto; }
    .cover { margin: 0 0 8px; }
    .two-charts, .question { break-inside: avoid; page-break-inside: avoid; }
  }
</style></head><body>
  <div class="toolbar noprint">
    <button onclick="window.print()" style="padding:10px 16px;background:#1B4D3E;color:#fff;border:0;cursor:pointer;border-radius:4px;font-size:12px">Print / Save as PDF (landscape)</button>
    <span style="margin-left:12px;font-size:12px;color:#5A6B7D">${totalPages} pages · ${reportDate}</span>
  </div>
  ${pagesHtml}
  <script>
    document.title = ${JSON.stringify(surveyTitle + ' — Report')};
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
    ...questions.map((q) => `${q.id} | ${String(q.label).replace(/[|,\n\r]/g, ' ')}`),
  ];
  const rows = responses.map((r, i) => {
    const answers = r.answers || {};
    const wardRaw = r.location?.ward || '';
    const villageRaw = r.location?.village || '';
    const wardUnknown = !wardRaw || /^unknown/i.test(wardRaw);
    const villageUnknown = !villageRaw || /^unknown/i.test(villageRaw);
    const ward =
      (!wardUnknown && wardRaw) ||
      String(answers.lari_ward ?? answers.ward ?? '') ||
      wardRaw;
    const village =
      (!villageUnknown && villageRaw) ||
      String(answers.lari_village ?? answers.village ?? '') ||
      villageRaw;
    const cells = [
      respondentCode(r, i),
      r.status || 'submitted',
      String(r.agent_id ?? ''),
      ward,
      village,
      r.created_at || r.submitted_at || '',
      ...questions.map((q) => {
        const v = answers[q.id];
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
