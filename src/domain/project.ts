export type ProjectStatus = 'active' | 'planning' | 'completed' | 'archived' | 'on_hold';

export type ResearchProject = {
  id: string;
  title: string;
  description?: string;
  client?: string;
  organisation?: string;
  funding_agency?: string;
  principal_investigator?: string;
  project_manager?: string;
  team_members?: string[];
  start_date?: string;
  end_date?: string;
  status: ProjectStatus | string;
  notes?: string;
  county_targets?: Record<string, number>;
  surveys_count?: number;
  active_surveys_count?: number;
  responses_count?: number;
  surveys?: unknown[];
  created_at?: string;
  updated_at?: string;
};

export function mapProjectFromApi(raw: Record<string, unknown>): ResearchProject {
  return {
    id: String(raw.id),
    title: String(raw.title ?? ''),
    description: raw.description as string | undefined,
    client: raw.client as string | undefined,
    organisation: raw.organisation as string | undefined,
    funding_agency: raw.funding_agency as string | undefined,
    principal_investigator: raw.principal_investigator as string | undefined,
    project_manager: raw.project_manager as string | undefined,
    team_members: Array.isArray(raw.team_members) ? (raw.team_members as string[]) : [],
    start_date: raw.start_date as string | undefined,
    end_date: raw.end_date as string | undefined,
    status: String(raw.status ?? 'active'),
    notes: raw.notes as string | undefined,
    county_targets: (raw.county_targets as Record<string, number>) || {},
    surveys_count: raw.surveys_count as number | undefined,
    active_surveys_count: raw.active_surveys_count as number | undefined,
    responses_count: raw.responses_count as number | undefined,
    surveys: raw.surveys as unknown[] | undefined,
    created_at: raw.created_at as string | undefined,
    updated_at: raw.updated_at as string | undefined,
  };
}
