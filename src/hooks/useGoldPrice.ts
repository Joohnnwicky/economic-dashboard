import { useQuery } from '@tanstack/react-query';
import { getGoldETFData } from '../api/alphavantage';

/**
 * Hook for fetching Gold price data via GLD ETF
 * GLD ETF (SPDR Gold Shares) tracks gold spot price
 * Alpha Vantage API - uses existing quota (25 calls/day)
 */
export function useGoldPrice() {
  const query = useQuery({
    queryKey: ['gold-price', 'gld'],
    queryFn: async () => {
      const data = await getGoldETFData();
      return data;
    },
    staleTime: 24 * 60 * 60 * 1000,  // 24 hours - daily updates
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache
    refetchInterval: 24 * 60 * 60 * 1000,  // Daily refresh
    retry: 0,  // Don't retry on quota limit - show error immediately
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}