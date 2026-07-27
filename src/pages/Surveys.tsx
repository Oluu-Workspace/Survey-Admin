import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Play, Pause, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { surveysAPI, responsesAPI } from '@/services/api';
import { Stamp } from '@/components/Stamp';
import { TablePagination } from '@/components/TablePagination';
import { normalizeQuestions } from '@/lib/questions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

type SurveyRecord = {
  id: string;
  title: string;
  description?: string;
  status: string;
  questions?: unknown[];
  assigned_agents?: string[];
  assigned_agents_count?: number;
  ward?: string;
  village?: string;
  target_submissions?: number;
};

const Surveys = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState({
    title: '',
    description: '',
    target_submissions: 100,
    ward: '',
    village: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [surveysRes, responsesRes] = await Promise.all([
        surveysAPI.getAll({ limit: 100 }),
        responsesAPI.getAll({ limit: 500 }),
      ]);
      setSurveys(surveysRes.surveys || surveysRes || []);
      const map: Record<string, number> = {};
      for (const r of responsesRes.responses || responsesRes || []) {
        if (r.survey_id) map[r.survey_id] = (map[r.survey_id] || 0) + 1;
      }
      setCounts(map);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not load surveys');
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return surveys.filter((s) => {
      const match =
        !q ||
        s.title?.toLowerCase().includes(q) ||
        s.ward?.toLowerCase().includes(q) ||
        s.village?.toLowerCase().includes(q);
      return match && (statusFilter === 'all' || s.status === statusFilter);
    });
  }, [surveys, searchTerm, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const paginatedSurveys = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  const createSurvey = async () => {
    if (!form.title.trim()) {
      toast.error('Title required');
      return;
    }
    setSaving(true);
    try {
      const assigned_regions =
        form.ward || form.village
          ? [{ ward: form.ward || undefined, village: form.village || undefined }]
          : [];
      const res = await surveysAPI.create({
        title: form.title.trim(),
        description: form.description.trim(),
        target_submissions: Number(form.target_submissions) || 0,
        assigned_regions,
        status: 'draft',
        questions: [],
      });
      toast.success('Draft created — add questions next');
      setCreateOpen(false);
      setForm({ title: '', description: '', target_submissions: 100, ward: '', village: '' });
      const id = res.survey?.id || res.id;
      if (id) navigate(`/dashboard/surveys/${id}?tab=questions`);
      else await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (survey: SurveyRecord, status: string) => {
    const qCount = normalizeQuestions(survey.questions).length;
    if (status === 'active' && qCount === 0) {
      toast.error('Add at least one question before activating');
      return;
    }
    try {
      await surveysAPI.update(survey.id, { status });
      toast.success(status === 'active' ? 'Survey is open for collection' : 'Survey closed');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Update failed');
    }
  };

  const removeSurvey = async (survey: SurveyRecord) => {
    if (!window.confirm(`Delete “${survey.title}”?`)) return;
    try {
      await surveysAPI.delete(survey.id);
      toast.success('Deleted');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Campaigns and their field data.</p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New survey
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-sm">
            <DialogHeader>
              <DialogTitle className="font-display">New survey</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="font-display text-xs uppercase tracking-wide">Title</Label>
                <Input
                  className="rounded-sm"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-display text-xs uppercase tracking-wide">Description</Label>
                <Textarea
                  className="rounded-sm"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-display text-xs uppercase tracking-wide">
                  Target submissions
                </Label>
                <Input
                  className="rounded-sm font-mono"
                  type="number"
                  min={0}
                  value={form.target_submissions}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, target_submissions: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-display text-xs uppercase tracking-wide">Ward</Label>
                  <Input
                    className="rounded-sm"
                    value={form.ward}
                    onChange={(e) => setForm((f) => ({ ...f, ward: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-display text-xs uppercase tracking-wide">Village</Label>
                  <Input
                    className="rounded-sm"
                    value={form.village}
                    onChange={(e) => setForm((f) => ({ ...f, village: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Questions are added on the next screen.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-sm" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button className="rounded-sm" onClick={() => void createSurvey()} disabled={saving}>
                {saving ? 'Creating…' : 'Create draft'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 rounded-sm pl-9"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[140px] rounded-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          No surveys yet — create one to get started.
        </p>
      ) : (
        <div className="overflow-hidden border border-border bg-card">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Survey</th>
                <th>Status</th>
                <th>Area</th>
                <th className="text-right">Questions</th>
                <th className="text-right">Agents</th>
                <th className="text-right">Data</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {paginatedSurveys.map((survey) => {
                const qCount = normalizeQuestions(survey.questions).length;
                const agents =
                  survey.assigned_agents_count ?? survey.assigned_agents?.length ?? 0;
                return (
                  <tr
                    key={survey.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(
                        counts[survey.id]
                          ? `/dashboard/surveys/${survey.id}?tab=data`
                          : `/dashboard/surveys/${survey.id}`,
                      )
                    }
                  >
                    <td className="font-display font-medium">{survey.title}</td>
                    <td>
                      <Stamp status={survey.status} />
                    </td>
                    <td className="text-muted-foreground">
                      {[survey.ward, survey.village].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="text-right">
                      <span className="ledger-count">{qCount}</span>
                    </td>
                    <td className="text-right">
                      <span className="ledger-count">{agents}</span>
                    </td>
                    <td className="text-right">
                      <span className="ledger-count">{counts[survey.id] ?? 0}</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-sm">
                          <DropdownMenuItem
                            onClick={() => navigate(`/dashboard/surveys/${survey.id}?tab=data`)}
                          >
                            Data & analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/dashboard/surveys/${survey.id}?tab=agents`)}
                          >
                            Assign agents
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/dashboard/data?survey=${survey.id}`)}
                          >
                            Data Explorer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {survey.status !== 'active' ? (
                            <DropdownMenuItem
                              disabled={qCount === 0}
                              onClick={() => void setStatus(survey, 'active')}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              {qCount === 0 ? 'Activate (add questions first)' : 'Activate'}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => void setStatus(survey, 'closed')}>
                              <Pause className="mr-2 h-4 w-4" /> Close
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => void removeSurvey(survey)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <TablePagination
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Surveys;
