import { useQuery } from '@tanstack/react-query';
import { getDefenseSector, DefenseSectorData } from '../api/tushare-backend';

/**
 * Hook for fetching defense sector index vs SSE Composite from Tushare:
 * CSI Defense (399967.SZ) and SSE Composite (000001.SH) daily closes.
 */
export function useDefenseSector() {
  const query = useQuery<DefenseSectorData>({
    queryKey: ['defense-sector'],
    queryFn: getDefenseSector,
    staleTime: 60 * 60 * 1000,  // matches backend 1h TTL
    gcTime: 6 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    series: query.data?.series ?? {},
    errors: query.data?.errors ?? {},
    isLoading: query.isLoading,
    error: query.error,
  };
}
