import { useQuery } from '@tanstack/react-query';
import { getTrendingMarkets, formatMarketData } from '../api/polymarket';

export function usePolymarketTrending(limit: number = 10) {
  const query = useQuery({
    queryKey: ['polymarket', 'trending', limit],
    queryFn: async () => {
      const markets = await getTrendingMarkets(limit);
      return markets.map(formatMarketData);
    },
    staleTime: 60 * 60 * 1000,  // 1 hour
    gcTime: 6 * 60 * 60 * 1000, // 6 hours
    refetchInterval: 60 * 60 * 1000,  // Hourly refresh
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    markets: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}