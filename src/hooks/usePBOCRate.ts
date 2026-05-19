import { useQuery } from '@tanstack/react-query';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';

interface PBOCRateEntry {
  date: string;
  rate: number;
  type: string;
}

/**
 * Fetches PBOC historical rate data from static JSON file
 *
 * Note: PBOC rate data is static historical data with rare updates.
 * No API polling needed. staleTime: Infinity prevents unnecessary fetches.
 */
async function fetchPBOCRate(): Promise<NormalizedIndicator> {
  // Fetch static JSON file from public directory
  const response = await fetch('/data/pboc-rates.json');
  const data: PBOCRateEntry[] = await response.json();

  // Sort by date ascending (oldest first) for chronological display
  const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const latest = sorted[sorted.length - 1];

  // Convert to historical data points (oldest first, newest last)
  const historical: HistoricalDataPoint[] = sorted.map((entry) => ({
    timestamp: new Date(entry.date),
    value: entry.rate,
  }));

  return {
    id: 'pboc-rate',
    name: '中国贷款市场报价利率（LPR Loan Prime Rate）',
    value: latest.rate,
    unit: '%',
    timestamp: new Date(latest.date),
    historical,
  };
}

/**
 * TanStack Query hook loading PBOC historical rate data from static JSON
 *
 * Cache configuration:
 * - staleTime: Infinity - static data, never stale
 * - gcTime: Infinity - keep cached data indefinitely
 * - retry: false - static file should load successfully on first attempt
 *
 * Per RESEARCH.md, PBOC rate is historical static data with rare updates.
 * No API polling needed.
 */
export function usePBOCRate() {
  return useQuery({
    queryKey: ['pboc-rate'],
    queryFn: fetchPBOCRate,
    staleTime: Infinity,  // Static data, never stale
    gcTime: Infinity,     // Keep cached indefinitely
    retry: false,         // Static file should load on first attempt
  });
}