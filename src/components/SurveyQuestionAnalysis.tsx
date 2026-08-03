import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { QuestionAnalytics } from '@/components/SurveyAnalyticsPanel';
import type { analyticsBundle } from '@/lib/analytics';
import { generateQuestionInsight } from '@/lib/researchInsights';
import { isChartableAnalyticsRow } from '@/lib/chartableQuestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
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

const COLORS = ['#1B4D3E', '#3D6B5C', '#A67C52', '#2C4A6E', '#5A6B7D', '#8B3A2F'];

type ChartView = 'pie' | 'donut' | 'bar' | 'table';
type TableSort = 'count' | 'pct' | 'label';
type TableOrder = 'asc' | 'desc';

type Props = {
  api?: {
    per_question?: QuestionAnalytics[];
    compare_options?: { id: string; label: string }[];
    comparisons?: unknown[];
  } | null;
  bundle: ReturnType<typeof analyticsBundle>;
  questionFilter?: string;
  onQuestionFilterChange?: (value: string) => void;
};

function QuestionFocusChart({
  q,
  chartView,
  tableSort,
  tableOrder,
  onTableSort,
}: {
  q: QuestionAnalytics;
  chartView: ChartView;
  tableSort: TableSort;
  tableOrder: TableOrder;
  onTableSort: (col: TableSort) => void;
}) {
  const data = useMemo(() => {
    const rows = [...(q.distribution || [])];
    if (tableSort === 'label') {
      rows.sort((a, b) => a.option.localeCompare(b.option));
    } else {
      rows.sort((a, b) => a[tableSort] - b[tableSort]);
    }
    if (tableOrder === 'asc') rows.reverse();
    return rows;
  }, [q.distribution, tableSort, tableOrder]);

  if (!data.length) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">No answers in this filter scope.</p>
    );
  }

  const SortBtn = ({ col, label }: { col: TableSort; label: string }) => (
    <button
      type="button"
      className="inline-flex items-center gap-0.5 hover:text-foreground"
      onClick={() => onTableSort(col)}
    >
      {label}
      {tableSort === col ? (
        tableOrder === 'desc' ? (
          <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUp className="h-3 w-3" />
        )
      ) : null}
    </button>
  );

  if (chartView === 'pie' || chartView === 'donut') {
    return (
      <div className="space-y-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="option"
                cx="50%"
                cy="50%"
                innerRadius={chartView === 'donut' ? 52 : 0}
                outerRadius={88}
                paddingAngle={1}
                label={(e) => `${e.pct}%`}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name, item) => [
                  `${Number(value).toLocaleString()} (${item.payload.pct}%)`,
                  item.payload.option,
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={48}
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <DistributionTable data={data} SortBtn={SortBtn} />
      </div>
    );
  }

  if (chartView === 'bar') {
    return (
      <div className="space-y-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 8, right: 8, bottom: 48, top: 12 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="option"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={60}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value: number, _name, item) => [
                  `${value.toLocaleString()} (${item.payload.pct}%)`,
                  'Count',
                ]}
              />
              <Bar dataKey="count" name="Count" radius={[2, 2, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <DistributionTable data={data} SortBtn={SortBtn} />
      </div>
    );
  }

  return <DistributionTable data={data} SortBtn={SortBtn} />;
}

