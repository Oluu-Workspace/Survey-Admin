import { responsesAPI } from '@/services/api';
import type { SurveyResponse } from '@/domain';

export type ResponseFetchFilters = {
  agent_id?: string;
  agent_ids?: string;
  county?: string;
  ward?: string;
  village?: string;
  status?: string;
  lifecycle_stage?: string;
  answer_question_id?: string;
  answer_value?: string;
  date_preset?: string;
  date_from?: string;
  date_to?: string;
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
      agent_ids: filters?.agent_ids,
      county: filters?.county,
      ward: filters?.ward,
      village: filters?.village,
      status: filters?.status,
      lifecycle_stage: filters?.lifecycle_stage,
      answer_question_id: filters?.answer_question_id,
      answer_value: filters?.answer_value,
      date_preset: filters?.date_preset,
      date_from: filters?.date_from,
      date_to: filters?.date_to,
    });
    all.push(...res.responses);
    pages = res.pagination?.pages ?? 1;
    page += 1;
  }

  return all;
}
