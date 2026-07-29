import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import { agentsAPI, responsesAPI, surveysAPI } from '@/services/api';
import { Stamp } from '@/components/Stamp';
import { QuestionBuilder } from '@/components/QuestionBuilder';
import { SurveyInsightsDashboard } from '@/components/SurveyInsightsDashboard';
import { SurveyDataExplorer } from '@/components/SurveyDataExplorer';
import { normalizeQuestions, type SurveyQuestion } from '@/lib/questions';
import { SurveyQuestionAnalysis } from '@/components/SurveyQuestionAnalysis';
import { analyticsBundle, exportResponsesCsv, openPrintableReport, type ResponseLike } from '@/lib/analytics';
import { fetchAllSurveyResponses } from '@/lib/fetchAllResponses';
import { buildFullResearchReportData } from '@/lib/buildResearchReport';
import {
  buildConclusions,
  buildExecutiveSummary,
  buildKeyFindings,
  collectionPeriodFromResponses,
  generateQuestionInsight,
} from '@/lib/researchInsights';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Agent = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: string;
  ward?: string;
  village?: string;
};
type Q = SurveyQuestion & { __new?: boolean };
type ResponseRow = ResponseLike & { survey_id?: string };

const TABS = ['overview', 'data', 'analysis', 'report', 'agents', 'questions'] as const;

const WORKFLOW = [
  { step: 1, label: 'Summary', tab: 'overview' },
  { step: 2, label: 'Review data', tab: 'data' },
  { step: 3, label: 'Analyse', tab: 'analysis' },
  { step: 4, label: 'Report & export', tab: 'report' },
] as const;

