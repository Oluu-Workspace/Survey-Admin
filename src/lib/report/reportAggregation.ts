import type { QuestionType, SurveyQuestion } from '@/domain/question';
import type { ResponseLike } from '@/lib/analytics';
import { isExcluded } from '@/lib/analytics';
import type { SurveyReportConfig } from './reportConfig.types';
import { isExcludedFromReport } from './reportPrivacy';
import {
  buildDistribution,
  chiSquareIndependence,
  detectAgentOutliers,
  isUndecided,
  marginOfError95,
  normalizeOptionLabel,
  twoProportionZTest,
  type DistRow,
} from './reportStats';

export type QuestionAnalysis = {
  id: string;
  label: string;
  type: QuestionType;
  n: number;
  nonResponseRate: number;
  otherRate: number;
  distribution: DistRow[];
  /** For ballot: share among decided respondents only. */
  decidedDistribution?: DistRow[];
  decidedN?: number;
  isOrdinal: boolean;
  isHorseRace: boolean;
  isDemographic: boolean;
};

export type CrosstabResult = {
  questionId: string;
  questionLabel: string;
  byQuestionId: string;
  byLabel: string;
  segments: string[];
  options: string[];
  matrix: number[][];
  pctMatrix: number[][];
  chi2: number;
  pValue: number;
  significant: boolean;
  segmentMoE: Record<string, number>;
};

export type OpenTextTheme = {
  theme: string;
  count: number;
  pct: number;
  quotes: string[];
};

export type AggregatedReport = {
  meta: {
    surveyId: string;
    title: string;
    generatedAt: string;
    region: string;
    fieldDates: string;
    n: number;
    agentCount: number;
    marginOfError: number;
    weighted: boolean;
    consentRate?: number;
    confidentialityNotice: string;
  };
  headlines: Array<{
    questionId: string;
    label: string;
    leader: string;
    leaderPct: number;
    runnerUp?: string;
    runnerUpPct?: number;
    gap: number;
    significantLead: boolean;
    n: number;
    moe: number;
  }>;
  demographics: QuestionAnalysis[];
  sections: Array<{
    id: string;
    title: string;
    accent: string;
    questions: QuestionAnalysis[];
  }>;
  horseRaces: QuestionAnalysis[];
  openText: Array<{ questionId: string; label: string; themes: OpenTextTheme[]; wordFreq: DistRow[] }>;
  crosstabs: CrosstabResult[];
  crosstabsAppendix: CrosstabResult[];
  dataQuality: {
    agentOutliers: ReturnType<typeof detectAgentOutliers>;
    nonResponseByQuestion: { id: string; label: string; rate: number }[];
    otherRateByQuestion: { id: string; label: string; rate: number }[];
    agentSubmissions: { agentId: string; name: string; count: number }[];
  };
  appendix: QuestionAnalysis[];
};

const ORDINAL_PATTERNS = /age|education|satisfaction|rank|scale|likert|rating/i;
const SATISFACTION_OPTIONS = ['dissatisfied', 'neutral', 'satisfied'];

function isOrdinalQuestion(q: SurveyQuestion): boolean {
  if (q.type === 'rating' || q.type === 'likert') return true;
  return ORDINAL_PATTERNS.test(`${q.id} ${q.label}`);
}

function answerValues(r: ResponseLike, qid: string): string[] {
  const v = r.answers?.[qid];
  if (v == null || String(v).trim() === '') return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return [String(v)];
}

