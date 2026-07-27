export const LIFECYCLE_STAGES = [
  'draft',
  'pending_sync',
  'uploaded',
  'pending_review',
  'approved',
  'rejected',
  'archived',
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const RESPONSE_STATUSES = [
  'submitted',
  'pending_sync',
  'approved',
  'flagged',
  'rejected',
  'archived',
] as const;

export type ResponseStatus = (typeof RESPONSE_STATUSES)[number];

export const AGENT_STATUSES = ['active', 'inactive', 'pending'] as const;

export const SURVEY_STATUSES = ['draft', 'active', 'completed', 'archived'] as const;

export const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  draft: 'Draft',
  pending_sync: 'Pending sync',
  uploaded: 'Uploaded',
  pending_review: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
};
