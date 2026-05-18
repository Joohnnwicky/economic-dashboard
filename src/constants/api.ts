export const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';
export const FRED_FED_RATE_SERIES = 'FEDFUNDS';
export const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export const RATE_LIMITS = {
  FRED: { maxCallsPerDay: 1000, minIntervalMs: 100, cacheTtlMs: 300000 },
  BLS: { maxCallsPerDay: 25, minIntervalMs: 3600000, cacheTtlMs: 1800000 },
  AlphaVantage: { maxCallsPerDay: 25, minIntervalMs: 3600000, cacheTtlMs: 3600000 },
  CoinGecko: { maxCallsPerDay: 500, minIntervalMs: 1200, cacheTtlMs: 60000 },
} as const;