function DistributionTable({
  data,
  SortBtn,
}: {
  data: { option: string; count: number; pct: number }[];
  SortBtn: React.ComponentType<{ col: TableSort; label: string }>;
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-2 pr-2">#</th>
            <th className="py-2 pr-2">
              <SortBtn col="label" label="Label" />
            </th>
            <th className="py-2 pr-2 text-right">
              <SortBtn col="count" label="Count" />
            </th>
            <th className="py-2 text-right">
              <SortBtn col="pct" label="%" />
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.option} className="border-b border-border/60">
              <td className="py-1.5 pr-2 tabular-nums text-muted-foreground">{i + 1}</td>
              <td className="py-1.5 pr-2 font-medium">{row.option}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{row.count.toLocaleString()}</td>
              <td className="py-1.5 text-right tabular-nums">{row.pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SurveyQuestionAnalysis({
  api,
  bundle,
  questionFilter: externalFilter,
  onQuestionFilterChange,
}: Props) {
  const perQuestion = useMemo(() => {
    const rows = api?.per_question?.length
      ? (api.per_question as QuestionAnalytics[])
      : (bundle.perQuestion as QuestionAnalytics[]);
    return rows.filter(isChartableAnalyticsRow);
  }, [api, bundle]);

  const [internalFilter, setInternalFilter] = useState('');
  const filter = externalFilter ?? internalFilter;
  const setFilter = onQuestionFilterChange ?? setInternalFilter;

  const [index, setIndex] = useState(0);
  const [chartView, setChartView] = useState<ChartView>('pie');
  const [tableSort, setTableSort] = useState<TableSort>('count');
  const [tableOrder, setTableOrder] = useState<TableOrder>('desc');

  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return perQuestion;
    return perQuestion.filter((item) => item.label.toLowerCase().includes(q));
  }, [perQuestion, filter]);

  useEffect(() => {
    setIndex(0);
  }, [filter]);

  const safeIndex = Math.min(index, Math.max(0, filtered.length - 1));
  const current = filtered[safeIndex];
  const insight = current ? generateQuestionInsight(current) : '';

  const handleTableSort = (col: TableSort) => {
    if (tableSort === col) {
      setTableOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
    } else {
      setTableSort(col);
      setTableOrder(col === 'label' ? 'asc' : 'desc');
    }
  };

  useEffect(() => {
    if (!current) return;
    const suggested =
      current.chart === 'bar' ? 'bar' : current.chart === 'donut' ? 'donut' : 'pie';
    setChartView(suggested);
  }, [current?.id]);

  if (!filtered.length) {
    return (
      <p className="border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        No chartable questions match these filters.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[180px] flex-1 space-y-1">
          <Label className="font-display text-xs uppercase tracking-wide">Search questions</Label>
          <Input
            className="h-9 rounded-sm"
            placeholder="Search questions…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="font-display text-xs uppercase tracking-wide">Chart type</Label>
          <div className="flex gap-1">
            {(['pie', 'donut', 'bar', 'table'] as const).map((v) => (
              <Button
                key={v}
                type="button"
                size="sm"
                variant={chartView === v ? 'default' : 'outline'}
                className="h-9 rounded-sm capitalize"
                onClick={() => setChartView(v)}
              >
                {v}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {current ? (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="max-h-[28rem] overflow-y-auto border border-border bg-card">
            {filtered.map((q, i) => (
              <button
                key={q.id}
                type="button"
                className={`block w-full border-b border-border px-3 py-2.5 text-left text-xs last:border-0 hover:bg-muted/40 ${
                  i === safeIndex ? 'bg-primary/5 font-medium' : ''
                }`}
                onClick={() => setIndex(i)}
              >
                <span className="line-clamp-2">{q.label}</span>
                <span className="mt-0.5 block text-muted-foreground">n={q.count}</span>
              </button>
            ))}
          </aside>

          <div className="border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div>
                <div className="font-display text-sm font-semibold">{current.label}</div>
                <div className="text-xs text-muted-foreground">
                  Question {safeIndex + 1} of {filtered.length} · {current.kind} · n={current.count}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-sm"
                  disabled={safeIndex <= 0}
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-sm"
                  disabled={safeIndex >= filtered.length - 1}
                  onClick={() => setIndex((i) => Math.min(filtered.length - 1, i + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4">
              <QuestionFocusChart
                q={current}
                chartView={chartView}
                tableSort={tableSort}
                tableOrder={tableOrder}
                onTableSort={handleTableSort}
              />
              <div className="mt-4 flex gap-2 border border-border bg-muted/30 p-3 text-sm">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <div className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                    Insight
                  </div>
                  <p className="mt-1 leading-relaxed text-foreground">{insight}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
