import { useQuery } from '@tanstack/react-query';
import { getBatchStockQuotes } from '../api/stock-backend';
import { useCustomStocksStore } from '../stores/customStocksStore';
import { intervalByMarket, isAshareMarketOpen } from '../utils/marketHours';

/**
 * Hook for fetching all custom stocks' quotes in parallel.
 * Gets the stock codes from the Zustand store and fetches their quotes.
 * 交易时段 5s 近实时刷新（后端一次批量 TDX 请求）；休市退到 10min 低频兜底。
 * 轮询期间 react-query 保留上次数据，面板原地更新数字，不清空不转圈。
 */
export function useCustomStockQuotes() {
  const stocks = useCustomStocksStore((state) => state.stocks);
  const codes = stocks.map((s) => s.code);

  const query = useQuery({
    queryKey: ['custom-stock-quotes', codes],
    queryFn: () => getBatchStockQuotes(codes),
    staleTime: 5 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: intervalByMarket(isAshareMarketOpen, 5 * 1000, 10 * 60 * 1000),
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