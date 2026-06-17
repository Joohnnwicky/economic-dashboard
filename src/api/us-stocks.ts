import axios from 'axios';
import { YFINANCE_BASE_URL } from '../constants/api';
import { HistoricalDataPoint } from '../types/indicator';

export interface USStockQuote {
  symbol: string;
  name: string;
  category: 'mag7' | 'semiconductor' | 'spacex';
  value: number;
  change?: {
    value: number;
    percentage: number;
  };
  timestamp: Date;
  /** 近 100 天日线收盘价，按时间升序 */
  historical: HistoricalDataPoint[];
  warning?: string;
}

// Mag 7 + Semiconductor expansion + SpaceX
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
  // SpaceX (2026-06-12 NASDAQ IPO)
  { symbol: 'SPCX', name: 'SpaceX', category: 'spacex' },
];

/**
 * 批量获取所有追踪美股
 * 后端 yfinance 一次拿 11 只股票，5 分钟缓存，无配额限制
 * 后端返回已规范化的数据，直接映射到 USStockQuote
 */
export async function getTrackedUSStocks(): Promise<USStockQuote[]> {
  const url = `${YFINANCE_BASE_URL}/us-stocks`;

  const response = await axios.get<USStockQuote[]>(url, {
    timeout: 60000, // 后端逐个获取需 ~25 秒，设 60 秒足够
  });

  // 后端返回 ISO 字符串时间戳，前端需转 Date 对象
  return response.data.map(stock => ({
    ...stock,
    timestamp: new Date(stock.timestamp as unknown as string),
    historical: stock.historical.map(h => ({
      timestamp: new Date(h.timestamp as unknown as string),
      value: h.value,
    })),
  }));
}
