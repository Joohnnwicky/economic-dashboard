import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getYieldSpread, getRecessionFlag } from '../api/fred-market';
import { NormalizedIndicator } from '../types/indicator';
import { useDashboardStore } from '../stores/dashboardStore';

export interface YieldSpreadHistory {
  spread: NormalizedIndicator | null;
  recession: NormalizedIndicator | null;
}

/**
 * Hook for fetching 10Y-2Y yield spread (T10Y2Y) + NBER recession flag (USREC).
 * 用于利差历史图 + 衰退期阴影。parallel fetch, 单项失败返 null。staleTime 1h。
 */
export function useYieldSpreadHistory() {
  const timeRange = useDashboardStore((state) => state.timeRange);

  const query = useQuery({
    queryKey: ['yield-spread-history', timeRange],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<YieldSpreadHistory> => {
      const [spreadRes, recessionRes] = await Promise.allSettled([
        getYieldSpread(timeRange),
        getRecessionFlag(timeRange),
      ]);
      return {
        spread: spreadRes.status === 'fulfilled' ? spreadRes.value : null,
        recession: recessionRes.status === 'fulfilled' ? recessionRes.value : null,
      };
    },
    staleTime: 60 * 60 * 1000,
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
