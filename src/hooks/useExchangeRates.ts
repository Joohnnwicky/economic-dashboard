import { useQuery, useQueries } from '@tanstack/react-query';
import { getLatestExchangeRates, getAllExchangeRates } from '../api/exchange-rates';
import { TimeRange } from '../types/api';
import { useDashboardStore } from '../stores/dashboardStore';

export function useExchangeRates() {
  const timeRange = useDashboardStore((state) => state.timeRange);

  // Latest rates (real-time)
  const latestQuery = useQuery({
    queryKey: ['exchange-rates', 'latest'],
    queryFn: getLatestExchangeRates,
    staleTime: 60 * 60 * 1000,  // 1 hour
    gcTime: 24 * 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Historical data for charts
  const historicalQueries = useQueries({
    queries: [
      {
        queryKey: ['exchange-rates', 'EUR', timeRange],
        queryFn: () => getAllExchangeRates(timeRange),
        staleTime: 60 * 60 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    ],
  });

  const historicalData = historicalQueries[0].data;

  return {
    latest: latestQuery.data,
    historical: historicalData,
    isLoading: latestQuery.isLoading || historicalQueries.some(q => q.isLoading),
    isFetching: latestQuery.isFetching,
    error: latestQuery.error || historicalQueries.find(q => q.error)?.error,
  };
}