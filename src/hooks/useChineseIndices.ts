import { useQuery } from '@tanstack/react-query';
import { getChineseIndices } from '../api/eastmoney';
import { intervalByMarket, isAshareMarketOpen } from '../utils/marketHours';

/**
 * TanStack Query hook for Chinese A-share indices data
 * 交易时段每小时刷新；休市退到 6 小时低频兜底。
 */
export function useChineseIndices() {
  return useQuery({
    queryKey: ['chinese-indices'],
    queryFn: getChineseIndices,
    staleTime: 60 * 60 * 1000,           // 1 hour - data considered fresh
    gcTime: 2 * 60 * 60 * 1000,          // Keep in cache 2 hours
    refetchInterval: intervalByMarket(isAshareMarketOpen, 60 * 60 * 1000, 6 * 60 * 60 * 1000),
    retry: 2,
    refetchOnWindowFocus: false,
  });
}