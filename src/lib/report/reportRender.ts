import type { AggregatedReport, QuestionAnalysis } from './reportAggregation';
import type { SurveyReportConfig } from './reportConfig.types';
import { redactSensitiveText, REPORT_LTR_CSS } from './reportPrivacy';
import {
  crosstabHeatmapHtml,
  frequencyTableHtml,
  horizontalBarSvg,
  renderQuestionChart,
} from './reportCharts';

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statCard(value: string, label: string, accent: string) {
  return `<div class="stat-card" style="border-top:3px solid ${accent}">
    <div class="stat-value">${esc(value)}</div>
    <div class="stat-label">${esc(label)}</div>
  </div>`;
}

function questionBlock(q: QuestionAnalysis, accent: string, _sectionTitle: string) {
  const chart = renderQuestionChart(q, accent);
  const leadNote =
    q.isHorseRace && q.decidedN != null
      ? `<p class="meta">All respondents and decided-only breakdown shown where applicable.</p>`
      : '';
  return `<article class="question-block page-break" id="q-${esc(q.id)}">
    <h3>${esc(q.label)}</h3>
    <p class="meta">${esc(q.type.replace(/_/g, ' '))}</p>
    ${leadNote}
    <div class="chart-wrap" role="figure" aria-label="Chart for ${esc(q.label)}">${chart}</div>
  </article>`;
}

function tocEntry(id: string, label: string, level = 1) {
  return `<li class="toc-l${level}"><a href="#${id}">${esc(label)}</a></li>`;
}

