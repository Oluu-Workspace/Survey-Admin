import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { agentQueriesAPI, type AgentQuery } from '@/services/api';
import { Stamp } from '@/components/Stamp';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateTimeEAT } from '@/lib/datetime';

export default function AgentQueries() {
  const [queries, setQueries] = useState<AgentQuery[]>([]);
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await agentQueriesAPI.list({
        status: status === 'all' ? undefined : status,
      });
      setQueries(data.queries || []);
      if (selectedId && !(data.queries || []).find((q) => q.id === selectedId)) {
        setSelectedId(null);
      }
    } catch {
      toast.error('Could not load agent queries');
      setQueries([]);
    } finally {
      setLoading(false);
    }
  }, [status, selectedId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => queries.find((q) => q.id === selectedId) || null,
    [queries, selectedId],
  );

  const resolve = async (opts?: { approve?: boolean; reject?: boolean }) => {
    if (!selected) return;
    setBusy(true);
    try {
      await agentQueriesAPI.resolve(selected.id, {
        admin_note: adminNote || undefined,
        approve_response: opts?.approve,
        reject_response: opts?.reject,
      });
      toast.success('Query resolved');
      setAdminNote('');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Resolve failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Agent queries</h2>
            <p className="text-sm text-muted-foreground">
              Flag interviews and ask field agents to explain unusual answers.
            </p>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-[140px] rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="answered">Answered</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : queries.length === 0 ? (
          <p className="border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
            No queries in this filter. Flag an interview from Data or Review and use{' '}
            <span className="font-medium text-foreground">Flag &amp; query agent</span>.
          </p>
        ) : (
          <div className="overflow-hidden border border-border bg-card">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th className="hidden sm:table-cell">Survey</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Sent</th>
                </tr>
              </thead>
              <tbody>
                {queries.map((q) => (
                  <tr
                    key={q.id}
                    className={`cursor-pointer ${selectedId === q.id ? 'bg-primary/5' : ''}`}
                    onClick={() => setSelectedId(q.id)}
                  >
                    <td className="font-display font-medium">{q.agent_name || q.agent_id}</td>
                    <td className="hidden text-muted-foreground sm:table-cell">
                      {q.survey_title || '—'}
                    </td>
                    <td>
                      <Stamp status={q.status} />
                    </td>
                    <td className="hidden text-muted-foreground md:table-cell">
                      {formatDateTimeEAT(q.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <aside className="w-full shrink-0 border border-border bg-card lg:sticky lg:top-4 lg:w-[420px]">
          <div className="border-b border-border px-4 py-3">
            <div className="font-display text-sm font-semibold">{selected.agent_name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {selected.agent_email} · {selected.survey_title || 'Survey'}
            </div>
            <div className="mt-2">
              <Stamp status={selected.status} />
            </div>
          </div>
          <div className="space-y-4 p-4 text-sm">
            <div>
              <div className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                Your question
              </div>
              <p className="mt-1 whitespace-pre-wrap">{selected.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selected.created_by} · {formatDateTimeEAT(selected.created_at)}
                {selected.reason ? ` · ${selected.reason}` : ''}
              </p>
            </div>
            {selected.response_id ? (
              <div>
                <div className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                  Interview
                </div>
                <Link
                  to={`/dashboard/data?response=${selected.response_id}`}
                  className="mt-1 inline-block font-mono text-xs text-primary underline-offset-2 hover:underline"
                >
                  {selected.response_id.slice(0, 12)}…
                </Link>
                {selected.flagged_response ? (
                  <span className="ml-2 text-xs text-destructive">flagged</span>
                ) : null}
              </div>
            ) : null}
            <div>
              <div className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                Agent reply
              </div>
              {selected.agent_reply ? (
                <>
                  <p className="mt-1 whitespace-pre-wrap">{selected.agent_reply}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTimeEAT(selected.replied_at)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-muted-foreground">Waiting for agent reply…</p>
              )}
            </div>
            {selected.status !== 'resolved' ? (
              <div className="space-y-2 border-t border-border pt-4">
                <Textarea
                  className="min-h-[64px] rounded-sm text-sm"
                  placeholder="Optional note when resolving…"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="rounded-sm"
                    disabled={busy}
                    onClick={() => void resolve()}
                  >
                    Mark resolved
                  </Button>
                  {selected.response_id ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-sm"
                        disabled={busy}
                        onClick={() => void resolve({ approve: true })}
                      >
                        Resolve + approve interview
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-sm"
                        disabled={busy}
                        onClick={() => void resolve({ reject: true })}
                      >
                        Resolve + reject interview
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Resolved by {selected.resolved_by} · {formatDateTimeEAT(selected.resolved_at)}
                {selected.admin_note ? ` — ${selected.admin_note}` : ''}
              </p>
            )}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
