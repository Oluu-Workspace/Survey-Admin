import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { operationsAPI } from '@/services/api';
import type { SurveyResponse } from '@/domain';
import { Stamp } from '@/components/Stamp';
import { CollectionHoursAdminCard } from '@/components/CollectionHoursAdminCard';
import { LIFECYCLE_LABELS } from '@/domain/enums';
import { Button } from '@/components/ui/button';

type CountyRow = {
  county: string;
  collected: number;
  target: number;
  progress_pct: number | null;
  behind_target: boolean;
};

type InactiveAgent = { id: string; name: string; email?: string };

type Ops = {
  responses_today: number;
  total_responses: number;
  pending_review: number;
  approved: number;
  rejected: number;
  active_agents: number;
  inactive_agents: InactiveAgent[];
  total_agents: number;
  active_surveys: number;
  active_projects: number;
  interviews_remaining: number;
  county_progress: CountyRow[];
  last_hour_activity: SurveyResponse[];
  survey_progress: {
    survey_id: string;
    title: string;
    responses: number;
    target_submissions: number;
    progress_pct: number | null;
  }[];
  recent_activity: SurveyResponse[];
  quality_alerts: SurveyResponse[];
  duplicate_groups_count: number;
};

const Dashboard = () => {
  const [ops, setOps] = useState<Ops | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await operationsAPI.getDashboard();
        setOps(data);
      } catch {
        toast.error('Could not load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!ops) {
    return <p className="text-sm text-muted-foreground">Dashboard unavailable.</p>;
  }

  const metrics = [
    { label: 'Active projects', value: ops.active_projects, to: '/dashboard/projects' },
    { label: 'Active surveys', value: ops.active_surveys, to: '/dashboard/surveys' },
    { label: 'Collected today', value: ops.responses_today, to: '/dashboard/surveys' },
    { label: 'Remaining (target)', value: ops.interviews_remaining, to: '/dashboard/surveys' },
    { label: 'Pending review', value: ops.pending_review, to: '/dashboard/review' },
    { label: 'Total responses', value: ops.total_responses, to: '/dashboard/data' },
    { label: 'Approved', value: ops.approved, to: '/dashboard/data' },
    { label: 'Active agents', value: ops.active_agents, hint: `${ops.total_agents} total`, to: '/dashboard/agents' },
  ];

  const behindCounties = ops.county_progress.filter((c) => c.behind_target && c.target > 0);

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">Research dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in → review survey totals → open a study → analyse questions → export report or CSV.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-sm">
          <Link to="/dashboard/surveys">All surveys</Link>
        </Button>
      </div>

      <CollectionHoursAdminCard />

      <section className="space-y-3">
        <h3 className="font-display text-xs uppercase tracking-wide text-muted-foreground">
          Surveys &amp; response summary
        </h3>
        <div className="overflow-hidden border border-border bg-card">
          <table className="ledger-table w-full">
            <thead>
              <tr>
                <th>Survey</th>
                <th className="text-right">Responses</th>
                <th className="text-right">Target</th>
                <th className="text-right">Progress</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(ops.survey_progress || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No active surveys.
                  </td>
                </tr>
              ) : (
                ops.survey_progress
                  .slice()
                  .sort((a, b) => b.responses - a.responses)
                  .map((s) => (
                    <tr key={s.survey_id}>
                      <td className="font-medium">{s.title}</td>
                      <td className="text-right">
                        <span className="ledger-count">{s.responses.toLocaleString()}</span>
                      </td>
                      <td className="text-right text-muted-foreground">
                        {s.target_submissions ? s.target_submissions.toLocaleString() : '—'}
                      </td>
                      <td className="text-right">
                        {s.progress_pct != null ? `${s.progress_pct}%` : '—'}
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/dashboard/surveys/${s.survey_id}?tab=overview`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-xs uppercase tracking-wide text-muted-foreground">
            Field operations
          </h3>
        </div>
        <Button asChild className="rounded-sm">
          <Link to="/dashboard/data">Data Explorer</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border sm:grid-cols-4">
        {metrics.map((m) => (
          <Link
            key={m.label}
            to={m.to}
            className="bg-card px-4 py-4 transition-colors hover:bg-muted/40"
          >
            <div className="font-display text-xs uppercase tracking-wide text-muted-foreground">
              {m.label}
            </div>
            <div className="ledger-count mt-2 text-3xl font-medium text-foreground">{m.value}</div>
            {'hint' in m && m.hint ? (
              <div className="mt-1 text-xs text-muted-foreground">{m.hint}</div>
            ) : null}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h3 className="font-display text-xs uppercase tracking-wide text-muted-foreground">
            County progress
          </h3>
          <div className="border border-border bg-card">
            <table className="ledger-table w-full">
              <thead>
                <tr>
                  <th>County</th>
                  <th>Collected</th>
                  <th>Target</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {ops.county_progress.slice(0, 8).map((c) => (
                  <tr key={c.county} className={c.behind_target ? 'bg-destructive/5' : ''}>
                    <td className="font-medium">{c.county}</td>
                    <td>{c.collected}</td>
                    <td>{c.target || '—'}</td>
                    <td>{c.progress_pct != null ? `${c.progress_pct}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {behindCounties.length > 0 ? (
              <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                {behindCounties.length} count{behindCounties.length === 1 ? 'y' : 'ies'} behind target (&lt;50% of goal).
              </p>
            ) : null}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-display text-xs uppercase tracking-wide text-muted-foreground">
            Inactive agents (online=false)
          </h3>
          <ul className="divide-y divide-border border border-border bg-card">
            {ops.inactive_agents.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">All active agents online.</li>
            ) : (
              ops.inactive_agents.map((a) => (
                <li key={a.id} className="flex justify-between px-4 py-2.5 text-sm">
                  <span>{a.name}</span>
                  <Link to="/dashboard/agents" className="text-xs text-primary">
                    View
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="space-y-3 lg:col-span-3">
          <h3 className="font-display text-xs uppercase tracking-wide text-muted-foreground">
            Last hour
          </h3>
          <div className="overflow-hidden border border-border bg-card">
            {ops.last_hour_activity.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No submissions in the last hour.</p>
            ) : (
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Respondent</th>
                    <th>Survey</th>
                  </tr>
                </thead>
                <tbody>
                  {ops.last_hour_activity.map((r) => (
                    <tr key={r.id}>
                      <td className="text-sm text-muted-foreground">
                        {r.submitted_at ? new Date(r.submitted_at).toLocaleTimeString() : '—'}
                      </td>
                      <td>{r.respondent.name || '—'}</td>
                      <td className="text-sm">{r.survey_title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="space-y-3 lg:col-span-2">
          <h3 className="font-display text-xs uppercase tracking-wide text-muted-foreground">
            Quality alerts
          </h3>
          <div className="space-y-2 border border-border bg-card p-3">
            {ops.quality_alerts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No alerts.</p>
            ) : (
              ops.quality_alerts.slice(0, 6).map((r) => (
                <Link
                  key={r.id}
                  to="/dashboard/review"
                  className="block border-b border-border py-2 last:border-0 hover:bg-muted/30"
                >
                  <div className="text-sm font-medium">{r.respondent.name || r.id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground">
                    Score {r.quality_score}% · {r.survey_title}
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <h3 className="font-display text-xs uppercase tracking-wide text-muted-foreground">
          Recent activity
        </h3>
        <div className="overflow-hidden border border-border bg-card">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Respondent</th>
                <th>Project</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {ops.recent_activity.map((r) => (
                <tr key={r.id}>
                  <td className="text-sm text-muted-foreground">
                    {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}
                  </td>
                  <td>{r.respondent.name || '—'}</td>
                  <td>
                    <Link
                      to={`/dashboard/projects/${r.project_id}`}
                      className="text-sm text-primary underline-offset-2 hover:underline"
                    >
                      {r.project_title || 'Project'}
                    </Link>
                  </td>
                  <td>
                    <Stamp status={r.lifecycle_stage} label={LIFECYCLE_LABELS[r.lifecycle_stage]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
