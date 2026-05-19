import { useQuery } from '@tanstack/react-query';
import { getBatchStockQuotes } from '../api/stock-backend';
import { useCustomStocksStore } from '../stores/customStocksStore';

/**
 * Hook for fetching all custom stocks' quotes in parallel.
 * Gets the stock codes from the Zustand store and fetches their quotes.
 */
export function useCustomStockQuotes() {
  const stocks = useCustomStocksStore((state) => state.stocks);
  const codes = stocks.map((s) => s.code);

  const query = useQuery({
    queryKey: ['custom-stock-quotes', codes],
    queryFn: () => getBatchStockQuotes(codes),
    staleTime: 60 * 1000,  // 1 minute for real-time data
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,  // Auto-refresh every minute
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: codes.length > 0,
  });

  return {
    quotes: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}