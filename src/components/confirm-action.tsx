import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type ConfirmTone = 'default' | 'warning' | 'danger';

export type ConfirmFact = {
  label: string;
  value: string;
};

export type ConfirmActionOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  facts?: ConfirmFact[];
};

type ConfirmActionFn = (options: ConfirmActionOptions) => Promise<boolean>;

const ConfirmActionContext = createContext<ConfirmActionFn | null>(null);

const TONE = {
  default: {
    bar: 'bg-primary',
    iconWrap: 'bg-primary/10 text-primary',
    Icon: ShieldQuestion,
  },
  warning: {
    bar: 'bg-amber-500',
    iconWrap: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    Icon: AlertTriangle,
  },
  danger: {
    bar: 'bg-destructive',
    iconWrap: 'bg-destructive/10 text-destructive',
    Icon: ShieldAlert,
  },
} as const;

function ConfirmActionModal({
  open,
  options,
  onSettle,
}: {
  open: boolean;
  options: ConfirmActionOptions | null;
  onSettle: (ok: boolean) => void;
}) {
  const tone = options?.tone ?? 'default';
  const visual = TONE[tone];
  const Icon = visual.Icon;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onSettle(false); }}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-sm border border-border bg-background shadow-2xl outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className={cn('h-1.5 w-full', visual.bar)} />
          <div className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-sm',
                  visual.iconWrap,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogPrimitive.Title className="font-display text-base font-semibold leading-snug">
                  {options?.title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {options?.description}
                </DialogPrimitive.Description>
              </div>
            </div>

            {options?.facts && options.facts.length > 0 ? (
              <dl className="overflow-hidden border border-border bg-muted/30">
                {options.facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="grid grid-cols-[7.5rem_1fr] gap-2 border-b border-border px-3 py-2 last:border-b-0"
                  >
                    <dt className="font-display text-[11px] uppercase tracking-wide text-muted-foreground">
                      {fact.label}
                    </dt>
                    <dd className="truncate text-sm font-medium">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-sm"
                onClick={() => onSettle(false)}
              >
                {options?.cancelLabel || 'Go back'}
              </Button>
              <Button
                type="button"
                variant={tone === 'danger' ? 'destructive' : 'default'}
                className="rounded-sm"
                autoFocus
                onClick={() => onSettle(true)}
              >
                {options?.confirmLabel || 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

export function ConfirmActionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmActionOptions | null>(null);
  const pending = useRef<((ok: boolean) => void) | null>(null);

  const settle = useCallback((ok: boolean) => {
    pending.current?.(ok);
    pending.current = null;
    setOpen(false);
  }, []);

  const confirmAction = useCallback<ConfirmActionFn>((next) => {
    pending.current?.(false);
    setOptions(next);
    setOpen(true);
    return new Promise((resolve) => {
      pending.current = resolve;
    });
  }, []);

  return (
    <ConfirmActionContext.Provider value={confirmAction}>
      {children}
      <ConfirmActionModal open={open} options={options} onSettle={settle} />
    </ConfirmActionContext.Provider>
  );
}

export function useConfirmAction(): ConfirmActionFn {
  const ctx = useContext(ConfirmActionContext);
  if (!ctx) {
    throw new Error('useConfirmAction must be used inside ConfirmActionProvider');
  }
  return ctx;
}
