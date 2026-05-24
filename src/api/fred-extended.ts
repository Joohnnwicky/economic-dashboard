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
  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);

  // API Key由后端注入，前端不传递
  const url = `${FRED_BASE_URL}/series/observations?series_id=${seriesId}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}`;

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

    const current = historical[historical.length - 1];

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

export async function getFOMCTargetRates(timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);

  // API Key由后端注入，前端不传递
  const url = `${FRED_BASE_URL}/series/observations?series_id=${FRED_FOMC_TARGET_UPPER}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}`;

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