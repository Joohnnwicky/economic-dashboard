import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { FRED_BASE_URL, FRED_FED_RATE_SERIES, FRED_CPI_SERIES, RATE_LIMITS } from '../constants/api';
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
    case 'ALL': return new Date(1950, 0, 1);
    default: return subYears(now, 1);
  }
}

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function normalizeFredData(
  response: FredSeriesResponse,
  _timeRange: TimeRange
): NormalizedIndicator {
  // FRED返回数据：最旧→最新（从2024-01到2024-12）
  // 需要反转：最新→最旧，然后图表显示从左到右时间递增
  // 但当前reverse导致最左边最新，最右边最旧（错误）
  // 所以移除reverse，保持最旧→最新顺序
  const historical: HistoricalDataPoint[] = response.observations
    .filter((obs) => obs.value !== '.')
    .map((obs) => ({
      timestamp: parseUTCDate(obs.date),
      value: parseFloat(obs.value),
    }))
    // 移除reverse，保持FRED原始顺序（最旧→最新）
    // 这样横轴从左到右：最旧月份→最新月份

  const current = historical[historical.length - 1];

  return {
    id: 'fed-rate',
    name: '美国联邦基金利率（FFR Federal Funds Rate）',
    value: current?.value ?? 0,
    unit: '%',
    timestamp: current?.timestamp ?? new Date(),
    historical,
  };
}

export async function getFedRate(timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);

  // API Key由后端注入，前端不传递
  const url = `${FRED_BASE_URL}/series/observations?series_id=${FRED_FED_RATE_SERIES}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}`;

  return rateLimiter.call('FRED', async () => {
    const response = await axios.get<FredSeriesResponse>(url);

    if (!response.data?.observations) {
      throw new Error('FRED response missing observations');
    }

    return normalizeFredData(response.data, timeRange);
  }, RATE_LIMITS.FRED);
}

// Get CPI data from FRED
export async function getCPI(timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);

  // API Key由后端注入，前端不传递
  const url = `${FRED_BASE_URL}/series/observations?series_id=${FRED_CPI_SERIES}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}`;

  return rateLimiter.call('FRED', async () => {
    const response = await axios.get<FredSeriesResponse>(url);

    if (!response.data?.observations) {
      throw new Error('FRED CPI response missing observations');
    }

    // FRED返回数据：最旧→最新
    const historical: HistoricalDataPoint[] = response.data.observations
      .filter((obs) => obs.value !== '.')
      .map((obs) => ({
        timestamp: parseUTCDate(obs.date),
        value: parseFloat(obs.value),
      }));

    const current = historical[historical.length - 1];

    return {
      id: 'cpi',
      name: '美国消费者物价指数（CPI Consumer Price Index）',
      value: current?.value ?? 0,
      unit: 'index',
      timestamp: current?.timestamp ?? new Date(),
      historical,
    };
  }, RATE_LIMITS.FRED);
}