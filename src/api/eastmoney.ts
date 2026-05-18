import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { NormalizedIndicator } from '../types/indicator';
import { CHINESE_INDEX_CODES, EASTMONEY_INDEX_FIELDS } from '../constants/chinese-indices';

// 开发环境使用代理，生产环境直接访问
const isDev = import.meta.env.DEV;
const EASTMONEY_INDEX_URL = isDev
  ? '/api/eastmoney/qt/ulist.np'
  : 'https://push2.eastmoney.com/api/qt/ulist.np';

// Rate limit configuration for East Money (unofficial API)
// Aggressive caching to prevent quota exhaustion and reduce risk of endpoint changes
const EASTMONEY_RATE_LIMIT = {
  maxCallsPerDay: 500,
  minIntervalMs: 60000,  // 60 seconds minimum interval
  cacheTtlMs: 3600000,   // 60 minutes cache TTL
};

interface EastMoneyDataItem {
  f2: number;   // latest price
  f3: number;   // change percentage
  f4: number;   // change amount
  f12: string;  // code
  f14: string;  // name
  f15: number;  // high
  f16: number;  // low
  f17: number;  // open
  f18: number;  // previous close
}

interface EastMoneyResponse {
  data?: {
    diff?: EastMoneyDataItem[];
  };
}

export async function getChineseIndices(): Promise<NormalizedIndicator[]> {
  const secids = Object.values(CHINESE_INDEX_CODES).join(',');

  return rateLimiter.call('EastMoney', async () => {
    const response = await axios.get<EastMoneyResponse>(
      `${EASTMONEY_INDEX_URL}?fltt=2&secids=${secids}&fields=${EASTMONEY_INDEX_FIELDS}`
    );

    if (!response.data?.data?.diff || response.data.data.diff.length === 0) {
      throw new Error('East Money response missing data.diff');
    }

    // Normalize East Money data to NormalizedIndicator format
    return response.data.data.diff.map((item: EastMoneyDataItem) => ({
      id: String(item.f12),
      name: String(item.f14),
      value: Number(item.f2),
      unit: 'index',
      timestamp: new Date(),
      change: {
        value: Number(item.f4),
        percentage: Number(item.f3),
        period: 'daily' as const,
      },
      historical: [], // East Money API provides current snapshot only, not historical data
    }));
  }, EASTMONEY_RATE_LIMIT);
}