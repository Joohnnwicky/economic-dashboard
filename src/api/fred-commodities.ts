import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { FRED_BASE_URL, FRED_GOLD_SERIES, FRED_BRENT_SERIES, FRED_WTI_SERIES, RATE_LIMITS } from '../constants/api';
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

function normalizeCommodityData(
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

  // Calculate daily change if we have previous data
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
 * Get Gold Price from Python backend cache (Alpha Vantage, updated hourly)
 * This avoids consuming Alpha Vantage API quota (25 calls/day)
 */
export async function getGoldPriceFromCache(): Promise<NormalizedIndicator> {
  const response = await axios.get('/api/backend/gold-price');

  const data = response.data;
  if (!data || data.error) {
    // 如果后端返回错误，fallback到FRED
    return getGoldPriceFromFRED('1M');
  }

  // 转换为NormalizedIndicator格式
  const historical: HistoricalDataPoint[] = (data.historical || []).map((h: any) => ({
    timestamp: new Date(h.timestamp),
    value: h.value,
  }));

  const current = historical[historical.length - 1];
  const previous = historical[historical.length - 2];

  let change = undefined;
  if (current && previous && previous.value > 0) {
    const changeValue = current.value - previous.value;
    const changePct = (changeValue / previous.value) * 100;
    change = {
      value: changeValue,
      percentage: changePct,
      period: 'hourly' as const,
    };
  }

  return {
    id: 'gold-lbma',
    name: '国际金价（XAU/USD）',
    value: data.value || current?.value || 0,
    unit: 'USD/oz',
    timestamp: new Date(data.timestamp || current?.timestamp || new Date()),
    change,
    historical,
  };
}

/**
 * Fallback: Get Gold Price from FRED (only used if backend cache fails)
 */
async function getGoldPriceFromFRED(timeRange: TimeRange): Promise<NormalizedIndicator> {
  const apiKey = import.meta.env.VITE_FRED_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_FRED_API_KEY not set');
  }

  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);

  const url = `${FRED_BASE_URL}/series/observations?series_id=${FRED_GOLD_SERIES}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}`;

  return rateLimiter.call('FRED', async () => {
    const response = await axios.get<FredSeriesResponse>(url);

    if (!response.data?.observations) {
      throw new Error('FRED Gold response missing observations');
    }

    return normalizeCommodityData(
      response.data,
      'gold-lbma',
      '伦敦金现货（LBMA Gold Price）',
      'USD/oz'
    );
  }, RATE_LIMITS.FRED);
}

/**
 * Get Gold Price (from backend cache, fallback to FRED)
 */
export async function getGoldPrice(timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  // 优先从后端缓存获取
  return getGoldPriceFromCache();
}

/**
 * Get Oil Price (Brent or WTI) from FRED
 * @param seriesId - DCOILBRENTEU (Brent) or DCOILWTICO (WTI)
 */
export async function getOilPrice(seriesId: string, timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);

  // API Key由后端注入，前端不传递
  const url = `${FRED_BASE_URL}/series/observations?series_id=${seriesId}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}`;

  return rateLimiter.call('FRED', async () => {
    const response = await axios.get<FredSeriesResponse>(url);

    if (!response.data?.observations) {
      throw new Error(`FRED Oil response missing observations for ${seriesId}`);
    }

    const isBrent = seriesId === FRED_BRENT_SERIES;
    const id = isBrent ? 'oil-brent' : 'oil-wti';
    const name = isBrent
      ? '布伦特原油（Brent Crude Oil）'
      : '西德州中质原油（WTI Crude Oil）';

    const data = normalizeCommodityData(response.data, id, name, 'USD/barrel');

    // Downsample if too many points
    if (data.historical.length > 365) {
      data.historical = downsampleData(data.historical, 365);
    }

    return data;
  }, RATE_LIMITS.FRED);
}

/**
 * Get all commodity prices in one batch call (fetches separately but cached)
 */
export async function getCommoditiesBatch(timeRange: TimeRange = '1Y'): Promise<{
  gold: NormalizedIndicator;
  brent: NormalizedIndicator;
  wti: NormalizedIndicator;
}> {
  const [gold, brent, wti] = await Promise.all([
    getGoldPrice(timeRange),
    getOilPrice(FRED_BRENT_SERIES, timeRange),
    getOilPrice(FRED_WTI_SERIES, timeRange),
  ]);

  return { gold, brent, wti };
}