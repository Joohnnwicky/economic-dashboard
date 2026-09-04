import { useQuery } from '@tanstack/react-query';
import { getAShareMargin, MarginData } from '../api/tushare-backend';

/**
 * Hook for fetching combined SSE+SZSE margin trading balance (两融余额) from Tushare.
 */
export function useAShareMargin() {
  const query = useQuery<MarginData>({
    queryKey: ['a-share-margin'],
    queryFn: getAShareMargin,
    staleTime: 6 * 60 * 60 * 1000,  // matches backend 6h TTL
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    series: query.data?.series ?? null,
    errors: query.data?.errors ?? {},
    isLoading: query.isLoading,
    error: query.error,
  };
}
