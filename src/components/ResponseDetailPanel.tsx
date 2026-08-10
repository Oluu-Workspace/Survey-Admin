import type { SurveyResponse } from '@/domain';
import { isUnknownLocationValue } from '@/domain/constants';
import { LIFECYCLE_LABELS } from '@/domain/enums';
import { normalizeQuestions } from '@/domain/question';
import { Stamp } from '@/components/Stamp';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

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
  busy,
}: Props) {
  const duration = r.metadata.duration_seconds;

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
            Submitted:{' '}
            {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}
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
                    {ev.by} · {ev.at ? new Date(ev.at).toLocaleString() : '—'}
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
