import { useQuery } from '@tanstack/react-query';
import { searchStocks } from '../api/stock-backend';

/**
 * Hook for searching stocks by name or code
 * @param keyword - Search keyword (minimum 1 character)
 */
export function useStockSearch(keyword: string) {
  return useQuery({
    queryKey: ['stock-search', keyword],
    queryFn: () => searchStocks(keyword),
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 1,
    enabled: keyword.length >= 1,  // Only search if keyword has content
    refetchOnWindowFocus: false,
  });
}