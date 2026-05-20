import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { NormalizedIndicator } from '../types/indicator';

// Backend URL - 使用nginx代理路径
const STOCK_BACKEND_URL = '/api/backend';

const STOCK_BACKEND_RATE_LIMIT = {
  maxCallsPerDay: 10000,
  minIntervalMs: 100,
  cacheTtlMs: 3600000,  // 1 hour
};

export interface StockSearchResult {
  code: string;
  name: string;
  market: 'sh' | 'sz';
}

/**
 * Search stocks by name or code
 */
export async function searchStocks(keyword: string): Promise<StockSearchResult[]> {
  return rateLimiter.call('StockBackend', async () => {
    const response = await axios.get(`${STOCK_BACKEND_URL}/api/stocks/search`, {
      params: { q: keyword },
    });
    return response.data;
  }, STOCK_BACKEND_RATE_LIMIT);
}

/**
 * Get real-time quote for a single stock
 */
export async function getStockQuote(code: string): Promise<NormalizedIndicator> {
  return rateLimiter.call('StockBackend', async () => {
    const response = await axios.get(`${STOCK_BACKEND_URL}/api/stocks/${code}/quote`);
    return response.data;
  }, STOCK_BACKEND_RATE_LIMIT);
}

/**
 * Get historical K-line data
 * @param code - Stock code (e.g., '600519' for Kweichow Moutai)
 * @param period - 'daily', 'weekly', or 'monthly'
 * @param limit - Number of data points (max 1000)
 */
export async function getStockKline(
  code: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  limit: number = 365
): Promise<NormalizedIndicator> {
  return rateLimiter.call('StockBackend', async () => {
    const response = await axios.get(`${STOCK_BACKEND_URL}/api/stocks/${code}/kline`, {
      params: { period, limit },
    });
    return response.data;
  }, STOCK_BACKEND_RATE_LIMIT);
}

/**
 * Get batch quotes for multiple stocks
 */
export async function getBatchStockQuotes(codes: string[]): Promise<NormalizedIndicator[]> {
  if (codes.length === 0) return [];

  return rateLimiter.call('StockBackend', async () => {
    const response = await axios.get(`${STOCK_BACKEND_URL}/api/stocks/batch`, {
      params: { codes: codes.join(',') },
    });
    return response.data;
  }, STOCK_BACKEND_RATE_LIMIT);
}