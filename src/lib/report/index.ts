import type { SurveyQuestion } from '@/domain/question';
import type { ResponseLike } from '@/lib/analytics';
import { openHtmlInNewTabOrDownload, type OpenHtmlReportResult } from '@/lib/download';
import {
  aggregateReport,
  buildDefaultConfig,
  loadReportConfig,
} from './reportAggregation';
import { questionsForReport } from './reportPrivacy';
import { renderAnalyticalReportHtml } from './reportRender';

export type GenerateAnalyticalReportInput = {
  surveyId: string;
  surveyTitle: string;
  region: string;
  fieldDates: string;
  generatedAt: string;
  questions: SurveyQuestion[];
  responses: ResponseLike[];
  agentName: (id: string) => string;
  filterSummary?: string;
};

export async function generateAnalyticalReport(
  input: GenerateAnalyticalReportInput,
): Promise<OpenHtmlReportResult> {
  const reportQuestions = questionsForReport(input.questions);
  const config =
    (await loadReportConfig(input.surveyId)) ??
    buildDefaultConfig(input.surveyId, input.surveyTitle, reportQuestions);

  const report = aggregateReport({
    config,
    surveyTitle: input.surveyTitle,
    region: input.region,
    generatedAt: input.generatedAt,
    fieldDates: input.fieldDates,
    questions: reportQuestions,
    responses: input.responses,
    agentName: input.agentName,
  });

  const logoSrc =
    typeof window !== 'undefined'
      ? `${window.location.origin}/strategic-insight-logo.png`
      : '/strategic-insight-logo.png';

  const html = renderAnalyticalReportHtml(report, config, {
    filterSummary: input.filterSummary,
    logoSrc,
  });

  const safeName = (input.surveyTitle || input.surveyId)
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 48);

  return openHtmlInNewTabOrDownload(html, `${safeName}_analytical_report`);
}

export { aggregateReport, buildDefaultConfig, loadReportConfig } from './reportAggregation';
export { chartKindForQuestion, renderQuestionChart } from './reportCharts';
export {
  marginOfError95,
  twoProportionZTest,
  chiSquareIndependence,
  detectAgentOutliers,
} from './reportStats';
export type { SurveyReportConfig } from './reportConfig.types';
export type { AggregatedReport, QuestionAnalysis } from './reportAggregation';
