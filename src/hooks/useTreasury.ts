import { useQuery } from '@tanstack/react-query';
import { getTreasuryYields, calculateYieldCurveSpread } from '../api/treasury';
import { TimeRange } from '../types/api';

/**
 * Hook for fetching US Treasury yields from FRED
 * Returns 10Y, 2Y, 30Y, 3MO yields and yield curve spread
 */
export function useTreasuryYields(timeRange: TimeRange = '1Y') {
  const query = useQuery({
    queryKey: ['treasury-yields', timeRange],
    queryFn: async () => {
      const yields = await getTreasuryYields(timeRange);
      const spread = calculateYieldCurveSpread(yields.dgs10, yields.dgs2);
      return { ...yields, spread };
    },
    staleTime: 24 * 60 * 60 * 1000,  // 24 hours - daily updates
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache
    refetchInterval: 24 * 60 * 60 * 1000,  // Daily refresh
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    dgs10: query.data?.dgs10,
    dgs2: query.data?.dgs2,
    dgs30: query.data?.dgs30,
    dgs3mo: query.data?.dgs3mo,
    spread: query.data?.spread,
    isLoading: query.isLoading,
    error: query.error,
  };
}