import { useQuery } from '@tanstack/react-query';
import { getFedWatch } from '../api/fedwatch';

/** FOMC 日历 hook. 前端 staleTime 10min(倒计时刷新), 后端 1h 缓存日程。 */
export function useFedWatch() {
  const query = useQuery({
    queryKey: ['fedwatch'],
    queryFn: async () => getFedWatch(),
    staleTime: 10 * 60 * 1000,  // 10 min - 倒计时需要相对新鲜
    gcTime: 7 * 24 * 60 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
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
