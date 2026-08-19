import { useEffect, useRef, useState } from 'react';
import { TrendingUp, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { surveysAPI } from '@/services/api';
import type { SurveyQuestion } from '@/lib/questions';

type DistRow = { option: string; count: number; pct: number };

type WardAnalytics = {
  summary?: { total?: number; included?: number };
  per_question?: Array<{
    id: string;
    label: string;
    kind: string;
    distribution?: DistRow[];
    count?: number;
  }>;
  by_agent?: Array<{ option: string; count: number; agent_id?: string }>;
};

type Props = {
  surveyId: string;
  ward: string;
  questions: SurveyQuestion[];
  currentAnswers: Record<string, unknown>;
};

function matchLabel(answer: unknown): string[] {
  if (answer == null) return [];
  if (Array.isArray(answer)) return answer.map(String);
  return [String(answer).trim()].filter(Boolean);
}

function rankMatch(
  dist: DistRow[],
  answer: unknown,
): 'leader' | 'matches' | 'differs' | 'none' {
  if (!dist.length) return 'none';
  const leader = dist[0].option;
  const picks = matchLabel(answer);
  if (!picks.length) return 'none';
  if (picks.includes(leader)) return 'leader';
  if (dist.slice(0, 3).some((d) => picks.includes(d.option))) return 'matches';
  return 'differs';
}

export function WardSnapshotPanel({ surveyId, ward, questions, currentAnswers }: Props) {
  const [analytics, setAnalytics] = useState<WardAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const prevKey = useRef('');

  useEffect(() => {
    const key = `${surveyId}::${ward}`;
    if (!surveyId || !ward || prevKey.current === key) return;
    prevKey.current = key;
    setLoading(true);
    setAnalytics(null);
    surveysAPI
      .getAnalytics(surveyId, { ward, status: 'approved' })
      .then((data) => setAnalytics(data as WardAnalytics))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, [surveyId, ward]);

  if (!ward || !surveyId) return null;

  const choiceQuestions = (analytics?.per_question || []).filter(
    (q) => (q.kind === 'choice' || q.kind === 'number') && (q.distribution?.length ?? 0) > 0,
  );

  const totalApproved = analytics?.summary?.included ?? analytics?.summary?.total ?? 0;

  return (
    <div className="flex h-full flex-col overflow-y-auto border-l border-border bg-muted/10">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card px-3 py-2.5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span className="font-display text-xs font-semibold text-primary">
            Ward snapshot
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium">{ward}</span>
          {loading ? (
            <span className="text-[10px] text-muted-foreground">Loading…</span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="h-2.5 w-2.5" />
              {totalApproved} approved
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && !analytics && (
        <p className="px-3 py-4 text-center text-xs text-muted-foreground">
          No approved data yet for this ward.
        </p>
      )}

      {!loading && analytics && (
        <div className="flex-1 space-y-0 divide-y divide-border">
          {/* Summary row */}
          <div className="grid grid-cols-2 gap-px bg-border">
            <div className="bg-card px-3 py-2">
              <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Approved</div>
              <div className="font-display text-lg font-bold text-primary">{totalApproved}</div>
            </div>
            <div className="bg-card px-3 py-2">
              <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Questions</div>
              <div className="font-display text-lg font-bold text-foreground">{choiceQuestions.length}</div>
            </div>
          </div>

          {/* Per-question leader breakdown */}
          {choiceQuestions.length === 0 && (
            <p className="px-3 py-3 text-center text-xs text-muted-foreground">
              No choice questions with data yet.
            </p>
          )}

          {choiceQuestions.map((q) => {
            const dist = (q.distribution || []).slice(0, 5);
            const leader = dist[0];
            const currentAnswer = currentAnswers[q.id];
            const match = rankMatch(dist, currentAnswer);
            const currentPicks = matchLabel(currentAnswer);

            return (
              <div key={q.id} className="px-3 py-2.5">
                {/* Question label */}
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <span className="text-[10px] font-medium leading-snug">
                    {questions.find((x) => x.id === q.id)?.label ?? q.label}
                  </span>
                  {match === 'leader' && (
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" title="Matches ward leader" />
                  )}
                  {match === 'differs' && (
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" title="Differs from ward leader" />
                  )}
                </div>

                {/* Ranked distribution */}
                <div className="space-y-1">
                  {dist.map((row, i) => {
                    const isPicked = currentPicks.includes(row.option);
                    const isWardLeader = i === 0;
                    return (
                      <div key={row.option} className="group">
                        <div className="mb-0.5 flex items-center justify-between gap-1">
                          <span
                            className={`truncate text-[10px] leading-none ${
                              isPicked
                                ? 'font-semibold text-foreground'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {isWardLeader ? (
                              <span className="mr-1 text-[8px] font-bold uppercase tracking-wide text-primary">
                                #1
                              </span>
                            ) : (
                              <span className="mr-1 text-[8px] text-muted-foreground/60">
                                #{i + 1}
                              </span>
                            )}
                            {row.option}
                          </span>
                          <span className="shrink-0 font-mono text-[9px] text-muted-foreground">
                            {row.pct}%
                          </span>
                        </div>
                        <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isPicked
                                ? 'bg-primary'
                                : isWardLeader
                                  ? 'bg-primary/30'
                                  : 'bg-muted-foreground/20'
                            }`}
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* This interview's answer highlight */}
                {currentPicks.length > 0 && (
                  <div
                    className={`mt-1.5 rounded-sm px-2 py-1 text-[9px] ${
                      match === 'leader'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : match === 'differs'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="font-medium">This interview: </span>
                    {currentPicks.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
