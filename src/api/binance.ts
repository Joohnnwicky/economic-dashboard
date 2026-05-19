import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';

// Binance API base URL
const BINANCE_API_URL = 'https://api.binance.com/api/v3';

// Rate limit for Binance (much higher than CoinGecko)
const BINANCE_RATE_LIMIT = {
  maxCallsPerDay: 10000,
  minIntervalMs: 1000,  // 1 second minimum interval
  cacheTtlMs: 30000,    // 30 seconds cache TTL
};

export interface CryptoPriceData {
  price: number;
  change24h: number;
  timestamp: Date;
}

/**
 * Get current price for a crypto symbol from Binance
 * @param symbol - Binance symbol (e.g., 'BTCUSDT', 'ETHUSDT')
 */
export async function getCryptoPriceFromBinance(symbol: string): Promise<CryptoPriceData> {
  return rateLimiter.call('Binance', async () => {
    const response = await axios.get(`${BINANCE_API_URL}/ticker/24hr?symbol=${symbol}`);

    if (!response.data) {
      throw new Error('Binance response missing data');
    }

    return {
      price: parseFloat(response.data.lastPrice),
      change24h: parseFloat(response.data.priceChangePercent),
      timestamp: new Date(),
    };
  }, BINANCE_RATE_LIMIT);
}

/**
 * Get current prices for BTC and ETH from Binance
 */
export async function getCryptoPrices(): Promise<Record<string, CryptoPriceData>> {
  const [btcData, ethData] = await Promise.all([
    getCryptoPriceFromBinance('BTCUSDT'),
    getCryptoPriceFromBinance('ETHUSDT'),
  ]);

  return {
    bitcoin: btcData,
    ethereum: ethData,
  };
}

/**
 * Get historical klines/candlestick data from Binance
 * @param symbol - Binance symbol (e.g., 'BTCUSDT')
 * @param interval - Kline interval (e.g., '1h' for hourly)
 * @param limit - Number of data points (max 1000)
 */
export async function getCryptoHistoryFromBinance(
  symbol: string,
  interval: string = '1h',
  limit: number = 24
): Promise<NormalizedIndicator> {
  return rateLimiter.call('Binance', async () => {
    const response = await axios.get(
      `${BINANCE_API_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Binance klines response missing data');
    }

    // Binance klines format: [openTime, open, high, low, close, volume, closeTime, ...]
    const historical: HistoricalDataPoint[] = response.data.map((kline: any[]) => ({
      timestamp: new Date(kline[0]), // openTime
      value: parseFloat(kline[4]),   // close price
    }));

    const current = historical[historical.length - 1];
    const coinId = symbol === 'BTCUSDT' ? 'bitcoin' : 'ethereum';
    const name = symbol === 'BTCUSDT' ? '比特币（BTC Bitcoin）' : '以太坊（ETH Ethereum）';

    return {
      id: coinId,
      name,
      value: current?.value || 0,
      unit: 'USD',
      timestamp: current?.timestamp || new Date(),
      historical,
    };
  }, BINANCE_RATE_LIMIT);
}