function analyzeQuestion(
  q: SurveyQuestion,
  included: ResponseLike[],
  totalN: number,
  config: SurveyReportConfig,
  flags: { horseRace?: boolean; demographic?: boolean },
): QuestionAnalysis {
  const undecided = config.undecidedLabels || ['Undecided', 'Not sure'];
  let answered = 0;
  const flat: string[] = [];
  const multi = q.type === 'multiple_choice';

  for (const r of included) {
    const vals = answerValues(r, q.id).map(normalizeOptionLabel).filter(Boolean);
    if (vals.length) {
      answered++;
      flat.push(...vals);
    }
  }

  const nonResponseRate = totalN > 0 ? Math.round(((totalN - answered) / totalN) * 100) : 0;
  const dist = buildDistribution(flat, answered, multi);

  let otherCount = 0;
  for (const row of dist) {
    if (/^other(s)?$/i.test(row.option) || /prefer not/i.test(row.option)) otherCount += row.count;
  }
  const otherRate = answered > 0 ? Math.round((otherCount / answered) * 100) : 0;

  let decidedDistribution: DistRow[] | undefined;
  let decidedN: number | undefined;
  if (flags.horseRace) {
    const decidedFlat: string[] = [];
    let decidedRespondents = 0;
    for (const r of included) {
      const vals = answerValues(r, q.id)
        .map(normalizeOptionLabel)
        .filter((v) => v && !isUndecided(v, undecided));
      if (vals.length) {
        decidedRespondents++;
        decidedFlat.push(...vals);
      }
    }
    decidedN = decidedRespondents;
    decidedDistribution = buildDistribution(decidedFlat, decidedRespondents, multi);
  }

  return {
    id: q.id,
    label: q.label,
    type: q.type,
    n: answered,
    nonResponseRate,
    otherRate,
    distribution: dist,
    decidedDistribution,
    decidedN,
    isOrdinal: isOrdinalQuestion(q),
    isHorseRace: Boolean(flags.horseRace),
    isDemographic: Boolean(flags.demographic),
  };
}

function buildCrosstab(
  q: SurveyQuestion,
  byQ: SurveyQuestion,
  included: ResponseLike[],
  config: SurveyReportConfig,
): CrosstabResult | null {
  const segments = new Set<string>();
  const options = new Set<string>();
  const counts: Record<string, Record<string, number>> = {};

  for (const r of included) {
    const segVals = answerValues(r, byQ.id);
    const optVals = answerValues(r, q.id);
    if (!segVals.length || !optVals.length) continue;
    const seg = normalizeOptionLabel(segVals[0]);
    const opt = normalizeOptionLabel(optVals[0]);
    if (!seg || !opt) continue;
    segments.add(seg);
    options.add(opt);
    counts[seg] ??= {};
    counts[seg][opt] = (counts[seg][opt] || 0) + 1;
  }

  const segList = [...segments].sort();
  const optList = [...options].sort();
  if (segList.length < 2 || optList.length < 2) return null;

  const matrix = segList.map((seg) => optList.map((opt) => counts[seg]?.[opt] || 0));
  const { chi2, pValue, significant } = chiSquareIndependence(matrix);

  const pctMatrix = matrix.map((row) => {
    const rowTotal = row.reduce((a, b) => a + b, 0) || 1;
    return row.map((c) => Math.round((c / rowTotal) * 100));
  });

  const segmentMoE: Record<string, number> = {};
  for (let i = 0; i < segList.length; i++) {
    const rowTotal = matrix[i].reduce((a, b) => a + b, 0);
    segmentMoE[segList[i]] = marginOfError95(rowTotal);
  }

  return {
    questionId: q.id,
    questionLabel: q.label,
    byQuestionId: byQ.id,
    byLabel: byQ.label,
    segments: segList,
    options: optList,
    matrix,
    pctMatrix,
    chi2,
    pValue,
    significant,
    segmentMoE,
  };
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'it',
  'that', 'this', 'with', 'as', 'be', 'are', 'was', 'were', 'by', 'from', 'have', 'has',
]);

function clusterOpenText(texts: string[], maxThemes = 8): OpenTextTheme[] {
  const freq: Record<string, number> = {};
  for (const t of texts) {
    const words = t.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP_WORDS.has(w));
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
  }
  const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, maxThemes);
  const total = texts.length || 1;

  return topWords.map(([theme, count]) => {
    const quotes = texts
      .filter((t) => t.toLowerCase().includes(theme))
      .slice(0, 3)
      .map((t) => t.slice(0, 160));
    return { theme, count, pct: Math.round((count / total) * 100), quotes };
  });
}

