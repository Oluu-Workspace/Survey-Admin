import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { agentsAPI } from '@/services/api';
import { Stamp } from '@/components/Stamp';
import { TablePagination } from '@/components/TablePagination';
import { useConfirmAction } from '@/components/confirm-action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  role?: string;
  ward?: string;
  village?: string;
  county?: string;
  subcounty?: string;
  surveys_completed?: number;
  has_login?: boolean;
}

type SurveyAssignRow = {
  id: string;
  title: string;
  status: string;
  assigned: boolean;
};

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  ward: '',
  village: '',
  county: '',
  subcounty: '',
};

const Agents = () => {
  const confirmAction = useConfirmAction();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [accountTotal, setAccountTotal] = useState(0);
  const [assignments, setAssignments] = useState<SurveyAssignRow[]>([]);
  const [assignBusy, setAssignBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await agentsAPI.getAll({ limit: 500, per_page: 500 });
      const list = (data.agents || data || []) as Agent[];
      setAccountTotal(Number(data?.pagination?.total) || list.length);
      // Field agents only on this page (staff live under Users)
      setAgents(list.filter((a) => {
        const role = (a.role || 'agent').toLowerCase();
        return role === 'agent';
      }));
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
      const status = a.status === 'inactive' ? 'suspended' : a.status;
      const hay = [a.first_name, a.last_name, a.email, a.ward, a.village]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (!q || hay.includes(q)) && (statusFilter === 'all' || status === statusFilter);
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

  useEffect(() => {
    if (!selectedId) {
      setAssignments([]);
      return;
    }
    void agentsAPI
      .getSurveyAssignments(selectedId)
      .then((data) => setAssignments(data.surveys || []))
      .catch(() => setAssignments([]));
  }, [selectedId]);

  const setStatus = async (id: string, next: 'active' | 'suspended') => {
    const agent = agents.find((a) => a.id === id);
    const name = agent ? `${agent.first_name} ${agent.last_name}`.trim() : 'this agent';
    const ok = await confirmAction(
      next === 'suspended'
        ? {
            title: `Suspend ${name}?`,
            description:
              'They will be signed out of the field app and cannot collect interviews until you unsuspend them.',
            confirmLabel: 'Suspend agent',
            tone: 'danger',
            facts: [
              { label: 'Agent', value: name },
              { label: 'Email', value: agent?.email || '—' },
            ],
          }
        : {
            title: `Unsuspend ${name}?`,
            description: 'They will be able to sign in and collect interviews again.',
            confirmLabel: 'Unsuspend agent',
            tone: 'warning',
            facts: [
              { label: 'Agent', value: name },
              { label: 'Email', value: agent?.email || '—' },
            ],
          },
    );
    if (!ok) return;
    try {
      if (next === 'active') await agentsAPI.activate(id);
      else await agentsAPI.deactivate(id);
      toast.success(next === 'active' ? 'Agent unsuspended — can sign in' : 'Agent suspended — cannot sign in');
      await load();
    } catch {
      toast.error('Update failed');
    }
  };

  const updateAgentPassword = async (id: string) => {
    if (!form.password || form.password.length < 6) {
      toast.error('Password must be 6+ characters');
      return;
    }
    const agent = agents.find((a) => a.id === id);
    const name = agent ? `${agent.first_name} ${agent.last_name}`.trim() : 'this agent';
    const ok = await confirmAction({
      title: `Reset password for ${name}?`,
      description: 'Their current password will stop working immediately. Share the new password with them securely.',
      confirmLabel: 'Reset password',
      tone: 'warning',
      facts: [{ label: 'Agent', value: name }, { label: 'Email', value: agent?.email || '—' }],
    });
    if (!ok) return;
    setSaving(true);
    try {
      await agentsAPI.update(id, { password: form.password });
      toast.success('Password updated — agent can log in now');
      setForm((f) => ({ ...f, password: '' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Password update failed');
    } finally {
      setSaving(false);
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
    const name = `${form.first_name.trim()} ${form.last_name.trim()}`;
    const ok = await confirmAction({
      title: 'Create this field agent?',
      description: 'They will be able to sign in to the Tafiti field app with this email and password.',
      confirmLabel: 'Create agent',
      facts: [
        { label: 'Name', value: name },
        { label: 'Email', value: form.email.trim().toLowerCase() },
        { label: 'Ward', value: form.ward.trim() || '—' },
        { label: 'Village', value: form.village.trim() || '—' },
      ],
    });
    if (!ok) return;
    setSaving(true);
    try {
      await agentsAPI.create({
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        status: 'active',
        role: 'agent',
      });
      toast.success('Agent added — they can log in with that password');
      setCreating(false);
      setForm(emptyForm);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!selectedId) return;
    const name = `${form.first_name.trim()} ${form.last_name.trim()}`;
    const ok = await confirmAction({
      title: 'Save agent profile?',
      description: 'These details will update on the field app the next time this agent syncs.',
      confirmLabel: 'Save profile',
      facts: [
        { label: 'Name', value: name || '—' },
        { label: 'Phone', value: form.phone.trim() || '—' },
        { label: 'Ward', value: form.ward.trim() || '—' },
        { label: 'Village', value: form.village.trim() || '—' },
      ],
    });
    if (!ok) return;
    setSaving(true);
    try {
      await agentsAPI.update(selectedId, {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || null,
        county: form.county.trim() || null,
        subcounty: form.subcounty.trim() || null,
        ward: form.ward.trim() || null,
        village: form.village.trim() || null,
      });
      toast.success('Agent updated');
      setEditing(false);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteAgent = async (id: string) => {
    const agent = agents.find((a) => a.id === id);
    const name = agent ? `${agent.first_name} ${agent.last_name}`.trim() : 'this agent';
    const ok = await confirmAction({
      title: `Delete ${name}?`,
      description:
        'They will lose access immediately and be unassigned from surveys. This cannot be undone.',
      confirmLabel: 'Delete agent',
      tone: 'danger',
      facts: [
        { label: 'Agent', value: name },
        { label: 'Email', value: agent?.email || '—' },
      ],
    });
    if (!ok) return;
    setSaving(true);
    try {
      await agentsAPI.delete(id);
      toast.success('Agent deleted');
      setSelectedId(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  const saveAssignments = async () => {
    if (!selectedId) return;
    const selected = agents.find((a) => a.id === selectedId);
    const name = selected ? `${selected.first_name} ${selected.last_name}`.trim() : 'this agent';
    const assigned = assignments.filter((s) => s.assigned);
    const ok = await confirmAction({
      title: 'Save survey assignments?',
      description:
        'The agent will only see questionnaires you keep checked. Unchecked surveys are removed from their field app.',
      confirmLabel: 'Save assignments',
      tone: 'warning',
      facts: [
        { label: 'Agent', value: name },
        { label: 'Surveys', value: String(assigned.length) },
      ],
    });
    if (!ok) return;
    setAssignBusy(true);
    try {
      const survey_ids = assigned.map((s) => s.id);
      await agentsAPI.setSurveyAssignments(selectedId, survey_ids);
      toast.success('Survey assignments saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not save assignments');
    } finally {
      setAssignBusy(false);
    }
  };

  const startEdit = (agent: Agent) => {
    setEditing(true);
    setCreating(false);
    setForm({
      first_name: agent.first_name || '',
      last_name: agent.last_name || '',
      email: agent.email || '',
      phone: agent.phone || '',
      password: '',
      ward: agent.ward || '',
      village: agent.village || '',
      county: agent.county || '',
      subcounty: agent.subcounty || '',
    });
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
      <div className={`min-w-0 flex-1 space-y-4 ${selected || creating ? 'lg:max-w-[55%]' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filtered.length} field agent{filtered.length === 1 ? '' : 's'}
            {accountTotal > filtered.length
              ? ` · ${accountTotal} accounts total (admins/managers are under Users)`
              : ''}
            {statusFilter !== 'all' ? ` · ${statusFilter}` : ''}
          </p>
          <Button
            size="sm"
            className="rounded-sm"
            onClick={() => {
              setSelectedId(null);
              setEditing(false);
              setCreating(true);
              setForm(emptyForm);
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
                  <th className="hidden lg:table-cell">Login</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAgents.map((agent) => {
                  const active = selectedId === agent.id;
                  const status = agent.status === 'inactive' ? 'suspended' : agent.status;
                  return (
                    <tr
                      key={agent.id}
                      className={`cursor-pointer ${active ? 'bg-primary/5' : ''}`}
                      onClick={() => {
                        setCreating(false);
                        setEditing(false);
                        setSelectedId(agent.id);
                        setForm(emptyForm);
                      }}
                    >
                      <td className="font-display font-medium">
                        {agent.first_name} {agent.last_name}
                      </td>
                      <td className="hidden text-muted-foreground sm:table-cell">
                        {(agent.email || '').toLowerCase()}
                      </td>
                      <td className="hidden text-muted-foreground md:table-cell">
                        {[agent.ward, agent.village].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td>
                        <Stamp status={status} />
                      </td>
                      <td className="hidden lg:table-cell">
                        {agent.has_login === false ? (
                          <span className="text-xs font-medium text-destructive">No password</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">OK</span>
                        )}
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
        <aside className="w-full shrink-0 border border-border bg-card lg:sticky lg:top-4 lg:w-[400px]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-display text-sm font-semibold">
              {creating ? 'Add agent' : editing ? 'Edit agent' : 'Agent detail'}
            </h2>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-sm"
              onClick={() => {
                setSelectedId(null);
                setCreating(false);
                setEditing(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {creating || editing ? (
            <div className="space-y-3 p-4">
              {(
                [
                  ['first_name', 'First name'],
                  ['last_name', 'Last name'],
                  ...(creating
                    ? ([['email', 'Email'], ['password', 'Password']] as const)
                    : []),
                  ['phone', 'Phone'],
                  ['county', 'County'],
                  ['subcounty', 'Sub county'],
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
                    autoCapitalize={key === 'email' ? 'none' : undefined}
                    autoCorrect={key === 'email' ? 'off' : undefined}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        [key]: key === 'email' ? e.target.value.toLowerCase() : e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-sm"
                  onClick={() => {
                    setCreating(false);
                    setEditing(false);
                    setForm(emptyForm);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-sm"
                  onClick={() => void (creating ? createAgent() : saveProfile())}
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
                  <Stamp status={selected.status === 'inactive' ? 'suspended' : selected.status} />
                </div>
              </div>
              <dl className="space-y-3 text-sm">
                {(
                  [
                    ['Email', selected.email],
                    ['Phone', selected.phone || '—'],
                    ['County', selected.county || '—'],
                    ['Ward', selected.ward || '—'],
                    ['Village', selected.village || '—'],
                    ['Surveys completed', String(selected.surveys_completed ?? 0)],
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

              <div className="space-y-2 border-t border-border pt-4">
                <div className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                  Survey assignments
                </div>
                {assignments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No surveys yet.</p>
                ) : (
                  <div className="max-h-40 space-y-2 overflow-y-auto">
                    {assignments.map((s) => (
                      <label key={s.id} className="flex cursor-pointer items-start gap-2 text-sm">
                        <Checkbox
                          checked={s.assigned}
                          onCheckedChange={(checked) =>
                            setAssignments((rows) =>
                              rows.map((r) =>
                                r.id === s.id ? { ...r, assigned: Boolean(checked) } : r,
                              ),
                            )
                          }
                        />
                        <span>
                          <span className="font-medium">{s.title}</span>
                          <span className="ml-1 text-xs text-muted-foreground">({s.status})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-sm"
                  disabled={assignBusy || assignments.length === 0}
                  onClick={() => void saveAssignments()}
                >
                  {assignBusy ? 'Saving…' : 'Save assignments'}
                </Button>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                {selected.has_login === false ? (
                  <p className="rounded-sm border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    This agent has no saved login password. Set one below so they can sign in.
                  </p>
                ) : null}
                <div className="space-y-1.5">
                  <Label className="font-display text-xs uppercase tracking-wide">
                    Reset password
                  </Label>
                  <Input
                    type="password"
                    className="rounded-sm"
                    placeholder="New password (6+ chars)"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                  <Button
                    variant="outline"
                    className="w-full rounded-sm"
                    disabled={saving || !form.password || form.password.length < 6}
                    onClick={() => void updateAgentPassword(selected.id)}
                  >
                    {saving ? 'Saving…' : 'Save password'}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-sm"
                  onClick={() => startEdit(selected)}
                >
                  Edit profile
                </Button>
                {selected.status !== 'active' ? (
                  <Button
                    className="w-full rounded-sm"
                    onClick={() => void setStatus(selected.id, 'active')}
                  >
                    Unsuspend agent
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full rounded-sm"
                    onClick={() => void setStatus(selected.id, 'suspended')}
                  >
                    Suspend agent
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="w-full rounded-sm"
                  disabled={saving}
                  onClick={() => void deleteAgent(selected.id)}
                >
                  Delete agent
                </Button>
              </div>
            </div>
          ) : null}
        </aside>
      )}
    </div>
  );
};

export default Agents;
