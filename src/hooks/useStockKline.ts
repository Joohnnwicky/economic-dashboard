import { useQuery } from '@tanstack/react-query';
import { getStockKline } from '../api/stock-backend';

/**
 * Hook for fetching stock historical K-line data
 * @param code - Stock code (e.g., '600519')
 * @param period - K-line period: 'daily', 'weekly', or 'monthly'
 * @param limit - Number of data points (default 365, max 1000)
 */
export function useStockKline(
  code: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  limit: number = 365
) {
  return useQuery({
    queryKey: ['stock-kline', code, period, limit],
    queryFn: () => getStockKline(code, period, limit),
    staleTime: 60 * 60 * 1000,  // 1 hour (historical data updates slowly)
    gcTime: 24 * 60 * 60 * 1000,  // 24 hours
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!code,  // Only run if code is provided
  });
}