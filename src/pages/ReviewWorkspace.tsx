import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { responsesAPI, surveysAPI, agentQueriesAPI } from '@/services/api';
import type { SurveyResponse } from '@/domain';
import { ResponseDetailPanel } from '@/components/ResponseDetailPanel';
import { WardSnapshotPanel } from '@/components/WardSnapshotPanel';
import { Stamp } from '@/components/Stamp';
import { LIFECYCLE_LABELS } from '@/domain/enums';
import { normalizeQuestions } from '@/domain/question';
import { useConfirmAction } from '@/components/confirm-action';

const ReviewWorkspace = () => {
  const confirmAction = useConfirmAction();
  const [queue, setQueue] = useState<SurveyResponse[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState<ReturnType<typeof normalizeQuestions>>([]);
  const [wardFilter, setWardFilter] = useState<string>('');
  const [showSnapshot, setShowSnapshot] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await responsesAPI.getAll({
        lifecycle_stage: 'pending_review',
        per_page: 200,
        sort_by: 'submitted_at',
        sort_order: 'asc',
      });
      const flagged = await responsesAPI.getAll({
        status: 'flagged',
        per_page: 100,
      });
      const merged = [...res.responses];
      for (const r of flagged.responses) {
        if (!merged.find((x) => x.id === r.id)) merged.push(r);
      }
      setQueue(merged);
      setIndex(0);
    } catch {
      toast.error('Could not load review queue');
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Unique wards from the queue
  const wardOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const r of queue) {
      const w = r.location?.ward?.trim();
      if (w && !/^unknown/i.test(w)) seen.add(w);
    }
    return Array.from(seen).sort();
  }, [queue]);

  // Ward stats for sidebar header
  const wardStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const r of queue) {
      const w = r.location?.ward?.trim() || 'Unknown';
      stats[w] = (stats[w] || 0) + 1;
    }
    return stats;
  }, [queue]);

  // Filtered queue based on selected ward
  const filteredQueue = useMemo(
    () => (wardFilter ? queue.filter((r) => (r.location?.ward?.trim() || '') === wardFilter) : queue),
    [queue, wardFilter],
  );

  const current = filteredQueue[index];

  useEffect(() => {
    setIndex(0);
  }, [wardFilter]);

  useEffect(() => {
    if (!current?.survey_id) return;
    void surveysAPI.getById(current.survey_id).then((data) => {
      const s = data.survey || data;
      setQuestions(normalizeQuestions(s.questions));
    });
  }, [current?.survey_id]);

  const act = async (payload: Parameters<typeof responsesAPI.validate>[1]) => {
    if (!current) return;
    const action =
      payload.status === 'rejected'
        ? 'Reject'
        : payload.status === 'flagged' || payload.flag
          ? 'Flag'
          : 'Approve';
    const ok = await confirmAction({
      title: `${action} this interview?`,
      description:
        action === 'Reject'
          ? 'The interview will be marked invalid and excluded from approved reporting.'
          : action === 'Flag'
            ? 'The interview will stay in review with a quality flag.'
            : 'The interview will be marked approved and counted in reports.',
      confirmLabel: action,
      tone: action === 'Reject' ? 'danger' : action === 'Flag' ? 'warning' : 'default',
      facts: [
        { label: 'Respondent', value: current.respondent?.name || current.id.slice(0, 8) },
        { label: 'Agent', value: current.agent_name || '—' },
        { label: 'Survey', value: current.survey_title || '—' },
      ],
    });
    if (!ok) return;
    setBusy(true);
    try {
      await responsesAPI.validate(current.id, { ...payload, validation_notes: notes });
      toast.success('Saved');
      setNotes('');
      const next = Math.min(index, filteredQueue.length - 2);
      await load();
      setIndex(Math.max(0, next));
    } catch {
      toast.error('Failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Loading queue…
      </div>
    );
  }

  const currentWard = current?.location?.ward?.trim() || '';
  const currentSurveyId = current?.survey_id || '';

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[480px] flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">Quality assurance</h2>
          <p className="text-sm text-muted-foreground">
            {wardFilter ? `Ward: ${wardFilter} · ` : ''}
            {filteredQueue.length} in queue · item {filteredQueue.length ? index + 1 : 0} of{' '}
            {filteredQueue.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Ward filter */}
          {wardOptions.length > 0 && (
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="h-8 rounded-sm border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All wards ({queue.length})</option>
              {wardOptions.map((w) => (
                <option key={w} value={w}>
                  {w} ({wardStats[w] ?? 0})
                </option>
              ))}
            </select>
          )}
          {/* Toggle snapshot */}
          <button
            type="button"
            onClick={() => setShowSnapshot((v) => !v)}
            className={`h-8 rounded-sm border px-2.5 text-xs transition-colors ${
              showSnapshot
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Ward snapshot {showSnapshot ? 'on' : 'off'}
          </button>
        </div>
      </div>

      {queue.length === 0 ? (
        <p className="border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          No responses waiting for review.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden border border-border">
          {/* Left: queue list */}
          <div className="w-[26%] min-w-[200px] overflow-y-auto border-r border-border bg-muted/20">
            {/* Ward group headers */}
            {wardFilter === '' ? (
              wardOptions.map((ward) => {
                const wardItems = queue.filter((r) => (r.location?.ward?.trim() || '') === ward);
                if (!wardItems.length) return null;
                return (
                  <div key={ward}>
                    <button
                      type="button"
                      onClick={() => setWardFilter(ward)}
                      className="flex w-full items-center justify-between border-b border-border/60 bg-muted/40 px-3 py-1.5 text-left hover:bg-muted/60"
                    >
                      <span className="font-display text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {ward}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {wardItems.length}
                      </span>
                    </button>
                    {wardItems.slice(0, 3).map((r) => {
                      const globalIdx = queue.indexOf(r);
                      const filtIdx = filteredQueue.indexOf(r);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          className={`flex w-full flex-col gap-0.5 border-b border-border px-3 py-2 text-left text-sm transition-colors ${
                            r.id === current?.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => {
                            void globalIdx;
                            setIndex(filtIdx >= 0 ? filtIdx : 0);
                          }}
                        >
                          <span className="truncate text-xs font-medium">
                            {r.respondent.name || r.id.slice(0, 8)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{r.agent_name}</span>
                          <Stamp
                            status={r.lifecycle_stage}
                            label={LIFECYCLE_LABELS[r.lifecycle_stage]}
                            className="mt-0.5 w-fit"
                          />
                        </button>
                      );
                    })}
                    {wardItems.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setWardFilter(ward)}
                        className="w-full border-b border-border/40 px-3 py-1 text-center text-[10px] text-muted-foreground hover:bg-muted/40"
                      >
                        +{wardItems.length - 3} more — filter to this ward
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <ul>
                {filteredQueue.map((r, i) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className={`flex w-full flex-col gap-0.5 border-b border-border px-3 py-2.5 text-left text-sm transition-colors ${
                        i === index ? 'bg-primary/10' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setIndex(i)}
                    >
                      <span className="font-medium">{r.respondent.name || r.id.slice(0, 8)}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.survey_title} · {r.agent_name}
                      </span>
                      <Stamp
                        status={r.lifecycle_stage}
                        label={LIFECYCLE_LABELS[r.lifecycle_stage]}
                        className="mt-1 w-fit"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Center: interview detail */}
          <div className="min-w-0 flex-1 overflow-hidden">
            {current ? (
              <ResponseDetailPanel
                response={current}
                questions={questions}
                notes={notes}
                onNotesChange={setNotes}
                busy={busy}
                onApprove={() => void act({ status: 'approved' })}
                onFlag={() => void act({ status: 'flagged', flag: true })}
                onReject={() => void act({ status: 'rejected', is_valid: false })}
                onQueryAgent={async (message) => {
                  setBusy(true);
                  try {
                    await agentQueriesAPI.create({
                      message,
                      response_id: current.id,
                      agent_id: current.agent_id,
                      survey_id: current.survey_id,
                      reason: (current.quality_flags || [])[0]?.split(':')[0] || 'quality',
                      flag_response: true,
                    });
                    toast.success('Agent queried — interview flagged');
                    setNotes('');
                    await load();
                  } catch (err: any) {
                    toast.error(err?.response?.data?.error || 'Could not query agent');
                    throw err;
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            ) : null}
          </div>

          {/* Right: ward snapshot */}
          {showSnapshot && current && currentWard && (
            <div className="w-[22%] min-w-[180px] overflow-hidden">
              <WardSnapshotPanel
                surveyId={currentSurveyId}
                ward={currentWard}
                questions={questions}
                currentAnswers={(current.answers as Record<string, unknown>) || {}}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewWorkspace;