function agentName(a?: Agent | null) {
  if (!a) return 'Unknown';
  return `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email || a.id;
}

function isToday(iso?: string) {
  return !!iso && new Date(iso).toDateString() === new Date().toDateString();
}

function progressStamp(n: number, today: number): 'waiting' | 'collecting' | 'synced' {
  if (today > 0) return 'synced';
  if (n > 0) return 'collecting';
  return 'waiting';
}

const SurveyDetail = () => {
  const { surveyId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawTab = searchParams.get('tab');
  const tab = rawTab && (TABS as readonly string[]).includes(rawTab) ? rawTab : 'overview';
  const agentFilter = searchParams.get('agent') || '';

  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<any>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [responseTotal, setResponseTotal] = useState(0);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [assignMode, setAssignMode] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [surveyAnalytics, setSurveyAnalytics] = useState<any>(null);
  const [tabBootstrapped, setTabBootstrapped] = useState(false);
  const [analyticsAgentId, setAnalyticsAgentId] = useState('');
  const [compareBy, setCompareBy] = useState('');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    if (next !== 'data') params.delete('agent');
    setSearchParams(params);
  };

  const load = useCallback(async () => {
    if (!surveyId) return;
    setLoading(true);
    try {
      const [surveyRes, agentsRes, responsesRes] = await Promise.all([
        surveysAPI.getById(surveyId),
        agentsAPI.getAll({ limit: 200 }),
        responsesAPI.getAll({ survey_id: surveyId, page: 1, per_page: 500 }),
      ]);
      const s = surveyRes.survey || surveyRes;
      setSurvey(s);
      setAgents(agentsRes.agents || agentsRes || []);
      setResponses(responsesRes.responses || []);
      setResponseTotal(responsesRes.pagination?.total ?? responsesRes.responses?.length ?? 0);
      setQuestions(normalizeQuestions(s.questions));
      setSelectedAgentIds(s.assigned_agents || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not load survey');
      setSurvey(null);
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  const refreshAnalytics = useCallback(async () => {
    if (!surveyId) return;
    setAnalyticsLoading(true);
    try {
      const analyticsRes = await surveysAPI.getAnalytics(surveyId, {
        agent_id: analyticsAgentId || undefined,
        compare_by: compareBy || undefined,
      });
      setSurveyAnalytics(analyticsRes);
      if (!compareBy && analyticsRes?.compare_by) {
        setCompareBy(analyticsRes.compare_by);
      }
    } catch {
      setSurveyAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [surveyId, analyticsAgentId, compareBy]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!survey || tabBootstrapped || rawTab) return;
    const assigned = survey.assigned_agents?.length ?? 0;
    const next =
      responseTotal > 0 ? 'overview' : assigned === 0 ? 'agents' : questions.length === 0 ? 'questions' : 'overview';
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
    setTabBootstrapped(true);
  }, [survey, responseTotal, questions.length, tabBootstrapped, rawTab, searchParams, setSearchParams]);

  useEffect(() => {
    void refreshAnalytics();
  }, [refreshAnalytics]);

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    agents.forEach((a) => map.set(a.id, a));
    return map;
  }, [agents]);

  const assignedIds: string[] = survey?.assigned_agents || [];

  const fieldAgents = useMemo(() => {
    const byAgent = (surveyAnalytics?.by_agent || []) as Array<{
      agent_id?: string;
      option?: string;
      count?: number;
    }>;
    const countFor = (id: string) =>
      byAgent.find((r) => r.agent_id === id)?.count ??
      responses.filter((r) => r.agent_id === id).length;

    const ids = new Set([...assignedIds, ...responses.map((r) => r.agent_id).filter(Boolean)]);
    return Array.from(ids).map((id) => {
      const submissions = countFor(id);
      const todayCount = responses
        .filter((r) => r.agent_id === id)
        .filter((r) => isToday(r.created_at || r.submitted_at)).length;
      return {
        id,
        agent: agentMap.get(id),
        submissions,
        stamp: progressStamp(submissions, todayCount),
      };
    });
  }, [assignedIds, responses, agentMap, surveyAnalytics]);

  const bundle = useMemo(
    () => analyticsBundle(questions, responses, (id) => agentName(agentMap.get(id))),
    [questions, responses, agentMap],
  );

  const saveQuestions = async () => {
    setSavingQuestions(true);
    try {
      const cleaned = questions.map(({ __new, ...rest }) => rest);
      await surveysAPI.update(surveyId, { questions: cleaned });
      toast.success('Questions saved');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not save questions');
    } finally {
      setSavingQuestions(false);
    }
  };

  const saveAssignments = async () => {
    setAssigning(true);
    try {
      await surveysAPI.assign(surveyId, selectedAgentIds);
      toast.success('Agents assigned');
      setAssignMode(false);
      setAgentSearch('');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Assign failed');
    } finally {
      setAssigning(false);
    }
  };

  const setSurveyStatus = async (status: string) => {
    if (status === 'active' && questions.length === 0) {
      toast.error('Add at least one question before activating');
      return;
    }
    try {
      await surveysAPI.update(surveyId, { status });
      toast.success(status === 'active' ? 'Survey is open for collection' : 'Collection blocked');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Update failed');
    }
  };

  const assignableAgents = useMemo(() => {
    const q = agentSearch.toLowerCase().trim();
    if (!q) return agents;
    return agents.filter((a) => {
      const hay = [a.first_name, a.last_name, a.email, a.ward, a.village]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [agents, agentSearch]);

  const viewAgent = (id: string) => {
    const p = new URLSearchParams(searchParams);
    p.set('tab', 'data');
    p.set('agent', id);
    setSearchParams(p);
  };

  const openAssign = () => {
    setSelectedAgentIds(survey?.assigned_agents || []);
    setAssignMode(true);
    setTab('agents');
  };

  const refreshSurveyData = async () => {
    await load();
    await refreshAnalytics();
  };

  const runPdfReport = async () => {
    setExportBusy(true);
    try {
      toast.message('Syncing all responses and analytics…');
      const {
        bundle: reportBundle,
        rows,
        perQuestion: perQ,
        api,
        responseCount,
        analyticsFromApi,
      } = await buildFullResearchReportData(
        surveyId,
        questions,
        (id) => agentName(agentMap.get(id)),
        compareBy || undefined,
      );
      const questionInsights: Record<string, string> = {};
      for (const q of perQ) {
        if (q?.id) questionInsights[q.id] = generateQuestionInsight(q);
      }
      const uniqueWards = Object.keys(reportBundle.byWard).filter(
        (w) => w && w !== 'Unknown ward',
      ).length;
      const uniqueAgents = reportBundle.byAgent.filter((a) => a.count > 0).length;
      const result = openPrintableReport({
        surveyTitle: survey.title || 'Survey',
        surveySubtitle: survey.description || undefined,
        area: [survey.ward, survey.village, survey.county].filter(Boolean).join(' · ') || 'All areas',
        generatedAt: new Date().toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        bundle: reportBundle,
        executiveSummary: buildExecutiveSummary({
          surveyTitle: survey.title || 'Survey',
          included: reportBundle.totalIncluded,
          excluded: reportBundle.totalExcluded,
          completionPct: reportBundle.completionRate,
          perQuestion: perQ,
          collectionPeriod: collectionPeriodFromResponses(rows),
          uniqueWards,
          uniqueAgents,
        }),
        conclusions: buildConclusions(perQ),
        questionInsights,
        keyFindings: buildKeyFindings(perQ),
        trend: api?.trend,
        statusBreakdown: api?.by_status,
        comparisons: api?.comparisons,
        totalResponsesFetched: responseCount,
        analyticsFromApi,
      });
      if (!analyticsFromApi) {
        toast.message('Analytics API unavailable — report uses client-side calculations.');
      }
      if (result.mode === 'download') {
        toast.success(`Popups blocked — downloaded ${result.filename}. Open it and use Print → Save as PDF.`);
      } else {
        toast.success('Report opened — click Print / Save as PDF in the report window.');
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { error?: string } } }).response?.data?.error)
          : err instanceof Error
            ? err.message
            : 'Unknown error';
      toast.error(msg ? `Could not build report: ${msg}` : 'Could not build report');
    } finally {
      setExportBusy(false);
    }
  };

  const runCsvExport = async () => {
    setExportBusy(true);
    try {
      toast.message('Exporting CSV…');
      const rows = await fetchAllSurveyResponses(surveyId);
      exportResponsesCsv(survey.title || 'survey', questions, rows);
      toast.success(`Downloaded CSV (${rows.length} rows)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      toast.error(msg);
    } finally {
      setExportBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="w-full space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-sm"
          onClick={() => navigate('/dashboard/surveys')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Surveys
        </Button>
        <p className="border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          Survey not found — go back to Surveys and pick another.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-2 h-8 rounded-sm px-2" asChild>
            <Link to="/dashboard/surveys">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Surveys
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-semibold tracking-tight">{survey.title}</h1>
            <Stamp status={survey.status} />
          </div>
          {survey.description ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{survey.description}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="ledger-count">{fieldAgents.length}</span> agents ·{' '}
            <span className="ledger-count">{responseTotal}</span> submissions ·{' '}
            <span className="ledger-count">{questions.length}</span> questions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {survey.status !== 'active' ? (
            <Button size="sm" className="rounded-sm" onClick={() => void setSurveyStatus('active')}>
              Activate survey
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="rounded-sm"
              onClick={() => void setSurveyStatus('closed')}
            >
              Block collection
            </Button>
          )}
          <Button size="sm" variant="outline" className="rounded-sm" onClick={() => setTab('data')}>
            Browse data
          </Button>
          <Button size="sm" className="rounded-sm" onClick={openAssign}>
            Assign agents
          </Button>
        </div>
      </div>

      <ol className="flex flex-wrap gap-2 text-xs">
        {WORKFLOW.map((w) => (
          <li key={w.tab}>
            <button
              type="button"
              className={`rounded-sm border px-2.5 py-1.5 ${
                tab === w.tab ? 'border-primary bg-primary/5 font-medium' : 'border-border bg-card'
              }`}
              onClick={() => setTab(w.tab)}
            >
              {w.step}. {w.label}
            </button>
          </li>
        ))}
      </ol>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-9 rounded-sm">
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t} className="rounded-sm text-xs capitalize sm:text-sm">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <SurveyInsightsDashboard surveyId={surveyId} />
          {responseTotal > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="rounded-sm" onClick={() => setTab('data')}>
                Review responses
              </Button>
              <Button size="sm" variant="outline" className="rounded-sm" onClick={() => setTab('analysis')}>
                Question analysis
              </Button>
              <Button size="sm" variant="outline" className="rounded-sm" onClick={() => void runPdfReport()}>
                Research report (PDF)
              </Button>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="questions" className="mt-4 space-y-4">
          <QuestionBuilder
            questions={questions}
            onChange={setQuestions}
            locked={survey.status === 'active'}
          />
          <Button
            size="sm"
            className="rounded-sm"
            disabled={savingQuestions}
            onClick={() => void saveQuestions()}
          >
            {savingQuestions ? 'Saving…' : 'Save questions'}
          </Button>
        </TabsContent>

        <TabsContent value="agents" className="mt-4 space-y-4">
          {assignMode ? (
            <div className="border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div>
                  <div className="font-display text-sm font-semibold">Assign field agents</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedAgentIds.length} selected · search scales past dozens of agents
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-sm"
                    onClick={() => {
                      setAssignMode(false);
                      setAgentSearch('');
                      setSelectedAgentIds(survey.assigned_agents || []);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-sm"
                    onClick={() => void saveAssignments()}
                    disabled={assigning}
                  >
                    {assigning ? 'Saving…' : 'Save assignments'}
                  </Button>
                </div>
              </div>
              <div className="border-b border-border p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-9 rounded-sm pl-9"
                    placeholder="Search agents by name, email, ward…"
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-[28rem] overflow-y-auto">
                {agents.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Add agents first from the Agents page.
                  </p>
                ) : assignableAgents.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No agents match “{agentSearch}”.
                  </p>
                ) : (
                  assignableAgents.map((agent) => (
                    <label
                      key={agent.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-border px-4 py-2.5 last:border-0 hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={selectedAgentIds.includes(agent.id)}
                        onCheckedChange={(value) => {
                          setSelectedAgentIds((prev) =>
                            value ? [...prev, agent.id] : prev.filter((id) => id !== agent.id),
                          );
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-display text-sm font-medium">
                          {agentName(agent)}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {[agent.email, agent.ward, agent.village].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <Stamp status={agent.status || 'active'} />
                    </label>
                  ))
                )}
              </div>
            </div>
          ) : fieldAgents.length === 0 ? (
            <div className="border border-dashed border-border bg-card px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No agents on this survey — assign field staff so they can collect.
              </p>
              <Button className="mt-4 rounded-sm" size="sm" onClick={openAssign}>
                Assign agents
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button size="sm" variant="outline" className="rounded-sm" onClick={openAssign}>
                  Edit assignments
                </Button>
              </div>
              <div className="overflow-hidden border border-border bg-card">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Area</th>
                      <th>Progress</th>
                      <th className="text-right">Count</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {fieldAgents.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="font-display font-medium">{agentName(row.agent)}</div>
                          <div className="text-xs text-muted-foreground">{row.agent?.email}</div>
                        </td>
                        <td className="text-muted-foreground">
                          {[row.agent?.ward, row.agent?.village].filter(Boolean).join(' · ') || '—'}
                        </td>
                        <td>
                          <Stamp status={row.stamp} />
                        </td>
                        <td className="text-right">
                          <span className="ledger-count">{row.submissions}</span>
                        </td>
                        <td className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-sm"
                            onClick={() => viewAgent(row.id)}
                          >
                            View data
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="data" className="mt-4">
          <SurveyDataExplorer
            surveyId={surveyId}
            surveyTitle={survey.title}
            questions={questions}
            agentFilter={agentFilter}
            agentOptions={fieldAgents.map((row) => ({
              id: row.id,
              name: agentName(row.agent),
            }))}
            onAgentFilterChange={(id) => {
              const p = new URLSearchParams(searchParams);
              p.set('tab', 'data');
              if (!id) p.delete('agent');
              else p.set('agent', id);
              setSearchParams(p);
            }}
            onResponsesChange={() => void refreshSurveyData()}
            emptyState={
              <div className="border border-dashed border-border bg-card px-6 py-14 text-center">
                <p className="font-display text-sm font-medium">Waiting for field data</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  {assignedIds.length === 0
                    ? 'Assign agents to this survey so they can download it in the field app and sync interviews.'
                    : 'Assigned agents have not uploaded yet — open the mobile app, complete interviews, and sync when online.'}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {assignedIds.length === 0 ? (
                    <Button size="sm" className="rounded-sm" onClick={openAssign}>
                      Assign agents
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="rounded-sm" onClick={openAssign}>
                      Manage agents
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="rounded-sm" asChild>
                    <Link to={`/dashboard/data?survey=${surveyId}`}>Open in Data Explorer</Link>
                  </Button>
                </div>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          {responseTotal === 0 ? (
            <div className="border border-dashed border-border bg-card px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No field data yet — assign agents and sync from the mobile app to unlock charts.
              </p>
              <Button size="sm" className="mt-4 rounded-sm" onClick={openAssign}>
                Assign agents
              </Button>
            </div>
          ) : (
            <SurveyQuestionAnalysis
              api={surveyAnalytics}
              bundle={bundle}
              agents={fieldAgents.map((row) => ({
                id: row.id,
                name: agentName(row.agent),
              }))}
              selectedAgentId={analyticsAgentId}
              compareBy={compareBy}
              onAgentChange={setAnalyticsAgentId}
              onCompareByChange={setCompareBy}
              loadingAnalytics={analyticsLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="report" className="mt-4">
          <div className="space-y-4 border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Research report &amp; export</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Generate a publication-style report with executive summary, key findings, count vs percentage
              graphs per question, ranked tables, geographic breakdowns, and conclusions — or download the
              full anonymised dataset as CSV for statistical software.
            </p>
            <p className="text-sm">
              <span className="ledger-count">{responseTotal.toLocaleString()}</span> responses in this survey.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                className="rounded-sm"
                disabled={exportBusy || responseTotal === 0}
                onClick={() => void runPdfReport()}
              >
                {exportBusy ? 'Working…' : 'Download research report (PDF)'}
              </Button>
              <Button
                variant="outline"
                className="rounded-sm"
                disabled={exportBusy || responseTotal === 0}
                onClick={() => void runCsvExport()}
              >
                Export raw data (CSV)
              </Button>
              <Button variant="ghost" className="rounded-sm" onClick={() => setTab('analysis')}>
                Back to analysis
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SurveyDetail;
