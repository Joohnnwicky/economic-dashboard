import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { COINGECKO_BASE_URL, RATE_LIMITS } from '../constants/api';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';
import { CoinGeckoPriceResponse, CoinGeckoHistoryResponse } from './types';

export interface CryptoPriceData {
  price: number;
  change24h: number;
  timestamp: Date;
}

/**
 * Get current prices for multiple cryptocurrencies
 * @param coinIds - Array of CoinGecko coin IDs (e.g., ['bitcoin', 'ethereum'])
 * @returns Record mapping coin ID to price data
 */
export async function getCryptoPrice(coinIds: string[]): Promise<Record<string, CryptoPriceData>> {
  const idsParam = coinIds.join(',');
  const url = `${COINGECKO_BASE_URL}/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`;

  return rateLimiter.call('CoinGecko', async () => {
    const response = await axios.get<CoinGeckoPriceResponse>(url);

    if (!response.data) {
      throw new Error('CoinGecko response missing data');
    }

    const result: Record<string, CryptoPriceData> = {};

    for (const [coinId, data] of Object.entries(response.data)) {
      // Validate numeric fields
      if (typeof data.usd !== 'number' || typeof data.usd_24h_change !== 'number') {
        console.warn(`[CoinGecko] Invalid price data for ${coinId}`);
        continue;
      }

      result[coinId] = {
        price: data.usd,
        change24h: data.usd_24h_change || 0,
        timestamp: new Date(data.last_updated_at * 1000), // Unix seconds to milliseconds
      };
    }

    return result;
  }, RATE_LIMITS.CoinGecko);
}

/**
 * Get price history for a single cryptocurrency
 * @param coinId - CoinGecko coin ID (e.g., 'bitcoin')
 * @param days - Number of days of history (default 1 for 24h)
 * @returns NormalizedIndicator with historical price data
 */
export async function getCryptoHistory(coinId: string, days: number = 1): Promise<NormalizedIndicator> {
  const url = `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

  return rateLimiter.call('CoinGecko', async () => {
    const response = await axios.get<CoinGeckoHistoryResponse>(url);

    if (!response.data?.prices || !Array.isArray(response.data.prices)) {
      throw new Error('CoinGecko history response missing prices array');
    }

    // Transform to NormalizedIndicator format
    const historical: HistoricalDataPoint[] = response.data.prices.map(([timestamp, price]) => ({
      timestamp: new Date(timestamp), // Already in milliseconds
      value: price,
    }));

    const currentPrice = historical[historical.length - 1]?.value || 0;
    const previousPrice = historical[0]?.value || 0;

    // Calculate percentage change from first to last price
    const changePercentage = previousPrice !== 0
      ? ((currentPrice - previousPrice) / previousPrice) * 100
      : 0;

    return {
      id: coinId,
      name: coinId === 'bitcoin' ? '比特币' : coinId === 'ethereum' ? '以太坊' : coinId,
      value: currentPrice,
      unit: 'USD',
      timestamp: new Date(),
      change: {
        value: currentPrice - previousPrice,
        percentage: changePercentage,
        period: 'daily',
      },
      historical,
    };
  }, RATE_LIMITS.CoinGecko);
}