function wordFrequency(texts: string[], limit = 20): DistRow[] {
  const freq: Record<string, number> = {};
  for (const t of texts) {
    for (const w of t.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/)) {
      if (w.length > 3 && !STOP_WORDS.has(w)) freq[w] = (freq[w] || 0) + 1;
    }
  }
  const total = Object.values(freq).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([option, count]) => ({ option, count, pct: Math.round((count / total) * 100) }));
}

export function aggregateReport(input: {
  config: SurveyReportConfig;
  surveyTitle: string;
  region: string;
  generatedAt: string;
  fieldDates: string;
  questions: SurveyQuestion[];
  responses: ResponseLike[];
  agentName: (id: string) => string;
}): AggregatedReport {
  const { config, questions, responses, agentName } = input;
  const included = responses.filter((r) => !isExcluded(r));
  const n = included.length;
  const qById = new Map(questions.map((q) => [q.id, q]));

  const agentCounts: Record<string, number> = {};
  for (const r of included) {
    agentCounts[r.agent_id] = (agentCounts[r.agent_id] || 0) + 1;
  }
  const agentCount = Object.keys(agentCounts).length;

  let consentRate: number | undefined;
  if (config.consentQuestionId) {
    let yes = 0;
    let answered = 0;
    for (const r of included) {
      const v = answerValues(r, config.consentQuestionId)[0]?.toLowerCase();
      if (v) {
        answered++;
        if (v === 'yes') yes++;
      }
    }
    if (answered) consentRate = Math.round((yes / answered) * 100);
  }

  const horseSet = new Set(config.horseRaceQuestionIds || config.headlineQuestionIds);
  const demoSet = new Set(config.demographicQuestionIds || []);

  const analyze = (q: SurveyQuestion, flags: { horseRace?: boolean; demographic?: boolean }) =>
    analyzeQuestion(q, included, n, config, flags);

  const headlines = (config.headlineQuestionIds || [])
    .map((id) => qById.get(id))
    .filter(Boolean)
    .map((q) => {
      const a = analyze(q!, { horseRace: horseSet.has(q!.id) });
      const sorted = [...a.distribution].sort((x, y) => y.count - x.count);
      const lead = sorted[0];
      const second = sorted[1];
      if (!lead) return null;
      const gap = second ? lead.pct - second.pct : lead.pct;
      let significantLead = false;
      if (second && a.n > 0) {
        const test = twoProportionZTest(a.n, lead.count, a.n, second.count);
        significantLead = test.significant && gap > marginOfError95(a.n);
      }
      return {
        questionId: q!.id,
        label: q!.label,
        leader: lead.option,
        leaderPct: lead.pct,
        runnerUp: second?.option,
        runnerUpPct: second?.pct,
        gap,
        significantLead,
        n: a.n,
        moe: marginOfError95(a.n),
      };
    })
    .filter(Boolean) as AggregatedReport['headlines'];

  const demographics = [...demoSet]
    .map((id) => qById.get(id))
    .filter(Boolean)
    .filter((q) => !isExcludedFromReport(q!))
    .map((q) => analyze(q!, { demographic: true }));

  const sections = config.sections.map((sec) => ({
    id: sec.id,
    title: sec.title,
    accent: sec.accent || '#1B4D3E',
    questions: sec.questionIds
      .map((id) => qById.get(id))
      .filter(Boolean)
      .filter((q) => !isExcludedFromReport(q!))
      .map((q) =>
        analyze(q!, { horseRace: horseSet.has(q!.id), demographic: demoSet.has(q!.id) }),
      ),
  }));

  const horseRaces = [...horseSet]
    .map((id) => qById.get(id))
    .filter(Boolean)
    .map((q) => analyze(q!, { horseRace: true }));

  const openTextSample = config.openTextSampleSize ?? 500;
  const openText = questions
    .filter((q) => q.type === 'long_text' || q.type === 'short_text')
    .filter((q) => !isExcludedFromReport(q))
    .map((q) => {
      let texts = included
        .map((r) => answerValues(r, q.id)[0])
        .filter(Boolean)
        .map((t) => String(t).trim());
      if (texts.length > openTextSample) {
        texts = texts.sort(() => Math.random() - 0.5).slice(0, openTextSample);
      }
      return {
        questionId: q.id,
        label: q.label,
        themes: clusterOpenText(texts),
        wordFreq: wordFrequency(texts),
      };
    })
    .filter((x) => x.themes.length > 0 || x.wordFreq.length > 0);

  const crosstabsAll: CrosstabResult[] = [];
  for (const ct of config.crosstabs || []) {
    const q = qById.get(ct.questionId);
    const by = qById.get(ct.byQuestionId);
    if (!q || !by) continue;
    const tab = buildCrosstab(q, by, included, config);
    if (tab) crosstabsAll.push(tab);
  }
  const crosstabs = crosstabsAll.filter((c) => c.significant);
  const crosstabsAppendix = crosstabsAll.filter((c) => !c.significant);

  const appendix = questions
    .filter((q) => !isExcludedFromReport(q))
    .map((q) => analyze(q, { horseRace: horseSet.has(q.id), demographic: demoSet.has(q.id) }));

  return {
    meta: {
      surveyId: config.surveyId,
      title: config.title || input.surveyTitle,
      generatedAt: input.generatedAt,
      region: input.region,
      fieldDates: input.fieldDates,
      n,
      agentCount,
      marginOfError: marginOfError95(n),
      weighted: Boolean(config.weighting?.enabled),
      consentRate,
      confidentialityNotice:
        config.confidentialityNotice ||
        'Confidential — for authorized use only.',
    },
    headlines,
    demographics,
    sections,
    horseRaces,
    openText,
    crosstabs,
    crosstabsAppendix,
    dataQuality: {
      agentOutliers: detectAgentOutliers(agentCounts),
      nonResponseByQuestion: appendix.map((a) => ({
        id: a.id,
        label: a.label,
        rate: a.nonResponseRate,
      })),
      otherRateByQuestion: appendix.map((a) => ({
        id: a.id,
        label: a.label,
        rate: a.otherRate,
      })),
      agentSubmissions: Object.entries(agentCounts)
        .map(([agentId, count]) => ({
          agentId,
          name: agentName(agentId),
          count,
        }))
        .sort((a, b) => b.count - a.count),
    },
    appendix,
  };
}

