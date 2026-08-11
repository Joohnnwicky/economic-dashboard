import { useQuery } from '@tanstack/react-query';
import { getMarketDominance } from '../api/market-dominance';

/**
 * Hook for fetching crypto market dominance + altcoin season index.
 * 后端 1h 缓存, 前端 staleTime 1h。
 */
export function useMarketDominance() {
  const query = useQuery({
    queryKey: ['market-dominance'],
    queryFn: async () => {
      const data = await getMarketDominance();
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
