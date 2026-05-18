// 开发环境使用 Vite 代理，生产环境直接访问
const isDev = import.meta.env.DEV;

export const FRED_BASE_URL = isDev ? '/api/fred' : 'https://api.stlouisfed.org/fred';
export const FRED_FED_RATE_SERIES = 'FEDFUNDS';
export const FRED_CPI_SERIES = 'CPIAUCSL';  // CPI All Urban Consumers
export const COINGECKO_BASE_URL = isDev ? '/api/coingecko' : 'https://api.coingecko.com/api/v3';

// BLS API configuration - CRITICAL: 25 calls/day FREE tier!
// 开发环境使用代理路径
export const BLS_BASE_URL = isDev ? '/api/bls/timeseries/data/' : 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

// BLS series IDs
export const BLS_SERIES = {
  NFP: 'CES0000000001',              // Nonfarm Payrolls (thousands)
  UNEMPLOYMENT_RATE: 'LNS14000000',  // Unemployment Rate (%)
  CPI: 'CUSR0000SA0',                // CPI All Items
  CPI_CORE: 'CUSR0000SA0L1E',        // Core CPI (excludes food/energy)
} as const;

// Alpha Vantage API configuration - CRITICAL: 25 calls/day FREE tier!
// 开发环境使用代理路径
export const ALPHA_VANTAGE_BASE_URL = isDev ? '/api/alphavantage' : 'https://www.alphavantage.co/query';

// Alpha Vantage symbols for US indices
// NOTE: Alpha Vantage TIME_SERIES_DAILY API doesn't support index symbols directly.
// Using ETF proxies: DIA (Dow), QQQ (Nasdaq-100), SPY (S&P 500)
export const ALPHA_VANTAGE_SYMBOLS = {
  DOW_JONES: 'DIA',           // Dow Jones Industrial Average ETF
  NASDAQ: 'QQQ',              // Nasdaq-100 ETF
  SP500: 'SPY',               // S&P 500 ETF
} as const;

export const RATE_LIMITS = {
  FRED: { maxCallsPerDay: 1000, minIntervalMs: 100, cacheTtlMs: 300000 },
  // WARNING: BLS free tier = 25 calls/day. With 30-min cache, max 2 calls per hour = 48 calls/day possible
  // MUST cache aggressively or quota will be exhausted in minutes!
  BLS: { maxCallsPerDay: 25, minIntervalMs: 3600000, cacheTtlMs: 1800000 },
  // WARNING: Alpha Vantage free tier = 25 calls/day. With 60-min cache, max 24 calls per day
  // Indices update slowly, so 60-min cache is acceptable for real-time display
  AlphaVantage: { maxCallsPerDay: 25, minIntervalMs: 3600000, cacheTtlMs: 3600000 },
  CoinGecko: { maxCallsPerDay: 500, minIntervalMs: 1200, cacheTtlMs: 60000 },
} as const;