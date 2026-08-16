import type { SurveyResponse } from '@/domain';
import { isUnknownLocationValue } from '@/domain/constants';
import { LIFECYCLE_LABELS } from '@/domain/enums';
import { normalizeQuestions } from '@/domain/question';
import { Stamp } from '@/components/Stamp';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { formatDateTimeEAT } from '@/lib/datetime';
import { useState } from 'react';
import { Link } from 'react-router-dom';

function answerText(answers: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = answers[key];
    if (v != null && String(v).trim() !== '') return String(v);
  }
  return '';
}

type Props = {
  response: SurveyResponse;
  questions?: ReturnType<typeof normalizeQuestions>;
  notes: string;
  onNotesChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onFlag: () => void;
  onQueryAgent?: (message: string) => void | Promise<void>;
  busy?: boolean;
};

export function ResponseDetailPanel({
  response: r,
  questions = [],
  notes,
  onNotesChange,
  onApprove,
  onReject,
  onFlag,
  onQueryAgent,
  busy,
}: Props) {
  const duration = r.metadata.duration_seconds;
  const [queryMode, setQueryMode] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [queryBusy, setQueryBusy] = useState(false);

  const sendQuery = async () => {
    if (!onQueryAgent || queryText.trim().length < 5) return;
    setQueryBusy(true);
    try {
      await onQueryAgent(queryText.trim());
      setQueryText('');
      setQueryMode(false);
    } finally {
      setQueryBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-mono text-xs text-muted-foreground">{r.id}</div>
            <h3 className="font-display text-sm font-semibold">{r.survey_title || 'Interview'}</h3>
          </div>
          <Stamp status={r.lifecycle_stage} label={LIFECYCLE_LABELS[r.lifecycle_stage]} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <span className="text-foreground">{r.respondent.name || '—'}</span>
            <div>
              {r.respondent.phone_number ||
                answerText(r.answers, 'lari_mobile', 'pd_phone', 'phone') ||
                'No phone'}
            </div>
          </div>
          <div>
            {r.respondent.gender ||
              answerText(r.answers, 'lari_gender', 'pd_gender', 'gender') ||
              '—'}{' '}
            ·{' '}
            {(r.respondent.age ??
              answerText(r.answers, 'lari_age', 'pd_age', 'age')) ||
              '—'}
          </div>
          <div className="col-span-2">
            {r.location.county} → {r.location.subcounty} →{' '}
            {!isUnknownLocationValue(r.location.ward)
              ? r.location.ward
              : answerText(r.answers, 'lari_ward', 'ward') || r.location.ward}{' '}
            →{' '}
            {!isUnknownLocationValue(r.location.village)
              ? r.location.village
              : answerText(r.answers, 'lari_village', 'village') || r.location.village}
          </div>
          <div>Agent: {r.agent_name || r.agent_id}</div>
          <div>Quality: {r.quality_score}%</div>
          <div>
            Started:{' '}
            {formatDateTimeEAT(
              r.started_at || (typeof r.metadata.started_at === 'string' ? r.metadata.started_at : null),
            )}
          </div>
          <div>
            Submitted:{' '}
            {formatDateTimeEAT(r.submitted_at)}
          </div>
          <div>
            Duration: {duration != null ? `${Math.round(duration / 60)} min` : '—'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <h4 className="font-display text-xs uppercase tracking-wide text-muted-foreground">
          Answers
        </h4>
        <dl className="mt-2 space-y-3">
          {questions.length > 0
            ? questions.map((q) => (
                <div key={q.id} className="border-b border-border pb-2">
                  <dt className="text-xs font-medium text-muted-foreground">{q.label}</dt>
                  <dd className="mt-0.5 text-sm text-foreground">
                    {formatAnswer(r.answers[q.id])}
                  </dd>
                </div>
              ))
            : Object.entries(r.answers).map(([k, v]) => (
                <div key={k} className="border-b border-border pb-2">
                  <dt className="font-mono text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 text-sm">{formatAnswer(v)}</dd>
                </div>
              ))}
        </dl>

        {r.review_history.length > 0 ? (
          <>
            <h4 className="mt-6 font-display text-xs uppercase tracking-wide text-muted-foreground">
              Review history
            </h4>
            <ul className="mt-2 space-y-2 text-xs">
              {r.review_history.map((ev, i) => (
                <li key={i} className="rounded-sm border border-border bg-muted/30 px-2 py-1.5">
                  <div className="text-muted-foreground">
                    {ev.by} · {formatDateTimeEAT(ev.at)}
                  </div>
                  {ev.notes ? <div className="mt-1">{ev.notes}</div> : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {r.validation_notes ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Notes: {r.validation_notes}
          </p>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-border p-4">
        <Textarea
          placeholder="Review notes…"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="min-h-[72px] rounded-sm text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-sm" disabled={busy} onClick={onApprove}>
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-sm"
            disabled={busy}
            onClick={onFlag}
          >
            Flag
          </Button>
          {onQueryAgent ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-sm"
              disabled={busy}
              onClick={() => {
                setQueryMode((v) => !v);
                if (!queryText && (notes || r.quality_flags?.length)) {
                  const flags = (r.quality_flags || []).join(', ');
                  setQueryText(
                    notes ||
                      `Please explain this interview. Quality flags: ${flags || 'manual review'}.`,
                  );
                }
              }}
            >
              Flag &amp; query agent
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="destructive"
            className="rounded-sm"
            disabled={busy}
            onClick={onReject}
          >
            Reject
          </Button>
        </div>
        {queryMode && onQueryAgent ? (
          <div className="space-y-2 rounded-sm border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              Flags this interview and sends a question to{' '}
              <span className="font-medium text-foreground">{r.agent_name || 'the agent'}</span>.
              They reply in the agent app. Track replies under{' '}
              <Link to="/dashboard/queries" className="text-primary underline-offset-2 hover:underline">
                Agent queries
              </Link>
              .
            </p>
            <Textarea
              className="min-h-[88px] rounded-sm text-sm"
              placeholder="What should the agent explain?"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="rounded-sm"
                disabled={queryBusy || queryText.trim().length < 5}
                onClick={() => void sendQuery()}
              >
                {queryBusy ? 'Sending…' : 'Send query'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-sm"
                onClick={() => setQueryMode(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatAnswer(v: unknown): string {
  if (v === undefined || v === null || v === '') return '—';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if ('lat' in o && 'lng' in o) {
      return `${Number(o.lat).toFixed(5)}, ${Number(o.lng).toFixed(5)}`;
    }
    return JSON.stringify(v);
  }
  return String(v);
}
