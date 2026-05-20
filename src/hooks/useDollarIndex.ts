import { useQuery } from '@tanstack/react-query';
import { getDollarIndex } from '../api/forex';
import { TimeRange } from '../types/api';
import { useDashboardStore } from '../stores/dashboardStore';

/**
 * Hook for fetching US Dollar Index (DXY) data
 * Uses FRED API series DTWEXBGS
 */
export function useDollarIndex() {
  const timeRange = useDashboardStore((state) => state.timeRange);

  const query = useQuery({
    queryKey: ['dollar-index', timeRange],
    queryFn: async () => {
      const data = await getDollarIndex(timeRange);
      return data;
    },
    staleTime: 24 * 60 * 60 * 1000,  // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache
    refetchInterval: 24 * 60 * 60 * 1000,  // Daily refresh
    retry: 2,
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