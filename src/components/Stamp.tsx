import { cn } from '@/lib/utils';

export type StampKind =
  | 'active'
  | 'draft'
  | 'closed'
  | 'completed'
  | 'suspended'
  | 'pending'
  | 'waiting'
  | 'collecting'
  | 'synced'
  | 'approved'
  | 'flagged'
  | 'submitted'
  | 'validated'
  | 'rejected'
  | 'inactive'
  | 'pending_sync'
  | 'pending_review'
  | 'uploaded'
  | 'archived';

const LABEL: Record<string, string> = {
  active: 'Ongoing',
  draft: 'Not started',
  closed: 'Closed',
  completed: 'Complete',
  complete: 'Complete',
  not_started: 'Not started',
  ongoing: 'Ongoing',
  suspended: 'Suspended',
  pending: 'Pending',
  waiting: 'Waiting',
  collecting: 'Collecting',
  synced: 'Synced today',
  synced_today: 'Synced today',
  approved: 'Approved',
  validated: 'Approved',
  flagged: 'Flagged',
  submitted: 'Submitted',
  rejected: 'Flagged',
  inactive: 'Suspended',
  deactivated: 'Suspended',
  pending_sync: 'Pending sync',
  pending_review: 'Pending review',
  uploaded: 'Uploaded',
  archived: 'Closed',
  open: 'Ongoing',
  answered: 'Answered',
  resolved: 'Resolved',
};

const CLASS: Record<string, string> = {
  active: 'stamp-active',
  draft: 'stamp-draft',
  closed: 'stamp-closed',
  completed: 'stamp-approved',
  complete: 'stamp-approved',
  not_started: 'stamp-draft',
  ongoing: 'stamp-active',
  suspended: 'stamp-suspended',
  pending: 'stamp-pending',
  waiting: 'stamp-waiting',
  collecting: 'stamp-collecting',
  synced: 'stamp-synced',
  synced_today: 'stamp-synced',
  approved: 'stamp-approved',
  validated: 'stamp-approved',
  flagged: 'stamp-flagged',
  submitted: 'stamp-waiting',
  rejected: 'stamp-flagged',
  inactive: 'stamp-suspended',
  deactivated: 'stamp-suspended',
  pending_sync: 'stamp-pending',
  pending_review: 'stamp-waiting',
  uploaded: 'stamp-collecting',
  archived: 'stamp-closed',
  open: 'stamp-active',
  answered: 'stamp-collecting',
  resolved: 'stamp-approved',
};

export function Stamp({
  status,
  className,
  label,
}: {
  status: string;
  className?: string;
  label?: string;
}) {
  const key = (status || 'draft').toLowerCase().replace(/\s+/g, '_');
  const text = label || LABEL[key] || status;
  const tone = CLASS[key] || 'stamp-draft';

  return <span className={cn('stamp', tone, className)}>{text}</span>;
}
