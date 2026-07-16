import { useQuery } from '@tanstack/react-query';
import { getCoinbasePremium } from '../api/coinbase';

/**
 * Coinbase 比特币溢价指数 hook。
 * 后端 60s 缓存，前端 1 分钟轮询。
 */
export function useCoinbasePremium() {
  return useQuery({
    queryKey: ['coinbase-btc-premium'],
    queryFn: getCoinbasePremium,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
