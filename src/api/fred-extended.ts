import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { FRED_BASE_URL, RATE_LIMITS } from '../constants/api';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';
import { TimeRange } from '../types/api';
import { FredSeriesResponse } from './types';
import { parseUTCDate } from '../utils/utc';
import { format, subYears, subMonths, subDays } from 'date-fns';

// PCE series IDs (verified from FRED)
const PCE_SERIES = {
  PCEPI: 'PCEPI',      // Overall PCE inflation
  PCEPILFE: 'PCEPILFE', // Core PCE (ex food/energy)
} as const;

// FOMC target rate series (per D-13)
export const FRED_FOMC_TARGET_UPPER = 'DFEDTARU'; // Federal Funds Target Range - Upper Bound

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

/**
 * Fetch PCE (Personal Consumption Expenditures) inflation data from FRED.
 * Uses the same pattern as existing getFedRate function.
 */
export async function getPCEData(seriesId: string, timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  const apiKey = import.meta.env.VITE_FRED_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_FRED_API_KEY not set in .env.local');
  }

  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);

  const url = `${FRED_BASE_URL}/series/observations?series_id=${seriesId}&api_key=${apiKey}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}&file_type=json`;

  return rateLimiter.call('FRED', async () => {
    const response = await axios.get<FredSeriesResponse>(url);

    if (!response.data?.observations) {
      throw new Error('FRED response missing observations');
    }

    const historical: HistoricalDataPoint[] = response.data.observations
      .filter((obs) => obs.value !== '.')
      .map((obs) => ({
        timestamp: parseUTCDate(obs.date),
        value: parseFloat(obs.value),
      }))
      // 移除reverse，保持最旧→最新顺序（与FEDFUNDS一致）

    const current = historical[historical.length - 1];

    // Override names for PCE-specific display
    let name = 'PCE物价指数';
    let id = 'pcepi';

    if (seriesId === PCE_SERIES.PCEPILFE) {
      name = '核心PCE物价指数';
      id = 'pcepilfe';
    }

    return {
      id,
      name,
      value: current?.value ?? 0,
      unit: 'index',
      timestamp: current?.timestamp ?? new Date(),
      historical,
    };
  }, RATE_LIMITS.FRED);
}

/**
 * Fetch FOMC target rate upper bound (DFEDTARU) for FOMC meeting detection.
 * Used to detect rate change points where FOMC meetings occurred (per D-13).
 * TimeRange defaults to '1Y' (past 1 year) per D-14.
 */
export async function getFOMCTargetRates(timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  const apiKey = import.meta.env.VITE_FRED_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_FRED_API_KEY not set in .env.local');
  }

  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);

  const url = `${FRED_BASE_URL}/series/observations?series_id=${FRED_FOMC_TARGET_UPPER}&api_key=${apiKey}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}&file_type=json`;

  return rateLimiter.call('FRED', async () => {
    const response = await axios.get<FredSeriesResponse>(url);

    if (!response.data?.observations) {
      throw new Error('FRED response missing observations');
    }

    const historical: HistoricalDataPoint[] = response.data.observations
      .filter((obs) => obs.value !== '.')
      .map((obs) => ({
        timestamp: parseUTCDate(obs.date),
        value: parseFloat(obs.value),
      }));
    // 移除reverse，保持最旧→最新顺序（与FEDFUNDS一致）

    const current = historical[historical.length - 1];

    return {
      id: 'fomc-target-rate-upper',
      name: '美联储目标利率上限',
      value: current?.value ?? 0,
      unit: '%',
      timestamp: current?.timestamp ?? new Date(),
      historical,
    };
  }, RATE_LIMITS.FRED);
}