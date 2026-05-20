import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { RATE_LIMITS } from '../constants/api';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';
import { TimeRange } from '../types/api';
import { format, subYears, subMonths, subDays, subWeeks } from 'date-fns';
import { downsampleData } from '../utils/downsampling';

// 使用nginx代理路径
const FRANKFURTER_BASE_URL = '/api/frankfurter';

interface FrankfurterRatesResponse {
  amount: number;
  base: string;
  start_date?: string;
  end_date?: string;
  rates: Record<string, number>;
}

interface FrankfurterHistoricalResponse {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
}

function calculateStartDate(timeRange: TimeRange): string {
  const now = new Date();
  let startDate: Date;
  switch (timeRange) {
    case '1D': startDate = subDays(now, 1); break;
    case '1W': startDate = subWeeks(now, 1); break;
    case '1M': startDate = subMonths(now, 1); break;
    case '3M': startDate = subMonths(now, 3); break;
    case '6M': startDate = subMonths(now, 6); break;
    case '1Y': startDate = subYears(now, 1); break;
    case 'ALL': startDate = subYears(now, 10); break;
    default: startDate = subYears(now, 1);
  }
  return format(startDate, 'yyyy-MM-dd');
}

/**
 * Get latest exchange rates from USD to multiple currencies
 * Uses Frankfurter API (ECB data, no API key required)
 */
export async function getLatestExchangeRates(): Promise<{
  EUR: number;
  GBP: number;
  JPY: number;
  CNY: number;
  timestamp: Date;
}> {
  const url = `${FRANKFURTER_BASE_URL}/latest?from=USD&to=EUR,GBP,JPY,CNY`;

  // Frankfurter doesn't need rate limiting (free, no quota)
  const response = await axios.get<FrankfurterRatesResponse>(url);

  if (!response.data?.rates) {
    throw new Error('Frankfurter response missing rates');
  }

  return {
    EUR: response.data.rates.EUR || 0,
    GBP: response.data.rates.GBP || 0,
    JPY: response.data.rates.JPY || 0,
    CNY: response.data.rates.CNY || 0,
    timestamp: new Date(),
  };
}

/**
 * Get historical exchange rate data for a specific currency pair
 * @param toCurrency - Target currency (EUR, GBP, JPY, CNY)
 */
export async function getHistoricalExchangeRate(
  toCurrency: string,
  timeRange: TimeRange = '1Y'
): Promise<NormalizedIndicator> {
  const startDate = calculateStartDate(timeRange);
  const endDate = format(new Date(), 'yyyy-MM-dd');

  const url = `${FRANKFURTER_BASE_URL}/${startDate}..${endDate}?from=USD&to=${toCurrency}`;

  const response = await axios.get<FrankfurterHistoricalResponse>(url);

  if (!response.data?.rates) {
    throw new Error(`Frankfurter historical response missing rates for ${toCurrency}`);
  }

  // Convert rates object to historical data points
  const historical: HistoricalDataPoint[] = Object.entries(response.data.rates)
    .map(([dateStr, rates]) => ({
      timestamp: new Date(dateStr + 'T00:00:00Z'),
      value: rates[toCurrency] || 0,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const current = historical[historical.length - 1];
  const previous = historical[historical.length - 2];

  let change = undefined;
  if (current && previous && previous.value > 0) {
    const changeValue = current.value - previous.value;
    const changePct = (changeValue / previous.value) * 100;
    change = {
      value: changeValue,
      percentage: changePct,
      period: 'daily' as const,
    };
  }

  const currencyNames: Record<string, string> = {
    EUR: '美元/欧元汇率（USD/EUR）',
    GBP: '美元/英镑汇率（USD/GBP）',
    JPY: '美元/日元汇率（USD/JPY）',
    CNY: '美元/人民币汇率（USD/CNY）',
  };

  if (historical.length > 365) {
    historical.splice(0, historical.length - 365);
  }

  return {
    id: `usd-${toCurrency.toLowerCase()}`,
    name: currencyNames[toCurrency] || `USD/${toCurrency}`,
    value: current?.value ?? 0,
    unit: toCurrency,
    timestamp: current?.timestamp ?? new Date(),
    change,
    historical,
  };
}

/**
 * Get all major currency exchange rates in one call
 */
export async function getAllExchangeRates(timeRange: TimeRange = '1Y'): Promise<{
  EUR: NormalizedIndicator;
  GBP: NormalizedIndicator;
  JPY: NormalizedIndicator;
}> {
  const [eur, gbp, jpy] = await Promise.all([
    getHistoricalExchangeRate('EUR', timeRange),
    getHistoricalExchangeRate('GBP', timeRange),
    getHistoricalExchangeRate('JPY', timeRange),
  ]);

  return { EUR: eur, GBP: gbp, JPY: jpy };
}