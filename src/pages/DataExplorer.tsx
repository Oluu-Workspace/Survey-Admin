import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, Database, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { responsesAPI, surveysAPI } from '@/services/api';
import { SurveyDataExplorer } from '@/components/SurveyDataExplorer';
import { Stamp } from '@/components/Stamp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SurveyRow = {
  id: string;
  title: string;
  status: string;
  assigned_agents?: string[];
  assigned_agents_count?: number;
};

const DataExplorer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const surveyId = searchParams.get('survey') || '';

  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [pickerSearch, setPickerSearch] = useState('');
  const [activeSurvey, setActiveSurvey] = useState<SurveyRow | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      surveysAPI.getAll({ limit: 100 }),
      responsesAPI.getAll({ limit: 500 }),
    ])
      .then(([surveysRes, responsesRes]) => {
        const list = surveysRes.surveys || surveysRes || [];
        setSurveys(list);
        const map: Record<string, number> = {};
        for (const r of responsesRes.responses || []) {
          if (r.survey_id) map[r.survey_id] = (map[r.survey_id] || 0) + 1;
        }
        setCounts(map);
      })
      .catch(() => {
        toast.error('Could not load surveys');
        setSurveys([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!surveyId) {
      setActiveSurvey(null);
      return;
    }
    const found = surveys.find((s) => s.id === surveyId);
    if (found) {
      setActiveSurvey(found);
      return;
    }
    void surveysAPI.getById(surveyId).then((data) => {
      const s = data.survey || data;
      setActiveSurvey({
        id: s.id,
        title: s.title,
        status: s.status,
        assigned_agents: s.assigned_agents,
      });
    });
  }, [surveyId, surveys]);

  const filteredSurveys = useMemo(() => {
    const q = pickerSearch.toLowerCase().trim();
    if (!q) return surveys;
    return surveys.filter((s) => s.title?.toLowerCase().includes(q));
  }, [surveys, pickerSearch]);

  const selectSurvey = (id: string) => {
    setSearchParams({ survey: id });
  };

  if (surveyId && activeSurvey) {
    const agents =
      activeSurvey.assigned_agents_count ?? activeSurvey.assigned_agents?.length ?? 0;
    return (
      <div className="flex h-[calc(100vh-7rem)] min-h-[480px] flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mb-1 h-8 rounded-sm px-2"
              onClick={() => setSearchParams({})}
            >
              ← All surveys
            </Button>
            <h2 className="font-display text-lg font-semibold">{activeSurvey.title}</h2>
            <p className="text-sm text-muted-foreground">
              Survey data explorer — uploads from assigned agents appear here after sync.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-sm" asChild>
              <Link to={`/dashboard/surveys/${surveyId}?tab=agents`}>
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Assign agents
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-sm" asChild>
              <Link to={`/dashboard/surveys/${surveyId}?tab=analysis`}>
                <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                Analytics
              </Link>
            </Button>
            <Button size="sm" className="rounded-sm" asChild>
              <Link to={`/dashboard/surveys/${surveyId}?tab=data`}>Survey workspace</Link>
            </Button>
          </div>
        </div>

        <SurveyDataExplorer
          surveyId={surveyId}
          surveyTitle={activeSurvey.title}
          variant="full"
          emptyState={
            <div className="flex flex-1 flex-col items-center justify-center border border-dashed border-border bg-card px-6 py-16 text-center">
              <Database className="mb-3 h-10 w-10 text-muted-foreground/60" />
              <p className="font-display text-sm font-medium">No submissions yet</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {agents === 0
                  ? 'Assign field agents to this survey, then have them collect and sync from the mobile app.'
                  : 'Agents are assigned — data will show up here after they upload interviews from the field app.'}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button size="sm" className="rounded-sm" asChild>
                  <Link to={`/dashboard/surveys/${surveyId}?tab=agents`}>Assign agents</Link>
                </Button>
                <Button size="sm" variant="outline" className="rounded-sm" asChild>
                  <Link to={`/dashboard/surveys/${surveyId}?tab=questions`}>Edit questions</Link>
                </Button>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold">Data Explorer</h2>
        <p className="text-sm text-muted-foreground">
          Choose a survey to browse every uploaded interview, filter, review, and export — analytics
          live on the same survey.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 rounded-sm pl-9"
          placeholder="Search surveys…"
          value={pickerSearch}
          onChange={(e) => setPickerSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading surveys…
        </div>
      ) : filteredSurveys.length === 0 ? (
        <p className="border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          No surveys match — create one under Surveys first.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredSurveys.map((s) => {
            const n = counts[s.id] ?? 0;
            const agents = s.assigned_agents_count ?? s.assigned_agents?.length ?? 0;
            return (
              <button
                key={s.id}
                type="button"
                className="flex flex-col items-start gap-2 border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
                onClick={() => selectSurvey(s.id)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="font-display font-medium leading-snug">{s.title}</span>
                  <Stamp status={s.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="ledger-count">{n}</span> submissions ·{' '}
                  <span className="ledger-count">{agents}</span> agents
                </p>
                <span className="text-xs font-medium text-primary">Open data →</span>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Tip: open any survey from{' '}
        <button
          type="button"
          className="text-primary underline-offset-2 hover:underline"
          onClick={() => navigate('/dashboard/surveys')}
        >
          Surveys
        </button>{' '}
        for assign agents, questions, and charts in one workspace.
      </p>
    </div>
  );
};

export default DataExplorer;
