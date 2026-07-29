import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { analyticsBundle } from '@/lib/analytics';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COLORS = [
  '#1B4D3E',
  '#3D6B5C',
  '#A67C52',
  '#2C4A6E',
  '#5A6B7D',
  '#8B3A2F',
  '#2C3E50',
  '#6B8F71',
];

export type DistRow = { option: string; count: number; pct: number };

export type QuestionAnalytics = {
  id: string;
  label: string;
  type?: string;
  kind: 'choice' | 'number' | 'text' | 'media';
  chart?: 'donut' | 'pie' | 'bar' | 'histogram' | 'none';
  chartable?: boolean;
  count: number;
  min?: number | null;
  max?: number | null;
  mean?: number | null;
  median?: number | null;
  distribution?: DistRow[];
};

type Bundle = ReturnType<typeof analyticsBundle>;

type AgentOption = { id: string; name: string };

type Comparison = {
  compare_by: string;
  compare_by_label: string;
  question_id: string;
  question_label: string;
  segments: string[];
  options: string[];
  stacked: Array<Record<string, string | number>>;
  rows: Array<{
    segment: string;
    total: number;
    cells: DistRow[];
  }>;
};

type AnalyticsApi = {
  summary?: {
    total?: number;
    included?: number;
    excluded?: number;
    today?: number;
    questions?: number;
  };
  per_question?: QuestionAnalytics[];
  by_ward?: DistRow[];
  by_village?: DistRow[];
  by_status?: DistRow[];
  by_agent?: Array<DistRow & { agent_id?: string }>;
  trend?: { date: string; count: number }[];
  comparisons?: Comparison[];
  compare_by?: string;
  compare_options?: { id: string; label: string }[];
  agent_vs_all?: Array<{
    id: string;
    label: string;
    rows: Array<{
      option: string;
      agent_count: number;
      agent_pct: number;
      all_count: number;
      all_pct: number;
    }>;
  }>;
  agent_name?: string;
  scope?: string;
  exclusion_note?: string;
};

type Props = {
  api?: AnalyticsApi | null;
  bundle: Bundle;
  agents?: AgentOption[];
  selectedAgentId?: string;
  compareBy?: string;
  onAgentChange?: (agentId: string) => void;
  onCompareByChange?: (questionId: string) => void;
  loadingAnalytics?: boolean;
  onExportReport?: () => void;
};

