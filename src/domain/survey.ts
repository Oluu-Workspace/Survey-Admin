import { normalizeLocation } from './location';
import { normalizeQuestions, type SurveyQuestion } from './question';

export type Survey = {
  id: string;
  title: string;
  description?: string;
  status: string;
  project_id: string;
  target_submissions?: number;
  assigned_agents: string[];
  assigned_regions: ReturnType<typeof normalizeLocation>[];
  questions: SurveyQuestion[];
  county?: string;
  subcounty?: string;
  ward?: string;
  village?: string;
  created_at?: string;
  updated_at?: string;
};

export function mapSurveyFromApi(raw: Record<string, unknown>): Survey {
  const regions = Array.isArray(raw.assigned_regions)
    ? raw.assigned_regions.map((r) => normalizeLocation(r))
    : [];
  const loc =
    regions[0] ??
    normalizeLocation({
      county: raw.county,
      subcounty: raw.subcounty ?? raw.subCounty,
      ward: raw.ward,
      village: raw.village,
    });
  return {
    id: String(raw.id),
    title: String(raw.title ?? ''),
    description: raw.description as string | undefined,
    status: String(raw.status ?? 'draft'),
    project_id: String(raw.project_id ?? raw.id),
    target_submissions: raw.target_submissions as number | undefined,
    assigned_agents: Array.isArray(raw.assigned_agents)
      ? (raw.assigned_agents as string[])
      : [],
    assigned_regions: regions.length ? regions : [loc],
    questions: normalizeQuestions(raw.questions),
    county: loc.county,
    subcounty: loc.subcounty,
    ward: loc.ward,
    village: loc.village,
    created_at: raw.created_at as string | undefined,
    updated_at: raw.updated_at as string | undefined,
  };
}
