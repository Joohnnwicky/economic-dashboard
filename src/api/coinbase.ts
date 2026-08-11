import axios from 'axios';
import { COINBASE_BASE_URL } from '../constants/api';
import { HistoricalDataPoint } from '../types/indicator';

export interface CoinbasePremiumData {
  coinbasePrice: number;
  binancePrice: number;
  premium: number;         // USD 绝对溢价 = Coinbase - Binance
  premiumPercent: number;  // 溢价率 %
  timestamp: Date;
  historical: HistoricalDataPoint[]; // 24h hourly 溢价序列
}

/**
 * 获取 Coinbase 比特币溢价指数（经后端代理）。
 * 后端组合 Coinbase BTC/USD 现货价与 Binance BTC/USDT 价计算溢价，60s 缓存。
 */
export async function getCoinbasePremium(): Promise<CoinbasePremiumData> {
  const response = await axios.get(`${COINBASE_BASE_URL}/btc-premium`, {
    timeout: 20000,
  });
  const d = response.data;
  return {
    coinbasePrice: d.coinbasePrice,
    binancePrice: d.binancePrice,
    premium: d.premium,
    premiumPercent: d.premiumPercent,
    timestamp: new Date(d.timestamp),
    historical: (d.historical || []).map((h: { timestamp: string; value: number }) => ({
      timestamp: new Date(h.timestamp),
      value: h.value,
    })),
  };
}
