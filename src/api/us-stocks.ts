import axios from 'axios';
import { ALPHA_VANTAGE_BASE_URL } from '../constants/api';

export interface USStockQuote {
  symbol: string;
  name: string;
  category: 'mag7' | 'semiconductor' | 'spacex-proxy';
  value: number;
  change?: {
    value: number;
    percentage: number;
  };
  timestamp: Date;
  warning?: string;
}

// Mag 7 + Semiconductor expansion + SpaceX proxy (DXYZ)
// 排序：按用户决策（Mag 7 → 半导体扩展 → SpaceX 代理）
export const TRACKED_STOCKS: Array<{
  symbol: string;
  name: string;
  category: USStockQuote['category'];
}> = [
  // Magnificent 7
  { symbol: 'AAPL', name: '苹果（Apple）', category: 'mag7' },
  { symbol: 'MSFT', name: '微软（Microsoft）', category: 'mag7' },
  { symbol: 'GOOGL', name: '谷歌（Alphabet）', category: 'mag7' },
  { symbol: 'AMZN', name: '亚马逊（Amazon）', category: 'mag7' },
  { symbol: 'NVDA', name: '英伟达（NVIDIA）', category: 'mag7' },
  { symbol: 'META', name: 'Meta（Facebook）', category: 'mag7' },
  { symbol: 'TSLA', name: '特斯拉（Tesla）', category: 'mag7' },
  // Semiconductor expansion
  { symbol: 'AVGO', name: '博通（Broadcom）', category: 'semiconductor' },
  { symbol: 'AMD', name: 'AMD', category: 'semiconductor' },
  { symbol: 'TSM', name: '台积电（TSMC）', category: 'semiconductor' },
  // SpaceX proxy
  { symbol: 'DXYZ', name: 'SpaceX 代理（Destiny Tech100 ETF）', category: 'spacex-proxy' },
];

interface AlphaVantageResponse {
  'Meta Data'?: {
    '2. Symbol': string;
    '3. Last Refreshed': string;
  };
  'Time Series (Daily)'?: Record<string, {
    '1. open': string;
    '2. high': string;
    '3. low': string;
    '4. close': string;
    '5. volume': string;
  }>;
  warning?: string;
  symbol?: string;
}

/**
 * 获取单个美股代码的最新报价
 * 后端做了 1 小时缓存 + 25/天配额管理，遇配额耗尽返回 {warning, symbol}
 */
export async function getUSStockQuote(
  symbol: string,
  name: string,
  category: USStockQuote['category'],
): Promise<USStockQuote> {
  const url = `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact`;

  const response = await axios.get<AlphaVantageResponse>(url);
  const data = response.data;

  // 后端配额耗尽时返回 {warning, symbol}
  if (data.warning) {
    return {
      symbol,
      name,
      category,
      value: 0,
      timestamp: new Date(),
      warning: data.warning,
    };
  }

  const timeSeries = data['Time Series (Daily)'];
  if (!timeSeries) {
    throw new Error(`${symbol}: 响应缺少 Time Series (Daily)`);
  }

  // 按日期降序排序，取最新和前一日
  const dates = Object.keys(timeSeries).sort().reverse();
  if (dates.length === 0) {
    throw new Error(`${symbol}: 无可用数据`);
  }

  const latest = timeSeries[dates[0]];
  const previous = dates.length > 1 ? timeSeries[dates[1]] : null;

  const close = parseFloat(latest['4. close']);
  const prevClose = previous ? parseFloat(previous['4. close']) : null;

  const change = prevClose !== null && prevClose > 0
    ? {
        value: close - prevClose,
        percentage: ((close - prevClose) / prevClose) * 100,
      }
    : undefined;

  return {
    symbol,
    name,
    category,
    value: close,
    change,
    timestamp: new Date(dates[0]),
  };
}

/**
 * 批量并发获取追踪列表内所有美股报价
 * 单个失败不影响其他，失败的项返回 warning 字段
 */
export async function getTrackedUSStocks(): Promise<USStockQuote[]> {
  const results = await Promise.allSettled(
    TRACKED_STOCKS.map(s => getUSStockQuote(s.symbol, s.name, s.category)),
  );

  return results.map((result, idx) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    const stock = TRACKED_STOCKS[idx];
    return {
      symbol: stock.symbol,
      name: stock.name,
      category: stock.category,
      value: 0,
      timestamp: new Date(),
      warning: result.reason instanceof Error ? result.reason.message : '加载失败',
    };
  });
}
