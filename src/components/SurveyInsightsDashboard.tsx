import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { surveysAPI } from '@/services/api';

type Props = {
  surveyId: string;
};

export function SurveyInsightsDashboard({ surveyId }: Props) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void Promise.all([surveysAPI.getInsights(surveyId)])
      .then(([insights]) => {
        setData(insights);
      })
      .catch(() => {
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [surveyId]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Loading insights…
      </div>
    );
  }

  if (!data?.summary) {
    return (
      <p className="text-sm text-muted-foreground">No insights available for this survey.</p>
    );
  }

  const summary = data.summary as Record<string, number | null>;
  const daily = (data.daily_trend as { date: string; count: number }[]) || [];
  const regional = data.regional as {
    by_county: { name: string; count: number }[];
    by_ward: { name: string; count: number }[];
  };

  const metrics = [
    { label: 'Total responses', value: summary.total_responses },
    { label: 'Today', value: summary.responses_today },
    { label: 'Completion rate', value: summary.completion_rate_pct != null ? `${summary.completion_rate_pct}%` : '—' },
    { label: 'Avg duration', value: summary.avg_duration_seconds != null ? `${Math.round(Number(summary.avg_duration_seconds) / 60)} min` : '—' },
    { label: 'Approved', value: summary.approved },
    { label: 'Rejected', value: summary.rejected },
    { label: 'Missing data', value: summary.missing_data_count },
    { label: 'Duplicate groups', value: summary.duplicate_groups },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{m.label}</div>
            <div className="ledger-count mt-1 text-2xl font-medium">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-border bg-card p-4">
          <h3 className="font-display text-xs uppercase tracking-wide text-muted-foreground">
            Daily responses
          </h3>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="border border-border bg-card p-4">
          <h3 className="font-display text-xs uppercase tracking-wide text-muted-foreground">
            Regional breakdown (county)
          </h3>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regional?.by_county?.slice(0, 8) || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {(data.question_analytics as { label: string; distribution?: { option: string; count: number }[] }[])?.length ? (
        <section>
          <h3 className="mb-3 font-display text-xs uppercase tracking-wide text-muted-foreground">
            Per-question charts
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {(data.question_analytics as { id: string; label: string; distribution?: { option: string; count: number }[] }[])
              .slice(0, 8)
              .map((q) => (
                <div key={q.id} className="border border-border bg-card p-3">
                  <div className="text-sm font-medium">{q.label}</div>
                  <div className="mt-2 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={q.distribution || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="option" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={45} />
                        <YAxis allowDecimals={false} width={28} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
