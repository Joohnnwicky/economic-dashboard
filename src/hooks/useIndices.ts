import { useQueries } from '@tanstack/react-query';
import { getIndexData } from '../api/alphavantage';
import { US_INDICES } from '../constants/indicators';

/**
 * Hook for fetching all US stock indices (Dow Jones, Nasdaq, S&P 500)
 *
 * CRITICAL: Alpha Vantage free tier = 25 calls/day
 * - 60-min stale time protects quota
 * - NO refetchInterval - quota cannot support minute updates
 * - Hourly updates max (3 indices = 3 calls per hour = 72/day exceeds quota!)
 * - Realistically: fetch once on load, cache for 60 min
 *
 * For true minute updates, need paid Alpha Vantage ($50/month) or WebSocket sources
 */
export function useIndices() {
  // Fetch all three indices in parallel using useQueries
  const queries = useQueries({
    queries: [
      {
        queryKey: ['index', 'dow-jones'],
        queryFn: () => getIndexData(US_INDICES.dowJones.symbol),
        staleTime: 60 * 60 * 1000,       // 60 min - CRITICAL for quota
        gcTime: 2 * 60 * 60 * 1000,      // Keep in cache 2 hours
        // NO refetchInterval - quota cannot support minute updates!
        retry: 1,                        // Fewer retries to save quota
        refetchOnWindowFocus: false,     // Don't waste quota on tab switch
      },
      {
        queryKey: ['index', 'nasdaq'],
        queryFn: () => getIndexData(US_INDICES.nasdaq.symbol),
        staleTime: 60 * 60 * 1000,
        gcTime: 2 * 60 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ['index', 'sp500'],
        queryFn: () => getIndexData(US_INDICES.sp500.symbol),
        staleTime: 60 * 60 * 1000,
        gcTime: 2 * 60 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    ],
  });

  return {
    dowJones: queries[0].data,
    nasdaq: queries[1].data,
    sp500: queries[2].data,
    isLoading: queries.some(q => q.isLoading),
    isFetching: queries.some(q => q.isFetching),
    isError: queries.some(q => q.isError),
    errors: queries.map(q => q.error),
    // Individual query status for error handling
    dowJonesError: queries[0].error,
    nasdaqError: queries[1].error,
    sp500Error: queries[2].error,
    // Timestamps for "last updated" display
    dowJonesUpdatedAt: queries[0].dataUpdatedAt,
    nasdaqUpdatedAt: queries[1].dataUpdatedAt,
    sp500UpdatedAt: queries[2].dataUpdatedAt,
  };
}