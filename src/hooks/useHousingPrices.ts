import { useQuery } from '@tanstack/react-query';
import { getHousingPrices } from '../api/housing-price';

export function useHousingPrices() {
  return useQuery({
    queryKey: ['housing-prices'],
    queryFn: getHousingPrices,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - data updates daily
    gcTime: 24 * 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000, // Check every hour for updates
    refetchOnWindowFocus: false,
  });
}