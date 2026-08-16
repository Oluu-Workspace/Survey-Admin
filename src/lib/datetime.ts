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
export function toDate(iso: string): Date {
  const s = iso.trim();
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  return new Date(s.endsWith('Z') ? s : `${s}Z`);
}

function part(parts: Intl.DateTimeFormatPart[], type: string, fallback = '00'): string {
  return parts.find((p) => p.type === type)?.value ?? fallback;
}

/** YYYY-MM-DD in Nairobi (for filenames / "today" / date filters). */
export function dateInNairobi(d: Date = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

export function todayEAT(): string {
  return dateInNairobi();
}

/** Combine a Kenya calendar date + wall time into an aware EAT ISO string. */
export function kenyaDateTimeToIso(date: string, time: string): string {
  const t = time.length === 5 ? `${time}:00` : time;
  return `${date}T${t}+03:00`;
}

/** Aware ISO timestamp in Africa/Nairobi (always UTC+03:00, no DST). */
export function nowIsoEAT(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  return `${part(parts, 'year')}-${part(parts, 'month')}-${part(parts, 'day')}T${part(parts, 'hour')}:${part(parts, 'minute')}:${part(parts, 'second')}+03:00`;
}

export function addDaysISO(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Monday of the Kenya calendar week containing isoDate (YYYY-MM-DD). */
export function startOfWeekEAT(isoDate = todayEAT()): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 Sun … 6 Sat
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  return addDaysISO(isoDate, mondayOffset);
}

export function startOfMonthEAT(isoDate = todayEAT()): string {
  return `${isoDate.slice(0, 7)}-01`;
}

export function isTodayEAT(iso?: string | null): boolean {
  if (!iso) return false;
  const d = toDate(iso);
  if (Number.isNaN(d.getTime())) return false;
  return dateInNairobi(d) === todayEAT();
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

export type DatePreset = '' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';

export const DATE_PRESET_OPTIONS: { id: DatePreset; label: string }[] = [
  { id: '', label: 'All dates' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This week' },
  { id: 'this_month', label: 'This month' },
  { id: 'custom', label: 'Custom range' },
];

/** Kenya calendar from/to for a named preset (custom returns null). */
export function rangeForPreset(preset: DatePreset): { from: string; to: string } | null {
  const today = todayEAT();
  if (preset === 'today') return { from: today, to: today };
  if (preset === 'yesterday') {
    const y = addDaysISO(today, -1);
    return { from: y, to: y };
  }
  if (preset === 'this_week') return { from: startOfWeekEAT(today), to: addDaysISO(startOfWeekEAT(today), 6) };
  if (preset === 'this_month') {
    const from = startOfMonthEAT(today);
    const nextMonth = addDaysISO(`${today.slice(0, 7)}-28`, 10).slice(0, 7);
    const last = addDaysISO(`${nextMonth}-01`, -1);
    return { from, to: last };
  }
  return null;
}

/** Calendar-cell Date for DayPicker — year/month/day only, not a timezone instant. */
export function isoToCalendarDate(iso: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return undefined;
  const y = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!y || month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return new Date(y, month - 1, day);
}

export function calendarDateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "10 August 2026" from a Kenya YYYY-MM-DD calendar date. */
export function formatKenyaCalendarDate(isoDate?: string | null): string {
  if (!isoDate) return '';
  const d = isoToCalendarDate(isoDate);
  if (!d) return isoDate;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatKenyaDateRange(from?: string, to?: string): string {
  const a = from || to;
  const b = to || from;
  if (!a || !b) return '';
  if (a === b) return formatKenyaCalendarDate(a);
  return `${formatKenyaCalendarDate(a)} – ${formatKenyaCalendarDate(b)}`;
}

/** Resolve named presets and incomplete ranges to an inclusive Kenya from/to. */
export function resolvedDateRange(
  preset?: DatePreset | string | null,
  dateFrom?: string | null,
  dateTo?: string | null,
): { from: string; to: string } | null {
  const from = (dateFrom || '').trim();
  const to = (dateTo || '').trim();
  if (from || to) return { from: from || to, to: to || from };
  if (preset && preset !== 'custom') return rangeForPreset(preset as DatePreset);
  return null;
}

/** Always send calendar dates (not presets) so list and reports share one backend path. */
export function dateFilterToParams(f: {
  datePreset?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}): { date_from?: string; date_to?: string } {
  const range = resolvedDateRange(f.datePreset, f.dateFrom, f.dateTo);
  if (!range) return {};
  return { date_from: range.from, date_to: range.to };
}

export function reportPeriodHeading(
  from?: string | null,
  to?: string | null,
): { title: 'Report Date' | 'Report Period'; value: string } | null {
  const range = resolvedDateRange('custom', from, to);
  if (!range) return null;
  if (range.from === range.to) {
    return { title: 'Report Date', value: formatKenyaCalendarDate(range.from) };
  }
  return {
    title: 'Report Period',
    value: `${formatKenyaCalendarDate(range.from)} – ${formatKenyaCalendarDate(range.to)}`,
  };
}