function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-border bg-card ${className}`}>
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-display text-sm font-semibold leading-snug">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function DistTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DistRow & { name?: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <div className="font-medium">{row.option || row.name}</div>
      <div className="text-muted-foreground">
        {row.count} · {row.pct}%
      </div>
    </div>
  );
}

function DonutChart({ data, inner = 55 }: { data: DistRow[]; inner?: number }) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No answers yet</p>;
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="option"
            cx="50%"
            cy="50%"
            innerRadius={inner}
            outerRadius={80}
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={1}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<DistTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieFullChart({ data }: { data: DistRow[] }) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No data</p>;
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="option"
            cx="50%"
            cy="50%"
            outerRadius={80}
            paddingAngle={1}
            stroke="#fff"
            strokeWidth={1}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<DistTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function HorizontalBars({ data }: { data: DistRow[] }) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No answers yet</p>;
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#D3DAE3" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="option" width={96} tick={{ fontSize: 11 }} interval={0} />
          <Tooltip content={<DistTooltip />} />
          <Bar dataKey="count" radius={[0, 2, 2, 0]} maxBarSize={22}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HistogramBars({ data }: { data: DistRow[] }) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No numeric answers</p>;
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D3DAE3" />
          <XAxis
            dataKey="option"
            tick={{ fontSize: 10 }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={48}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip content={<DistTooltip />} />
          <Bar dataKey="count" fill="#1B4D3E" radius={[2, 2, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendArea({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No trend data</p>;
  }
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1B4D3E" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#1B4D3E" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#D3DAE3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              borderRadius: 2,
              border: '1px solid #D3DAE3',
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#1B4D3E"
            fill="url(#trendFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function StackedCompare({ comparison }: { comparison: Comparison }) {
  if (!comparison.stacked?.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Not enough paired answers</p>;
  }
  return (
    <div className="space-y-3">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparison.stacked} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D3DAE3" />
            <XAxis dataKey="segment" tick={{ fontSize: 10 }} interval={0} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 2,
                border: '1px solid #D3DAE3',
                fontSize: 12,
              }}
            />
            <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
            {comparison.options.map((opt, i) => (
              <Bar
                key={opt}
                dataKey={opt}
                stackId="a"
                fill={COLORS[i % COLORS.length]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-auto">
        <table className="ledger-table text-xs">
          <thead>
            <tr>
              <th>{comparison.compare_by_label}</th>
              {comparison.options.map((opt) => (
                <th key={opt} className="text-right">
                  {opt}
                </th>
              ))}
              <th className="text-right">n</th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row) => (
              <tr key={row.segment}>
                <td className="font-medium">{row.segment}</td>
                {row.cells.map((cell) => (
                  <td key={cell.option} className="text-right tabular-nums">
                    {cell.count}
                    <span className="text-muted-foreground"> ({cell.pct}%)</span>
                  </td>
                ))}
                <td className="text-right ledger-count">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AgentVsAllChart({
  rows,
  agentLabel,
}: {
  rows: Array<{
    option: string;
    agent_pct: number;
    all_pct: number;
    agent_count: number;
    all_count: number;
  }>;
  agentLabel: string;
}) {
  const data = rows.map((r) => ({
    option: r.option,
    [agentLabel]: r.agent_pct,
    'All agents': r.all_pct,
    agent_count: r.agent_count,
    all_count: r.all_count,
  }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D3DAE3" />
          <XAxis dataKey="option" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
          <YAxis unit="%" tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, name: string, item: any) => {
              const countKey = name === agentLabel ? 'agent_count' : 'all_count';
              return [`${value}% (${item.payload[countKey]})`, name];
            }}
            contentStyle={{ borderRadius: 2, border: '1px solid #D3DAE3', fontSize: 12 }}
          />
          <Legend />
          <Bar dataKey={agentLabel} fill="#1B4D3E" maxBarSize={28} />
          <Bar dataKey="All agents" fill="#A67C52" maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function QuestionChart({ q }: { q: QuestionAnalytics }) {
  const dist = q.distribution || [];
  const chart = q.chart || (q.kind === 'number' ? 'histogram' : dist.length <= 5 ? 'donut' : 'bar');

  if (q.kind === 'text' || (chart === 'none' && q.kind !== 'media')) {
    return (
      <ChartCard title={q.label} subtitle={`${q.count} text responses`}>
        <p className="text-sm text-muted-foreground">
          Free-text answers are not charted — export Data CSV to review.
        </p>
      </ChartCard>
    );
  }

  if (q.kind === 'media') {
    return (
      <ChartCard title={q.label} subtitle={`${q.count} captured`}>
        <DonutChart data={dist} />
      </ChartCard>
    );
  }

  const subtitle =
    q.kind === 'number'
      ? `n=${q.count}${q.mean != null ? ` · mean ${q.mean}` : ''}${q.median != null ? ` · median ${q.median}` : ''}${q.min != null ? ` · min ${q.min}` : ''}${q.max != null ? ` · max ${q.max}` : ''}`
      : `${q.count} answers`;

  return (
    <ChartCard title={q.label} subtitle={subtitle}>
      {chart === 'histogram' ? (
        <HistogramBars data={dist} />
      ) : chart === 'pie' ? (
        <PieFullChart data={dist} />
      ) : chart === 'bar' ? (
        <HorizontalBars data={dist} />
      ) : (
        <DonutChart data={dist} />
      )}
      {dist.length > 0 ? (
        <ul className="mt-2 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          {dist.map((d) => (
            <li key={d.option} className="flex justify-between gap-2">
              <span className="truncate">{d.option}</span>
              <span className="ledger-count shrink-0">
                {d.count} ({d.pct}%)
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </ChartCard>
  );
}

export function SurveyAnalyticsPanel({
  api,
  bundle,
  agents = [],
  selectedAgentId = '',
  compareBy = '',
  onAgentChange,
  onCompareByChange,
  loadingAnalytics,
  onExportReport,
}: Props) {
  const [activeCompareId, setActiveCompareId] = useState<string>('');

  const view = useMemo(() => {
    if (api?.per_question?.length) {
      return {
        included: api.summary?.included ?? bundle.totalIncluded,
        excluded: api.summary?.excluded ?? bundle.totalExcluded,
        today: api.summary?.today ?? bundle.todayCount,
        total: api.summary?.total ?? bundle.totalIncluded + bundle.totalExcluded,
        completion: bundle.completionRate,
        perQuestion: api.per_question as QuestionAnalytics[],
        byWard: api.by_ward || [],
        byVillage: api.by_village || [],
        byStatus: api.by_status || [],
        byAgent: api.by_agent || [],
        trend: api.trend || [],
        comparisons: api.comparisons || [],
        compareOptions: api.compare_options || [],
        agentVsAll: api.agent_vs_all || [],
        agentName: api.agent_name || 'Selected agent',
        scope: api.scope || 'all',
        note: api.exclusion_note || bundle.exclusionNote,
      };
    }

    const byWard: DistRow[] = Object.entries(bundle.byWard).map(([option, count]) => {
      const total = Object.values(bundle.byWard).reduce((a, b) => a + b, 0) || 1;
      return { option, count, pct: Math.round((count / total) * 100) };
    });
    const byVillage: DistRow[] = Object.entries(bundle.byVillage).map(([option, count]) => {
      const total = Object.values(bundle.byVillage).reduce((a, b) => a + b, 0) || 1;
      return { option, count, pct: Math.round((count / total) * 100) };
    });
    const byAgent: DistRow[] = bundle.byAgent.map((a) => {
      const total = bundle.byAgent.reduce((s, x) => s + x.count, 0) || 1;
      return { option: a.name, count: a.count, pct: Math.round((a.count / total) * 100) };
    });

    return {
      included: bundle.totalIncluded,
      excluded: bundle.totalExcluded,
      today: bundle.todayCount,
      total: bundle.totalIncluded + bundle.totalExcluded,
      completion: bundle.completionRate,
      perQuestion: bundle.perQuestion as QuestionAnalytics[],
      byWard,
      byVillage,
      byStatus: [] as DistRow[],
      byAgent,
      trend: [] as { date: string; count: number }[],
      comparisons: [] as Comparison[],
      compareOptions: [] as { id: string; label: string }[],
      agentVsAll: [] as NonNullable<AnalyticsApi['agent_vs_all']>,
      agentName: 'Selected agent',
      scope: 'all',
      note: bundle.exclusionNote,
    };
  }, [api, bundle]);

  useEffect(() => {
    if (view.comparisons.length) {
      setActiveCompareId((prev) =>
        prev && view.comparisons.some((c) => c.question_id === prev)
          ? prev
          : view.comparisons[0].question_id,
      );
    }
  }, [view.comparisons]);

  const activeComparison =
    view.comparisons.find((c) => c.question_id === activeCompareId) || view.comparisons[0];

  const metrics = [
    ['Included', view.included],
    ['Today', view.today],
    ['Excluded', view.excluded],
    ['Completion', `${view.completion}%`],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold">Question analytics</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Compare one field agent against all combined, and cross-tabulate questions.
          </p>
        </div>
        {onExportReport ? (
          <button
            type="button"
            onClick={onExportReport}
            className="rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted/40"
          >
            Generate report
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 border border-border bg-card p-3">
        <div className="space-y-1">
          <Label className="font-display text-xs uppercase tracking-wide">Scope</Label>
          <Select
            value={selectedAgentId || 'all'}
            onValueChange={(v) => onAgentChange?.(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-9 w-[220px] rounded-sm">
              <SelectValue placeholder="All agents combined" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents combined</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="font-display text-xs uppercase tracking-wide">Compare by</Label>
          <Select
            value={compareBy || view.compareOptions[0]?.id || ''}
            onValueChange={(v) => onCompareByChange?.(v)}
            disabled={!view.compareOptions.length}
          >
            <SelectTrigger className="h-9 w-[220px] rounded-sm">
              <SelectValue placeholder="Pick a question" />
            </SelectTrigger>
            <SelectContent>
              {view.compareOptions.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {loadingAnalytics ? (
          <div className="flex items-end pb-2 text-xs text-muted-foreground">Updating…</div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border sm:grid-cols-4">
        {metrics.map(([label, val]) => (
          <div key={label} className="bg-card px-4 py-3">
            <div className="font-display text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </div>
            <div className="ledger-count mt-1 text-2xl font-medium">{val}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {view.scope === 'agent'
          ? `Showing ${view.agentName}'s submissions. Charts below also compare against all agents combined.`
          : 'Showing all agents combined.'}{' '}
        {view.note}
      </p>

      {view.scope === 'agent' && view.agentVsAll.length > 0 ? (
        <section className="space-y-3">
          <h3 className="font-display text-xs uppercase tracking-wide text-muted-foreground">
            One agent vs all combined
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {view.agentVsAll.slice(0, 6).map((item) => (
              <ChartCard
                key={item.id}
                title={item.label}
                subtitle={`${view.agentName} % vs all agents %`}
              >
                <AgentVsAllChart rows={item.rows} agentLabel={view.agentName} />
              </ChartCard>
            ))}
          </div>
        </section>
      ) : null}

      {activeComparison ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                Cross-question comparison
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Break down each opinion question by {activeComparison.compare_by_label}.
              </p>
            </div>
            <Select value={activeCompareId} onValueChange={setActiveCompareId}>
              <SelectTrigger className="h-9 w-[260px] rounded-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {view.comparisons.map((c) => (
                  <SelectItem key={c.question_id} value={c.question_id}>
                    {c.question_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ChartCard
            title={activeComparison.question_label}
            subtitle={`Segmented by ${activeComparison.compare_by_label}`}
          >
            <StackedCompare comparison={activeComparison} />
          </ChartCard>
        </section>
      ) : null}

      {view.trend.length > 0 ? (
        <ChartCard title="Submissions over time" subtitle="Current scope">
          <TrendArea data={view.trend} />
        </ChartCard>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {view.perQuestion.map((q) => (
          <QuestionChart key={q.id} q={q} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="By ward" subtitle="Included submissions">
          <PieFullChart data={view.byWard} />
        </ChartCard>
        <ChartCard title="By village" subtitle="Included submissions">
          <DonutChart data={view.byVillage} inner={48} />
        </ChartCard>
        {view.byStatus.length > 0 ? (
          <ChartCard title="By review status" subtitle="All submissions in scope">
            <DonutChart data={view.byStatus} />
          </ChartCard>
        ) : (
          <ChartCard title="By agent" subtitle="Included submissions">
            <HorizontalBars data={view.byAgent} />
          </ChartCard>
        )}
      </div>

      {view.byStatus.length > 0 && view.byAgent.length > 0 ? (
        <ChartCard title="By agent" subtitle="Current scope">
          <HorizontalBars data={view.byAgent} />
        </ChartCard>
      ) : null}
    </div>
  );
}
