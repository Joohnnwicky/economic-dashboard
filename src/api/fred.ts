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
  const historical: HistoricalDataPoint[] = response.observations
    .filter((obs) => obs.value !== '.')
    .map((obs) => ({
      timestamp: parseUTCDate(obs.date),
      value: parseFloat(obs.value),
    }))
    .reverse();

  const current = historical[historical.length - 1];

  return {
    id: 'fed-rate',
    name: '美联储利率',
    value: current?.value ?? 0,
    unit: '%',
    timestamp: current?.timestamp ?? new Date(),
    historical,
  };
}

export async function getFedRate(timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  const apiKey = import.meta.env.VITE_FRED_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_FRED_API_KEY not set in .env.local');
  }

  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);

  const url = `${FRED_BASE_URL}/series/observations?series_id=${FRED_FED_RATE_SERIES}&api_key=${apiKey}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}&file_type=json`;

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
  const apiKey = import.meta.env.VITE_FRED_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_FRED_API_KEY not set in .env.local');
  }

  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);

  const url = `${FRED_BASE_URL}/series/observations?series_id=${FRED_CPI_SERIES}&api_key=${apiKey}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}&file_type=json`;

  return rateLimiter.call('FRED', async () => {
    const response = await axios.get<FredSeriesResponse>(url);

    if (!response.data?.observations) {
      throw new Error('FRED CPI response missing observations');
    }

    const historical: HistoricalDataPoint[] = response.data.observations
      .filter((obs) => obs.value !== '.')
      .map((obs) => ({
        timestamp: parseUTCDate(obs.date),
        value: parseFloat(obs.value),
      }))
      .reverse();

    const current = historical[historical.length - 1];

    return {
      id: 'cpi',
      name: 'CPI消费者物价指数',
      value: current?.value ?? 0,
      unit: 'index',
      timestamp: current?.timestamp ?? new Date(),
      historical,
    };
  }, RATE_LIMITS.FRED);
}