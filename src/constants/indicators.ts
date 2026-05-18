import { ALPHA_VANTAGE_SYMBOLS } from './api';

export const INDICATORS = {
  FED_RATE: {
    id: 'fed-rate',
    name: '美联储利率',
    unit: '%',
    source: 'FRED',
    seriesId: 'FEDFUNDS',
  },
} as const;

export const BTC = {
  id: 'btc',
  name: '比特币',
  unit: 'USD',
  source: 'CoinGecko',
  coinGeckoId: 'bitcoin',
} as const;

export const ETH = {
  id: 'eth',
  name: '以太坊',
  unit: 'USD',
  source: 'CoinGecko',
  coinGeckoId: 'ethereum',
} as const;

// Employment indicators from BLS
export const EMPLOYMENT = {
  id: 'employment',
  indicators: [
    { id: 'nfp', name: '非农就业人数', unit: 'K', seriesId: 'CES0000000001' },
    { id: 'unemployment-rate', name: '失业率', unit: '%', seriesId: 'LNS14000000' },
  ],
} as const;

// Inflation indicators from BLS
export const INFLATION = {
  id: 'inflation',
  indicators: [
    { id: 'cpi', name: 'CPI消费者物价指数', unit: 'index', seriesId: 'CUSR0000SA0' },
  ],
} as const;

// US stock indices from Alpha Vantage
// CRITICAL: Alpha Vantage free tier = 25 calls/day
// Updates are hourly due to API quota limitation
export const US_INDICES = {
  dowJones: {
    id: 'dow-jones',
    name: '道琼斯指数',
    unit: 'index',
    source: 'Alpha Vantage',
    symbol: ALPHA_VANTAGE_SYMBOLS.DOW_JONES,
  },
  nasdaq: {
    id: 'nasdaq',
    name: '纳斯达克指数',
    unit: 'index',
    source: 'Alpha Vantage',
    symbol: ALPHA_VANTAGE_SYMBOLS.NASDAQ,
  },
  sp500: {
    id: 'sp500',
    name: '标普500指数',
    unit: 'index',
    source: 'Alpha Vantage',
    symbol: ALPHA_VANTAGE_SYMBOLS.SP500,
  },
} as const;