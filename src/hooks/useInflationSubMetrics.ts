import { useQueries } from '@tanstack/react-query';
import { useDashboardStore } from '../stores/dashboardStore';
import { fetchBLSSeries } from '../api/bls';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';

// BLS CPI component series IDs (verified from BLS API)
const CPI_COMPONENT_SERIES = {
  CORE_CPI: 'CUSR0000SAC',           // Core CPI (ex food/energy)
  FOOD: 'CUSR0000SAF',               // Food CPI
  ENERGY: 'CUSR0000SA0E',            // Energy CPI
  MEDICAL: 'CUSR0000SAM',            // Medical care CPI
} as const;

interface BLSSeriesData {
  seriesId: string;
  data: Array<{ timestamp: Date; value: number }>;
}

/**
 * Hook for fetching CPI component series (core CPI, food, energy, medical).
 * CRITICAL: 30-min stale time to protect BLS quota (25 calls/day).
 * Gracefully handles missing series by returning available data only.
 */
export function useInflationSubMetrics() {
  const timeRange = useDashboardStore((state) => state.timeRange);

  return useQueries({
    queries: [
      {
        queryKey: ['bls', 'cpi-components', timeRange],
        queryFn: async () => {
          const seriesIds = Object.values(CPI_COMPONENT_SERIES);
          const data: Record<string, BLSSeriesData> = await fetchBLSSeries(seriesIds, timeRange);

          // Normalize to NormalizedIndicator format
          const indicators: NormalizedIndicator[] = [];

          // Core CPI
          const coreData = data[CPI_COMPONENT_SERIES.CORE_CPI];
          if (coreData && coreData.data.length > 0) {
            const historical: HistoricalDataPoint[] = coreData.data.map(d => ({
              timestamp: d.timestamp,
              value: d.value,
            }));
            const current = historical[historical.length - 1];

            indicators.push({
              id: 'core-cpi',
              name: '核心CPI (不含食品能源)',
              value: current?.value ?? 0,
              unit: 'index',
              timestamp: current?.timestamp ?? new Date(),
              historical,
            });
          }

          // Food CPI
          const foodData = data[CPI_COMPONENT_SERIES.FOOD];
          if (foodData && foodData.data.length > 0) {
            const historical: HistoricalDataPoint[] = foodData.data.map(d => ({
              timestamp: d.timestamp,
              value: d.value,
            }));
            const current = historical[historical.length - 1];

            indicators.push({
              id: 'cpi-food',
              name: 'CPI: 食品',
              value: current?.value ?? 0,
              unit: 'index',
              timestamp: current?.timestamp ?? new Date(),
              historical,
            });
          }

          // Energy CPI
          const energyData = data[CPI_COMPONENT_SERIES.ENERGY];
          if (energyData && energyData.data.length > 0) {
            const historical: HistoricalDataPoint[] = energyData.data.map(d => ({
              timestamp: d.timestamp,
              value: d.value,
            }));
            const current = historical[historical.length - 1];

            indicators.push({
              id: 'cpi-energy',
              name: 'CPI: 能源',
              value: current?.value ?? 0,
              unit: 'index',
              timestamp: current?.timestamp ?? new Date(),
              historical,
            });
          }

          // Medical CPI
          const medicalData = data[CPI_COMPONENT_SERIES.MEDICAL];
          if (medicalData && medicalData.data.length > 0) {
            const historical: HistoricalDataPoint[] = medicalData.data.map(d => ({
              timestamp: d.timestamp,
              value: d.value,
            }));
            const current = historical[historical.length - 1];

            indicators.push({
              id: 'cpi-medical',
              name: 'CPI: 医疗',
              value: current?.value ?? 0,
              unit: 'index',
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
      const firstResult = results[0];
      return {
        data: firstResult?.data ?? [],
        isLoading: firstResult?.isLoading ?? false,
        error: firstResult?.error,
      };
    },
  });
}