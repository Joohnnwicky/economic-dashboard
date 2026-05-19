import { ALPHA_VANTAGE_SYMBOLS } from './api';

export const INDICATORS = {
  FED_RATE: {
    id: 'fed-rate',
    name: '联邦基金利率（FFR Federal Funds Rate）',
    unit: '%',
    source: 'FRED',
    seriesId: 'FEDFUNDS',
  },
} as const;

export const BTC = {
  id: 'btc',
  name: '比特币（BTC Bitcoin）',
  unit: 'USD',
  source: 'Binance',
  symbol: 'BTCUSDT',
} as const;

export const ETH = {
  id: 'eth',
  name: '以太坊（ETH Ethereum）',
  unit: 'USD',
  source: 'Binance',
  symbol: 'ETHUSDT',
} as const;

// Employment indicators from BLS
export const EMPLOYMENT = {
  id: 'employment',
  indicators: [
    { id: 'nfp', name: '非农就业人数（NFP Nonfarm Payrolls）', unit: 'K', seriesId: 'CES0000000001' },
    { id: 'unemployment-rate', name: '失业率（UR Unemployment Rate）', unit: '%', seriesId: 'LNS14000000' },
  ],
} as const;

// Inflation indicators from BLS
export const INFLATION = {
  id: 'inflation',
  indicators: [
    { id: 'cpi', name: '消费者物价指数（CPI）', unit: 'index', seriesId: 'CUSR0000SA0' },
  ],
} as const;

// US stock indices (静态数据展示)
// CRITICAL: 美股在中国白天闭市，使用静态JSON数据
export const US_INDICES = {
  dowJones: {
    id: 'dow-jones',
    name: '道琼斯工业平均指数（DJIA Dow Jones）',
    unit: 'index',
    source: 'Static JSON',
    symbol: 'DIA',
  },
  nasdaq: {
    id: 'nasdaq',
    name: '纳斯达克综合指数（NASDAQ Nasdaq Composite）',
    unit: 'index',
    source: 'Static JSON',
    symbol: 'QQQ',
  },
  sp500: {
    id: 'sp500',
    name: '标准普尔500指数（S&P 500）',
    unit: 'index',
    source: 'Static JSON',
    symbol: 'SPY',
  },
} as const;