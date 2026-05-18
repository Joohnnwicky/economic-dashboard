import { useQuery } from '@tanstack/react-query';
import { getFOMCTargetRates } from '../api/fred-extended';
import { downsampleData } from '../utils/downsampling';
import { TimeRange } from '../types/api';

export function useFOMCTargetRates(timeRange: TimeRange = '1Y') {
  const query = useQuery({
    queryKey: ['fomc-target-rates', timeRange],
    queryFn: async () => {
      const data = await getFOMCTargetRates(timeRange);
      if (data.historical.length > 365) {
        data.historical = downsampleData(data.historical, 365);
      }
      return data;
    },
    staleTime: 5 * 60 * 1000, // FOMC decisions infrequent
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    isPending: query.isFetching,
  };
}