export async function loadReportConfig(surveyId: string): Promise<SurveyReportConfig | null> {
  try {
    const res = await fetch(`/report-configs/${surveyId}.json`);
    if (!res.ok) return null;
    return (await res.json()) as SurveyReportConfig;
  } catch {
    return null;
  }
}

export function buildDefaultConfig(
  surveyId: string,
  surveyTitle: string,
  questions: SurveyQuestion[],
): SurveyReportConfig {
  const reportQs = questions.filter((q) => !isExcludedFromReport(q));
  const choiceIds = reportQs
    .filter((q) =>
      ['single_choice', 'multiple_choice', 'yes_no', 'dropdown'].includes(q.type) ||
      q.type === 'rating' ||
      q.type === 'likert',
    )
    .map((q) => q.id);
  const demographicQuestionIds = reportQs
    .filter((q) =>
      /age|gender|sex|education|school|occupation|livelihood|employment|marital|religion|faith|ward|village|region|county/i.test(
        `${q.id} ${q.label}`,
      ),
    )
    .map((q) => q.id);
  const otherIds = reportQs
    .map((q) => q.id)
    .filter((id) => !demographicQuestionIds.includes(id));

  const sections: SurveyReportConfig['sections'] = [];
  if (demographicQuestionIds.length) {
    sections.push({
      id: 'demographics',
      title: 'Demographic profile',
      accent: '#1B4D3E',
      questionIds: demographicQuestionIds,
    });
  }
  if (otherIds.length) {
    sections.push({
      id: 'results',
      title: 'Survey results',
      accent: '#2C4A6E',
      questionIds: otherIds,
    });
  }

  return {
    schemaVersion: 1,
    surveyId,
    title: surveyTitle,
    headlineQuestionIds: choiceIds.slice(0, 6),
    demographicQuestionIds,
    horseRaceQuestionIds: choiceIds.filter((id) =>
      /president|governor|senator|mp|mca|women|candidate|vote/i.test(id),
    ),
    sections,
    crosstabs: [],
    openTextSampleSize: 500,
  };
}
