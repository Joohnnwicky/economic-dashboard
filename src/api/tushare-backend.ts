import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { NormalizedIndicator } from '../types/indicator';

// Backend URL - 使用nginx代理路径
const TUSHARE_BACKEND_URL = '/api/backend';

const TUSHARE_RATE_LIMIT = {
  maxCallsPerDay: 2000,
  minIntervalMs: 200,
  cacheTtlMs: 1800000,  // 30 minutes
};

// ============================================================
// A股自选股雷达
// ============================================================

export interface AShareValuation {
  tradeDate: string | null;
  close: number | null;
  peTtm: number | null;
  pb: number | null;
  turnoverRate: number | null;
  volumeRatio: number | null;
  totalMv: number | null;   // 亿元
  circMv: number | null;    // 亿元
}

export interface AShareFinance {
  endDate: string | null;
  eps: number | null;
  roe: number | null;
  grossMargin: number | null;
  debtRatio: number | null;
  netProfitYoy: number | null;
  revenueYoy: number | null;
}

export interface FloatEvent {
  date: string | null;
  shares: number | null;   // 万股
  ratio: number | null;    // %
}

export interface BlockTradeEvent {
  date: string | null;
  price: number | null;
  amount: number | null;   // 亿元
}

export interface DragonTigerEvent {
  date: string | null;
  reason: string | null;
  netbuy: number | null;   // 亿元
  pctChange?: number | null;  // 上榜当日涨跌幅 %
}

export interface AShareRadarStock {
  code: string;
  tsCode: string;
  valuation: AShareValuation | null;
  finance: AShareFinance | null;
  risks: {
    pledgeRatio: number | null;
    upcomingFloats: FloatEvent[];
    recentBlocks: BlockTradeEvent[];
    dragonTiger: DragonTigerEvent[];
  };
}

export interface AShareRadarData {
  stocks: AShareRadarStock[];
  errors: Record<string, string>;
}

/**
 * 自选股雷达：Tushare 估值 + 财务指标 + 风险事件（质押/解禁/大宗/龙虎榜）
 */
export async function getAShareRadar(codes: string[]): Promise<AShareRadarData> {
  return rateLimiter.call('TushareBackend', async () => {
    const response = await axios.get(`${TUSHARE_BACKEND_URL}/a-share-radar`, {
      params: { codes: codes.join(',') },
    });
    return response.data;
  }, TUSHARE_RATE_LIMIT);
}

// ============================================================
// 中国利率（SHIBOR & LPR）
// ============================================================

export interface MacroSeries {
  seriesId: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  historical: { timestamp: string; value: number }[];
  pctChange?: number | null;
}

export interface ChinaRatesData {
  series: Record<string, MacroSeries>;
  errors: Record<string, string>;
}

/**
 * 中国利率：SHIBOR 隔夜/3月/1年 + LPR 1年/5年
 */
export async function getChinaRates(): Promise<ChinaRatesData> {
  return rateLimiter.call('TushareBackend', async () => {
    const response = await axios.get(`${TUSHARE_BACKEND_URL}/china-rates`);
    return response.data;
  }, TUSHARE_RATE_LIMIT);
}

// ============================================================
// 两融余额
// ============================================================

export interface MarginData {
  series: MacroSeries | null;
  errors: Record<string, string>;
}

/**
 * 沪深两市融资融券余额（亿元）
 */
export async function getAShareMargin(): Promise<MarginData> {
  return rateLimiter.call('TushareBackend', async () => {
    const response = await axios.get(`${TUSHARE_BACKEND_URL}/a-share-margin`);
    return response.data;
  }, TUSHARE_RATE_LIMIT);
}

// ============================================================
// 军工行业指数
// ============================================================

export interface DefenseSectorData {
  series: Record<string, MacroSeries>;
  errors: Record<string, string>;
}

/**
 * 军工行业指数：中证军工(399967.SZ) × 上证指数(000001.SH)
 */
export async function getDefenseSector(): Promise<DefenseSectorData> {
  return rateLimiter.call('TushareBackend', async () => {
    const response = await axios.get(`${TUSHARE_BACKEND_URL}/defense-sector`);
    return response.data;
  }, TUSHARE_RATE_LIMIT);
}

// ============================================================
// 后端 MacroSeries -> 前端 NormalizedIndicator 转换
// ============================================================

export function toNormalizedIndicator(series: MacroSeries | null | undefined): NormalizedIndicator | null {
  if (!series || series.historical.length === 0) return null;
  return {
    id: series.seriesId,
    name: series.name,
    value: series.value,
    unit: series.unit,
    timestamp: new Date(series.timestamp),
    historical: series.historical.map((p) => ({
      timestamp: new Date(p.timestamp),
      value: p.value,
    })),
  };
}
