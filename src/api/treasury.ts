import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { FRED_BASE_URL, FRED_TREASURY_SERIES, RATE_LIMITS } from '../constants/api';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';
import { TimeRange } from '../types/api';
import { FredSeriesResponse } from './types';
import { parseUTCDate } from '../utils/utc';
import { format, subYears, subMonths, subDays } from 'date-fns';

function calculateStartDate(timeRange: TimeRange): Date {
  const now = new Date();
  switch (timeRange) {
    case '1D': return subDays(now, 1);
    case '1W': return subDays(now, 7);
    case '1M': return subMonths(now, 1);
    case '3M': return subMonths(now, 3);
    case '6M': return subMonths(now, 6);
    case '1Y': return subYears(now, 1);
    case 'ALL': return new Date(1990, 0, 1);  // Treasury data since 1990
    default: return subYears(now, 1);
  }
}

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

interface TreasuryYieldData {
  seriesId: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  historical: HistoricalDataPoint[];
}

const TREASURY_NAMES: Record<string, string> = {
  DGS10: '10年期国债收益率',
  DGS2: '2年期国债收益率',
  DGS30: '30年期国债收益率',
  DGS3MO: '3个月国债收益率',
};

/**
 * Fetch a single Treasury yield series from FRED
 */
export async function getTreasuryYield(seriesId: string, timeRange: TimeRange = '1Y'): Promise<TreasuryYieldData> {
  const apiKey = import.meta.env.VITE_FRED_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_FRED_API_KEY not set');
  }

  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);

  const url = `${FRED_BASE_URL}/series/observations?series_id=${seriesId}&api_key=${apiKey}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}&file_type=json`;

  return rateLimiter.call('FRED', async () => {
    const response = await axios.get<FredSeriesResponse>(url);

    if (!response.data?.observations) {
      throw new Error(`FRED Treasury response missing observations for ${seriesId}`);
    }

    const historical: HistoricalDataPoint[] = response.data.observations
      .filter((obs) => obs.value !== '.' && obs.value !== 'NaN')
      .map((obs) => ({
        timestamp: parseUTCDate(obs.date),
        value: parseFloat(obs.value),
      }));

    const current = historical[historical.length - 1];
    const previous = historical[historical.length - 2];

    // Calculate daily change
    let change = undefined;
    if (current && previous && previous.value !== null && current.value !== null) {
      const changeValue = current.value - previous.value;
      const changePct = previous.value !== 0 ? (changeValue / previous.value) * 100 : 0;
      change = {
        value: changeValue,
        percentage: changePct,
        period: 'daily' as const,
      };
    }

    return {
      seriesId,
      name: TREASURY_NAMES[seriesId] || seriesId,
      value: current?.value ?? 0,
      unit: '%',
      timestamp: current?.timestamp ?? new Date(),
      historical,
    };
  }, RATE_LIMITS.FRED);
}

/**
 * Fetch all four Treasury yields in parallel
 */
export async function getTreasuryYields(timeRange: TimeRange = '1Y'): Promise<{
  dgs10: TreasuryYieldData;
  dgs2: TreasuryYieldData;
  dgs30: TreasuryYieldData;
  dgs3mo: TreasuryYieldData;
}> {
  const [dgs10, dgs2, dgs30, dgs3mo] = await Promise.all([
    getTreasuryYield(FRED_TREASURY_SERIES.DGS10, timeRange),
    getTreasuryYield(FRED_TREASURY_SERIES.DGS2, timeRange),
    getTreasuryYield(FRED_TREASURY_SERIES.DGS30, timeRange),
    getTreasuryYield(FRED_TREASURY_SERIES.DGS3MO, timeRange),
  ]);

  return { dgs10, dgs2, dgs30, dgs3mo };
}

/**
 * Calculate yield curve spread (10Y - 2Y)
 * Positive = normal curve, Negative = inverted curve (recession signal)
 */
export function calculateYieldCurveSpread(dgs10: TreasuryYieldData, dgs2: TreasuryYieldData): number {
  return dgs10.value - dgs2.value;
}

/**
 * Convert Treasury data to NormalizedIndicator format for charts/export
 */
export function treasuryToNormalizedIndicator(data: TreasuryYieldData): NormalizedIndicator {
  return {
    id: `treasury-${data.seriesId}`,
    name: `美国国债收益率 - ${data.name}`,
    value: data.value,
    unit: data.unit,
    timestamp: data.timestamp,
    historical: data.historical,
  };
}