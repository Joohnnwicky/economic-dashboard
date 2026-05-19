import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { NormalizedIndicator } from '../types/indicator';

// 开发环境使用代理，生产环境直接访问
const isDev = import.meta.env.DEV;

// 新浪财经API - 更稳定、广泛使用的公开API
const SINA_FINANCE_URL = isDev
  ? '/api/sina/hq.sinajs.cn'
  : 'http://hq.sinajs.cn';

// Rate limit configuration
const SINA_RATE_LIMIT = {
  maxCallsPerDay: 1000,
  minIntervalMs: 60000,  // 60 seconds minimum interval
  cacheTtlMs: 3600000,   // 60 minutes cache TTL
};

// 新浪财经返回格式: var hq_str_s_sh000001="上证指数,3400.23,12.45,0.37,34567890,12345678";
// 格式: 名称,当前价,涨跌额,涨跌幅,成交量(手),成交额(万)
export async function getChineseIndices(): Promise<NormalizedIndicator[]> {
  // A股主要指数代码: 上证指数、沪深300、深证成指
  const symbols = 's_sh000001,s_sh000300,s_sh000016';

  return rateLimiter.call('SinaFinance', async () => {
    const response = await axios.get<string>(
      `${SINA_FINANCE_URL}/list=${symbols}`,
      {
        responseType: 'text',  // 新浪返回的是文本格式
        transformResponse: [(data: string) => {
          // 解析新浪返回的文本格式
          const lines = data.split('\n').filter(line => line.includes('var hq_str_'));
          const indices: NormalizedIndicator[] = [];

          for (const line of lines) {
            const match = line.match(/var hq_str_s_sh(\d+)="(.+)"/);
            if (!match || !match[2]) continue;

            const parts = match[2].split(',');
            if (parts.length < 4) continue;

            const [name, priceStr, changeStr, changePercentStr] = parts;
            const price = parseFloat(priceStr);
            const change = parseFloat(changeStr);
            const changePercent = parseFloat(changePercentStr);

            if (isNaN(price)) continue;

            indices.push({
              id: `sh${match[1]}`,
              name: name.trim(),
              value: price,
              unit: 'index',
              timestamp: new Date(),
              change: {
                value: change,
                percentage: changePercent,
                period: 'daily' as const,
              },
              historical: [], // 新浪API只提供当前数据
            });
          }

          return indices;
        }],
      }
    );

    if (!response.data || response.data.length === 0) {
      throw new Error('新浪财经API返回数据为空');
    }

    return response.data;
  }, SINA_RATE_LIMIT);
}