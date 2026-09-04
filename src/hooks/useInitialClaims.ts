import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getInitialClaims } from '../api/fred-market';
import { useDashboardStore } from '../stores/dashboardStore';

/**
 * Hook for fetching Initial Jobless Claims (ICSA) from FRED.
 * Series: ICSA - weekly, in thousands. staleTime 1h。
 */
export function useInitialClaims() {
  const timeRange = useDashboardStore((state) => state.timeRange);

  const query = useQuery({
    queryKey: ['initial-claims', timeRange],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const data = await getInitialClaims(timeRange);
      return data;
    },
    staleTime: 60 * 60 * 1000,  // 1 hour
    gcTime: 7 * 24 * 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
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
