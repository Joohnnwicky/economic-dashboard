import { useQuery } from '@tanstack/react-query';
import { getEconomicCalendar } from '../api/economic-calendar';

/** 经济日历 hook. 后端 1h 缓存, 前端 staleTime 1h。 */
export function useEconomicCalendar() {
  const query = useQuery({
    queryKey: ['economic-calendar'],
    queryFn: async () => getEconomicCalendar(),
    staleTime: 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}
