import type { QualityMetrics } from '../types';

export function assessQuality(data: any[]): QualityMetrics {
  const recordCount = data.length;
  const serialized = data.map((d) => JSON.stringify(d));
  const uniqueSet = new Set(serialized);
  const duplicateRatio = recordCount === 0 ? 0 : (recordCount - uniqueSet.size) / recordCount;

  // Compute field-wise stats
  const numericFieldStats: QualityMetrics['numericFieldStats'] = {};
  const categoricalCounts: Record<string, Record<string, number>> = {};
  let nulls = 0;

  for (const row of data) {
    if (row == null) {
      nulls++;
      continue;
    }
    for (const [key, value] of Object.entries(row)) {
      if (value == null) {
        nulls++;
        continue;
      }
      if (typeof value === 'number') {
        const stat = numericFieldStats[key] || { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY, mean: 0 };
        stat.min = Math.min(stat.min, value);
        stat.max = Math.max(stat.max, value);
        stat.mean += value;
        numericFieldStats[key] = stat;
      } else if (typeof value === 'string' || typeof value === 'boolean') {
        const bucket = (categoricalCounts[key] = categoricalCounts[key] || {});
        const keyVal = String(value);
        bucket[keyVal] = (bucket[keyVal] || 0) + 1;
      }
    }
  }

  // Finalize means
  for (const key of Object.keys(numericFieldStats)) {
    const stat = numericFieldStats[key];
    stat.mean = recordCount ? Number((stat.mean / recordCount).toFixed(4)) : 0;
  }

  const nullRatio = recordCount === 0 ? 0 : nulls / (recordCount * Object.keys(data[0] || {}).length || 1);

  const categoricalUniques: QualityMetrics['categoricalUniques'] = {};
  for (const [key, counts] of Object.entries(categoricalCounts)) {
    categoricalUniques[key] = Object.keys(counts).length;
  }

  // Simple composite quality score: penalize duplicates and nulls, reward diversity
  const diversityBoost = Math.min(1, Object.values(categoricalUniques).reduce((a, b) => a + b, 0) / (recordCount || 1)) * 0.2;
  const base = 1 - Math.min(1, duplicateRatio * 0.7 + nullRatio * 0.3);
  const score = Math.max(0, Math.min(1, base + diversityBoost)) * 100;

  return {
    recordCount,
    duplicateRatio: Number(duplicateRatio.toFixed(4)),
    nullRatio: Number(nullRatio.toFixed(4)),
    numericFieldStats,
    categoricalUniques,
    score: Number(score.toFixed(2)),
  };
}