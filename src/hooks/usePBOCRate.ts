import { useQuery } from '@tanstack/react-query';
import { NormalizedIndicator } from '../types/indicator';

interface PBOCRateEntry {
  date: string;
  rate: number;
  type: string;
}

interface PBOCRates {
  lpr: NormalizedIndicator;
  omo7d: NormalizedIndicator;
}

/**
 * Fetches PBOC historical rate data from static JSON file
 * Supports both LPR-1Y and OMO-7D rate types
 */
async function fetchPBOCRates(): Promise<PBOCRates> {
  const response = await fetch('/data/pboc-rates.json');
  const data: PBOCRateEntry[] = await response.json();

  // Filter and sort by type
  const lprEntries = data
    .filter(e => e.type === 'LPR-1Y')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const omoEntries = data
    .filter(e => e.type === 'OMO-7D')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const latestLpr = lprEntries[lprEntries.length - 1];
  const latestOmo = omoEntries[omoEntries.length - 1];

  return {
    lpr: {
      id: 'pboc-lpr',
      name: 'LPR 1年期',
      value: latestLpr.rate,
      unit: '%',
      timestamp: new Date(latestLpr.date),
      historical: lprEntries.map(e => ({ timestamp: new Date(e.date), value: e.rate })),
    },
    omo7d: {
      id: 'pboc-omo-7d',
      name: '7天逆回购',
      value: latestOmo.rate,
      unit: '%',
      timestamp: new Date(latestOmo.date),
      historical: omoEntries.map(e => ({ timestamp: new Date(e.date), value: e.rate })),
    },
  };
}

/**
 * TanStack Query hook for PBOC rate data (LPR + OMO)
 */
export function usePBOCRate() {
  return useQuery({
    queryKey: ['pboc-rates'],
    queryFn: fetchPBOCRates,
    staleTime: 24 * 60 * 60 * 1000,  // 24 hours
    gcTime: Infinity,
    refetchOnMount: true,
    retry: false,
  });
}
