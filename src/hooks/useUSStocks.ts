import { useQuery } from '@tanstack/react-query';
import { getTrackedUSStocks } from '../api/us-stocks';

/**
 * Hook for tracking US stocks (Mag 7 + Semiconductor + SpaceX proxy)
 *
 * 数据来源：Alpha Vantage（后端代理，1小时缓存）
 * 配额：25次/天。后端缓存意味着每股每小时最多调1次。
 * 11只股票 × 每天2次完整刷新 = 22次/天，刚好在配额内。
 */
export function useUSStocks() {
  return useQuery({
    queryKey: ['us-stocks-tracked'],
    queryFn: getTrackedUSStocks,
    staleTime: 60 * 60 * 1000,        // 1小时（后端也缓存1小时）
    gcTime: 4 * 60 * 60 * 1000,       // 4小时
    refetchInterval: 60 * 60 * 1000,  // 每小时刷新一次
    retry: 1,
    refetchOnWindowFocus: false,      // 切换标签页不重拉，省配额
  });
}
