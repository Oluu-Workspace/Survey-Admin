import { describe, expect, it } from 'vitest';
import {
  chiSquareIndependence,
  detectAgentOutliers,
  marginOfError95,
  twoProportionZTest,
} from './reportStats';

describe('marginOfError95', () => {
  it('returns 0 for empty sample', () => {
    expect(marginOfError95(0)).toBe(0);
  });

  it('decreases as n increases', () => {
    expect(marginOfError95(100)).toBeGreaterThan(marginOfError95(400));
  });
});

describe('twoProportionZTest', () => {
  it('flags large gaps as significant', () => {
    const r = twoProportionZTest(500, 300, 500, 150);
    expect(r.significant).toBe(true);
  });

  it('treats identical proportions as not significant', () => {
    const r = twoProportionZTest(200, 100, 200, 100);
    expect(r.significant).toBe(false);
  });
});

describe('chiSquareIndependence', () => {
  it('detects association in skewed table', () => {
    const table = [
      [80, 20],
      [20, 80],
    ];
    const r = chiSquareIndependence(table);
    expect(r.significant).toBe(true);
    expect(r.pValue).toBeLessThan(0.05);
  });

  it('returns not significant for uniform table', () => {
    const table = [
      [50, 50],
      [50, 50],
    ];
    const r = chiSquareIndependence(table);
    expect(r.significant).toBe(false);
  });
});

describe('detectAgentOutliers', () => {
  it('flags agents above mean + 2σ', () => {
    const counts = { a: 10, b: 10, c: 10, d: 10, e: 150 };
    const outliers = detectAgentOutliers(counts);
    expect(outliers.some((o) => o.agentId === 'e')).toBe(true);
  });
});
