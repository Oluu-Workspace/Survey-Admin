import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  calendarDateToIso,
  formatKenyaCalendarDate,
  formatKenyaDateRange,
  isoToCalendarDate,
  rangeForPreset,
  todayEAT,
  type DatePreset,
} from '@/lib/datetime';

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This week' },
  { id: 'this_month', label: 'This month' },
];

type Props = {
  dateFrom: string;
  dateTo: string;
  onChange: (next: { dateFrom: string; dateTo: string; datePreset: DatePreset }) => void;
  disabled?: boolean;
};

export function KenyaDateRangePicker({ dateFrom, dateTo, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const year = Number(todayEAT().slice(0, 4));
  const selected = useMemo<DateRange | undefined>(() => {
    const from = dateFrom ? isoToCalendarDate(dateFrom) : undefined;
    const to = dateTo ? isoToCalendarDate(dateTo) : undefined;
    if (!from) return undefined;
    return { from, to };
  }, [dateFrom, dateTo]);

  const summary = useMemo(() => {
    if (dateFrom && dateTo) return formatKenyaDateRange(dateFrom, dateTo);
    if (dateFrom) return `Start date: ${formatKenyaCalendarDate(dateFrom)}`;
    if (dateTo) return `End date: ${formatKenyaCalendarDate(dateTo)}`;
    return 'Select date';
  }, [dateFrom, dateTo]);

  const complete = Boolean(dateFrom && dateTo);
  const sameDay = complete && dateFrom === dateTo;

  const emit = (from: string, to: string, preset: DatePreset = 'custom') => {
    onChange({ dateFrom: from, dateTo: to, datePreset: from || to ? preset : '' });
  };

  const applyRange = (range: DateRange | undefined) => {
    if (!range?.from) {
      emit('', '', '');
      return;
    }
    const from = calendarDateToIso(range.from);
    const to = range.to ? calendarDateToIso(range.to) : '';
    emit(from, to, 'custom');
  };

  const applyPreset = (preset: DatePreset) => {
    const named = rangeForPreset(preset);
    if (!named) return;
    emit(named.from, named.to, preset);
  };

  const useStartDayOnly = () => {
    if (!dateFrom) return;
    emit(dateFrom, dateFrom, 'custom');
  };

  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="font-display text-xs uppercase tracking-wide">Select date</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-10 w-full justify-start rounded-sm px-3 font-normal"
          >
            <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{summary}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(100vw-2rem,320px)] rounded-sm p-4" collisionPadding={16}>
          <div className="mb-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-sm px-2.5 text-xs"
                onClick={() => applyPreset(p.id)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={selected}
            onSelect={applyRange}
            defaultMonth={selected?.from || isoToCalendarDate(todayEAT())}
            today={isoToCalendarDate(todayEAT())}
            captionLayout="dropdown-buttons"
            fromYear={year - 8}
            toYear={year + 1}
            numberOfMonths={1}
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-display text-[10px] uppercase tracking-wide">Start date</Label>
              <Input
                type="date"
                className="h-9 rounded-sm text-sm"
                value={dateFrom}
                onChange={(e) => emit(e.target.value, dateTo || e.target.value, 'custom')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-display text-[10px] uppercase tracking-wide">End date</Label>
              <Input
                type="date"
                className="h-9 rounded-sm text-sm"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => emit(dateFrom || e.target.value, e.target.value, 'custom')}
              />
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {sameDay
              ? `${formatKenyaCalendarDate(dateFrom)} — that Kenya day only (00:00–23:59:59.999 EAT).`
              : complete
                ? `${formatKenyaDateRange(dateFrom, dateTo)} (Kenya time).`
                : dateFrom
                  ? 'Select an end date, or use this day only.'
                  : 'Pick a day, or a start and end date. Same start and end = one day.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {dateFrom && !dateTo ? (
              <Button type="button" size="sm" className="h-8 rounded-sm text-xs" onClick={useStartDayOnly}>
                This day only
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-sm text-xs"
              onClick={() => emit('', '', '')}
            >
              Clear dates
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="ml-auto h-8 rounded-sm text-xs"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
