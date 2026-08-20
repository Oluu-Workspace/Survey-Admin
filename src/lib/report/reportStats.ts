/** Pure statistical helpers for survey reports — unit-testable, no DOM. */

const Z_95 = 1.96;

export type DistRow = { option: string; count: number; pct: number };

/** Margin of error at 95% CI. Uses p=0.5 for max conservative MoE when p unknown. */
export function marginOfError95(n: number, p = 0.5): number {
  if (n <= 0) return 0;
  return Math.round(Z_95 * Math.sqrt((p * (1 - p)) / n) * 1000) / 10;
}

/** Two-proportion z-test (two-tailed). Returns { z, pValue, significant at alpha=0.05 }. */
export function twoProportionZTest(
  n1: number,
  x1: number,
  n2: number,
  x2: number,
): { z: number; pValue: number; significant: boolean } {
  if (n1 <= 0 || n2 <= 0) return { z: 0, pValue: 1, significant: false };
  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const pPool = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return { z: 0, pValue: 1, significant: false };
  const z = (p1 - p2) / se;
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));
  return { z, pValue, significant: pValue < 0.05 };
}

/** Chi-square test of independence on a contingency table (rows × cols counts). */
export function chiSquareIndependence(table: number[][]): {
  chi2: number;
  df: number;
  pValue: number;
  significant: boolean;
} {
  const rows = table.length;
  const cols = table[0]?.length ?? 0;
  if (rows < 2 || cols < 2) return { chi2: 0, df: 0, pValue: 1, significant: false };

  let total = 0;
  const rowSums: number[] = [];
  const colSums = new Array(cols).fill(0);
  for (let r = 0; r < rows; r++) {
    let rs = 0;
    for (let c = 0; c < cols; c++) {
      const v = table[r][c] || 0;
      rs += v;
      colSums[c] += v;
      total += v;
    }
    rowSums.push(rs);
  }
  if (total === 0) return { chi2: 0, df: 0, pValue: 1, significant: false };

  let chi2 = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const expected = (rowSums[r] * colSums[c]) / total;
      if (expected > 0) {
        const obs = table[r][c] || 0;
        chi2 += ((obs - expected) ** 2) / expected;
      }
    }
  }
  const df = (rows - 1) * (cols - 1);
  const pValue = 1 - chiSquareCdf(chi2, df);
  return { chi2, df, pValue, significant: pValue < 0.05 };
}

/** Flag agents with submission count > mean + 2*std. */
export function detectAgentOutliers(
  agentCounts: Record<string, number>,
): { agentId: string; count: number; mean: number; threshold: number }[] {
  const counts = Object.values(agentCounts);
  if (counts.length < 2) return [];
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((s, c) => s + (c - mean) ** 2, 0) / counts.length;
  const std = Math.sqrt(variance);
  const threshold = mean + 2 * std;
  return Object.entries(agentCounts)
    .filter(([, c]) => c > threshold)
    .map(([agentId, count]) => ({ agentId, count, mean, threshold }))
    .sort((a, b) => b.count - a.count);
}

/** Simple post-stratification weights: weight_i = targetShare[segment] / sampleShare[segment]. */
export function computePostStratWeights(
  segments: string[],
  targetShares: Record<string, number>,
): number[] {
  const n = segments.length;
  if (!n) return [];
  const sampleCounts: Record<string, number> = {};
  for (const s of segments) sampleCounts[s] = (sampleCounts[s] || 0) + 1;
  const total = n;
  return segments.map((s) => {
    const sampleShare = (sampleCounts[s] || 0) / total;
    const target = targetShares[s];
    if (!target || sampleShare === 0) return 1;
    return target / sampleShare;
  });
}

export function normalizeOptionLabel(raw: string): string {
  const t = String(raw || '').trim();
  if (!t) return '';
  if (/^other(s)?(\s*\(.*\))?$/i.test(t)) return 'Others';
  return t;
}

export function isUndecided(label: string, undecidedLabels: string[]): boolean {
  const n = normalizeOptionLabel(label).toLowerCase();
  return undecidedLabels.some((u) => n === u.toLowerCase() || n === 'others');
}

/** Build distribution with pct of respondents (for single choice) or pct of selections (multi). */
export function buildDistribution(
  values: string[],
  respondentCount: number,
  multiSelect = false,
): DistRow[] {
  const freq: Record<string, number> = {};
  for (const v of values) {
    const key = normalizeOptionLabel(v);
    if (key) freq[key] = (freq[key] || 0) + 1;
  }
  const denom = multiSelect ? respondentCount || 1 : values.length || 1;
  const totalSelections = Object.values(freq).reduce((a, b) => a + b, 0) || 1;
  const pctBase = multiSelect ? respondentCount : totalSelections;
  return Object.entries(freq)
    .map(([option, count]) => ({
      option,
      count,
      pct: Math.round((count / (pctBase || 1)) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

/** Percent label that avoids misleading 0% when count > 0. */
export function formatPctLabel(count: number, total: number): string {
  if (total <= 0 || count <= 0) return '0%';
  const raw = (count / total) * 100;
  if (raw > 0 && raw < 0.5) return '<1%';
  return `${Math.round(raw)}%`;
}

/** Approximate normal CDF (Abramowitz & Stegun). */
function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/** Chi-square CDF approximation via Wilson-Hilferty for df >= 1. */
function chiSquareCdf(x: number, df: number): number {
  if (df <= 0 || x <= 0) return 0;
  if (df === 1) return 2 * normalCdf(Math.sqrt(x)) - 1;
  const z = ((x / df) ** (1 / 3) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
  return normalCdf(z);
}
