/** Identity / free-text fields must not drive charts or demographic cross-tabs. */

const ID_RE =
  /(^|_)(name|full.?name|first.?name|last.?name|surname|phone|email|notes?|comment|respondent.?code|serial|national.?id|id.?number)($|_)/i;

const AGE_RE = /(^|_)(age|age.?group|years?.?old)($|_)/i;

export function isIdentityQuestion(q: {
  id?: string;
  label?: string;
  type?: string;
}): boolean {
  const qid = String(q.id || '');
  const label = String(q.label || '');
  const qtype = String(q.type || '').toLowerCase();
  if (['short_text', 'long_text', 'phone', 'email', 'photo', 'gps', 'datetime'].includes(qtype)) {
    return true;
  }
  const blob = `${qid} ${label}`;
  if (ID_RE.test(qid) || ID_RE.test(label.replace(/\s+/g, '_'))) return true;
  if (/\b(name|phone|email|comment|notes?)\b/i.test(blob)) return true;
  return false;
}

export function isAgeNumberQuestion(q: { id?: string; label?: string; type?: string }): boolean {
  if (String(q.type || '').toLowerCase() !== 'number') return false;
  const qid = String(q.id || '');
  const label = String(q.label || '');
  return (
    AGE_RE.test(qid) ||
    AGE_RE.test(label.replace(/\s+/g, '_')) ||
    /\bage\b/i.test(label)
  );
}

export function isChartableAnalyticsRow(q: {
  kind?: string;
  chartable?: boolean;
  chart?: string;
  distribution?: unknown[];
  type?: string;
  id?: string;
  label?: string;
}): boolean {
  if (q.chartable === false) return false;
  if (isIdentityQuestion(q)) return false;
  if (q.kind === 'text' || q.kind === 'media') return false;
  if (q.chart === 'none' && !(q.distribution && q.distribution.length)) return false;
  return q.kind === 'choice' || q.kind === 'number' || Boolean(q.distribution?.length);
}

export const AGE_BANDS: Array<{ lo: number; hi: number; lab: string }> = [
  { lo: 18, hi: 24, lab: '18-24' },
  { lo: 25, hi: 34, lab: '25-34' },
  { lo: 35, hi: 44, lab: '35-44' },
  { lo: 45, hi: 54, lab: '45-54' },
  { lo: 55, hi: 64, lab: '55-64' },
  { lo: 65, hi: 200, lab: '65+' },
];

export function ageBand(value: unknown): string | null {
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  for (const b of AGE_BANDS) {
    if (n >= b.lo && n <= b.hi) return b.lab;
  }
  if (n < 18) return 'Under 18';
  return null;
}
