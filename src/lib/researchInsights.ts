import type { QuestionAnalytics } from '@/components/SurveyAnalyticsPanel';
import type { ResponseLike } from '@/lib/analytics';
import { isExcluded } from '@/lib/analytics';
import { isChartableAnalyticsRow } from '@/lib/chartableQuestions';

function topDistribution(q: QuestionAnalytics) {
  if (!q.distribution?.length) return null;
  return [...q.distribution].sort((a, b) => b.count - a.count)[0];
}

function sortedDist(q: QuestionAnalytics) {
  return [...(q.distribution || [])].sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Ballot / political question detection
// ---------------------------------------------------------------------------

const BALLOT_RE =
  /\b(president|governor|senator|women.?rep|member.?of.?parliament|mp|mca|ballot|candidate|vote|prefer|support)\b/i;

export function isBallotQuestion(q: { id?: string; label?: string }): boolean {
  const blob = `${q.id || ''} ${q.label || ''}`;
  return BALLOT_RE.test(blob);
}

// ---------------------------------------------------------------------------
// Per-ward and per-village leader computation
// ---------------------------------------------------------------------------

export type RaceLeader = {
  leader: string;
  leaderCount: number;
  leaderPct: number;
  runnerUp?: string;
  runnerUpCount?: number;
  runnerUpPct?: number;
  gap: number;
  n: number;
};

export type WardLeaderRow = {
  ward: string;
  n: number;
  leaders: Record<string, RaceLeader>;
  villages: VillageLeaderRow[];
};

export type VillageLeaderRow = {
  village: string;
  ward: string;
  n: number;
  leaders: Record<string, RaceLeader>;
};

function computeLeader(
  responses: ResponseLike[],
  questionId: string,
): RaceLeader | null {
  const freq: Record<string, number> = {};
  let total = 0;
  for (const r of responses) {
    if (isExcluded(r)) continue;
    const v = r.answers?.[questionId];
    if (v == null || String(v).trim() === '') continue;
    total++;
    const vals = Array.isArray(v) ? v : [v];
    for (const val of vals) {
      const key = String(val).trim();
      if (key) freq[key] = (freq[key] || 0) + 1;
    }
  }
  if (!total) return null;
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return null;
  const [leader, leaderCount] = sorted[0];
  const leaderPct = Math.round((leaderCount / total) * 100);
  const second = sorted[1];
  return {
    leader,
    leaderCount,
    leaderPct,
    runnerUp: second?.[0],
    runnerUpCount: second?.[1],
    runnerUpPct: second ? Math.round((second[1] / total) * 100) : undefined,
    gap: second ? leaderPct - Math.round((second[1] / total) * 100) : leaderPct,
    n: total,
  };
}

/**
 * Build a full geographic breakdown: for each ballot question,
 * compute leaders at overall, ward, and village level.
 */
export function buildGeographicLeaders(
  responses: ResponseLike[],
  ballotQuestions: { id: string; label: string }[],
): {
  overall: Record<string, RaceLeader>;
  wards: WardLeaderRow[];
} {
  const included = responses.filter((r) => !isExcluded(r));

  // Overall leaders
  const overall: Record<string, RaceLeader> = {};
  for (const q of ballotQuestions) {
    const leader = computeLeader(included, q.id);
    if (leader) overall[q.id] = leader;
  }

  // Group by ward
  const wardGroups: Record<string, ResponseLike[]> = {};
  for (const r of included) {
    const w = (r.location?.ward || '').trim();
    if (!w || /^unknown/i.test(w)) continue;
    (wardGroups[w] ??= []).push(r);
  }

  const wards: WardLeaderRow[] = Object.entries(wardGroups)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([ward, wardResponses]) => {
      const leaders: Record<string, RaceLeader> = {};
      for (const q of ballotQuestions) {
        const leader = computeLeader(wardResponses, q.id);
        if (leader) leaders[q.id] = leader;
      }

      // Group by village within this ward
      const villageGroups: Record<string, ResponseLike[]> = {};
      for (const r of wardResponses) {
        const v = (r.location?.village || '').trim();
        if (!v || /^unknown/i.test(v)) continue;
        (villageGroups[v] ??= []).push(r);
      }

      const villages: VillageLeaderRow[] = Object.entries(villageGroups)
        .sort((a, b) => b[1].length - a[1].length)
        .map(([village, villageResponses]) => {
          const vLeaders: Record<string, RaceLeader> = {};
          for (const q of ballotQuestions) {
            const leader = computeLeader(villageResponses, q.id);
            if (leader) vLeaders[q.id] = leader;
          }
          return { village, ward, n: villageResponses.length, leaders: vLeaders };
        });

      return { ward, n: wardResponses.length, leaders, villages };
    });

  return { overall, wards };
}

