import { useQuery } from '@tanstack/react-query';
import { getChineseIndices } from '../api/eastmoney';

/**
 * TanStack Query hook for Chinese A-share indices data
 *
 * Cache configuration:
 * - staleTime: 60 minutes (3600000ms) - data remains fresh for 60 min
 * - gcTime: 2 hours (7200000ms) - garbage collection after 2 hours
 * - retry: 2 - retry failed requests twice
 * - refetchOnWindowFocus: false - do not refetch when window regains focus
 *
 * Per RESEARCH.md, East Money is unofficial API. 60-minute cache prevents
 * quota exhaustion and reduces risk of endpoint changes breaking during session.
 */
export function useChineseIndices() {
  return useQuery({
    queryKey: ['chinese-indices'],
    queryFn: getChineseIndices,
    staleTime: 60 * 60 * 1000,  // 60 minutes (matches cacheTtlMs from rate limiter)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours garbage collection
    retry: 2,
    refetchOnWindowFocus: false,
  });
}