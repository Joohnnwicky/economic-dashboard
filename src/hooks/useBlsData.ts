import { useQuery } from '@tanstack/react-query';
import { useDashboardStore } from '../stores/dashboardStore';
import { getEmploymentData, getInflationData } from '../api/bls';

// Hook for Employment data (NFP + Unemployment Rate)
// CRITICAL: 30-min stale time to protect BLS quota (25 calls/day)
export function useEmploymentData() {
  const timeRange = useDashboardStore((state) => state.timeRange);

  return useQuery({
    queryKey: ['employment', timeRange],
    queryFn: async () => {
      return getEmploymentData(timeRange);
    },
    staleTime: 30 * 60 * 1000,       // 30 minutes - CRITICAL for quota
    gcTime: 60 * 60 * 1000,          // Keep in cache 1 hour
    // NO refetchInterval - employment updates monthly, save quota!
    retry: 1,                        // Fewer retries to save quota
    refetchOnWindowFocus: false,     // Don't waste quota on tab switch
  });
}

// Hook for Inflation data (CPI)
// CRITICAL: 30-min stale time to protect BLS quota (25 calls/day)
export function useInflationData() {
  const timeRange = useDashboardStore((state) => state.timeRange);

  return useQuery({
    queryKey: ['inflation', timeRange],
    queryFn: async () => {
      return getInflationData(timeRange);
    },
    staleTime: 30 * 60 * 1000,       // 30 minutes - CRITICAL
    gcTime: 60 * 60 * 1000,
    // NO refetchInterval - CPI updates monthly
    retry: 1,
    refetchOnWindowFocus: false,
  });
}