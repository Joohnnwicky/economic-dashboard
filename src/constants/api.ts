export const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';
export const FRED_FED_RATE_SERIES = 'FEDFUNDS';
export const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// BLS API configuration - CRITICAL: 25 calls/day FREE tier!
export const BLS_BASE_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

// BLS series IDs
export const BLS_SERIES = {
  NFP: 'CES0000000001',              // Nonfarm Payrolls (thousands)
  UNEMPLOYMENT_RATE: 'LNS14000000',  // Unemployment Rate (%)
  CPI: 'CUSR0000SA0',                // CPI All Items
  CPI_CORE: 'CUSR0000SA0L1E',        // Core CPI (excludes food/energy)
} as const;

export const RATE_LIMITS = {
  FRED: { maxCallsPerDay: 1000, minIntervalMs: 100, cacheTtlMs: 300000 },
  // WARNING: BLS free tier = 25 calls/day. With 30-min cache, max 2 calls per hour = 48 calls/day possible
  // MUST cache aggressively or quota will be exhausted in minutes!
  BLS: { maxCallsPerDay: 25, minIntervalMs: 3600000, cacheTtlMs: 1800000 },
  AlphaVantage: { maxCallsPerDay: 25, minIntervalMs: 3600000, cacheTtlMs: 3600000 },
  CoinGecko: { maxCallsPerDay: 500, minIntervalMs: 1200, cacheTtlMs: 60000 },
} as const;