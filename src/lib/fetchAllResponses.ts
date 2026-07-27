import { responsesAPI } from '@/services/api';
import type { SurveyResponse } from '@/domain';

/** Fetch every response for a survey (paginated API, max 500 per page). */
export async function fetchAllSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
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
    });
    all.push(...res.responses);
    pages = res.pagination?.pages ?? 1;
    page += 1;
  }

  return all;
}
