import axios from 'axios';
import { CRYPTO_SIGNALS_BASE_URL } from '../constants/api';

export interface CryptoSignals {
  fearGreed: number | null;          // 0-100
  fearGreedClassification: string | null;
  fearGreedYesterday: number | null;
  price: number | null;
  ma200: number | null;
  ma111: number | null;
  ma350: number | null;
  deviationPct: number | null;       // (price-MA200)/MA200*100
  piCycleSignal: boolean;            // 111日 > 350日×2 顶部预警
  aboveMa200: boolean | null;        // 经典牛熊分界
  timestamp: Date;
}

/** 获取加密牛熊综合信号（恐惧贪婪+200日均线偏离+PiCycle），1h 缓存。 */
export async function getCryptoSignals(): Promise<CryptoSignals> {
  const response = await axios.get(`${CRYPTO_SIGNALS_BASE_URL}`, { timeout: 15000 });
  const d = response.data;
  return { ...d, timestamp: new Date(d.timestamp) };
}
