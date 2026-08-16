import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { agentsAPI, settingsAPI, surveysAPI, type CollectionHoursSettings } from '@/services/api';
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
import { formatDateTimeEAT, kenyaDateTimeToIso, todayEAT } from '@/lib/datetime';

type Scope = 'all' | 'survey' | 'agent';
type UntilMode = 'morning' | 'custom' | 'open';

/** Admin control to extend agent-app hours globally, per questionnaire, or per agent. */
export function CollectionHoursAdminCard() {
  const [hours, setHours] = useState<CollectionHoursSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<Scope>('all');
  const [untilMode, setUntilMode] = useState<UntilMode>('morning');
  const [untilDate, setUntilDate] = useState(todayEAT());
  const [untilTime, setUntilTime] = useState('20:00');
  const [surveyId, setSurveyId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [surveys, setSurveys] = useState<{ id: string; title: string }[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, surveysRes, agentsRes] = await Promise.all([
        settingsAPI.getCollectionHours(),
        surveysAPI.getAll({ per_page: 500 }).catch(() => ({ surveys: [] })),
        agentsAPI.getAll({ per_page: 500 }).catch(() => ({ agents: [] })),
      ]);
      setHours(data);
      const slist = surveysRes.surveys || surveysRes || [];
      setSurveys(
        (Array.isArray(slist) ? slist : []).map((s: { id: string; title?: string }) => ({
          id: s.id,
          title: s.title || s.id,
        })),
      );
      const alist = agentsRes.agents || agentsRes || [];
      setAgents(
        (Array.isArray(alist) ? alist : []).map(
          (a: { id: string; first_name?: string; last_name?: string; email?: string }) => ({
            id: a.id,
            name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email || a.id,
          }),
        ),
      );
    } catch {
      toast.error('Could not load collection hours settings');
      setHours(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const open = Boolean(hours?.effective_open ?? hours?.after_hours_open);
  const overrides = hours?.overrides || [];

  const scopeLabel = useMemo(() => {
    if (scope === 'survey') return surveys.find((s) => s.id === surveyId)?.title || 'questionnaire';
    if (scope === 'agent') return agents.find((a) => a.id === agentId)?.name || 'agent';
    return 'all agents and questionnaires';
  }, [scope, surveyId, agentId, surveys, agents]);

  const extend = async () => {
    if (scope === 'survey' && !surveyId) {
      toast.error('Choose a questionnaire');
      return;
    }
    if (scope === 'agent' && !agentId) {
      toast.error('Choose an agent');
      return;
    }
    if (untilMode === 'custom' && (!untilDate || !untilTime)) {
      toast.error('Choose a Kenya date and time');
      return;
    }
    setBusy(true);
    try {
      const survey = surveys.find((s) => s.id === surveyId);
      const agent = agents.find((a) => a.id === agentId);
      const data = await settingsAPI.extendCollectionHours({
        scope,
        until_morning: untilMode === 'morning' || undefined,
        until: untilMode === 'custom' ? kenyaDateTimeToIso(untilDate, untilTime) : untilMode === 'open' ? null : undefined,
        survey_id: scope === 'survey' ? surveyId : undefined,
        survey_title: scope === 'survey' ? survey?.title : undefined,
        agent_id: scope === 'agent' ? agentId : undefined,
        agent_name: scope === 'agent' ? agent?.name : undefined,
      });
      setHours(data);
      const untilText =
        untilMode === 'morning'
          ? 'until 8:00 AM Kenya time'
          : untilMode === 'open'
            ? 'until you close it'
            : `until ${untilDate} ${untilTime} Kenya time`;
      toast.success(`Extended collection time for ${scopeLabel} ${untilText}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { error?: string } } }).response?.data?.error)
          : 'Could not extend collection time';
      toast.error(msg || 'Could not extend collection time');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    setBusy(true);
    try {
      const data = await settingsAPI.revokeCollectionHoursOverride(id);
      setHours(data);
      toast.success('Extension closed');
    } catch {
      toast.error('Could not revoke extension');
    } finally {
      setBusy(false);
    }
  };

  const closeAllGlobal = async () => {
    setBusy(true);
    try {
      const data = await settingsAPI.updateCollectionHours({
        after_hours_open: false,
        clear_until: true,
      });
      setHours(data);
      toast.success('Global after-hours closed — questionnaire and agent extensions are unchanged');
    } catch {
      toast.error('Update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 border border-border bg-card p-4">
      <div>
        <h3 className="font-display text-sm font-semibold">Extend agent collection time</h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Normal window is <span className="font-medium text-foreground">8:00 AM – 6:30 PM</span>{' '}
          Kenya time. Extend after-hours for everyone, one questionnaire, or a single agent.
        </p>
        {loading ? (
          <p className="mt-2 text-xs text-muted-foreground">Loading…</p>
        ) : hours ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Global status:{' '}
            <span className={open ? 'font-medium text-primary' : 'font-medium text-foreground'}>
              {open ? 'After-hours OPEN for all' : 'Normal hours (unless a scoped extension is listed below)'}
            </span>
            {hours.after_hours_until ? ` · until ${formatDateTimeEAT(hours.after_hours_until)}` : null}
          </p>
        ) : (
          <p className="mt-2 text-xs text-destructive">Settings unavailable</p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="font-display text-xs uppercase tracking-wide">Who</Label>
          <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <SelectTrigger className="h-9 w-[220px] rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents &amp; questionnaires</SelectItem>
              <SelectItem value="survey">One questionnaire</SelectItem>
              <SelectItem value="agent">One agent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {scope === 'survey' ? (
          <div className="space-y-1">
            <Label className="font-display text-xs uppercase tracking-wide">Questionnaire</Label>
            <Select value={surveyId || 'none'} onValueChange={(v) => setSurveyId(v === 'none' ? '' : v)}>
              <SelectTrigger className="h-9 w-[240px] rounded-sm">
                <SelectValue placeholder="Choose survey" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Choose survey</SelectItem>
                {surveys.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {scope === 'agent' ? (
          <div className="space-y-1">
            <Label className="font-display text-xs uppercase tracking-wide">Agent</Label>
            <Select value={agentId || 'none'} onValueChange={(v) => setAgentId(v === 'none' ? '' : v)}>
              <SelectTrigger className="h-9 w-[220px] rounded-sm">
                <SelectValue placeholder="Choose agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Choose agent</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-1">
          <Label className="font-display text-xs uppercase tracking-wide">Until (Kenya time)</Label>
          <Select value={untilMode} onValueChange={(v) => setUntilMode(v as UntilMode)}>
            <SelectTrigger className="h-9 w-[200px] rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Next 8:00 AM</SelectItem>
              <SelectItem value="custom">Custom date &amp; time</SelectItem>
              <SelectItem value="open">Until I close it</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {untilMode === 'custom' ? (
          <>
            <div className="space-y-1">
              <Label className="font-display text-xs uppercase tracking-wide">Date</Label>
              <Input
                type="date"
                className="h-9 w-[150px] rounded-sm"
                value={untilDate}
                onChange={(e) => setUntilDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="font-display text-xs uppercase tracking-wide">Time</Label>
              <Input
                type="time"
                className="h-9 w-[120px] rounded-sm"
                value={untilTime}
                onChange={(e) => setUntilTime(e.target.value)}
              />
            </div>
          </>
        ) : null}

        <Button size="sm" className="h-9 rounded-sm" disabled={busy || loading} onClick={() => void extend()}>
          Extend time
        </Button>
        {open ? (
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-sm"
            disabled={busy || loading}
            onClick={() => void closeAllGlobal()}
          >
            Close global after-hours
          </Button>
        ) : null}
      </div>

      {overrides.length > 0 ? (
        <div className="overflow-hidden border border-border">
          <table className="ledger-table w-full">
            <thead>
              <tr>
                <th>Extension</th>
                <th>Until</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {overrides.map((ov) => (
                <tr key={ov.id}>
                  <td>
                    {ov.scope === 'all'
                      ? 'All agents & questionnaires'
                      : ov.scope === 'survey'
                        ? `Questionnaire: ${ov.survey_title || ov.label || ov.survey_id}`
                        : `Agent: ${ov.agent_name || ov.label || ov.agent_id}`}
                  </td>
                  <td className="text-muted-foreground">
                    {ov.until ? formatDateTimeEAT(ov.until) : 'Until closed'}
                  </td>
                  <td className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-sm"
                      disabled={busy}
                      onClick={() => void revoke(ov.id)}
                    >
                      Close
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No active extensions.</p>
      )}
    </div>
  );
}