export function renderAnalyticalReportHtml(
  report: AggregatedReport,
  config: SurveyReportConfig,
  opts: { filterSummary?: string; logoSrc?: string } = {},
): string {
  const { meta } = report;
  const logoSrc = opts.logoSrc || '/strategic-insight-logo.png';
  const accentDefault = '#1B4D3E';

  const toc: string[] = [
    tocEntry('cover', 'Cover', 1),
    tocEntry('executive-summary', 'Executive summary', 1),
    tocEntry('methodology', 'Methodology', 1),
    tocEntry('demographics', 'Demographic profile', 1),
  ];

  for (const sec of report.sections) {
    if (sec.id === 'demographics') continue;
    toc.push(tocEntry(`section-${sec.id}`, sec.title, 1));
  }
  if (report.horseRaces.length) toc.push(tocEntry('horse-races', 'Ballot / horse race', 1));
  if (report.openText.length) toc.push(tocEntry('open-text', 'Open-text themes', 1));
  if (report.crosstabs.length) toc.push(tocEntry('crosstabs', 'Significant crosstabs', 1));
  toc.push(tocEntry('data-quality', 'Data quality appendix', 1));
  toc.push(tocEntry('full-appendix', 'Full appendix', 1));

  const headlineCards = report.headlines
    .map((h) => {
      const leadLabel = h.significantLead
        ? `${h.leader} leads (${h.leaderPct}%)`
        : h.runnerUp
          ? `${h.leader} ${h.leaderPct}% · tied within MoE`
          : `${h.leader} ${h.leaderPct}%`;
      return statCard(leadLabel, h.label, accentDefault);
    })
    .join('');

  const demoSection =
    report.demographics.length > 0
      ? `<section class="report-section page-break" id="demographics">
    <h1>Demographic profile</h1>
    <div class="stat-row">${report.demographics
      .slice(0, 3)
      .map((d) => {
        const top = [...d.distribution].sort((a, b) => b.pct - a.pct)[0];
        return top ? statCard(`${top.pct}%`, `${d.label}: ${top.option}`, accentDefault) : '';
      })
      .join('')}</div>
    ${report.demographics.map((q) => questionBlock(q, accentDefault, 'Demographics')).join('')}
  </section>`
      : '';

  const behavioralSections = report.sections
    .filter((s) => s.id !== 'demographics')
    .map((sec) => {
      const topQ = sec.questions.find((q) => q.distribution.length);
      const top = topQ ? [...topQ.distribution].sort((a, b) => b.pct - a.pct)[0] : null;
      const cards = top
        ? statCard(`${top.pct}%`, `${topQ!.label}: ${top.option}`, sec.accent)
        : statCard('—', sec.title, sec.accent);
      return `<section class="report-section page-break" id="section-${esc(sec.id)}">
    <h1 style="border-color:${sec.accent}">${esc(sec.title)}</h1>
    <div class="stat-row">${cards}</div>
    ${sec.questions.map((q) => questionBlock(q, sec.accent, sec.title)).join('')}
  </section>`;
    })
    .join('');

  const horseRaceSection = report.horseRaces.length
    ? `<section class="report-section page-break" id="horse-races">
    <h1>Ballot preference (horse race)</h1>
    ${report.horseRaces
      .map((q) => {
        if (/mca/i.test(q.id)) {
          return `<article class="question-block" id="q-${esc(q.id)}">
          <h3>${esc(q.label)}</h3>
          <p class="note">MCA preferences are ward-specific. Overall constituency totals are not shown. Use ward-level reports for MCA breakdowns.</p>
        </article>`;
        }
        const sorted = [...q.distribution].sort((a, b) => b.pct - a.pct);
        const lead = sorted[0];
        const cards = lead
          ? statCard(`${lead.pct}%`, `${lead.option} (all respondents)`, '#8B3A2F')
          : '';
        const regionCt = report.crosstabs.find(
          (c) => c.questionId === q.id && /ward|region/i.test(c.byQuestionId),
        );
        return `<article class="question-block page-break" id="q-${esc(q.id)}">
        <h3>${esc(q.label)}</h3>
        <div class="stat-row">${cards}</div>
        ${renderQuestionChart(q, '#8B3A2F')}
        ${
          regionCt
            ? `<h4>By ${esc(regionCt.byLabel)}</h4>${crosstabHeatmapHtml(regionCt, '#8B3A2F')}`
            : ''
        }
      </article>`;
      })
      .join('')}
  </section>`
    : '';

  const openTextSection = report.openText.length
    ? `<section class="report-section page-break" id="open-text">
    <h1>Open-text themes</h1>
    ${report.openText
      .map((ot) => {
        const themeBars = horizontalBarSvg(
          ot.themes.map((t) => ({ option: t.theme, count: t.count, pct: t.pct })),
          { accent: '#2C4A6E', caption: 'Top themes by mention frequency (sampled responses).' },
        );
        const quotes = ot.themes
          .slice(0, 5)
          .map(
            (t) =>
              `<div class="quote-block"><strong>${esc(t.theme)}</strong> (${t.pct}%)<blockquote>${t.quotes.map((q) => esc(redactSensitiveText(q))).join('</blockquote><blockquote>')}</blockquote></div>`,
          )
          .join('');
        const words = horizontalBarSvg(ot.wordFreq.slice(0, 15), {
          accent: '#5A6B7D',
          caption: 'Word frequency (excluding stop words).',
        });
        return `<article class="question-block page-break" id="q-${esc(ot.questionId)}">
        <h3>${esc(ot.label)}</h3>
        <div class="chart-wrap">${themeBars}</div>
        ${quotes}
        <h4>Word frequency</h4>
        <div class="chart-wrap">${words}</div>
      </article>`;
      })
      .join('')}
  </section>`
    : '';

  const crosstabSection = report.crosstabs.length
    ? `<section class="report-section page-break" id="crosstabs">
    <h1>Significant demographic breakdowns</h1>
    <p class="meta">Only associations significant at p&lt;0.05 are shown here. Others appear in the appendix.</p>
    ${report.crosstabs
      .map(
        (ct) =>
          `<article class="question-block page-break" id="ct-${esc(ct.questionId)}-${esc(ct.byQuestionId)}">
        <h3>${esc(ct.questionLabel)} × ${esc(ct.byLabel)}</h3>
        ${crosstabHeatmapHtml(ct, accentDefault)}
      </article>`,
      )
      .join('')}
  </section>`
    : '';

  const dq = report.dataQuality;
  const outlierRows = dq.agentOutliers
    .map(
      (o) =>
        `<tr><td>${esc(o.agentId)}</td><td class="mono text-right">${o.count}</td><td class="mono text-right">${Math.round(o.mean)}</td><td class="mono text-right">${Math.round(o.threshold)}</td></tr>`,
    )
    .join('');
  const agentRows = dq.agentSubmissions
    .slice(0, 50)
    .map((a) => `<tr><td>${esc(a.name || a.agentId)}</td><td class="mono text-right">${a.count}</td></tr>`)
    .join('');
  const nonRespRows = dq.nonResponseByQuestion
    .filter((r) => r.rate > 0)
    .sort((a, b) => b.rate - a.rate)
    .map((r) => `<tr><td>${esc(r.label)}</td><td class="mono text-right">${r.rate}%</td></tr>`)
    .join('');
  const otherRows = dq.otherRateByQuestion
    .filter((r) => r.rate > 0)
    .map((r) => `<tr><td>${esc(r.label)}</td><td class="mono text-right">${r.rate}%</td></tr>`)
    .join('');

  const dataQualitySection = `<section class="report-section page-break" id="data-quality">
    <h1>Data quality appendix</h1>
    <h2>Agent submission counts</h2>
    <p class="meta">Agents flagged if submissions exceed mean + 2σ (${dq.agentOutliers.length} flagged).</p>
    ${
      outlierRows
        ? `<table class="stats"><thead><tr><th>Agent</th><th class="text-right">Submissions</th><th class="text-right">Mean</th><th class="text-right">Threshold</th></tr></thead><tbody>${outlierRows}</tbody></table>`
        : '<p class="meta">No outliers detected.</p>'
    }
    <h2>Submissions per agent (top 50)</h2>
    <table class="stats"><thead><tr><th>Agent</th><th class="text-right">n</th></tr></thead><tbody>${agentRows}</tbody></table>
    <h2>Item non-response</h2>
    <table class="stats"><thead><tr><th>Question</th><th class="text-right">Non-response %</th></tr></thead><tbody>${nonRespRows || '<tr><td colspan="2">None</td></tr>'}</tbody></table>
    <h2>Other / Prefer not to say</h2>
    <table class="stats"><thead><tr><th>Question</th><th class="text-right">Rate</th></tr></thead><tbody>${otherRows || '<tr><td colspan="2">None</td></tr>'}</tbody></table>
  </section>`;

  const appendixSection = `<section class="report-section appendix page-break" id="full-appendix">
    <h1>Full appendix</h1>
    <p class="meta">Complete question text and percentage tables for every item.</p>
    ${report.crosstabsAppendix
      .map(
        (ct) =>
          `<article class="question-block"><h3>${esc(ct.questionLabel)} × ${esc(ct.byLabel)} (not significant)</h3>${crosstabHeatmapHtml(ct, '#5A6B7D')}</article>`,
      )
      .join('')}
    ${report.appendix
      .map(
        (q) =>
          `<article class="question-block page-break" id="app-${esc(q.id)}">
        <h3>${esc(q.label)}</h3>
        <p class="meta">${esc(q.type.replace(/_/g, ' '))}${q.nonResponseRate > 0 ? ` · non-response ${q.nonResponseRate}%` : ''}</p>
        ${frequencyTableHtml(q.distribution)}
      </article>`,
      )
      .join('')}
  </section>`;

  const weightingLine = meta.weighted
    ? 'Post-stratification weighting applied per report configuration.'
    : 'Results are <strong>unweighted</strong> — raw sample proportions.';

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(meta.title)} — Analytical Report</title>
<style>
  ${REPORT_LTR_CSS}
  @page { size: A4 portrait; margin: 24mm 20mm 28mm 20mm; }
  @media print {
    .no-print { display: none !important; }
    .page-break { break-before: page; page-break-before: always; }
    body { padding: 0; }
    main {
      max-width: none;
      margin: 0;
      padding: 0;
    }
    .running-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 14mm;
      padding: 3mm 20mm;
      background: #fff;
    }
    .running-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 12mm;
      padding: 2mm 20mm;
      background: #fff;
    }
    .report-section, .cover, #toc { padding-left: 0; padding-right: 0; }
  }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1A2838; line-height: 1.5; font-size: 11pt; margin: 0; padding: 0; background: #fff; }
  .running-header { display: flex; justify-content: space-between; align-items: center; font-size: 8pt; color: #5A6B7D; border-bottom: 1px solid #D3DAE3; padding: 10px 24px; background: #fff; }
  .running-footer { display: flex; justify-content: space-between; align-items: center; font-size: 7pt; color: #5A6B7D; border-top: 1px solid #D3DAE3; padding: 8px 24px; background: #fff; }
  main { max-width: 680px; margin: 0 auto; padding: 56px 32px 72px; }
  h1 { font-size: 18pt; font-weight: 600; margin: 0 0 20px; padding-bottom: 10px; border-bottom: 3px solid ${accentDefault}; }
  h2 { font-size: 13pt; margin: 28px 0 14px; }
  h3 { font-size: 12pt; margin: 20px 0 10px; }
  h4 { font-size: 10pt; margin: 14px 0 8px; color: #5A6B7D; }
  .cover { text-align: center; padding: 64px 16px; min-height: 85vh; display: flex; flex-direction: column; justify-content: center; }
  .cover img { max-height: 64px; margin-bottom: 28px; }
  .cover h1 { border: none; font-size: 22pt; margin-bottom: 12px; }
  .cover-meta { color: #5A6B7D; font-size: 10pt; margin: 10px 0; }
  .confidential { margin-top: 36px; font-size: 9pt; color: #8B3A2F; border: 1px solid #E8D5D2; padding: 14px 16px; border-radius: 4px; }
  .stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; margin: 20px 0 28px; }
  .stat-card { background: #F7F9FB; border-radius: 6px; padding: 16px; }
  .stat-value { font-size: 14pt; font-weight: 700; line-height: 1.25; }
  .stat-label { font-size: 8pt; color: #5A6B7D; margin-top: 8px; }
  .meta { font-size: 9pt; color: #5A6B7D; margin: 8px 0; }
  .note { font-size: 9pt; background: #FFF8E6; border-left: 3px solid #A67C52; padding: 10px 14px; margin: 14px 0; }
  table.stats { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 14px 0; }
  table.stats th, table.stats td { border: 1px solid #D3DAE3; padding: 8px 10px; text-align: left; vertical-align: top; }
  table.stats th { background: #F0F3F7; font-weight: 600; }
  .text-right { text-align: right; }
  .mono { font-family: ui-monospace, monospace; }
  .total-row td { background: #F7F9FB; }
  .chart-wrap { margin: 16px 0 24px; }
  .question-block { margin-bottom: 32px; }
  .report-section { margin-bottom: 24px; }
  .pie-card { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  .legend-row { display: flex; gap: 8px; align-items: center; font-size: 9pt; margin: 4px 0; }
  .swatch { width: 12px; height: 12px; border-radius: 2px; display: inline-block; }
  .quote-block { margin: 14px 0; font-size: 9pt; }
  blockquote { margin: 8px 0 8px 12px; padding-left: 12px; border-left: 2px solid #D3DAE3; color: #3D4F63; font-style: italic; }
  .toc { list-style: none; padding: 0; margin: 16px 0; }
  .toc li { margin: 8px 0; }
  .toc a { color: #1B4D3E; text-decoration: none; }
  .toc-l2 { margin-left: 16px; font-size: 9pt; }
  .appendix h1 { border-color: #5A6B7D; }
  .print-hint { position: fixed; top: 12px; right: 12px; background: #1B4D3E; color: #fff; padding: 10px 16px; border-radius: 6px; font-size: 10pt; cursor: pointer; z-index: 99; border: none; }
  svg { max-width: 100%; height: auto; display: block; }
  @media print {
    svg rect { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<button class="print-hint no-print" onclick="window.print()">Print / Save as PDF</button>
<div class="running-header"><span>${esc(meta.title)}</span><span id="section-label">Report</span></div>
<div class="running-footer"><span>${esc(meta.confidentialityNotice)}</span><span></span></div>
<main>
  <section class="cover page-break" id="cover">
    <img src="${esc(logoSrc)}" alt="Logo"/>
    <h1>${esc(meta.title)}</h1>
    <p class="cover-meta">${esc(meta.region)}</p>
    <p class="cover-meta">Field dates: ${esc(meta.fieldDates)}</p>
    <p class="cover-meta">Report generated: ${esc(meta.generatedAt)}</p>
    <div class="stat-row" style="justify-content:center;margin-top:32px">
      ${statCard(String(meta.n), 'Sample size (n)', accentDefault)}
      ${statCard(String(meta.agentCount), 'Field agents', accentDefault)}
      ${statCard(`±${meta.marginOfError}%`, 'Margin of error (95% CI)', accentDefault)}
    </div>
    ${opts.filterSummary ? `<p class="cover-meta">Filters: ${esc(opts.filterSummary)}</p>` : ''}
    <p class="confidential">${esc(meta.confidentialityNotice)}</p>
  </section>

  <section class="page-break" id="toc">
    <h1>Table of contents</h1>
    <ul class="toc">${toc.join('')}</ul>
  </section>

  <section class="report-section page-break" id="executive-summary">
    <h1>Executive summary</h1>
    <p class="meta">Top-line findings from headline questions. Leads marked "tied within MoE" when the gap is not statistically significant.</p>
    <div class="stat-row">${headlineCards || statCard('—', 'No headline questions configured', accentDefault)}</div>
  </section>

  <section class="report-section page-break" id="methodology">
    <h1>Methodology</h1>
    <table class="stats">
      <tbody>
        <tr><td>Sampling</td><td>Multi-stage area probability sample; field agents collect via mobile PWA.</td></tr>
        <tr><td>Field dates</td><td>${esc(meta.fieldDates)}</td></tr>
        <tr><td>Collection mode</td><td>Face-to-face / field interview (mobile app)</td></tr>
        <tr><td>Sample size</td><td class="mono">${meta.n} (MoE ±${meta.marginOfError}% at 95% CI)</td></tr>
        <tr><td>Agents</td><td class="mono">${meta.agentCount}</td></tr>
        ${
          meta.consentRate != null
            ? `<tr><td>Consent rate</td><td class="mono">${meta.consentRate}%</td></tr>`
            : ''
        }
        <tr><td>Weighting</td><td>${weightingLine}</td></tr>
      </tbody>
    </table>
  </section>

  ${demoSection}
  ${behavioralSections}
  ${horseRaceSection}
  ${openTextSection}
  ${crosstabSection}
  ${dataQualitySection}
  ${appendixSection}
</main>
<script>
  window.onbeforeprint = function() {
    var sections = document.querySelectorAll('section[id] h1');
    // page numbers via CSS counter would need @page — footer placeholder for print
  };
</script>
</body>
</html>`;
}
