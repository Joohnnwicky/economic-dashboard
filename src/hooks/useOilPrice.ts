import { useQueries } from '@tanstack/react-query';
import { getOilPrice } from '../api/fred-commodities';
import { FRED_BRENT_SERIES, FRED_WTI_SERIES } from '../constants/api';
import { TimeRange } from '../types/api';

/**
 * Hook for fetching both Brent and WTI oil prices
 * Uses FRED API series DCOILBRENTEU and DCOILWTICO
 */
export function useOilPrices(timeRange: TimeRange = '1Y') {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['oil-price', 'brent', timeRange],
        queryFn: () => getOilPrice(FRED_BRENT_SERIES, timeRange),
        staleTime: 24 * 60 * 60 * 1000,  // 24 hours - daily updates
        gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache
        refetchInterval: 24 * 60 * 60 * 1000,  // Daily refresh
        retry: 2,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ['oil-price', 'wti', timeRange],
        queryFn: () => getOilPrice(FRED_WTI_SERIES, timeRange),
        staleTime: 24 * 60 * 60 * 1000,
        gcTime: 7 * 24 * 60 * 60 * 1000,
        refetchInterval: 24 * 60 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    ],
  });

  return {
    brent: queries[0].data,
    wti: queries[1].data,
    isLoading: queries.some(q => q.isLoading),
    isFetching: queries.some(q => q.isFetching),
    errors: queries.map(q => q.error).filter(Boolean),
  };
}