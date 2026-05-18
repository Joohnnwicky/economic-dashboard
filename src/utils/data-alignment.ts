import { NormalizedIndicator } from '../types/indicator';

/**
 * Align timestamps from multiple series for cross-market comparison.
 * Returns a sorted array of unique timestamps from all series.
 */
export function alignTimestamps(series: NormalizedIndicator[]): Date[] {
  // Collect all timestamps from all series
  const timestampSet = new Set<number>();

  for (const s of series) {
    for (const point of s.historical) {
      timestampSet.add(point.timestamp.getTime());
    }
  }

  // Convert to array and sort chronologically
  const sortedTimestamps = Array.from(timestampSet)
    .sort((a, b) => a - b)
    .map((ms) => new Date(ms));

  return sortedTimestamps;
}