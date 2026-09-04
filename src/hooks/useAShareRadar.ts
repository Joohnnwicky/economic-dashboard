import { useQuery } from '@tanstack/react-query';
import { getAShareRadar, AShareRadarData } from '../api/tushare-backend';

/**
 * Hook for fetching the A-share watchlist radar (Tushare):
 * valuation + fundamentals + risk events (pledge / share float / block trades / dragon-tiger).
 */
export function useAShareRadar(codes: string[]) {
  const query = useQuery<AShareRadarData>({
    queryKey: ['a-share-radar', [...codes].sort().join(',')],
    queryFn: () => getAShareRadar(codes),
    staleTime: 30 * 60 * 1000,   // matches backend 30min TTL
    gcTime: 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: codes.length > 0,
  });

  return {
    stocks: query.data?.stocks ?? [],
    errors: query.data?.errors ?? {},
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}
