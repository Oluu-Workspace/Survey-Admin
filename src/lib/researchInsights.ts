import type { QuestionAnalytics } from '@/components/SurveyAnalyticsPanel';

/** Rule-based narrative insights (no external AI) from question distributions. */
export function generateQuestionInsight(q: QuestionAnalytics): string {
  if (!q.count) {
    return 'Insufficient responses to summarise this question yet. Check back after more field syncs.';
  }

  if (q.kind === 'number' && q.distribution?.length) {
    const top = [...q.distribution].sort((a, b) => b.count - a.count)[0];
    const spread =
      q.min != null && q.max != null && q.min !== q.max
        ? ` Values range from ${q.min} to ${q.max} (mean ${q.mean ?? '—'}, median ${q.median ?? '—'}).`
        : '';
    return `Based on ${q.count} valid numeric answers, the most common band is “${top.option}” (${top.pct}% of responses).${spread} Consider whether outliers reflect data entry errors or genuine heterogeneity in the sample.`;
  }

  if (q.kind === 'choice' && q.distribution?.length) {
    const sorted = [...q.distribution].sort((a, b) => b.count - a.count);
    const lead = sorted[0];
    const second = sorted[1];
    const concentration =
      lead.pct >= 50
        ? `Responses are concentrated on “${lead.option}” (${lead.pct}%).`
        : `No single option dominates; the leading category is “${lead.option}” (${lead.pct}%).`;
    const runner =
      second && second.pct >= 15
        ? ` “${second.option}” is the next most common (${second.pct}%).`
        : '';
    return `${concentration}${runner} (n=${q.count} included answers.)`;
  }

  if (q.kind === 'text' || q.kind === 'media') {
    return `${q.count} open-ended or media responses recorded. Use the Data tab to review verbatim answers and code themes for the final report.`;
  }

  return `n=${q.count} answers in the current filter scope.`;
}

export function buildExecutiveSummary(opts: {
  surveyTitle: string;
  included: number;
  excluded: number;
  completionPct: number;
  perQuestion: QuestionAnalytics[];
}): string[] {
  const bullets: string[] = [
    `This report summarises ${opts.included} included interviews from “${opts.surveyTitle}” (${opts.excluded} excluded from descriptive statistics).`,
    `Required-field completion across included records is ${opts.completionPct}%.`,
  ];

  const choiceQs = opts.perQuestion.filter((q) => q.kind === 'choice' && q.distribution?.length);
  for (const q of choiceQs.slice(0, 3)) {
    const top = [...q.distribution!].sort((a, b) => b.count - a.count)[0];
    if (top) {
      bullets.push(`For “${q.label}”, the modal response is “${top.option}” (${top.pct}%).`);
    }
  }

  return bullets;
}

export function buildConclusions(perQuestion: QuestionAnalytics[]): string[] {
  const lines = [
    'Findings are descriptive summaries of the collected sample and should be interpreted within the survey design and field protocol.',
    'Triangulate quantitative distributions with qualitative comments and supervisor review notes before policy recommendations.',
  ];
  const challenges = perQuestion.find((q) => /challenge|livelihood|issue/i.test(q.label));
  if (challenges?.distribution?.length) {
    const top = [...challenges.distribution].sort((a, b) => b.count - a.count).slice(0, 2);
    lines.push(
      `Priority themes in the data include ${top.map((t) => `“${t.option}” (${t.pct}%)`).join(' and ')}.`,
    );
  }
  return lines;
}
