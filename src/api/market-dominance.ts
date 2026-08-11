import axios from 'axios';
import { MARKET_DOMINANCE_BASE_URL } from '../constants/api';

export interface TopCoin {
  symbol: string;
  name: string;
  market_cap: number | null;
  change_30d: number | null;
}

export interface MarketDominance {
  btc_dominance: number | null;       // %
  eth_dominance: number | null;       // %
  total_market_cap: number | null;    // USD
  total_volume: number | null;        // USD
  market_cap_change_24h: number | null; // %
  // 山寨季
  index: number | null;               // 0-100
  is_altcoin_season: boolean | null;
  btc_season: boolean | null;
  btc_change_30d: number | null;      // %
  top_coins: TopCoin[];
  timestamp: Date;
}

/** 获取加密市场市占率 + 山寨季指数（CoinGecko, 1h 缓存）。 */
export async function getMarketDominance(): Promise<MarketDominance> {
  const response = await axios.get(MARKET_DOMINANCE_BASE_URL, { timeout: 20000 });
  const d = response.data;
  return { ...d, timestamp: new Date(d.timestamp) };
}
