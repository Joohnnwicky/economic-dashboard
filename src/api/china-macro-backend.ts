import axios from 'axios';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';

export interface ChinaMacroData {
  seriesId: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  historical: HistoricalDataPoint[];
  yoyChange?: number;
  forecast?: number | null;
  previous?: number | null;
  source?: string;
}

export interface ChinaPMIGroup {
  nbs_mfg: ChinaMacroData | null;
  nbs_non_mfg: ChinaMacroData | null;
  caixin_mfg: ChinaMacroData | null;
  caixin_services: ChinaMacroData | null;
}

export interface ChinaTradeGroup {
  exports_yoy: ChinaMacroData | null;
  imports_yoy: ChinaMacroData | null;
  trade_balance: ChinaMacroData | null;
}

export interface ChinaCreditGroup {
  social_financing: ChinaMacroData | null;
  new_loans: ChinaMacroData | null;
}

export interface ChinaOtherGroup {
  fx_reserves: ChinaMacroData | null;
  industrial_production: ChinaMacroData | null;
}

export interface ChinaMacroResponse {
  gdp: ChinaMacroData | null;
  cpi: ChinaMacroData | null;
  ppi: ChinaMacroData | null;
  m2: ChinaMacroData | null;
  pmi: ChinaPMIGroup;
  trade: ChinaTradeGroup;
  credit: ChinaCreditGroup;
  other: ChinaOtherGroup;
  unemployment: ChinaMacroData | null;
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
    change: data.yoyChange !== undefined && data.yoyChange !== null ? {
      value: data.value * (data.yoyChange / 100),
      percentage: data.yoyChange,
      period: 'yearly' as const,
    } : undefined,
    historical,
  };
}
