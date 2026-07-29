import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronDown,
  Columns3,
  Download,
  Filter,
  Group,
  RefreshCw,
  Save,
  Search,
} from 'lucide-react';
import { responsesAPI, surveysAPI } from '@/services/api';
import type { SurveyResponse } from '@/domain';
import { LIFECYCLE_LABELS, LIFECYCLE_STAGES } from '@/domain/enums';
import { exportResponsesCsv } from '@/domain/response';
import { normalizeQuestions, type SurveyQuestion } from '@/domain/question';
import { exportResponsesCsv as exportWithAnswers } from '@/lib/analytics';
import { ResponseDetailPanel } from '@/components/ResponseDetailPanel';
import { Stamp } from '@/components/Stamp';
import { TablePagination } from '@/components/TablePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const VIEWS_KEY = 'tafiti-survey-data-views';

type ColumnKey =
  | 'id'
  | 'project'
  | 'respondent'
  | 'phone'
  | 'gender'
  | 'age'
  | 'county'
  | 'subcounty'
  | 'ward'
  | 'village'
  | 'agent'
  | 'submitted'
  | 'duration'
  | 'status'
  | 'lifecycle'
  | 'quality';

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'id', label: 'Response ID' },
  { key: 'project', label: 'Project' },
  { key: 'respondent', label: 'Respondent' },
  { key: 'phone', label: 'Phone' },
  { key: 'gender', label: 'Gender' },
  { key: 'age', label: 'Age' },
  { key: 'county', label: 'County' },
  { key: 'subcounty', label: 'Sub County' },
  { key: 'ward', label: 'Ward' },
  { key: 'village', label: 'Village' },
  { key: 'agent', label: 'Agent' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'duration', label: 'Duration' },
  { key: 'status', label: 'Status' },
  { key: 'lifecycle', label: 'Stage' },
  { key: 'quality', label: 'Quality' },
];

type SavedView = {
  id: string;
  name: string;
  surveyId: string;
  visibleColumns: ColumnKey[];
  lifecycle: string;
  status: string;
  groupBy: string;
};

function loadViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(VIEWS_KEY);
    return raw ? (JSON.parse(raw) as SavedView[]) : [];
  } catch {
    return [];
  }
}

function persistViews(views: SavedView[]) {
  localStorage.setItem(VIEWS_KEY, JSON.stringify(views));
}

const defaultVisible: ColumnKey[] = [
  'gender',
  'age',
  'county',
  'subcounty',
  'ward',
  'village',
  'agent',
  'submitted',
];

export type SurveyDataExplorerProps = {
  surveyId: string;
  surveyTitle?: string;
  questions?: SurveyQuestion[];
  agentFilter?: string;
  agentOptions?: { id: string; name: string }[];
  onAgentFilterChange?: (agentId: string) => void;
  onResponsesChange?: () => void;
  variant?: 'embedded' | 'full';
  emptyState?: React.ReactNode;
};

