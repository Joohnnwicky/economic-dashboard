import { useQuery } from '@tanstack/react-query';
import { getChinaMacroIndicators } from '../api/china-macro';
import { TimeRange } from '../types/api';

/**
 * Hook for fetching China macro economic indicators from FRED
 * Returns GDP, CPI, Industrial Production Index
 */
export function useChinaMacro(timeRange: TimeRange = '1Y') {
  const query = useQuery({
    queryKey: ['china-macro', timeRange],
    queryFn: async () => {
      return getChinaMacroIndicators(timeRange);
    },
    staleTime: 24 * 60 * 60 * 1000,  // 24 hours - quarterly/monthly updates
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    gdp: query.data?.gdp,
    cpi: query.data?.cpi,
    ip: query.data?.ip,
    isLoading: query.isLoading,
    error: query.error,
  };
}