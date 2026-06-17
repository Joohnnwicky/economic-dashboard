import { useQuery } from '@tanstack/react-query';
import { getTrackedUSStocks } from '../api/us-stocks';

/**
 * Hook for tracking US stocks (Mag 7 + Semiconductor + SpaceX)
 *
 * 数据来源：yfinance（后端代理，5分钟缓存）
 * 无日配额限制，后端一次获取全部 11 只股票
 */
export function useUSStocks() {
  return useQuery({
    queryKey: ['us-stocks-tracked'],
    queryFn: getTrackedUSStocks,
    staleTime: 5 * 60 * 1000,           // 5分钟（匹配后端缓存）
    gcTime: 30 * 60 * 1000,            // 30分钟
    refetchInterval: 5 * 60 * 1000,    // 5分钟自动刷新
    retry: 2,
    refetchOnWindowFocus: true,        // 无配额压力，可以刷新
  });
}
