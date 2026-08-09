import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { agentsAPI, usersAPI } from '@/services/api';
import { Stamp } from '@/components/Stamp';
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

type StaffUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  phone?: string;
};

const empty = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'admin',
  phone: '',
};

export default function Users() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getAll();
      setUsers(data.users || []);
    } catch {
      toast.error('Could not load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const selected = selectedId ? users.find((u) => u.id === selectedId) || null : null;

  const create = async () => {
    if (!form.email || !form.password || form.password.length < 6) {
      toast.error('Email and password (6+) required');
      return;
    }
    setSaving(true);
    try {
      await usersAPI.create({
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        status: 'active',
      });
      toast.success('Admin user created');
      setCreating(false);
      setForm(empty);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    if (!selectedId || password.length < 6) {
      toast.error('Password must be 6+ characters');
      return;
    }
    setSaving(true);
    try {
      await agentsAPI.update(selectedId, { password });
      toast.success('Password updated');
      setPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, next: 'active' | 'suspended') => {
    try {
      if (next === 'active') await agentsAPI.activate(id);
      else await agentsAPI.deactivate(id);
      toast.success(next === 'active' ? 'User activated' : 'User suspended');
      await load();
    } catch {
      toast.error('Status update failed');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this admin user?')) return;
    try {
      await agentsAPI.delete(id);
      toast.success('User deleted');
      setSelectedId(null);
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
    <div className="flex w-full flex-col gap-5 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {users.length} admin / manager account{users.length === 1 ? '' : 's'}
          </p>
          <Button
            size="sm"
            className="rounded-sm"
            onClick={() => {
              setSelectedId(null);
              setCreating(true);
              setForm(empty);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add admin
          </Button>
        </div>

        <div className="overflow-hidden border border-border bg-card">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={`cursor-pointer ${selectedId === u.id ? 'bg-primary/5' : ''}`}
                  onClick={() => {
                    setCreating(false);
                    setSelectedId(u.id);
                  }}
                >
                  <td className="font-display font-medium">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="text-muted-foreground">{u.email}</td>
                  <td className="capitalize">{u.role}</td>
                  <td>
                    <Stamp status={u.status === 'inactive' ? 'suspended' : u.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(creating || selected) && (
        <aside className="w-full shrink-0 border border-border bg-card lg:sticky lg:top-4 lg:w-[380px]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-display text-sm font-semibold">
              {creating ? 'Add admin / manager' : 'User detail'}
            </h2>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-sm"
              onClick={() => {
                setCreating(false);
                setSelectedId(null);
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
              <div className="space-y-1.5">
                <Label className="font-display text-xs uppercase tracking-wide">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
                >
                  <SelectTrigger className="rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full rounded-sm" disabled={saving} onClick={() => void create()}>
                {saving ? 'Saving…' : 'Create'}
              </Button>
            </div>
          ) : selected ? (
            <div className="space-y-4 p-4">
              <div>
                <div className="font-display text-base font-semibold">
                  {selected.first_name} {selected.last_name}
                </div>
                <div className="mt-1 text-sm capitalize text-muted-foreground">{selected.role}</div>
              </div>
              <div className="text-sm break-all">{selected.email}</div>
              <div className="space-y-1.5 border-t border-border pt-4">
                <Label className="font-display text-xs uppercase tracking-wide">Reset password</Label>
                <Input
                  type="password"
                  className="rounded-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (6+)"
                />
                <Button
                  variant="outline"
                  className="w-full rounded-sm"
                  disabled={saving || password.length < 6}
                  onClick={() => void resetPassword()}
                >
                  Save password
                </Button>
              </div>
              {selected.status !== 'active' ? (
                <Button className="w-full rounded-sm" onClick={() => void setStatus(selected.id, 'active')}>
                  Activate
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full rounded-sm"
                  onClick={() => void setStatus(selected.id, 'suspended')}
                >
                  Suspend
                </Button>
              )}
              <Button
                variant="destructive"
                className="w-full rounded-sm"
                onClick={() => void remove(selected.id)}
              >
                Delete
              </Button>
            </div>
          ) : null}
        </aside>
      )}
    </div>
  );
}
