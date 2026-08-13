import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { responsesAPI, surveysAPI, agentQueriesAPI } from '@/services/api';
import type { SurveyResponse } from '@/domain';
import { ResponseDetailPanel } from '@/components/ResponseDetailPanel';
import { Stamp } from '@/components/Stamp';
import { LIFECYCLE_LABELS } from '@/domain/enums';
import { normalizeQuestions } from '@/domain/question';

const ReviewWorkspace = () => {
  const [queue, setQueue] = useState<SurveyResponse[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState<ReturnType<typeof normalizeQuestions>>([]);

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

  const current = queue[index];

  useEffect(() => {
    if (!current?.survey_id) return;
    void surveysAPI.getById(current.survey_id).then((data) => {
      const s = data.survey || data;
      setQuestions(normalizeQuestions(s.questions));
    });
  }, [current?.survey_id]);

  const act = async (payload: Parameters<typeof responsesAPI.validate>[1]) => {
    if (!current) return;
    setBusy(true);
    try {
      await responsesAPI.validate(current.id, { ...payload, validation_notes: notes });
      toast.success('Saved');
      setNotes('');
      const next = Math.min(index, queue.length - 2);
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

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[480px] flex-col gap-3">
      <div>
        <h2 className="font-display text-lg font-semibold">Quality assurance</h2>
        <p className="text-sm text-muted-foreground">
          Split-screen review — {queue.length} in queue · item {queue.length ? index + 1 : 0} of{' '}
          {queue.length}
        </p>
      </div>

      {queue.length === 0 ? (
        <p className="border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          No responses waiting for review.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden border border-border">
          <div className="w-[38%] min-w-[260px] overflow-y-auto border-r border-border bg-muted/20">
            <ul>
              {queue.map((r, i) => (
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
          </div>
          <div className="min-w-0 flex-1">
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
        </div>
      )}
    </div>
  );
};

export default ReviewWorkspace;