/** Rule-based narrative insights from question distributions (no external AI). */
export function generateQuestionInsight(q: QuestionAnalytics): string {
  if (!q.count) {
    return 'Not enough valid answers in the current dataset to interpret this question. Collect more interviews or widen filters (e.g. all agents).';
  }

  if (q.kind === 'number' && q.distribution?.length) {
    const top = topDistribution(q)!;
    const spread =
      q.min != null && q.max != null && q.min !== q.max
        ? ` The range is ${q.min.toLocaleString()}–${q.max.toLocaleString()} (mean ${q.mean ?? '—'}, median ${q.median ?? '—'}).`
        : q.mean != null
          ? ` The central value is about ${q.mean}.`
          : '';
    return `Among ${q.count} numeric responses, the largest share falls in “${top.option}” (${top.count} answers, ${top.pct}%).${spread}`;
  }

  if ((q.kind === 'choice' || (q.distribution?.length ?? 0) > 0) && q.distribution?.length) {
    const sorted = sortedDist(q);
    const lead = sorted[0];
    const second = sorted[1];
    const multi =
      q.type === 'multiple_choice'
        ? ' Percentages reflect share of all ticked options (respondents may select more than one).'
        : '';
    const marginPts =
      second != null ? Math.round((lead.pct - second.pct) * 10) / 10 : null;
    const marginCount = second != null ? lead.count - second.count : null;

    if (lead.pct >= 60) {
      const runner =
        second != null
          ? ` Runner-up “${second.option}” has ${second.count} (${second.pct}%) — lead of ${marginCount} responses (${marginPts} points).`
          : '';
      return `Clear majority for “${lead.option}”: ${lead.count} of ${q.count} answers (${lead.pct}%).${runner}${multi}`;
    }
    if (lead.pct >= 40) {
      const runner =
        second != null
          ? ` “${second.option}” is second at ${second.count} (${second.pct}%), ${marginPts} points behind.`
          : '';
      return `Leading option is “${lead.option}” with ${lead.count} answers (${lead.pct}%), without an overwhelming consensus.${runner}${multi}`;
    }
    const top3 = sorted
      .slice(0, 3)
      .map((x) => `“${x.option}” ${x.count}/${x.pct}%`)
      .join('; ');
    return `Opinion is fragmented across options (n=${q.count}). Top three: ${top3}. Cross-tabulate by ward or demographics for clearer patterns.${multi}`;
  }

  if (q.kind === 'text' || q.kind === 'media') {
    return `${q.count} open-ended or media answers on file. Export CSV for full verbatim review and manual coding.`;
  }

  return `${q.count} valid answers in scope.`;
}

export function buildExecutiveSummary(opts: {
  surveyTitle: string;
  included: number;
  excluded: number;
  completionPct: number;
  perQuestion: QuestionAnalytics[];
  collectionPeriod?: string;
  uniqueWards?: number;
  uniqueAgents?: number;
}): string[] {
  const bullets: string[] = [];

  bullets.push(
    `Study: “${opts.surveyTitle}” — ${opts.included.toLocaleString()} interviews analysed.`,
  );

  if (opts.collectionPeriod) {
    bullets.push(`Field collection window (submitted dates): ${opts.collectionPeriod}.`);
  }

  bullets.push(
    `Data completeness: ${opts.completionPct}% of required question slots answered among included records.`,
  );

  if (opts.uniqueWards != null && opts.uniqueWards > 0) {
    bullets.push(`Geographic coverage: ${opts.uniqueWards} ward(s) represented in included data.`);
  }

  if (opts.uniqueAgents != null && opts.uniqueAgents > 0) {
    bullets.push(`${opts.uniqueAgents} field agent(s) contributed included interviews.`);
  }

  const choiceQs = opts.perQuestion.filter(
    (q) => (q.kind === 'choice' || q.distribution?.length) && q.count > 0 && q.distribution?.length,
  );

  for (const q of choiceQs.slice(0, 6)) {
    const sorted = sortedDist(q);
    const top = sorted[0];
    const second = sorted[1];
    if (!top) continue;
    if (second) {
      const gap = Math.round((top.pct - second.pct) * 10) / 10;
      bullets.push(
        `“${q.label}”: “${top.option}” leads with ${top.count.toLocaleString()} (${top.pct}%), ahead of “${second.option}” by ${gap} points (${(top.count - second.count).toLocaleString()} responses).`,
      );
    } else {
      bullets.push(
        `“${q.label}”: “${top.option}” — ${top.count.toLocaleString()} answers (${top.pct}%, n=${q.count.toLocaleString()}).`,
      );
    }
  }

  const numericQs = opts.perQuestion.filter((q) => q.kind === 'number' && q.count > 0 && q.mean != null);
  if (numericQs[0]) {
    const n = numericQs[0];
    bullets.push(
      `“${n.label}”: mean ${n.mean}, median ${n.median ?? '—'} (n=${n.count.toLocaleString()}).`,
    );
  }

  return bullets;
}

