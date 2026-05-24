import axios from 'axios';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';

interface ChinaMacroData {
  seriesId: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  historical: HistoricalDataPoint[];
  yoyChange?: number;
}

interface ChinaMacroResponse {
  gdp: ChinaMacroData | null;
  cpi: ChinaMacroData | null;
  ppi: ChinaMacroData | null;
  m2: ChinaMacroData | null;
}

/**
 * Fetch China macro indicators from Python backend (AkShare)
 */
export async function getChinaMacroFromBackend(): Promise<ChinaMacroResponse> {
  const response = await axios.get<ChinaMacroResponse>('/api/backend/china-macro');
  return response.data;
}

/**
 * Convert backend data to NormalizedIndicator format
 */
export function chinaMacroBackendToNormalized(data: ChinaMacroData): NormalizedIndicator {
  const historical: HistoricalDataPoint[] = data.historical.map(h => ({
    timestamp: new Date(h.timestamp),
    value: h.value,
  }));

  return {
    id: `china-${data.seriesId}`,
    name: data.name,
    value: data.value,
    unit: data.unit,
    timestamp: new Date(data.timestamp),
    change: data.yoyChange !== undefined ? {
      value: data.value * (data.yoyChange / 100),
      percentage: data.yoyChange,
      period: 'yearly' as const,
    } : undefined,
    historical,
  };
}