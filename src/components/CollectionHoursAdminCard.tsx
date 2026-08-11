import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { settingsAPI, type CollectionHoursSettings } from '@/services/api';
import { Button } from '@/components/ui/button';

/** Admin control to open/close agent app outside 8:00–18:30 Kenya time. */
export function CollectionHoursAdminCard() {
  const [hours, setHours] = useState<CollectionHoursSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settingsAPI.getCollectionHours();
      setHours(data);
    } catch {
      toast.error('Could not load collection hours settings');
      setHours(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setOpen = async (open: boolean) => {
    setBusy(true);
    try {
      const data = await settingsAPI.updateCollectionHours({
        after_hours_open: open,
        clear_until: !open,
      });
      setHours(data);
      toast.success(
        open
          ? 'After-hours collection is ON — agents can work outside 8:00–18:30 Kenya time'
          : 'After-hours collection is OFF — normal hours only',
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { error?: string } } }).response?.data?.error)
          : 'Update failed';
      toast.error(msg || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const openUntilMorning = async () => {
    setBusy(true);
    try {
      // Next 08:00 Africa/Nairobi as UTC ISO — approximate via offset +3
      const now = new Date();
      // Build next Kenya morning 08:00 by formatting in Kenya then constructing UTC-3
      const kenyaParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Nairobi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(now);
      const get = (t: string) => kenyaParts.find((p) => p.type === t)?.value || '0';
      let y = Number(get('year'));
      let m = Number(get('month'));
      let d = Number(get('day'));
      const hh = Number(get('hour'));
      const mm = Number(get('minute'));
      // If already past/at 08:00 Kenya today, use tomorrow
      if (hh * 60 + mm >= 8 * 60) {
        const probe = new Date(Date.UTC(y, m - 1, d) + 24 * 60 * 60 * 1000);
        y = probe.getUTCFullYear();
        m = probe.getUTCMonth() + 1;
        d = probe.getUTCDate();
      }
      // 08:00 EAT = 05:00 UTC
      const until = new Date(Date.UTC(y, m - 1, d, 5, 0, 0)).toISOString();
      const data = await settingsAPI.updateCollectionHours({
        after_hours_open: true,
        after_hours_until: until,
      });
      setHours(data);
      toast.success('After-hours open until 8:00 AM Kenya time tomorrow (or next morning)');
    } catch {
      toast.error('Could not set temporary after-hours window');
    } finally {
      setBusy(false);
    }
  };

  const open = Boolean(hours?.effective_open ?? hours?.after_hours_open);

  return (
    <div className="border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold">Agent collection hours</h3>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Normal window is <span className="font-medium text-foreground">8:00 AM – 6:30 PM</span>{' '}
            Kenya time. Use this control to temporarily let agents log in and collect outside that
            window.
          </p>
          {loading ? (
            <p className="mt-2 text-xs text-muted-foreground">Loading…</p>
          ) : hours ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Status:{' '}
              <span className={open ? 'font-medium text-primary' : 'font-medium text-foreground'}>
                {open ? 'After-hours OPEN' : 'Normal hours only'}
              </span>
              {hours.after_hours_until
                ? ` · until ${new Date(hours.after_hours_until).toLocaleString()}`
                : null}
              {hours.updated_at
                ? ` · updated ${new Date(hours.updated_at).toLocaleString()}`
                : null}
            </p>
          ) : (
            <p className="mt-2 text-xs text-destructive">Settings unavailable</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="rounded-sm"
            disabled={busy || loading || open}
            onClick={() => void setOpen(true)}
          >
            Open after-hours
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-sm"
            disabled={busy || loading}
            onClick={() => void openUntilMorning()}
          >
            Open until 8 AM
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-sm"
            disabled={busy || loading || !open}
            onClick={() => void setOpen(false)}
          >
            Close after-hours
          </Button>
        </div>
      </div>
    </div>
  );
}
