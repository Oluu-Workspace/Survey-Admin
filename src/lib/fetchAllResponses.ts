import { responsesAPI } from '@/services/api';
import type { SurveyResponse } from '@/domain';

export type ResponseFetchFilters = {
  agent_id?: string;
  county?: string;
  ward?: string;
  status?: string;
  lifecycle_stage?: string;
  answer_question_id?: string;
  answer_value?: string;
};

/** Fetch every response for a survey (paginated API, max 500 per page). */
export async function fetchAllSurveyResponses(
  surveyId: string,
  filters?: ResponseFetchFilters,
): Promise<SurveyResponse[]> {
  const perPage = 500;
  let page = 1;
  const all: SurveyResponse[] = [];
  let pages = 1;

  while (page <= pages) {
    const res = await responsesAPI.getAll({
      survey_id: surveyId,
      page,
      per_page: perPage,
      sort_by: 'submitted_at',
      sort_order: 'desc',
      agent_id: filters?.agent_id,
      county: filters?.county,
      ward: filters?.ward,
      status: filters?.status,
      lifecycle_stage: filters?.lifecycle_stage,
      answer_question_id: filters?.answer_question_id,
      answer_value: filters?.answer_value,
    });
    all.push(...res.responses);
    pages = res.pagination?.pages ?? 1;
    page += 1;
  }

  return all;
}
