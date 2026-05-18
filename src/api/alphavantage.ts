import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { ALPHA_VANTAGE_BASE_URL, ALPHA_VANTAGE_SYMBOLS, RATE_LIMITS } from '../constants/api';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';
import { AlphaVantageDailyResponse } from './types';
import { parseUTCDate } from '../utils/utc';

// Track daily call count for quota warning
// CRITICAL: Alpha Vantage free tier = 25 calls/day
let alphaVantageCallCount = 0;
const MAX_AV_CALLS_PER_DAY = 25;

// Helper to map symbol to name
function getIndexName(symbol: string): string {
  const names: Record<string, string> = {
    'DJI': '道琼斯指数',
    'NASDAQ': '纳斯达克指数',
    'SPX': '标普500指数',
  };
  return names[symbol] || symbol;
}

/**
 * Get daily time series for an index
 * @param symbol - Alpha Vantage symbol (DJI, NASDAQ, SPX)
 * @returns NormalizedIndicator with historical data (limited to 365 days)
 */
export async function getIndexData(symbol: string): Promise<NormalizedIndicator> {
  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_ALPHA_VANTAGE_API_KEY not set in .env.local');
  }

  // Track quota
  alphaVantageCallCount++;
  console.warn(`[Alpha Vantage] Call #${alphaVantageCallCount} of ${MAX_AV_CALLS_PER_DAY} daily quota`);

  if (alphaVantageCallCount >= MAX_AV_CALLS_PER_DAY - 5) {
    console.error(`[Alpha Vantage] WARNING: Approaching daily quota! ${MAX_AV_CALLS_PER_DAY - alphaVantageCallCount} remaining`);
  }

  const url = `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;

  return rateLimiter.call('AlphaVantage', async () => {
    const response = await axios.get<AlphaVantageDailyResponse>(url);

    if (!response.data?.['Time Series (Daily)']) {
      throw new Error('Alpha Vantage response missing Time Series (Daily)');
    }

    const timeSeries = response.data['Time Series (Daily)'];

    // Transform to historical data points
    // Alpha Vantage returns string values, parse to number
    const historical: HistoricalDataPoint[] = Object.entries(timeSeries)
      .map(([dateStr, values]) => ({
        timestamp: parseUTCDate(dateStr),
        value: parseFloat(values['4. close']), // Use close price
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort chronological

    // Limit to 365 days to prevent big data issues (Pitfall 5)
    const limitedHistorical = historical.slice(-365);

    const current = limitedHistorical[limitedHistorical.length - 1];

    return {
      id: symbol.toLowerCase(),
      name: getIndexName(symbol),
      value: current?.value || 0,
      unit: 'index',
      timestamp: current?.timestamp || new Date(),
      historical: limitedHistorical,
    };
  }, RATE_LIMITS.AlphaVantage);
}

/**
 * Get all US indices data in parallel
 * @returns Array of NormalizedIndicator for DJI, NASDAQ, SPX
 */
export async function getAllIndicesData(): Promise<NormalizedIndicator[]> {
  const symbols = [
    ALPHA_VANTAGE_SYMBOLS.DOW_JONES,
    ALPHA_VANTAGE_SYMBOLS.NASDAQ,
    ALPHA_VANTAGE_SYMBOLS.SP500,
  ];

  // Fetch all indices in parallel
  const results = await Promise.all(symbols.map(symbol => getIndexData(symbol)));

  return results;
}