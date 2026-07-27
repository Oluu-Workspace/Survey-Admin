import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { projectsAPI } from '@/services/api';
import { mapProjectFromApi, type ResearchProject } from '@/domain/project';
import { Stamp } from '@/components/Stamp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', client: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await projectsAPI.getAll();
      setProjects((data.projects || []).map((p: Record<string, unknown>) => mapProjectFromApi(p)));
    } catch {
      toast.error('Could not load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return projects.filter(
      (p) =>
        !s ||
        p.title.toLowerCase().includes(s) ||
        (p.client || '').toLowerCase().includes(s),
    );
  }, [projects, q]);

  const create = async () => {
    if (!form.title.trim()) {
      toast.error('Title required');
      return;
    }
    setSaving(true);
    try {
      const res = await projectsAPI.create({
        title: form.title.trim(),
        description: form.description.trim(),
        client: form.client.trim(),
        status: 'active',
      });
      toast.success('Project created');
      setOpen(false);
      setForm({ title: '', description: '', client: '' });
      const id = res.project?.id;
      if (id) navigate(`/dashboard/projects/${id}`);
      else await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Create failed');
    } finally {
      setSaving(false);
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
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Research projects</h2>
          <p className="text-sm text-muted-foreground">
            Programs that group surveys, teams, and reporting.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-sm">
              <Plus className="mr-1 h-4 w-4" />
              New project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New research project</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Client</Label>
                <Input
                  value={form.client}
                  onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void create()} disabled={saving}>
                {saving ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          placeholder="Search projects…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-hidden border border-border bg-card">
        <table className="ledger-table w-full">
          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>Surveys</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link
                    to={`/dashboard/projects/${p.id}`}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {p.title}
                  </Link>
                </td>
                <td className="text-sm text-muted-foreground">{p.client || '—'}</td>
                <td className="text-sm">
                  {p.active_surveys_count ?? 0} active / {p.surveys_count ?? 0}
                </td>
                <td>
                  <Stamp status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">No projects.</p>
        ) : null}
      </div>
    </div>
  );
};

export default Projects;
