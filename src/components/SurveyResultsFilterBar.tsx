import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Eraser, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { KenyaDateRangePicker } from '@/components/KenyaDateRangePicker';
import {
  dateFilterToParams,
  formatKenyaDateRange,
  rangeForPreset,
  reportPeriodHeading,
  resolvedDateRange,
  type DatePreset,
} from '@/lib/datetime';
import type { ResponseFacets } from '@/components/AnalyticsFilterBar';

export type SurveyListFilters = {
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
  agentIds: string[];
  ward: string;
  village: string;
};

export const EMPTY_SURVEY_LIST_FILTERS: SurveyListFilters = {
  datePreset: '',
  dateFrom: '',
  dateTo: '',
  agentIds: [],
  ward: '',
  village: '',
};

export function surveyListFiltersActive(f: SurveyListFilters): boolean {
  return Boolean(
    f.datePreset ||
      f.dateFrom ||
      f.dateTo ||
      f.agentIds.length ||
      f.ward ||
      f.village,
  );
}

/** Fill incomplete same-day ranges and named presets into calendar dates. */
export function normalizeSurveyListFilters(f: SurveyListFilters): SurveyListFilters {
  const named = f.datePreset && f.datePreset !== 'custom' ? rangeForPreset(f.datePreset) : null;
  if (named) {
    return { ...f, dateFrom: named.from, dateTo: named.to };
  }
  const from = f.dateFrom || f.dateTo;
  const to = f.dateTo || f.dateFrom;
  return {
    ...f,
    dateFrom: from,
    dateTo: to,
    datePreset: from ? 'custom' : '',
    agentIds: [...f.agentIds],
  };
}

/** Query params for GET /responses and /surveys/:id/analytics. */
export function surveyListFiltersToParams(f: SurveyListFilters): {
  date_from?: string;
  date_to?: string;
  agent_id?: string;
  agent_ids?: string;
  ward?: string;
  village?: string;
} {
  const n = normalizeSurveyListFilters(f);
  const params: {
    date_from?: string;
    date_to?: string;
    agent_id?: string;
    agent_ids?: string;
    ward?: string;
    village?: string;
  } = { ...dateFilterToParams(n) };
  if (n.agentIds.length === 1) params.agent_id = n.agentIds[0];
  else if (n.agentIds.length > 1) params.agent_ids = n.agentIds.join(',');
  if (n.ward) params.ward = n.ward;
  if (n.village) params.village = n.village;
  return params;
}

export function surveyListFilterSummary(
  f: SurveyListFilters,
  agents: { id: string; name: string }[],
): {
  dateLine: { title: 'Report Date' | 'Report Period'; value: string } | null;
  parts: string[];
} {
  const n = normalizeSurveyListFilters(f);
  const range = resolvedDateRange(n.datePreset, n.dateFrom, n.dateTo);
  const dateLine = range ? reportPeriodHeading(range.from, range.to) : null;
  const parts: string[] = [];
  if (n.agentIds.length) {
    const names = n.agentIds.map((id) => agents.find((a) => a.id === id)?.name || id);
    parts.push(names.length === 1 ? `Agent: ${names[0]}` : `Agents: ${names.join(', ')}`);
  }
  if (n.ward) parts.push(`Ward: ${n.ward}`);
  if (n.village) parts.push(`Village: ${n.village}`);
  return { dateLine, parts };
}

type AgentOption = { id: string; name: string };

type Props = {
  draft: SurveyListFilters;
  onDraftChange: (next: Partial<SurveyListFilters>) => void;
  onApply: () => void;
  onClear: () => void;
  applying?: boolean;
  agents: AgentOption[];
  facets?: ResponseFacets | null;
  matchCount?: number | null;
  loading?: boolean;
  heading?: string;
};

