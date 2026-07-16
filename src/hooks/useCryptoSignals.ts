import { useQuery } from '@tanstack/react-query';
import { getCryptoSignals } from '../api/crypto-signals';

/** 加密牛熊信号 hook。后端 1h 缓存，前端 1h 轮询。 */
export function useCryptoSignals() {
  return useQuery({
    queryKey: ['crypto-signals'],
    queryFn: getCryptoSignals,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
