import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { QuestionAnalytics } from '@/components/SurveyAnalyticsPanel';
import type { analyticsBundle } from '@/lib/analytics';
import { generateQuestionInsight } from '@/lib/researchInsights';
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#1B4D3E', '#3D6B5C', '#A67C52', '#2C4A6E', '#5A6B7D', '#8B3A2F'];

type Props = {
  api?: Parameters<typeof SurveyAnalyticsPanel>[0]['api'];
  bundle: ReturnType<typeof analyticsBundle>;
  agents: { id: string; name: string }[];
  selectedAgentId?: string;
  compareBy?: string;
  onAgentChange?: (id: string) => void;
  onCompareByChange?: (id: string) => void;
  loadingAnalytics?: boolean;
};

function QuestionFocusChart({ q }: { q: QuestionAnalytics }) {
  const data = q.distribution || [];
  if (!data.length) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">No answers in this filter scope.</p>
    );
  }
  if (q.kind === 'number' || data.length > 6) {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 8, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="option" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="option" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.pct}%`}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SurveyQuestionAnalysis({
  api,
  bundle,
  agents,
  selectedAgentId,
  compareBy,
  onAgentChange,
  onCompareByChange,
  loadingAnalytics,
}: Props) {
  const perQuestion = useMemo(() => {
    if (api?.per_question?.length) {
      return api.per_question as QuestionAnalytics[];
    }
    return bundle.perQuestion as QuestionAnalytics[];
  }, [api, bundle]);

  const [filter, setFilter] = useState('');
  const [index, setIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return perQuestion;
    return perQuestion.filter((item) => item.label.toLowerCase().includes(q));
  }, [perQuestion, filter]);

  useEffect(() => {
    setIndex(0);
  }, [filter, selectedAgentId, compareBy]);

  const safeIndex = Math.min(index, Math.max(0, filtered.length - 1));
  const current = filtered[safeIndex];

  const insight = current ? generateQuestionInsight(current) : '';

  const compareOptions = api?.compare_options || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 border border-border bg-card p-3">
        <div className="space-y-1">
          <Label className="font-display text-xs uppercase tracking-wide">Agent filter</Label>
          <Select
            value={selectedAgentId || 'all'}
            onValueChange={(v) => onAgentChange?.(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-9 w-[200px] rounded-sm">
              <SelectValue placeholder="All agents" />
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
          <Label className="font-display text-xs uppercase tracking-wide">Demographic breakdown</Label>
          <Select
            value={compareBy || compareOptions[0]?.id || ''}
            onValueChange={(v) => onCompareByChange?.(v)}
            disabled={!compareOptions.length}
          >
            <SelectTrigger className="h-9 w-[220px] rounded-sm">
              <SelectValue placeholder="Compare by question" />
            </SelectTrigger>
            <SelectContent>
              {compareOptions.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative min-w-[180px] flex-1 space-y-1">
          <Label className="font-display text-xs uppercase tracking-wide">Questions</Label>
          <Input
            className="h-9 rounded-sm"
            placeholder="Search questions…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {loadingAnalytics ? (
          <span className="pb-2 text-xs text-muted-foreground">Refreshing analytics…</span>
        ) : null}
      </div>

      {filtered.length > 0 && current ? (
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
              <QuestionFocusChart q={current} />
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
