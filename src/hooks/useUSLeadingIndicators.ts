import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getIsmPmi, getMichiganSentiment } from '../api/fred-market';
import { NormalizedIndicator } from '../types/indicator';
import { useDashboardStore } from '../stores/dashboardStore';

export interface USLeadingIndicators {
  pmi: NormalizedIndicator | null;
  sentiment: NormalizedIndicator | null;
}

/**
 * Hook for fetching US leading indicators (ISM Manufacturing PMI + Michigan Consumer Sentiment).
 * Both monthly FRED series, fetched in parallel. 单项失败返回 null 不影响另一项。
 * staleTime 1h。
 */
export function useUSLeadingIndicators() {
  const timeRange = useDashboardStore((state) => state.timeRange);

  const query = useQuery({
    queryKey: ['us-leading', timeRange],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<USLeadingIndicators> => {
      const [pmiRes, sentimentRes] = await Promise.allSettled([
        getIsmPmi(timeRange),
        getMichiganSentiment(timeRange),
      ]);
      return {
        pmi: pmiRes.status === 'fulfilled' ? pmiRes.value : null,
        sentiment: sentimentRes.status === 'fulfilled' ? sentimentRes.value : null,
      };
    },
    staleTime: 60 * 60 * 1000,  // 1 hour
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
