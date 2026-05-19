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
  // Fetch static JSON file
  const response = await fetch('/src/data/pboc-rates.json');
  const data: PBOCRateEntry[] = await response.json();

  // Sort by date descending, latest first
  const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const latest = sorted[0];

  // Convert to historical data points
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