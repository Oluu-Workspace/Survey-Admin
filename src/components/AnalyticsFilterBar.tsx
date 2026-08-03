import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LIFECYCLE_LABELS, LIFECYCLE_STAGES } from '@/domain/enums';

export type ResponseFacets = {
  counties: string[];
  wards: string[];
  statuses: string[];
  lifecycle_stages: string[];
  filterable_questions: Array<{ id: string; label: string; options: string[] }>;
};

export type AnalyticsFilters = {
  county: string;
  ward: string;
  status: string;
  lifecycle: string;
  answerQuestionId: string;
  answerValue: string;
};

type Props = {
  facets: ResponseFacets | null;
  filters: AnalyticsFilters;
  onChange: (next: Partial<AnalyticsFilters>) => void;
  agents: { id: string; name: string }[];
  selectedAgentId?: string;
  onAgentChange?: (id: string) => void;
  compareBy?: string;
  compareOptions?: { id: string; label: string }[];
  onCompareByChange?: (id: string) => void;
  loading?: boolean;
};

export function AnalyticsFilterBar({
  facets,
  filters,
  onChange,
  agents,
  selectedAgentId,
  onAgentChange,
  compareBy,
  compareOptions = [],
  onCompareByChange,
  loading,
}: Props) {
  const answerQuestion = facets?.filterable_questions.find((q) => q.id === filters.answerQuestionId);

  return (
    <div className="flex flex-wrap items-end gap-3 border border-border bg-card p-3">
      <div className="space-y-1">
        <Label className="font-display text-xs uppercase tracking-wide">Agent</Label>
        <Select
          value={selectedAgentId || 'all'}
          onValueChange={(v) => onAgentChange?.(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="h-9 w-[180px] rounded-sm">
            <SelectValue placeholder="All agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="font-display text-xs uppercase tracking-wide">County</Label>
        <Select
          value={filters.county || 'all'}
          onValueChange={(v) => onChange({ county: v === 'all' ? '' : v, ward: '' })}
        >
          <SelectTrigger className="h-9 w-[150px] rounded-sm">
            <SelectValue placeholder="All counties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All counties</SelectItem>
            {(facets?.counties || []).map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="font-display text-xs uppercase tracking-wide">Ward</Label>
        <Select
          value={filters.ward || 'all'}
          onValueChange={(v) => onChange({ ward: v === 'all' ? '' : v })}
        >
          <SelectTrigger className="h-9 w-[150px] rounded-sm">
            <SelectValue placeholder="All wards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All wards</SelectItem>
            {(facets?.wards || []).map((w) => (
              <SelectItem key={w} value={w}>
                {w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="font-display text-xs uppercase tracking-wide">Status</Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(v) => onChange({ status: v === 'all' ? '' : v })}
        >
          <SelectTrigger className="h-9 w-[130px] rounded-sm">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {(facets?.statuses || ['submitted', 'approved', 'validated', 'flagged', 'rejected']).map(
              (s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="font-display text-xs uppercase tracking-wide">Stage</Label>
        <Select
          value={filters.lifecycle || 'all'}
          onValueChange={(v) => onChange({ lifecycle: v === 'all' ? '' : v })}
        >
          <SelectTrigger className="h-9 w-[140px] rounded-sm">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {LIFECYCLE_STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {LIFECYCLE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="font-display text-xs uppercase tracking-wide">Filter by answer</Label>
        <Select
          value={filters.answerQuestionId || 'none'}
          onValueChange={(v) =>
            onChange({
              answerQuestionId: v === 'none' ? '' : v,
              answerValue: '',
            })
          }
        >
          <SelectTrigger className="h-9 w-[200px] rounded-sm">
            <SelectValue placeholder="Question" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Any answer</SelectItem>
            {(facets?.filterable_questions || []).map((q) => (
              <SelectItem key={q.id} value={q.id}>
                {q.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {answerQuestion ? (
        <div className="space-y-1">
          <Label className="font-display text-xs uppercase tracking-wide">Answer value</Label>
          <Select
            value={filters.answerValue || 'all'}
            onValueChange={(v) => onChange({ answerValue: v === 'all' ? '' : v })}
          >
            <SelectTrigger className="h-9 w-[160px] rounded-sm">
              <SelectValue placeholder="Value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any value</SelectItem>
              {answerQuestion.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="space-y-1">
        <Label className="font-display text-xs uppercase tracking-wide">Compare by</Label>
        <Select
          value={compareBy || compareOptions[0]?.id || ''}
          onValueChange={(v) => onCompareByChange?.(v)}
          disabled={!compareOptions.length}
        >
          <SelectTrigger className="h-9 w-[200px] rounded-sm">
            <SelectValue placeholder="Demographics" />
          </SelectTrigger>
          <SelectContent>
            {compareOptions.map((q) => (
              <SelectItem key={q.id} value={q.id}>
                {q.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <span className="pb-2 text-xs text-muted-foreground">Updating charts…</span>
      ) : null}
    </div>
  );
}
