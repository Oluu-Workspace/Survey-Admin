import type { SurveyQuestion } from '@/domain/question';

/**
 * Demographic / common-knowledge fields — always keep in reports.
 * (Gender, age, education, occupation, marital status, religion, location.)
 */
const DEMOGRAPHIC_KEEP_RE =
  /\b(gender|sex|age|education|school|occupation|livelihood|employment|marital|married|religion|faith|ward|village|county|region|sub.?county)\b/i;

/** Only strip true identity contact fields: names + phone numbers. */
export function isExcludedFromReport(q: Pick<SurveyQuestion, 'id' | 'label' | 'type'>): boolean {
  const qid = String(q.id || '');
  const label = String(q.label || '');
  const blob = `${qid} ${label}`;

  // Always keep demographic / general profile questions
  if (DEMOGRAPHIC_KEEP_RE.test(blob)) return false;

  const qtype = String(q.type || '').toLowerCase();
  if (qtype === 'phone') return true;

  // Phone / mobile (incl. glued ids like Q4Mobile, lari_mobile)
  if (/phone|mobile|cellphone|cell\s*phone|\btel\b/i.test(blob)) return true;

  // Personal names only — not "occupation name" style false positives
  if (/(^|_)(name|full.?name|first.?name|last.?name|surname|respondent.?name)($|_)/i.test(qid)) {
    return true;
  }
  if (/\b(full\s*name|first\s*name|last\s*name|surname|respondent\s*name|your\s*name)\b/i.test(label)) {
    return true;
  }
  if (/^name$/i.test(label.trim()) || /\bwhat is your name\b/i.test(label)) return true;

  return false;
}

export function looksLikePhoneNumber(value: string): boolean {
  const t = String(value || '').trim();
  if (!t) return false;
  const digits = t.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return false;
  if (/^254\d{9}$/.test(digits)) return true;
  if (/^0?7\d{8}$/.test(digits)) return true;
  if (/^\d{9,15}$/.test(digits) && digits === t.replace(/\D/g, '')) return true;
  return /^[\d+\s().-]+$/.test(t);
}

export function redactSensitiveText(value: string): string {
  if (looksLikePhoneNumber(value)) return '[redacted]';
  return value;
}

/** Strip name + phone questions only; keep education, occupation, gender, etc. */
export function questionsForReport<T extends Pick<SurveyQuestion, 'id' | 'label' | 'type'>>(
  questions: T[],
): T[] {
  return questions.filter((q) => !isExcludedFromReport(q));
}

/** CSS snippet to stop RTL mirroring in PDF/print output. */
export const REPORT_LTR_CSS = `
  html, body, main, table, th, td, .stats, .legend, .chart-panel, .question, .meta {
    direction: ltr;
    unicode-bidi: isolate;
  }
  svg, svg text, text { direction: ltr; unicode-bidi: normal; }
`;