export function SurveyDataExplorer({
  surveyId,
  surveyTitle,
  questions: questionsProp,
  agentFilter = '',
  agentOptions = [],
  onAgentFilterChange,
  onResponsesChange,
  variant = 'embedded',
  emptyState,
}: SurveyDataExplorerProps) {
  const [rows, setRows] = useState<SurveyResponse[]>([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: 25, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [lifecycle, setLifecycle] = useState('all');
  const [status, setStatus] = useState('all');
  const [county, setCounty] = useState('');
  const [sortBy, setSortBy] = useState('submitted_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState<string>('none');
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(defaultVisible);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>(loadViews);
  const [questions, setQuestions] = useState<SurveyQuestion[]>(questionsProp || []);

  useEffect(() => {
    if (questionsProp?.length) setQuestions(questionsProp);
  }, [questionsProp]);

  useEffect(() => {
    if (questionsProp?.length || !surveyId) return;
    void surveysAPI.getById(surveyId).then((data) => {
      const s = data.survey || data;
      setQuestions(normalizeQuestions(s.questions));
    });
  }, [surveyId, questionsProp]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    if (!surveyId) return;
    setLoading(true);
    try {
      const res = await responsesAPI.getAll({
        page: pagination.page,
        per_page: pagination.per_page,
        search: debouncedSearch || undefined,
        lifecycle_stage: lifecycle !== 'all' ? lifecycle : undefined,
        status: status !== 'all' ? status : undefined,
        survey_id: surveyId,
        agent_id: agentFilter || undefined,
        county: county || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setRows(res.responses);
      setPagination((p) => ({ ...p, ...res.pagination }));
    } catch {
      toast.error('Could not load survey responses');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [
    surveyId,
    pagination.page,
    pagination.per_page,
    debouncedSearch,
    lifecycle,
    status,
    agentFilter,
    county,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [debouncedSearch, lifecycle, status, agentFilter, county, sortBy, sortOrder, surveyId]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  useEffect(() => {
    if (selected) setNotes(selected.validation_notes || '');
  }, [selected?.id]);

  const counties = useMemo(() => {
    const set = new Set(rows.map((r) => r.location.county).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const grouped = useMemo(() => {
    if (groupBy === 'none') return [{ key: 'All', items: rows }];
    const map = new Map<string, SurveyResponse[]>();
    for (const r of rows) {
      let key = '—';
      if (groupBy === 'county') key = r.location.county;
      if (groupBy === 'ward') key = r.location.ward;
      if (groupBy === 'agent') key = r.agent_name || r.agent_id;
      if (groupBy === 'lifecycle') key = LIFECYCLE_LABELS[r.lifecycle_stage];
      if (groupBy === 'status') key = String(r.status);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  }, [rows, groupBy]);

  const surveyViews = useMemo(
    () => savedViews.filter((v) => v.surveyId === surveyId),
    [savedViews, surveyId],
  );

  const toggleCol = (key: ColumnKey) => {
    setVisibleColumns((cols) =>
      cols.includes(key) ? cols.filter((c) => c !== key) : [...cols, key],
    );
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runValidate = async (id: string, payload: Parameters<typeof responsesAPI.validate>[1]) => {
    setActionBusy(true);
    try {
      await responsesAPI.validate(id, payload);
      toast.success('Updated');
      setNotes('');
      await fetchData();
      onResponsesChange?.();
    } catch {
      toast.error('Action failed');
    } finally {
      setActionBusy(false);
    }
  };

  const bulkApprove = async () => {
    for (const id of selectedIds) {
      await responsesAPI.validate(id, { status: 'approved', validation_notes: notes });
    }
    toast.success(`Approved ${selectedIds.size} responses`);
    setSelectedIds(new Set());
    await fetchData();
    onResponsesChange?.();
  };

  const saveCurrentView = () => {
    const name = window.prompt('Name this view');
    if (!name) return;
    const view: SavedView = {
      id: crypto.randomUUID(),
      name,
      surveyId,
      visibleColumns,
      lifecycle,
      status,
      groupBy,
    };
    const next = [...savedViews, view];
    setSavedViews(next);
    persistViews(next);
    toast.success('View saved');
  };

  const applyView = (v: SavedView) => {
    setVisibleColumns(v.visibleColumns);
    setLifecycle(v.lifecycle);
    setStatus(v.status);
    setGroupBy(v.groupBy);
  };

  const exportSelected = () => {
    const toExport = rows.filter((r) => selectedIds.has(r.id));
    if (!toExport.length) {
      toast.error('Select rows to export');
      return;
    }
    const name = `${surveyTitle || 'survey'}-${new Date().toISOString().slice(0, 10)}.csv`;
    if (questions.length) {
      exportWithAnswers(surveyTitle || 'survey', questions, toExport as never);
    } else {
      exportResponsesCsv(toExport, name);
    }
  };

  const renderCell = (r: SurveyResponse, key: ColumnKey) => {
    switch (key) {
      case 'id':
        return <span className="font-mono text-xs">{r.id.slice(0, 8)}…</span>;
      case 'project':
        return r.project_id ? (
          <Link
            to={`/dashboard/projects/${r.project_id}`}
            className="text-sm text-primary underline-offset-2 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {r.project_title || r.project_id.slice(0, 8)}
          </Link>
        ) : (
          '—'
        );
      case 'respondent':
        return r.respondent.name || '—';
      case 'phone':
        return r.respondent.phone_number || '—';
      case 'gender':
        return r.respondent.gender || '—';
      case 'age':
        return r.respondent.age ?? '—';
      case 'county':
        return r.location.county;
      case 'subcounty':
        return r.location.subcounty;
      case 'ward':
        return r.location.ward;
      case 'village':
        return r.location.village;
      case 'agent':
        return r.agent_name || r.agent_id.slice(0, 8);
      case 'submitted':
        return r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—';
      case 'duration':
        return r.metadata.duration_seconds != null
          ? `${Math.round(Number(r.metadata.duration_seconds) / 60)}m`
          : '—';
      case 'status':
        return <Stamp status={r.status} />;
      case 'lifecycle':
        return <Stamp status={r.lifecycle_stage} label={LIFECYCLE_LABELS[r.lifecycle_stage]} />;
      case 'quality':
        return `${r.quality_score}%`;
      default:
        return '—';
    }
  };

  const heightClass =
    variant === 'full' ? 'h-[calc(100vh-7rem)] min-h-[480px]' : 'min-h-[420px] h-[calc(100vh-14rem)]';

  const showEmpty = !loading && pagination.total === 0 && !debouncedSearch && lifecycle === 'all' && status === 'all';

  return (
    <div className={`flex flex-col gap-3 ${heightClass}`}>
      <div className="flex flex-wrap items-center gap-2 border border-border bg-card px-3 py-2">
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-sm border border-input bg-background px-2 py-1.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            placeholder="Search this survey…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {agentOptions.length > 0 && onAgentFilterChange ? (
          <div className="space-y-0">
            <Label className="sr-only">Agent</Label>
            <Select
              value={agentFilter || 'all'}
              onValueChange={(v) => onAgentFilterChange(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="h-9 w-[160px] rounded-sm">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {agentOptions.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <Select value={lifecycle} onValueChange={setLifecycle}>
          <SelectTrigger className="h-9 w-[150px] rounded-sm">
            <Filter className="mr-1 h-3.5 w-3.5" />
            <SelectValue placeholder="Stage" />
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
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[130px] rounded-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="validated">Validated</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={county || 'all'} onValueChange={(v) => setCounty(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 w-[130px] rounded-sm">
            <SelectValue placeholder="County" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All counties</SelectItem>
            {counties.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger className="h-9 w-[120px] rounded-sm">
            <Group className="mr-1 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No grouping</SelectItem>
            <SelectItem value="county">County</SelectItem>
            <SelectItem value="ward">Ward</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="lifecycle">Stage</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 rounded-sm">
              <Columns3 className="mr-1 h-3.5 w-3.5" />
              Columns
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_COLUMNS.map((c) => (
              <DropdownMenuCheckboxItem
                key={c.key}
                checked={visibleColumns.includes(c.key)}
                onCheckedChange={() => toggleCol(c.key)}
              >
                {c.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 rounded-sm">
              <Save className="mr-1 h-3.5 w-3.5" />
              Views
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={saveCurrentView}>Save current view</DropdownMenuItem>
            <DropdownMenuSeparator />
            {surveyViews.length === 0 ? (
              <DropdownMenuItem disabled>No saved views</DropdownMenuItem>
            ) : (
              surveyViews.map((v) => (
                <DropdownMenuItem key={v.id} onClick={() => applyView(v)}>
                  {v.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-sm"
          onClick={() => void fetchData()}
          disabled={loading}
        >
          <RefreshCw className={`mr-1 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm" className="h-9 rounded-sm" onClick={exportSelected}>
          <Download className="mr-1 h-3.5 w-3.5" />
          Export
        </Button>
        {selectedIds.size > 0 ? (
          <Button size="sm" className="h-9 rounded-sm" onClick={() => void bulkApprove()}>
            Approve {selectedIds.size}
          </Button>
        ) : null}
      </div>

      {showEmpty && emptyState ? (
        emptyState
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden border border-border bg-card">
          <div className={`flex min-w-0 flex-col ${selected ? 'w-[58%]' : 'w-full'}`}>
            <div className="border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
              {loading ? 'Loading…' : (
                <>
                  <span className="ledger-count">{pagination.total}</span> submission
                  {pagination.total === 1 ? '' : 's'}
                  {surveyTitle ? ` · ${surveyTitle}` : ''}
                  {agentFilter
                    ? ` · ${agentOptions.find((a) => a.id === agentFilter)?.name || 'Agent filter'}`
                    : ''}
                </>
              )}
            </div>
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  Loading responses…
                </div>
              ) : rows.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  No rows match these filters.
                </div>
              ) : (
                grouped.map((group) => (
                  <div key={group.key}>
                    {groupBy !== 'none' ? (
                      <div className="sticky top-0 z-10 border-b border-border bg-muted/80 px-3 py-1.5 text-xs font-medium uppercase tracking-wide">
                        {group.key} ({group.items.length})
                      </div>
                    ) : null}
                    <table className="ledger-table w-full min-w-[900px]">
                      <thead className="sticky top-0 z-[5] bg-card shadow-sm">
                        <tr>
                          <th className="w-10">
                            <span className="sr-only">Select</span>
                          </th>
                          {ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key)).map((c) => (
                            <th
                              key={c.key}
                              className="cursor-pointer whitespace-nowrap text-xs"
                              onClick={() => {
                                const map: Partial<Record<ColumnKey, string>> = {
                                  submitted: 'submitted_at',
                                  quality: 'quality_score',
                                  lifecycle: 'lifecycle_stage',
                                };
                                const field = map[c.key] || c.key;
                                if (sortBy === field) {
                                  setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                                } else {
                                  setSortBy(field);
                                  setSortOrder('desc');
                                }
                              }}
                            >
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((r) => (
                          <tr
                            key={r.id}
                            className={`cursor-pointer ${selectedId === r.id ? 'bg-primary/5' : ''}`}
                            onClick={() => setSelectedId(r.id)}
                          >
                            <td onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.has(r.id)}
                                onCheckedChange={() => toggleRow(r.id)}
                              />
                            </td>
                            {ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key)).map((c) => (
                              <td key={c.key} className="whitespace-nowrap text-sm">
                                {renderCell(r, c.key)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border px-2 py-2">
              <TablePagination
                page={pagination.page}
                pageSize={pagination.per_page}
                total={pagination.total}
                onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
                onPageSizeChange={(per_page) => setPagination((p) => ({ ...p, per_page, page: 1 }))}
              />
            </div>
          </div>
          {selected ? (
            <div className="w-[42%] min-w-[320px]">
              <ResponseDetailPanel
                response={selected}
                questions={questions}
                notes={notes}
                onNotesChange={setNotes}
                busy={actionBusy}
                onApprove={() =>
                  void runValidate(selected.id, {
                    status: 'approved',
                    validation_notes: notes,
                  })
                }
                onFlag={() =>
                  void runValidate(selected.id, {
                    status: 'flagged',
                    flag: true,
                    validation_notes: notes,
                  })
                }
                onReject={() =>
                  void runValidate(selected.id, {
                    status: 'rejected',
                    is_valid: false,
                    validation_notes: notes,
                  })
                }
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
