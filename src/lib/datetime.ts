/** East Africa Time — Kenya / Uganda / Tanzania. */
export const APP_TIMEZONE = 'Africa/Nairobi';

const DATE_FMT: Intl.DateTimeFormatOptions = {
  timeZone: APP_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

const DATETIME_FMT: Intl.DateTimeFormatOptions = {
  ...DATE_FMT,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
};

/** Naive ISO from older API writes was UTC; treat those as UTC. */
function toDate(iso: string): Date {
  const s = iso.trim();
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  return new Date(s.endsWith('Z') ? s : `${s}Z`);
}

export function formatDateEAT(
  iso?: string | null,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!iso) return '—';
  const d = toDate(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { timeZone: APP_TIMEZONE, ...opts });
}

export function formatDateTimeEAT(iso?: string | null): string {
  if (!iso) return '—';
  const d = toDate(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', DATETIME_FMT);
}

/** YYYY-MM-DD in Nairobi (for filenames / "today"). */
export function todayEAT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}
