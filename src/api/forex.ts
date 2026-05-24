import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { FRED_BASE_URL, FRED_DXY_SERIES, FRED_USDCNY_SERIES, RATE_LIMITS } from '../constants/api';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';
import { TimeRange } from '../types/api';
import { FredSeriesResponse } from './types';
import { parseUTCDate } from '../utils/utc';
import { format, subYears, subMonths, subDays } from 'date-fns';
import { downsampleData } from '../utils/downsampling';

function calculateStartDate(timeRange: TimeRange): Date {
  const now = new Date();
  switch (timeRange) {
    case '1D': return subDays(now, 1);
    case '1W': return subDays(now, 7);
    case '1M': return subMonths(now, 1);
    case '3M': return subMonths(now, 3);
    case '6M': return subMonths(now, 6);
    case '1Y': return subYears(now, 1);
    case 'ALL': return new Date(1970, 0, 1);
    default: return subYears(now, 1);
  }
}

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function normalizeForexData(
  response: FredSeriesResponse,
  id: string,
  name: string,
  unit: string
): NormalizedIndicator {
  const historical: HistoricalDataPoint[] = response.observations
    .filter((obs) => obs.value !== '.')
    .map((obs) => ({
      timestamp: parseUTCDate(obs.date),
      value: parseFloat(obs.value),
    }));

  const current = historical[historical.length - 1];
  const previous = historical[historical.length - 2];

  let change = undefined;
  if (current && previous && previous.value !== null && current.value !== null && previous.value > 0) {
    const changeValue = current.value - previous.value;
    const changePct = (changeValue / previous.value) * 100;
    change = {
      value: changeValue,
      percentage: changePct,
      period: 'daily' as const,
    };
  }

  return {
    id,
    name,
    value: current?.value ?? 0,
    unit,
    timestamp: current?.timestamp ?? new Date(),
    change,
    historical,
  };
}

/**
 * Get US Dollar Index (DXY) from FRED
 * Series: DTWEXBGS - Trade Weighted U.S. Dollar Index: Broad, Goods and Services
 */
export async function getDollarIndex(timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);

  // API Key由后端注入，前端不传递
  const url = `${FRED_BASE_URL}/series/observations?series_id=${FRED_DXY_SERIES}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}`;

  return rateLimiter.call('FRED', async () => {
    const response = await axios.get<FredSeriesResponse>(url);

    if (!response.data?.observations) {
      throw new Error('FRED Dollar Index response missing observations');
    }

    const data = normalizeForexData(
      response.data,
      'dollar-index',
      '美元指数（US Dollar Index）',
      'index'
    );

    if (data.historical.length > 365) {
      data.historical = downsampleData(data.historical, 365);
    }

    return data;
  }, RATE_LIMITS.FRED);
}

/**
 * Get USD/CNY Exchange Rate from FRED
 * Series: DEXCHUS - China / U.S. Foreign Exchange Rate
 */
export async function getUSDCNYRate(timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);

  // API Key由后端注入，前端不传递
  const url = `${FRED_BASE_URL}/series/observations?series_id=${FRED_USDCNY_SERIES}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}`;

  return rateLimiter.call('FRED', async () => {
    const response = await axios.get<FredSeriesResponse>(url);

    if (!response.data?.observations) {
      throw new Error('FRED USD/CNY response missing observations');
    }

    const data = normalizeForexData(
      response.data,
      'usdcny',
      '美元/人民币汇率（USD/CNY Exchange Rate）',
      'CNY'
    );

    if (data.historical.length > 365) {
      data.historical = downsampleData(data.historical, 365);
    }

    return data;
  }, RATE_LIMITS.FRED);
}