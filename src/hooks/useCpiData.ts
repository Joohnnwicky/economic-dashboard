import { useQuery } from '@tanstack/react-query';
import { getCPI } from '../api/fred';
import { downsampleData } from '../utils/downsampling';
import { TimeRange } from '../types/api';

export function useCpiData(timeRange: TimeRange = '1Y') {
  const query = useQuery({
    queryKey: ['cpi', timeRange],
    queryFn: async () => {
      const data = await getCPI(timeRange);
      if (data.historical.length > 365) {
        data.historical = downsampleData(data.historical, 365);
      }
      return data;
    },
    staleTime: 30 * 60 * 1000,  // CPI updates monthly, cache 30 min
    gcTime: 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    isPending: query.isFetching,
  };
}