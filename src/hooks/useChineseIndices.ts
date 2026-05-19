import { useQuery } from '@tanstack/react-query';
import { getChineseIndices } from '../api/eastmoney';

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