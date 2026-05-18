import { useQueries } from '@tanstack/react-query';
import { useDashboardStore } from '../stores/dashboardStore';
import { fetchBLSSeries } from '../api/bls';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';

// BLS series IDs for employment sub-metrics
const EMPLOYMENT_SUB_SERIES = {
  LABOR_PARTICIPATION: 'LNS11300000',     // Labor force participation rate (%) - CORRECT series ID
  WAGE_GROWTH: 'CES0500000003',           // Average hourly earnings (USD)
} as const;

interface BLSSeriesData {
  seriesId: string;
  data: Array<{ timestamp: Date; value: number }>;
}

/**
 * Hook for fetching employment sub-metrics (labor participation rate, wage growth).
 * CRITICAL: 30-min stale time to protect BLS quota (25 calls/day).
 */
export function useEmploymentSubMetrics() {
  const timeRange = useDashboardStore((state) => state.timeRange);

  return useQueries({
    queries: [
      {
        queryKey: ['bls', 'labor-participation', timeRange],
        queryFn: async () => {
          const seriesIds = [EMPLOYMENT_SUB_SERIES.LABOR_PARTICIPATION, EMPLOYMENT_SUB_SERIES.WAGE_GROWTH];
          const data: Record<string, BLSSeriesData> = await fetchBLSSeries(seriesIds, timeRange);

          // Normalize to NormalizedIndicator format
          const indicators: NormalizedIndicator[] = [];

          // Labor participation rate
          const laborData = data[EMPLOYMENT_SUB_SERIES.LABOR_PARTICIPATION];
          if (laborData && laborData.data.length > 0) {
            const historical: HistoricalDataPoint[] = laborData.data.map(d => ({
              timestamp: d.timestamp,
              value: d.value,
            }));
            const current = historical[historical.length - 1];

            indicators.push({
              id: 'labor-participation',
              name: '劳动参与率',
              value: current?.value ?? 0,
              unit: '%',
              timestamp: current?.timestamp ?? new Date(),
              historical,
            });
          }

          // Wage growth (average hourly earnings)
          const wageData = data[EMPLOYMENT_SUB_SERIES.WAGE_GROWTH];
          if (wageData && wageData.data.length > 0) {
            const historical: HistoricalDataPoint[] = wageData.data.map(d => ({
              timestamp: d.timestamp,
              value: d.value,
            }));
            const current = historical[historical.length - 1];

            indicators.push({
              id: 'wage-growth',
              name: '平均小时工资同比增长',
              value: current?.value ?? 0,
              unit: 'USD',
              timestamp: current?.timestamp ?? new Date(),
              historical,
            });
          }

          return indicators;
        },
        staleTime: 30 * 60 * 1000,       // 30 minutes - CRITICAL for quota
        gcTime: 60 * 60 * 1000,          // Keep in cache 1 hour
        retry: 1,                        // Fewer retries to save quota
        refetchOnWindowFocus: false,     // Don't waste quota on tab switch
      },
    ],
    combine: (results) => {
      const [firstResult] = results;
      return {
        data: firstResult?.data ?? [],
        isLoading: firstResult?.isLoading ?? false,
        error: firstResult?.error,
      };
    },
  });
}