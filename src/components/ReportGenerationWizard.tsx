import { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from 'lucide-react';
import {
  AnalyticsFilterBar,
  type AnalyticsFilters,
  type ResponseFacets,
} from '@/components/AnalyticsFilterBar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PoweredByStrategicInsight } from '@/components/PoweredByStrategicInsight';

type AgentOption = { id: string; name: string };

type Props = {
  surveyTitle: string;
  surveyDescription?: string;
  responseTotal: number;
  questionCount: number;
  facets: ResponseFacets | null;
  filters: AnalyticsFilters;
  onFiltersChange: (next: Partial<AnalyticsFilters>) => void;
  agents: AgentOption[];
  selectedAgentId: string;
  onAgentChange: (id: string) => void;
  compareBy: string;
  compareOptions: { id: string; label: string }[];
  onCompareByChange: (v: string) => void;
  analyticsLoading?: boolean;
  busy?: boolean;
  onGeneratePdf: () => void | Promise<void>;
  onGenerateCsv: () => void | Promise<void>;
};

const STEPS = [
  { id: 1, title: 'Questionnaire', hint: 'Confirm which survey to report on' },
  { id: 2, title: 'Filters', hint: 'Optional — narrow the data included' },
  { id: 3, title: 'Output', hint: 'Choose PDF report or raw CSV' },
  { id: 4, title: 'Generate', hint: 'Review and create your report' },
] as const;

export function ReportGenerationWizard({
  surveyTitle,
  surveyDescription,
  responseTotal,
  questionCount,
  facets,
  filters,
  onFiltersChange,
  agents,
  selectedAgentId,
  onAgentChange,
  compareBy,
  compareOptions,
  onCompareByChange,
  analyticsLoading,
  busy,
  onGeneratePdf,
  onGenerateCsv,
}: Props) {
  const [step, setStep] = useState(1);
  const [wantPdf, setWantPdf] = useState(true);
  const [wantCsv, setWantCsv] = useState(false);

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (selectedAgentId) {
      parts.push(`Agent: ${agents.find((a) => a.id === selectedAgentId)?.name || selectedAgentId}`);
    }
    if (filters.county) parts.push(`County: ${filters.county}`);
    if (filters.ward) parts.push(`Ward: ${filters.ward}`);
    if (filters.status) parts.push(`Status: ${filters.status}`);
    if (filters.lifecycle) parts.push(`Stage: ${filters.lifecycle}`);
    if (filters.answerQuestionId && filters.answerValue) {
      parts.push(`Answer filter: ${filters.answerValue}`);
    }
    if (compareBy) parts.push(`Compare by: ${compareBy}`);
    return parts;
  }, [agents, compareBy, filters, selectedAgentId]);

  const canNext = step < 4 && !(step === 3 && !wantPdf && !wantCsv);
  const canGenerate = responseTotal > 0 && (wantPdf || wantCsv) && !busy;

  return (
    <div className="space-y-5 border border-border bg-card p-5 md:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Report generation wizard</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Follow these steps to create a research report or download the dataset. No technical
          setup required.
        </p>
        <div className="mt-2">
          <PoweredByStrategicInsight />
        </div>
      </div>

      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-2 rounded-sm border px-2.5 py-1.5 text-left text-xs ${
                  active
                    ? 'border-primary bg-primary/5 font-medium'
                    : done
                      ? 'border-border bg-muted/40'
                      : 'border-border bg-background'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-semibold ${
                    done || active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {done ? <Check className="h-3 w-3" /> : s.id}
                </span>
                <span>
                  <span className="block font-display">{s.title}</span>
                  <span className="hidden text-muted-foreground sm:block">{s.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <div className="space-y-3 border border-dashed border-border bg-background/60 p-4">
          <div className="font-display text-sm font-semibold">Selected questionnaire</div>
          <div className="text-base font-medium">{surveyTitle}</div>
          {surveyDescription ? (
            <p className="text-sm text-muted-foreground">{surveyDescription}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            <span className="ledger-count">{responseTotal.toLocaleString()}</span> responses ·{' '}
            <span className="ledger-count">{questionCount}</span> questions
          </p>
          {responseTotal === 0 ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              No responses yet. Collect field data before generating a report.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              You are reporting on this survey. Continue to optionally filter the data.
            </p>
          )}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Leave filters empty to include all responses. Filters apply to both the PDF report and
            CSV export.
          </p>
          <AnalyticsFilterBar
            facets={facets}
            filters={filters}
            onChange={onFiltersChange}
            agents={agents}
            selectedAgentId={selectedAgentId}
            onAgentChange={onAgentChange}
            compareBy={compareBy}
            compareOptions={compareOptions}
            onCompareByChange={onCompareByChange}
            loading={analyticsLoading}
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Select one or both outputs.</p>
          <label className="flex cursor-pointer items-start gap-3 border border-border p-4">
            <Checkbox checked={wantPdf} onCheckedChange={(v) => setWantPdf(Boolean(v))} />
            <div>
              <div className="flex items-center gap-2 font-display text-sm font-semibold">
                <FileText className="h-4 w-4" />
                Research report (PDF)
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Executive summary, charts, question breakdowns, and conclusions — print or save as
                PDF from the browser.
              </p>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3 border border-border p-4">
            <Checkbox checked={wantCsv} onCheckedChange={(v) => setWantCsv(Boolean(v))} />
            <div>
              <div className="flex items-center gap-2 font-display text-sm font-semibold">
                <FileSpreadsheet className="h-4 w-4" />
                Raw data (CSV)
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Spreadsheet-ready export of answers for further analysis.
              </p>
            </div>
          </label>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-3 border border-border bg-background/60 p-4">
          <div className="font-display text-sm font-semibold">Ready to generate</div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>
              Survey: <span className="text-foreground">{surveyTitle}</span>
            </li>
            <li>
              Responses in scope:{' '}
              <span className="ledger-count text-foreground">{responseTotal.toLocaleString()}</span>
            </li>
            <li>
              Filters:{' '}
              <span className="text-foreground">
                {filterSummary.length ? filterSummary.join(' · ') : 'None (all data)'}
              </span>
            </li>
            <li>
              Outputs:{' '}
              <span className="text-foreground">
                {[wantPdf ? 'PDF report' : null, wantCsv ? 'CSV' : null].filter(Boolean).join(' + ') ||
                  'None selected'}
              </span>
            </li>
          </ul>
          <div className="flex flex-wrap gap-2 pt-2">
            {wantPdf ? (
              <Button
                className="rounded-sm"
                disabled={!canGenerate}
                onClick={() => void onGeneratePdf()}
              >
                {busy ? 'Working…' : 'Generate PDF report'}
              </Button>
            ) : null}
            {wantCsv ? (
              <Button
                variant="outline"
                className="rounded-sm"
                disabled={!canGenerate}
                onClick={() => void onGenerateCsv()}
              >
                {busy ? 'Working…' : 'Download CSV'}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-sm"
          disabled={step === 1 || busy}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        {step < 4 ? (
          <Button
            size="sm"
            className="rounded-sm"
            disabled={!canNext || (step === 1 && responseTotal === 0)}
            onClick={() => setStep((s) => Math.min(4, s + 1))}
          >
            Continue
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Use the buttons above to finish.</p>
        )}
      </div>
    </div>
  );
}
