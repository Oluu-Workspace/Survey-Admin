import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { agentsAPI } from '@/services/api';
import { Stamp } from '@/components/Stamp';
import { TablePagination } from '@/components/TablePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: string;
  ward?: string;
  village?: string;
  surveys_completed?: number;
}

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  ward: '',
  village: '',
};

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    setLoading(true);
    try {
      const data = await agentsAPI.getAll({ limit: 200 });
      setAgents(data.agents || data || []);
    } catch {
      toast.error('Could not load agents');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return agents.filter((a) => {
      const hay = [a.first_name, a.last_name, a.email, a.ward, a.village]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (!q || hay.includes(q)) && (statusFilter === 'all' || a.status === statusFilter);
    });
  }, [agents, searchTerm, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const paginatedAgents = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  const selected = selectedId ? agents.find((a) => a.id === selectedId) || null : null;

  const setStatus = async (id: string, next: 'active' | 'suspended') => {
    try {
      if (next === 'active') await agentsAPI.activate(id);
      else await agentsAPI.deactivate(id);
      toast.success(next === 'active' ? 'Agent can sign in to the field app' : 'Agent sign-in blocked');
      await load();
    } catch {
      toast.error('Update failed');
    }
  };

  const createAgent = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      toast.error('Name and email required');
      return;
    }
    if (!form.password || form.password.length < 6) {
      toast.error('Password must be 6+ characters');
      return;
    }
    setSaving(true);
    try {
      await agentsAPI.create({
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        status: 'active',
      });
      toast.success('Agent added');
      setCreating(false);
      setForm(emptyForm);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Create failed');
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
    <div className="flex w-full flex-col gap-5 lg:flex-row lg:items-start">
      <div className={`min-w-0 flex-1 space-y-4 ${selected || creating ? 'lg:max-w-[58%]' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filtered.length} agent{filtered.length === 1 ? '' : 's'}
            {statusFilter !== 'all' ? ` · ${statusFilter}` : ''}
          </p>
          <Button
            size="sm"
            className="rounded-sm"
            onClick={() => {
              setSelectedId(null);
              setCreating(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add agent
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 rounded-sm pl-9"
              placeholder="Search name, email, ward…"
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <p className="border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
            No agents match — clear filters or add one.
          </p>
        ) : (
          <div className="overflow-hidden border border-border bg-card">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="hidden sm:table-cell">Email</th>
                  <th className="hidden md:table-cell">Ward / Village</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAgents.map((agent) => {
                  const active = selectedId === agent.id;
                  return (
                    <tr
                      key={agent.id}
                      className={`cursor-pointer ${active ? 'bg-primary/5' : ''}`}
                      onClick={() => {
                        setCreating(false);
                        setSelectedId(agent.id);
                      }}
                    >
                      <td className="font-display font-medium">
                        {agent.first_name} {agent.last_name}
                      </td>
                      <td className="hidden text-muted-foreground sm:table-cell">{agent.email}</td>
                      <td className="hidden text-muted-foreground md:table-cell">
                        {[agent.ward, agent.village].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td>
                        <Stamp status={agent.status} />
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

      {(selected || creating) && (
        <aside className="w-full shrink-0 border border-border bg-card lg:sticky lg:top-4 lg:w-[380px]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-display text-sm font-semibold">
              {creating ? 'Add agent' : 'Agent detail'}
            </h2>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-sm"
              onClick={() => {
                setSelectedId(null);
                setCreating(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {creating ? (
            <div className="space-y-3 p-4">
              {(
                [
                  ['first_name', 'First name'],
                  ['last_name', 'Last name'],
                  ['email', 'Email'],
                  ['password', 'Password'],
                  ['phone', 'Phone'],
                  ['ward', 'Ward'],
                  ['village', 'Village'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label className="font-display text-xs uppercase tracking-wide">{label}</Label>
                  <Input
                    type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
                    className="rounded-sm"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-sm"
                  onClick={() => {
                    setCreating(false);
                    setForm(emptyForm);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-sm"
                  onClick={() => void createAgent()}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          ) : selected ? (
            <div className="space-y-4 p-4">
              <div>
                <div className="font-display text-base font-semibold">
                  {selected.first_name} {selected.last_name}
                </div>
                <div className="mt-1">
                  <Stamp status={selected.status} />
                </div>
              </div>
              <dl className="space-y-3 text-sm">
                {(
                  [
                    ['Email', selected.email],
                    ['Phone', selected.phone || '—'],
                    ['Ward', selected.ward || '—'],
                    ['Village', selected.village || '—'],
                    [
                      'Surveys completed',
                      String(selected.surveys_completed ?? 0),
                    ],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-0.5 break-all">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="border-t border-border pt-4">
                {selected.status !== 'active' ? (
                  <Button
                    className="w-full rounded-sm"
                    onClick={() => void setStatus(selected.id, 'active')}
                  >
                    Let them sign in
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full rounded-sm"
                    onClick={() => void setStatus(selected.id, 'suspended')}
                  >
                    Block sign-in
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </aside>
      )}
    </div>
  );
};

export default Agents;
