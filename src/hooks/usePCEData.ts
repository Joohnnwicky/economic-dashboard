import { useQueries } from '@tanstack/react-query';
import { useDashboardStore } from '../stores/dashboardStore';
import { getPCEData } from '../api/fred-extended';
import { NormalizedIndicator } from '../types/indicator';

/**
 * Hook for fetching PCE inflation data (overall and core PCE).
 * PCE is Fed's preferred inflation metric (more stable than CPI).
 * FRED数据月度更新，24小时缓存。
 */
export function usePCEData() {
  const timeRange = useDashboardStore((state) => state.timeRange);

  return useQueries({
    queries: [
      {
        queryKey: ['fred', 'PCEPI', timeRange],
        queryFn: () => getPCEData('PCEPI', timeRange),
        staleTime: 24 * 60 * 60 * 1000,       // 24小时（FRED数据月度更新）
        gcTime: 7 * 24 * 60 * 60 * 1000,         // 7天
        retry: 2,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ['fred', 'PCEPILFE', timeRange],
        queryFn: () => getPCEData('PCEPILFE', timeRange),
        staleTime: 5 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    ],
    combine: (results) => {
      return {
        data: results.map((r) => r.data).filter(Boolean) as NormalizedIndicator[],
        isLoading: results.some((r) => r.isLoading),
        error: results.find((r) => r.error)?.error,
      };
    },
  });
}