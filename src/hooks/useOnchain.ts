import { useQuery } from '@tanstack/react-query';
import { getOnchain } from '../api/onchain';

/**
 * Hook for fetching BTC on-chain data (hashrate/fees/difficulty).
 * 后端 30min 缓存, 前端 staleTime 30min。
 */
export function useOnchain() {
  const query = useQuery({
    queryKey: ['onchain'],
    queryFn: async () => {
      const data = await getOnchain();
      return data;
    },
    staleTime: 30 * 60 * 1000,  // 30 min
    gcTime: 7 * 24 * 60 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
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
