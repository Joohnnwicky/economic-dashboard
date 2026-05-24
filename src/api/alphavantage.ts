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

// Helper to map ETF symbol to index name
function getIndexName(symbol: string): string {
  const names: Record<string, string> = {
    'DIA': '道琼斯指数 (DIA ETF)',
    'QQQ': '纳斯达克指数 (QQQ ETF)',
    'SPY': '标普500指数 (SPY ETF)',
    'DJI': '道琼斯指数',
    'NASDAQ': '纳斯达克指数',
    'SPX': '标普500指数',
    'GLD': '黄金ETF (GLD - SPDR Gold Shares)',
  };
  return names[symbol] || symbol;
}

/**
 * Get daily time series for an index
 * @param symbol - Alpha Vantage symbol (DJI, NASDAQ, SPX)
 * @returns NormalizedIndicator with historical data (limited to 365 days)
 */
export async function getIndexData(symbol: string): Promise<NormalizedIndicator> {
  const url = `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}`;

  return rateLimiter.call('AlphaVantage', async () => {
    const response = await axios.get<AlphaVantageDailyResponse>(url);

    if (!response.data?.['Time Series (Daily)']) {
      throw new Error('Alpha Vantage response missing Time Series (Daily)');
    }

    const timeSeries = response.data['Time Series (Daily)'];

    const historical: HistoricalDataPoint[] = Object.entries(timeSeries)
      .map(([dateStr, values]) => ({
        timestamp: parseUTCDate(dateStr),
        value: parseFloat(values['4. close']),
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

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

/**
 * Get GLD ETF data (Gold price proxy)
 * Uses backend cache to avoid Alpha Vantage API quota limits
 */
export async function getGoldETFData(): Promise<NormalizedIndicator> {
  // Try backend cache first (avoids Alpha Vantage quota)
  try {
    const backendResponse = await axios.get('/api/backend/gold-price');
    if (backendResponse.data) {
      const data = backendResponse.data;
      return {
        id: 'gold-gld',
        name: '黄金ETF (GLD - SPDR Gold Shares)',
        value: data.currentPrice || 0,
        unit: 'USD',
        timestamp: new Date(data.timestamp || new Date()),
        change: data.change ? {
          value: data.change.value,
          percentage: data.change.percentage,
          period: 'daily' as const,
        } : undefined,
        historical: data.historical || [],
      };
    }
  } catch (backendError) {
    console.warn('[Gold] Backend cache unavailable, falling back to Alpha Vantage');
  }

  // Fallback to Alpha Vantage API
  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_ALPHA_VANTAGE_API_KEY not set in .env.local');
  }

  // Track quota
  alphaVantageCallCount++;
  console.warn(`[Alpha Vantage] Call #${alphaVantageCallCount} of ${MAX_AV_CALLS_PER_DAY} daily quota (GLD)`);

  // Fallback to Alpha Vantage API (via backend proxy)
  const url = `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=GLD`;

  return rateLimiter.call('AlphaVantage', async () => {
    const response = await axios.get<AlphaVantageDailyResponse>(url);

    // Check for API limit message
    // Note: "Information" is rate limit warning (1 req/sec), just need to wait
    // "Note" is daily quota limit (25 req/day), need to wait until tomorrow
    if (response.data?.['Note']) {
      throw new Error('Alpha Vantage 日配额已用完 (25次/天)，请明天再试');
    }
    if (response.data?.['Information']) {
      console.warn('[Alpha Vantage] Rate limit hit, data may be stale');
      // Don't throw error for rate limit - it recovers in seconds
    }

    if (!response.data?.['Time Series (Daily)']) {
      throw new Error('Alpha Vantage GLD response missing Time Series (Daily)');
  }

    const timeSeries = response.data['Time Series (Daily)'];

    const historical: HistoricalDataPoint[] = Object.entries(timeSeries)
      .map(([dateStr, values]) => ({
        timestamp: parseUTCDate(dateStr),
        value: parseFloat(values['4. close']),
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const limitedHistorical = historical.slice(-365);
    const current = limitedHistorical[limitedHistorical.length - 1];
    const previous = limitedHistorical[limitedHistorical.length - 2];

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

    return {
      id: 'gold-gld',
      name: '黄金ETF (GLD - SPDR Gold Shares)',
      value: current?.value || 0,
      unit: 'USD',
      timestamp: current?.timestamp || new Date(),
      change,
      historical: limitedHistorical,
    };
  }, RATE_LIMITS.AlphaVantage);
}