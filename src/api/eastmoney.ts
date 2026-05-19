import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';
import { parseUTCDate } from '../utils/utc';

// 开发环境使用代理，生产环境直接访问
const isDev = import.meta.env.DEV;

// 腾讯财经API - 更稳定、不易被封禁
const TENCENT_FINANCE_URL = isDev
  ? '/api/tencent'
  : 'http://qt.gtimg.cn';

// 东方财富K线API - 注意：此API可能失效，已添加fallback处理
const EASTMONEY_KLINE_URL = isDev
  ? '/api/eastmoneykline'
  : 'http://push2his.eastmoney.com';

// Rate limit configuration
const TENCENT_RATE_LIMIT = {
  maxCallsPerDay: 1000,
  minIntervalMs: 60000,  // 60 seconds minimum interval
  cacheTtlMs: 3600000,   // 60 minutes cache TTL
};

const EASTMONEY_KLINE_RATE_LIMIT = {
  maxCallsPerDay: 100,
  minIntervalMs: 60000,
  cacheTtlMs: 3600000,
};

// A股指数代码映射（东方财富secid格式：市场代码.指数代码）
const INDEX_SECID_MAP: Record<string, string> = {
  'sh000001': '1.000001',  // 上证指数
  'sh000300': '1.000300',  // 沪深300
  'sh000016': '1.000016',  // 上证50
  'sz399006': '0.399006',  // 创业板指
};

// 腾讯财经返回格式: v_s_sh000001="1~上证指数~000001~3400.23~-3.86~-0.09~627233137~131508420~~";
// 格式: 类型~名称~代码~当前价~涨跌额~涨跌幅~成交量~成交额~~
export async function getChineseIndices(): Promise<NormalizedIndicator[]> {
  // A股主要指数代码: 上证指数、沪深300、上证50
  const symbols = 's_sh000001,s_sh000300,s_sh000016';

  return rateLimiter.call('TencentFinance', async () => {
    console.log('[Tencent] Fetching Chinese indices...');
    const response = await axios.get<ArrayBuffer>(
      `${TENCENT_FINANCE_URL}/q=${symbols}`,
      {
        responseType: 'arraybuffer',
        transformResponse: [(data) => {
          try {
            if (!data || !(data instanceof ArrayBuffer)) {
              console.error('[Tencent] Invalid response');
              return [];
            }

            const decoder = new TextDecoder('gbk');
            const text = decoder.decode(data);
            const lines = text.split('\n').filter(line => line.includes('v_s_sh'));
            const indices: NormalizedIndicator[] = [];

            for (const line of lines) {
              const match = line.match(/v_s_sh(\d+)="(.+)"/);
              if (!match || !match[2]) continue;

              const parts = match[2].split('~');
              if (parts.length < 6) continue;

              const name = parts[1].trim();
              const price = parseFloat(parts[3]);
              const change = parseFloat(parts[4]);
              const changePercent = parseFloat(parts[5]);

              if (isNaN(price)) continue;

              indices.push({
                id: `sh${match[1]}`,
                name,
                value: price,
                unit: 'index',
                timestamp: new Date(),
                change: {
                  value: change,
                  percentage: changePercent,
                  period: 'daily' as const,
                },
                historical: [],
              });
            }

            return indices;
          } catch (err) {
            console.error('[Tencent] Transform error:', err);
            return [];
          }
        }],
      }
    );

    const parsedData = response.data as NormalizedIndicator[];
    if (!parsedData || parsedData.length === 0) {
      throw new Error('腾讯财经API返回数据为空或解析失败');
    }

    return parsedData;
  }, TENCENT_RATE_LIMIT);
}

/**
 * 获取A股指数历史K线数据（近一年）
 * 注意：东方财富K线API可能失效，返回空数组作为fallback
 * @param indexId - 指数ID（如 'sh000001'）
 * @param days - 天数，默认365天
 */
export async function getChineseIndexHistory(indexId: string, days: number = 365): Promise<HistoricalDataPoint[]> {
  const secid = INDEX_SECID_MAP[indexId];
  if (!secid) {
    console.warn(`[EastMoney] Unknown indexId: ${indexId}`);
    return [];
  }

  try {
    return await rateLimiter.call('EastMoneyKline', async () => {
      const params = `secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&end=20500101&lmt=${days}`;
      const url = `${EASTMONEY_KLINE_URL}/api/qt/stock/kline/get?${params}`;

      console.log(`[EastMoney] Fetching history for ${indexId}...`);

      const response = await axios.get(url, {
        timeout: 10000, // 10秒超时
      });

      if (!response.data?.data?.klines) {
        console.warn(`[EastMoney] No klines data for ${indexId}, API may be down`);
        return [];
      }

      // 东方财富K线格式: "日期,开盘,收盘,最高,最低,成交量,成交额,振幅,涨跌幅,涨跌额,换手率"
      const klines: string[] = response.data.data.klines;
      const historical: HistoricalDataPoint[] = klines.map((line: string) => {
        const parts = line.split(',');
        // parts[0]=日期(如"2025-05-19"), parts[2]=收盘价
        return {
          timestamp: parseUTCDate(parts[0]),
          value: parseFloat(parts[2]),
        };
      });

      // 东方财富返回的是最新→最旧，需要反转
      console.log(`[EastMoney] Successfully parsed ${historical.length} points for ${indexId}`);
      return historical.reverse();
    }, EASTMONEY_KLINE_RATE_LIMIT);
  } catch (error) {
    console.warn(`[EastMoney] History API failed for ${indexId}:`, error instanceof Error ? error.message : 'Unknown error');
    // Fallback: 返回空数组，不影响当前数据显示
    return [];
  }
}