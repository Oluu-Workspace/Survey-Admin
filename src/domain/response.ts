import type { LifecycleStage, ResponseStatus } from './enums';
import { normalizeLocation, type AdminLocation } from './location';

export type Respondent = {
  name: string;
  phone_number: string;
  gender: string;
  age: number | null;
  consent: boolean;
};

export type ReviewEvent = {
  at?: string;
  by?: string;
  notes?: string;
  status?: string;
};

export type ResponseMetadata = {
  is_offline?: boolean;
  duration_seconds?: number | null;
  gps_accuracy_m?: number | null;
  respondent_code?: string;
  attachments?: unknown[];
  [key: string]: unknown;
};

/** Canonical response shape (matches backend normalization). */
export type SurveyResponse = {
  id: string;
  survey_id: string;
  project_id: string;
  agent_id: string;
  respondent: Respondent;
  location: AdminLocation;
  submitted_at?: string;
  synced_at?: string;
  created_at?: string;
  updated_at?: string;
  status: ResponseStatus | string;
  lifecycle_stage: LifecycleStage;
  validation_status: string;
  answers: Record<string, unknown>;
  metadata: ResponseMetadata;
  validation_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_history: ReviewEvent[];
  quality_score: number;
  survey_title?: string;
  project_title?: string;
  agent_name?: string;
};

export function mapResponseFromApi(raw: Record<string, unknown>): SurveyResponse {
  const respondentRaw = (raw.respondent as Record<string, unknown>) || {};
  return {
    id: String(raw.id),
    survey_id: String(raw.survey_id ?? ''),
    project_id: String(raw.project_id ?? raw.survey_id ?? ''),
    agent_id: String(raw.agent_id ?? ''),
    respondent: {
      name: String(respondentRaw.name ?? ''),
      phone_number: String(
        respondentRaw.phone_number ?? respondentRaw.phoneNumber ?? '',
      ),
      gender: String(respondentRaw.gender ?? respondentRaw.sex ?? ''),
      age:
        typeof respondentRaw.age === 'number'
          ? respondentRaw.age
          : respondentRaw.age != null
            ? Number(respondentRaw.age)
            : null,
      consent: Boolean(respondentRaw.consent ?? true),
    },
    location: normalizeLocation(raw.location),
    submitted_at: raw.submitted_at as string | undefined,
    synced_at: raw.synced_at as string | undefined,
    created_at: raw.created_at as string | undefined,
    updated_at: raw.updated_at as string | undefined,
    status: String(raw.status ?? 'submitted'),
    lifecycle_stage: (raw.lifecycle_stage as LifecycleStage) ?? 'pending_review',
    validation_status: String(raw.validation_status ?? 'pending'),
    answers: (raw.answers as Record<string, unknown>) ?? {},
    metadata: (raw.metadata as ResponseMetadata) ?? {},
    validation_notes: raw.validation_notes as string | undefined,
    reviewed_by: raw.reviewed_by as string | undefined,
    reviewed_at: raw.reviewed_at as string | undefined,
    review_history: Array.isArray(raw.review_history)
      ? (raw.review_history as ReviewEvent[])
      : [],
    quality_score: Number(raw.quality_score ?? 0),
    survey_title: raw.survey_title as string | undefined,
    project_title: raw.project_title as string | undefined,
    agent_name: raw.agent_name as string | undefined,
  };
}

export function exportResponsesCsv(rows: SurveyResponse[], filename: string) {
  const headers = [
    'id',
    'survey_title',
    'project_id',
    'respondent_name',
    'phone',
    'gender',
    'age',
    'county',
    'subcounty',
    'ward',
    'village',
    'agent_name',
    'submitted_at',
    'duration_seconds',
    'status',
    'lifecycle_stage',
    'quality_score',
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    const cells = [
      r.id,
      r.survey_title ?? '',
      r.project_id,
      r.respondent.name,
      r.respondent.phone_number,
      r.respondent.gender,
      r.respondent.age ?? '',
      r.location.county,
      r.location.subcounty,
      r.location.ward,
      r.location.village,
      r.agent_name ?? '',
      r.submitted_at ?? '',
      r.metadata.duration_seconds ?? '',
      r.status,
      r.lifecycle_stage,
      r.quality_score,
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`);
    lines.push(cells.join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