/** Compact key findings for the report cover / snapshot. */
export function buildKeyFindings(perQuestion: QuestionAnalytics[]): Array<{
  question: string;
  leader: string;
  count: number;
  pct: number;
  runnerUp?: string;
  marginPts?: number;
  n: number;
}> {
  return perQuestion
    .filter(isChartableAnalyticsRow)
    .filter((q) => q.count > 0 && q.distribution?.length)
    .map((q) => {
      const sorted = sortedDist(q);
      const lead = sorted[0];
      const second = sorted[1];
      return {
        question: q.label,
        leader: lead.option,
        count: lead.count,
        pct: lead.pct,
        runnerUp: second?.option,
        marginPts: second != null ? Math.round((lead.pct - second.pct) * 10) / 10 : undefined,
        n: q.count,
      };
    })
    .slice(0, 8);
}

export function buildConclusions(perQuestion: QuestionAnalytics[]): string[] {
  const lines: string[] = [
    'This report summarises the answers collected in the field — counts and percentages for the sample achieved.',
    'Read count and percentage together: a high share on few responses is less reliable than the same share on many responses.',
  ];

  const withData = perQuestion.filter((q) => q.count > 0 && isChartableAnalyticsRow(q));
  if (!withData.length) {
    lines.push('No question-level conclusions yet: add responses in the field, sync, then regenerate this report.');
    return lines;
  }

  const choiceWithDist = withData.filter((q) => q.distribution?.length);

  const dominant = choiceWithDist
    .map((q) => ({ q, top: topDistribution(q)! }))
    .filter((x) => x.top.pct >= 50)
    .slice(0, 4);

  if (dominant.length) {
    lines.push(
      `Majority outcomes (≥50%): ${dominant
        .map((d) => `“${d.q.label}” → ${d.top.option} (${d.top.count}, ${d.top.pct}%)`)
        .join('; ')}.`,
    );
  }

  const closeRaces = choiceWithDist
    .map((q) => {
      const s = sortedDist(q);
      if (s.length < 2) return null;
      const gap = s[0].pct - s[1].pct;
      if (gap > 12) return null;
      return { q, lead: s[0], second: s[1], gap: Math.round(gap * 10) / 10 };
    })
    .filter(Boolean)
    .slice(0, 3) as Array<{
    q: QuestionAnalytics;
    lead: { option: string; count: number; pct: number };
    second: { option: string; count: number; pct: number };
    gap: number;
  }>;

  if (closeRaces.length) {
    lines.push(
      `Competitive / close results (≤12 point gap): ${closeRaces
        .map(
          (r) =>
            `“${r.q.label}” — ${r.lead.option} ${r.lead.pct}% vs ${r.second.option} ${r.second.pct}% (${r.gap} pts)`,
        )
        .join('; ')}.`,
    );
  }

  const fragmented = choiceWithDist
    .map((q) => ({ q, top: topDistribution(q)! }))
    .filter((x) => x.top.pct < 35)
    .slice(0, 3);

  if (fragmented.length) {
    lines.push(
      `Divided opinion on ${fragmented.map((f) => `“${f.q.label}”`).join(', ')} — segment by ward, village, or demographic questions before generalising.`,
    );
  }

  const challenges = withData.find((q) =>
    /challenge|barrier|priority|issue|concern|livelihood|vote|president|governor|candidate/i.test(
      q.label,
    ),
  );
  if (challenges?.distribution?.length) {
    const top = sortedDist(challenges).slice(0, 3);
    lines.push(
      `Headline theme (${challenges.label}): ${top
        .map((t) => `${t.option} — ${t.count.toLocaleString()} (${t.pct}%)`)
        .join('; ')}.`,
    );
  }

  lines.push(
    'Recommended next steps: (1) review geographic breakdowns, (2) cross-tabulate key opinion questions by demographics, (3) export CSV for advanced analysis if needed.',
  );

  return lines;
}

export function mergeQuestionAnalytics(
  surveyQuestions: { id: string; label: string; type?: string }[],
  clientRows: QuestionAnalytics[],
  apiRows?: QuestionAnalytics[] | null,
): QuestionAnalytics[] {
  const apiById = new Map((apiRows || []).map((q) => [q.id, q]));
  const clientById = new Map(clientRows.map((q) => [q.id, q]));

  return surveyQuestions.map((sq) => {
    const api = apiById.get(sq.id);
    const client = clientById.get(sq.id);
    const base = api || client;
    if (!base) {
      return {
        id: sq.id,
        label: sq.label,
        type: sq.type,
        kind: 'text' as const,
        count: 0,
        distribution: [],
      };
    }
    return {
      ...base,
      label: sq.label || base.label,
      type: sq.type || base.type,
    };
  });
}

export function collectionPeriodFromResponses(rows: ResponseLike[]): string | undefined {
  const dates = rows
    .map((r) => r.submitted_at || r.created_at)
    .filter(Boolean)
    .map((d) => {
      const s = String(d).trim();
      return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s}Z`);
    })
    .filter((d) => !Number.isNaN(d.getTime()));
  if (!dates.length) return undefined;
  dates.sort((a, b) => a.getTime() - b.getTime());
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', {
      timeZone: 'Africa/Nairobi',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  const lo = fmt(dates[0]);
  const hi = fmt(dates[dates.length - 1]);
  return lo === hi ? lo : `${lo} – ${hi}`;
}
