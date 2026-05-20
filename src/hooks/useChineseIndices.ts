import { useQuery } from '@tanstack/react-query';
import { getChineseIndices } from '../api/eastmoney';

/**
 * TanStack Query hook for Chinese A-share indices data
 */
export function useChineseIndices() {
  return useQuery({
    queryKey: ['chinese-indices'],
    queryFn: getChineseIndices,
    staleTime: 60 * 60 * 1000,           // 1 hour - data considered fresh
    gcTime: 2 * 60 * 60 * 1000,          // Keep in cache 2 hours
    refetchInterval: 60 * 60 * 1000,     // Auto-refresh every 1 hour
    retry: 2,
    refetchOnWindowFocus: false,
  });
}