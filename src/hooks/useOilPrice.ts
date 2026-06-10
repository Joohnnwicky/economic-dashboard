import { useQuery } from '@tanstack/react-query';
import { getOilPriceFromBackend } from '../api/oil-backend';

export function useOilPrices() {
  const query = useQuery({
    queryKey: ['oil-price'],
    queryFn: () => getOilPriceFromBackend(),
    staleTime: 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    domestic: query.data?.domestic ?? null,
    international: query.data?.international ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}
