import { useQuery } from '@tanstack/react-query';
import { getChinaRates, ChinaRatesData } from '../api/tushare-backend';

/**
 * Hook for fetching China interest rates from Tushare:
 * SHIBOR (O/N, 3M, 1Y) and LPR (1Y, 5Y) historical series.
 */
export function useChinaRates() {
  const query = useQuery<ChinaRatesData>({
    queryKey: ['china-rates-tushare'],
    queryFn: getChinaRates,
    staleTime: 6 * 60 * 60 * 1000,  // matches backend 6h TTL
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    series: query.data?.series ?? {},
    errors: query.data?.errors ?? {},
    isLoading: query.isLoading,
    error: query.error,
  };
}
