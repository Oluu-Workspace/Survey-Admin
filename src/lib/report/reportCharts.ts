import type { QuestionType } from '@/domain/question';
import type { CrosstabResult, QuestionAnalysis } from './reportAggregation';
import { redactSensitiveText } from './reportPrivacy';
import { formatPctLabel } from './reportStats';
import type { DistRow } from './reportStats';

export type ChartKind =
  | 'yes_no_bar'
  | 'horizontal_bar'
  | 'horizontal_bar_top8'
  | 'ordinal_bar'
  | 'diverging_satisfaction'
  | 'multi_select_bar'
  | 'short_text_freq'
  | 'crosstab_stacked'
  | 'word_freq';

export function chartKindForQuestion(q: QuestionAnalysis): ChartKind {
  if (q.type === 'yes_no') return 'yes_no_bar';
  if (q.type === 'multiple_choice') return 'multi_select_bar';
  if (q.type === 'short_text') return 'short_text_freq';
  if (q.type === 'long_text') return 'short_text_freq';
  if (q.isHorseRace || (q.type === 'single_choice' && q.distribution.length > 6)) {
    return 'horizontal_bar_top8';
  }
  if (q.isOrdinal || q.type === 'rating' || q.type === 'likert') {
    if (/satisf/i.test(q.label)) return 'diverging_satisfaction';
    return 'ordinal_bar';
  }
  if (q.type === 'single_choice') return 'horizontal_bar';
  return 'horizontal_bar';
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function topNWithOthers(items: DistRow[], n = 8): DistRow[] {
  const sorted = [...items].sort((a, b) => b.count - a.count);
  if (sorted.length <= n) return sorted;
  const head = sorted.slice(0, n);
  const rest = sorted.slice(n);
  const otherCount = rest.reduce((s, i) => s + i.count, 0);
  const total = sorted.reduce((s, i) => s + i.count, 0) || 1;
  return [...head, { option: 'Others', count: otherCount, pct: Math.round((otherCount / total) * 100) }];
}

/** Horizontal bar chart SVG — primary chart type. */
export function horizontalBarSvg(
  items: DistRow[],
  opts: { accent?: string; maxItems?: number; caption?: string; showN?: boolean } = {},
): string {
  const data = opts.maxItems ? topNWithOthers(items, opts.maxItems) : [...items].sort((a, b) => b.pct - a.pct);
  if (!data.length) return '<p class="meta">No data</p>';
  const accent = opts.accent || '#1B4D3E';
  const rowH = 22;
  const h = data.length * rowH + 24;
  const w = 480;
  const maxPct = Math.max(...data.map((d) => d.pct), 1);
  const bars = data
    .map((d, i) => {
      const y = 12 + i * rowH;
      const bw = Math.max(2, (d.pct / maxPct) * (w - 180));
      const label = d.option.length > 28 ? `${d.option.slice(0, 26)}…` : d.option;
      const safeLabel = redactSensitiveText(label);
      return `<g>
        <text x="0" y="${y + 14}" font-size="10" fill="#1A2838">${escapeHtml(safeLabel)}</text>
        <rect x="170" y="${y + 2}" width="${bw}" height="14" fill="${accent}" fill-opacity="0.85" rx="2"/>
        <text x="${170 + bw + 6}" y="${y + 14}" font-size="9" fill="#5A6B7D" font-family="monospace">${d.pct > 0 ? `${d.pct}%` : formatPctLabel(d.count, data.reduce((s, x) => s + x.count, 0) || 1)}</text>
      </g>`;
    })
    .join('');
  const cap = opts.caption ? `<text x="0" y="${h - 4}" font-size="8" fill="#5A6B7D">${escapeHtml(opts.caption)}</text>` : '';
  const foot =
    opts.caption
      ? cap
      : opts.showN !== false
        ? `<text x="0" y="${h - 4}" font-size="8" fill="#5A6B7D">Share of respondents (%)</text>`
        : '';
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Horizontal bar chart"><title>Bar chart</title>${bars}${foot}</svg>`;
}

export function yesNoDonutSvg(items: DistRow[], accent = '#1B4D3E'): string {
  const sorted = [...items].sort((a, b) => b.count - a.count);
  if (!sorted.length) return '<p class="meta">No data</p>';
  const total = sorted.reduce((s, d) => s + d.count, 0) || 1;
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 55;
  const ri = 32;
  let angle = -Math.PI / 2;
  const slices = sorted.slice(0, 2).map((item, idx) => {
    const slice = (item.count / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + slice);
    const y2 = cy + r * Math.sin(angle + slice);
    const ix1 = cx + ri * Math.cos(angle);
    const iy1 = cy + ri * Math.sin(angle);
    const ix2 = cx + ri * Math.cos(angle + slice);
    const iy2 = cy + ri * Math.sin(angle + slice);
    const large = slice > Math.PI ? 1 : 0;
    const fill = idx === 0 ? accent : '#D3DAE3';
    angle += slice;
    return `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ri} ${ri} 0 ${large} 0 ${ix1} ${iy1} Z" fill="${fill}"/>`;
  });
  const legend = sorted
    .slice(0, 2)
    .map(
      (d, i) =>
        `<div class="legend-row"><span class="swatch" style="background:${i === 0 ? accent : '#D3DAE3'}"></span><span>${escapeHtml(d.option)}</span><span class="mono">${d.pct}%</span></div>`,
    )
    .join('');
  const leadPct = sorted[0]?.pct ?? 0;
  return `<div class="pie-card">${`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img"><title>Yes/No distribution</title>${slices.join('')}<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="14" font-weight="600">${leadPct}%</text></svg>`}<div class="legend">${legend}</div></div>`;
}

export function crosstabHeatmapHtml(ct: CrosstabResult, accent: string): string {
  const header = ct.options.map((o) => `<th>${escapeHtml(o.length > 12 ? o.slice(0, 10) + '…' : o)}</th>`).join('');
  const rows = ct.segments
    .map((seg, ri) => {
      const cells = ct.pctMatrix[ri]
        .map((pct, ci) => {
          const intensity = Math.min(1, pct / 100);
          const bg = `rgba(27, 77, 62, ${0.08 + intensity * 0.5})`;
          return `<td class="mono text-right" style="background:${bg}">${pct}%</td>`;
        })
        .join('');
      const moe = ct.segmentMoE[seg];
      return `<tr><td>${escapeHtml(seg)} <span class="meta">(MoE ±${moe}%)</span></td>${cells}</tr>`;
    })
    .join('');
  const sig = ct.significant
    ? `<p class="note">Statistically significant association (χ² p=${ct.pValue.toFixed(3)})</p>`
    : `<p class="meta">Not significant at p&lt;0.05 (appendix only)</p>`;
  return `${sig}<table class="stats heatmap"><thead><tr><th>${escapeHtml(ct.byLabel)}</th>${header}</tr></thead><tbody>${rows}</tbody></table>`;
}

export function renderQuestionChart(q: QuestionAnalysis, accent: string): string {
  const kind = chartKindForQuestion(q);
  const caption =
    kind === 'multi_select_bar'
      ? 'Note: multiple selections allowed — bars do not sum to 100%.'
      : undefined;

  if (kind === 'yes_no_bar') return yesNoDonutSvg(q.distribution, accent);

  const dist =
    kind === 'horizontal_bar_top8' ? topNWithOthers(q.distribution, 8) : q.distribution;

  let chart = horizontalBarSvg(dist, { accent, caption, maxItems: kind === 'horizontal_bar_top8' ? 8 : undefined });

  if (q.isHorseRace && q.decidedDistribution?.length) {
    chart += `<p class="meta" style="margin-top:8px"><strong>Among decided respondents</strong> (undecided excluded):</p>`;
    chart += horizontalBarSvg(topNWithOthers(q.decidedDistribution, 8), {
      accent,
      maxItems: 8,
    });
  }

  return chart;
}

/** Frequency table — percentages only (no raw counts). */
export function frequencyTableHtml(items: DistRow[]): string {
  const sorted = [...items].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((s, i) => s + i.count, 0) || 1;
  const rows = sorted
    .map(
      (i) =>
        `<tr><td>${escapeHtml(redactSensitiveText(i.option))}</td><td class="mono text-right">${formatPctLabel(i.count, total)}</td></tr>`,
    )
    .join('');
  return `<table class="stats"><thead><tr><th>Response</th><th class="text-right">Share (%)</th></tr></thead><tbody>${rows}<tr class="total-row"><td><strong>Total</strong></td><td class="mono text-right"><strong>100%</strong></td></tr></tbody></table>`;
}
