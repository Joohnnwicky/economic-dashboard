import { useQuery } from '@tanstack/react-query';
import { getVix } from '../api/fred-market';
import { useDashboardStore } from '../stores/dashboardStore';

/**
 * Hook for fetching VIX (CBOE Volatility Index) from FRED.
 * Series: VIXCLS - daily close. staleTime 1h (FRED 后端缓存 5-15min, 前端避免重复请求)。
 */
export function useVix() {
  const timeRange = useDashboardStore((state) => state.timeRange);

  const query = useQuery({
    queryKey: ['vix', timeRange],
    queryFn: async () => {
      const data = await getVix(timeRange);
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
