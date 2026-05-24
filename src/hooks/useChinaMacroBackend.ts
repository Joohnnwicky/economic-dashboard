import { useQuery } from '@tanstack/react-query';
import { getChinaMacroFromBackend } from '../api/china-macro-backend';

/**
 * Hook for fetching China macro economic indicators from Python backend (AkShare)
 * Returns GDP, CPI, PPI, M2
 */
export function useChinaMacro() {
  const query = useQuery({
    queryKey: ['china-macro-backend'],
    queryFn: async () => {
      return getChinaMacroFromBackend();
    },
    staleTime: 24 * 60 * 60 * 1000,  // 24 hours - quarterly/monthly updates
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    gdp: query.data?.gdp,
    cpi: query.data?.cpi,
    ppi: query.data?.ppi,
    m2: query.data?.m2,
    isLoading: query.isLoading,
    error: query.error,
  };
}