import { useQuery, useQueries } from '@tanstack/react-query';
import { getChineseIndices, getChineseIndexHistory } from '../api/eastmoney';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';

/**
 * TanStack Query hook for Chinese A-share indices data
 */
export function useChineseIndices() {
  return useQuery({
    queryKey: ['chinese-indices'],
    queryFn: getChineseIndices,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for Chinese A-share index historical data (近一年)
 */
export function useChineseIndicesWithHistory() {
  const indicesQuery = useChineseIndices();

  // 获取每个指数的历史数据
  const historyQueries = useQueries({
    queries: (indicesQuery.data || []).map((index) => ({
      queryKey: ['chinese-index-history', index.id],
      queryFn: () => getChineseIndexHistory(index.id, 365),
      staleTime: 60 * 60 * 1000,
      gcTime: 2 * 60 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: indicesQuery.data !== undefined,
    })),
  });

  // 合并当前数据和历史数据
  const combinedData: NormalizedIndicator[] = indicesQuery.data?.map((index, i) => ({
    ...index,
    historical: historyQueries[i].data || [],
  })) || [];

  const isLoading = indicesQuery.isLoading || historyQueries.some(q => q.isLoading);
  const hasHistoryError = historyQueries.some(q => q.isError);
  const error = indicesQuery.error || (hasHistoryError ? new Error('部分历史数据加载失败') : null);

  return {
    data: combinedData,
    isLoading,
    error,
    dataUpdatedAt: indicesQuery.dataUpdatedAt,
  };
}