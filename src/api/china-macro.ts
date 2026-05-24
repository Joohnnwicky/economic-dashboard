import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { FRED_BASE_URL, FRED_CHINA_SERIES, RATE_LIMITS } from '../constants/api';
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
    case 'ALL': return new Date(1990, 0, 1);  // China economic data since 1990
    default: return subYears(now, 1);
  }
}

// China GDP data is quarterly and may lag 2+ years behind current date
// Use 3 years lookback to ensure we get recent data
function calculateChinaStartDate(timeRange: TimeRange): Date {
  const now = new Date();
  switch (timeRange) {
    case '1Y': return subYears(now, 3);  // GDP lags ~2 years, need 3y lookback
    case 'ALL': return new Date(1990, 0, 1);
    default: return subYears(now, 3);
  }
}

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

interface ChinaMacroData {
  seriesId: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  historical: HistoricalDataPoint[];
  yoyChange?: number;  // Year-over-year change percentage
}

const CHINA_MACRO_NAMES: Record<string, string> = {
  CHNGDPNQDSMEI: '中国GDP',
  CHNCPIALLMINMEI: '中国CPI',
};

const CHINA_MACRO_UNITS: Record<string, string> = {
  CHNGDPNQDSMEI: '人民币',  // GDP in Yuan Renminbi
  CHNCPIALLMINMEI: '指数',
};

// Format large GDP numbers to trillions/billions
function formatGDPValue(value: number): string {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)}万亿`;
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}十亿`;
  }
  return value.toFixed(2);
}

/**
 * Fetch a single China economic indicator from FRED
 */
export async function getChinaMacroIndicator(seriesId: string, timeRange: TimeRange = '1Y'): Promise<ChinaMacroData> {
  const endDate = new Date();
  const startDate = calculateChinaStartDate(timeRange);

  // API Key由后端注入，前端不传递
  const url = `${FRED_BASE_URL}/series/observations?series_id=${seriesId}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}`;

  return rateLimiter.call('FRED', async () => {
    const response = await axios.get<FredSeriesResponse>(url);

    if (!response.data?.observations) {
      throw new Error(`FRED China response missing observations for ${seriesId}`);
    }

    const historical: HistoricalDataPoint[] = response.data.observations
      .filter((obs) => obs.value !== '.' && obs.value !== 'NaN')
      .map((obs) => ({
        timestamp: parseUTCDate(obs.date),
        value: parseFloat(obs.value),
      }));

    const current = historical[historical.length - 1];

    // Calculate YoY change (compare to same period last year)
    let yoyChange = undefined;
    if (historical.length >= 12) {
      // Find data point approximately 1 year ago (could be 4 quarters for GDP, 12 months for CPI)
      const oneYearAgoIndex = Math.max(0, historical.length - 13);
      const yearAgoValue = historical[oneYearAgoIndex].value;
      if (yearAgoValue > 0 && current) {
        yoyChange = ((current.value - yearAgoValue) / yearAgoValue) * 100;
      }
    }

    return {
      seriesId,
      name: CHINA_MACRO_NAMES[seriesId] || seriesId,
      value: current?.value ?? 0,
      unit: CHINA_MACRO_UNITS[seriesId] || '指数',
      timestamp: current?.timestamp ?? new Date(),
      historical,
      yoyChange,
    };
  }, RATE_LIMITS.FRED);
}

/**
 * Fetch all China macro indicators in parallel
 */
export async function getChinaMacroIndicators(timeRange: TimeRange = '1Y'): Promise<{
  gdp: ChinaMacroData;
  cpi: ChinaMacroData;
}> {
  const [gdp, cpi] = await Promise.all([
    getChinaMacroIndicator(FRED_CHINA_SERIES.GDP, timeRange),
    getChinaMacroIndicator(FRED_CHINA_SERIES.CPI, timeRange),
  ]);

  return { gdp, cpi };
}

/**
 * Convert China macro data to NormalizedIndicator format
 */
export function chinaMacroToNormalizedIndicator(data: ChinaMacroData): NormalizedIndicator {
  const change = data.yoyChange !== undefined ? {
    value: data.value * (data.yoyChange / 100),
    percentage: data.yoyChange,
    period: 'yearly' as const,
  } : undefined;

  return {
    id: `china-${data.seriesId}`,
    name: data.name,
    value: data.value,
    unit: data.unit,
    timestamp: data.timestamp,
    change,
    historical: data.historical,
  };
}