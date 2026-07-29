import type { QuestionAnalytics } from '@/components/SurveyAnalyticsPanel';
import { surveysAPI } from '@/services/api';
import type { SurveyQuestion } from '@/lib/questions';
import {
  analyticsBundle,
  isExcluded,
  type ResponseLike,
} from '@/lib/analytics';
import { fetchAllSurveyResponses } from '@/lib/fetchAllResponses';
import {
  collectionPeriodFromResponses,
  mergeQuestionAnalytics,
} from '@/lib/researchInsights';
import type { SurveyResponse } from '@/domain';

export type SurveyAnalyticsPayload = {
  summary?: {
    total?: number;
    included?: number;
    excluded?: number;
    today?: number;
    questions?: number;
  };
  per_question?: QuestionAnalytics[];
  by_ward?: { option: string; count: number; pct?: number }[];
  by_village?: { option: string; count: number; pct?: number }[];
  by_status?: { option: string; count: number; pct?: number }[];
  by_agent?: { option: string; count: number; pct?: number; agent_id?: string }[];
  trend?: { date: string; count: number }[];
  comparisons?: Array<{
    compare_by_label: string;
    question_label: string;
    rows: Array<{
      segment: string;
      total: number;
      cells: { option: string; count: number; pct: number }[];
    }>;
  }>;
  exclusion_note?: string;
  compare_by_label?: string;
};

function distToRecord(rows?: { option: string; count: number }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows || []) {
    if (r.option) out[r.option] = r.count;
  }
  return out;
}

function asResponseLike(rows: SurveyResponse[]): ResponseLike[] {
  return rows.map((r) => ({
    ...r,
    duration_seconds: r.metadata?.duration_seconds ?? undefined,
    gps_accuracy_m: r.metadata?.gps_accuracy_m ?? undefined,
    respondent_code: r.metadata?.respondent_code,
  }));
}

/** Top verbatim text answers for open-ended questions (anonymised snippets). */
function textAnswerSamples(
  responses: ResponseLike[],
  questionId: string,
  limit = 10,
): { option: string; count: number; pct: number }[] {
  const freq: Record<string, number> = {};
  for (const r of responses) {
    if (isExcluded(r)) continue;
    const v = r.answers?.[questionId];
    if (v == null || String(v).trim() === '') continue;
    const text = String(v).trim().slice(0, 120);
    freq[text] = (freq[text] || 0) + 1;
  }
  const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, limit);
  const total = entries.reduce((s, [, c]) => s + c, 0) || 1;
  return entries.map(([option, count]) => ({
    option,
    count,
    pct: Math.round((count / total) * 100),
  }));
}

export async function buildFullResearchReportData(
  surveyId: string,
  questions: SurveyQuestion[],
  agentName: (id: string) => string,
  compareBy?: string,
) {
  const rowsPromise = fetchAllSurveyResponses(surveyId);
  let api: SurveyAnalyticsPayload | null = null;
  try {
    api = (await surveysAPI.getAnalytics(surveyId, {
      compare_by: compareBy || undefined,
    })) as SurveyAnalyticsPayload;
  } catch {
    api = null;
  }
  const rows = await rowsPromise;

  const responseLikes = asResponseLike(rows);
  const clientBundle = analyticsBundle(questions, responseLikes, agentName);
  const clientAgentById = new Map(clientBundle.byAgent.map((a) => [a.id, a]));

  const perQuestion = mergeQuestionAnalytics(
    questions,
    clientBundle.perQuestion,
    api?.per_question,
  ).map((q) => {
    if ((q.kind === 'text' || q.kind === 'media') && q.count > 0 && !(q.distribution?.length)) {
      return {
        ...q,
        distribution: textAnswerSamples(responseLikes, q.id),
      };
    }
    return q;
  });

  const bundle = {
    ...clientBundle,
    perQuestion,
    ...(api
      ? {
          totalIncluded: api.summary?.included ?? clientBundle.totalIncluded,
          totalExcluded: api.summary?.excluded ?? clientBundle.totalExcluded,
          todayCount: api.summary?.today ?? clientBundle.todayCount,
          byWard: (() => {
            const w = distToRecord(api.by_ward);
            return Object.keys(w).length ? w : clientBundle.byWard;
          })(),
          byVillage: (() => {
            const v = distToRecord(api.by_village);
            return Object.keys(v).length ? v : clientBundle.byVillage;
          })(),
          byAgent: api.by_agent?.length
            ? api.by_agent.map((row) => {
                const id = row.agent_id || row.option;
                const fromClient = clientAgentById.get(id);
                const flagged = fromClient?.flagged ?? 0;
                const count = row.count;
                return {
                  id,
                  name: row.option,
                  count,
                  flagged,
                  flagRate:
                    count + flagged > 0 ? Math.round((flagged / (count + flagged)) * 100) : 0,
                };
              })
            : clientBundle.byAgent,
          exclusionNote: api.exclusion_note || clientBundle.exclusionNote,
        }
      : {}),
  };

  const collectionPeriod = collectionPeriodFromResponses(responseLikes);

  return {
    bundle,
    rows: responseLikes,
    api,
    perQuestion: bundle.perQuestion,
    collectionPeriod,
    responseCount: rows.length,
    analyticsFromApi: Boolean(api),
  };
}
