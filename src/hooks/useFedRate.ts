import { useQuery } from '@tanstack/react-query';
import { getFedRate } from '../api/fred';
import { downsampleData } from '../utils/downsampling';
import { TimeRange } from '../types/api';

export function useFedRate(timeRange: TimeRange = '1Y') {
  const query = useQuery({
    queryKey: ['fed-rate', timeRange],
    queryFn: async () => {
      const data = await getFedRate(timeRange);
      if (data.historical.length > 365) {
        data.historical = downsampleData(data.historical, 365);
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    isPending: query.isFetching,
  };
}