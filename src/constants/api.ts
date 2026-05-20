// 生产环境也使用nginx代理路径（NAS部署时代理转发请求）
// 开发环境使用Vite代理，生产环境使用nginx代理
const isDev = import.meta.env.DEV;

export const FRED_BASE_URL = '/api/fred';
export const FRED_FED_RATE_SERIES = 'FEDFUNDS';
export const FRED_CPI_SERIES = 'CPIAUCSL';  // CPI All Urban Consumers

// FRED Commodity Series IDs
export const FRED_GOLD_SERIES = 'GOLDAMGBD228NLBM';   // LBMA Gold Price AM Fix ($/oz)
export const FRED_BRENT_SERIES = 'DCOILBRENTEU';      // Brent Crude Oil ($/barrel)
export const FRED_WTI_SERIES = 'DCOILWTICO';          // WTI Crude Oil ($/barrel)

// FRED Currency/Exchange Rate Series IDs
export const FRED_DXY_SERIES = 'DTWEXBGS';            // Trade Weighted Dollar Index (Broad)
export const FRED_USDCNY_SERIES = 'DEXCHUS';          // China/U.S. Foreign Exchange Rate
export const COINGECKO_BASE_URL = '/api/coingecko';

// BLS API configuration - CRITICAL: 25 calls/day FREE tier!
// 使用nginx代理路径
export const BLS_BASE_URL = '/api/bls/timeseries/data/';

// BLS series IDs
export const BLS_SERIES = {
  NFP: 'CES0000000001',              // Nonfarm Payrolls (thousands)
  UNEMPLOYMENT_RATE: 'LNS14000000',  // Unemployment Rate (%)
  CPI: 'CUSR0000SA0',                // CPI All Items
  CPI_CORE: 'CUSR0000SA0L1E',        // Core CPI (excludes food/energy)
} as const;

// Alpha Vantage API configuration - CRITICAL: 25 calls/day FREE tier!
// 使用nginx代理路径
export const ALPHA_VANTAGE_BASE_URL = '/api/alphavantage';

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