function SearchableMulti({
  label,
  placeholder,
  options,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: AgentOption[];
  values: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((o) => o.name.toLowerCase().includes(needle));
  }, [options, q]);
  const summary = values.length === 0
    ? placeholder
    : values.length === 1
      ? options.find((o) => o.id === values[0])?.name || '1 selected'
      : `${values.length} agents`;

  const toggle = (id: string) => {
    onChange(values.includes(id) ? values.filter((x) => x !== id) : [...values, id]);
  };

  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="font-display text-xs uppercase tracking-wide">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-between rounded-sm px-3 font-normal"
          >
            <span className="truncate">{summary}</span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[240px] rounded-sm p-2">
          <Input
            className="mb-2 h-8 rounded-sm"
            placeholder="Search agents…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">No agents</p>
            ) : (
              filtered.map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted/60"
                >
                  <Checkbox checked={values.includes(o.id)} onCheckedChange={() => toggle(o.id)} />
                  <span className="truncate">{o.name}</span>
                </label>
              ))
            )}
          </div>
          {values.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-7 w-full rounded-sm text-xs"
              onClick={() => onChange([])}
            >
              Clear agents
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((o) => o.toLowerCase().includes(needle));
  }, [options, q]);

  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="font-display text-xs uppercase tracking-wide">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-10 w-full justify-between rounded-sm px-3 font-normal"
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[220px] rounded-sm p-2">
          <Input
            className="mb-2 h-8 rounded-sm"
            placeholder={`Search ${label.toLowerCase()}…`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="max-h-56 overflow-y-auto">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted/60"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              {value ? null : <Check className="h-3.5 w-3.5" />}
              <span className={value ? 'pl-5' : ''}>{placeholder}</span>
            </button>
            {filtered.map((o) => (
              <button
                key={o}
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted/60"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
              >
                {value === o ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
                <span className="truncate">{o}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function SurveyResultsFilterBar({
  draft,
  onDraftChange,
  onApply,
  onClear,
  applying,
  agents,
  facets,
  matchCount,
  loading,
  heading = 'Filter collected surveys',
}: Props) {
  const villageOptions = useMemo(() => {
    if (draft.ward && facets?.villages_by_ward?.[draft.ward]) {
      return facets.villages_by_ward[draft.ward];
    }
    return facets?.villages || [];
  }, [draft.ward, facets]);

  const selectedRange = resolvedDateRange(draft.datePreset, draft.dateFrom, draft.dateTo);

  const setWard = (ward: string) => {
    const nextVillage =
      ward && draft.village && facets?.villages_by_ward?.[ward]?.includes(draft.village)
        ? draft.village
        : '';
    onDraftChange({ ward, village: nextVillage });
  };

  return (
    <div className="space-y-4 border border-border bg-card p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-display text-sm font-semibold">{heading}</h3>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Dates and times are Kenya time (EAT, UTC+03:00)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KenyaDateRangePicker
          dateFrom={draft.dateFrom}
          dateTo={draft.dateTo}
          onChange={(next) => onDraftChange(next)}
        />

        <SearchableMulti
          label="Agent"
          placeholder="All agents"
          options={agents}
          values={draft.agentIds}
          onChange={(agentIds) => onDraftChange({ agentIds })}
        />

        <SearchableSelect
          label="Ward"
          placeholder="All wards"
          options={facets?.wards || []}
          value={draft.ward}
          onChange={setWard}
        />

        <SearchableSelect
          label="Village"
          placeholder={draft.ward ? 'All villages in ward' : 'All villages'}
          options={villageOptions}
          value={draft.village}
          onChange={(village) => onDraftChange({ village })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" className="h-10 rounded-sm px-4" onClick={onApply} disabled={applying}>
          Apply filters
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-10 rounded-sm px-4"
          onClick={onClear}
          disabled={applying}
        >
          <Eraser className="mr-1.5 h-3.5 w-3.5" />
          Clear filters
        </Button>
        {matchCount != null && !loading ? (
          <p className="text-sm text-muted-foreground">
            <span className="ledger-count text-foreground">{matchCount}</span>{' '}
            {matchCount === 1 ? 'survey matches' : 'surveys match'} the current filters
          </p>
        ) : null}
      </div>

      {surveyListFiltersActive(draft) ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Selected:</span>
          {selectedRange ? (
            <FilterChip
              label={formatKenyaDateRange(selectedRange.from, selectedRange.to)}
              onRemove={() => onDraftChange({ datePreset: '', dateFrom: '', dateTo: '' })}
            />
          ) : null}
          {draft.agentIds.map((id) => (
            <FilterChip
              key={id}
              label={agents.find((a) => a.id === id)?.name || id.slice(0, 8)}
              onRemove={() => onDraftChange({ agentIds: draft.agentIds.filter((x) => x !== id) })}
            />
          ))}
          {draft.ward ? <FilterChip label={draft.ward} onRemove={() => setWard('')} /> : null}
          {draft.village ? (
            <FilterChip label={draft.village} onRemove={() => onDraftChange({ village: '' })} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-muted/40 px-2 py-1 text-xs"
      onClick={onRemove}
    >
      {label}
      <X className="h-3 w-3" />
    </button>
  );
}
