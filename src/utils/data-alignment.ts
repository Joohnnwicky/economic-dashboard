import { NormalizedIndicator } from '../types/indicator';

/**
 * Align timestamps from multiple series for cross-market comparison.
 * Returns monthly timestamps to ensure alignment across series with different update schedules.
 *
 * Strategy: For each month in the time range, use the latest available data point from each series.
 * This handles cases like:
 * - LPR updates monthly on 20th
 * - FFR updates more frequently (weekly/daily)
 */
export function alignTimestamps(series: NormalizedIndicator[]): Date[] {
  if (series.length === 0) return [];

  // Find time range across all series
  const allTimestamps: Date[] = [];
  for (const s of series) {
    for (const point of s.historical) {
      allTimestamps.push(point.timestamp);
    }
  }

  if (allTimestamps.length === 0) return [];

  const minDate = new Date(Math.min(...allTimestamps.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allTimestamps.map(d => d.getTime())));

  // Generate monthly timestamps from min to max
  const monthlyTimestamps: Date[] = [];
  const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);

  while (current <= maxDate) {
    monthlyTimestamps.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  return monthlyTimestamps;
}