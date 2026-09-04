import { useQuery } from '@tanstack/react-query';
import { getTrackedUSStocks } from '../api/us-stocks';
import { intervalByMarket, isUsMarketOpen } from '../utils/marketHours';

/**
 * Hook for tracking US stocks (Mag 7 + Semiconductor + SpaceX)
 *
 * 数据来源：腾讯日K（后端代理，5分钟缓存）
 * 国内稳定、无 key、无配额限制，后端并发获取全部 18 只股票
 * 美股交易时段 5min 刷新；休市退到 1 小时低频兜底。
 */
export function useUSStocks() {
  return useQuery({
    queryKey: ['us-stocks-tracked'],
    queryFn: getTrackedUSStocks,
    staleTime: 5 * 60 * 1000,           // 5分钟（匹配后端缓存）
    gcTime: 30 * 60 * 1000,            // 30分钟
    refetchInterval: intervalByMarket(isUsMarketOpen, 5 * 60 * 1000, 60 * 60 * 1000),
    retry: 2,
    refetchOnWindowFocus: true,        // 无配额压力，可以刷新
  });
}
