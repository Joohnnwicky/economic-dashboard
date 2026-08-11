// 所有API请求通过Python后端代理，API Key不暴露给前端
export const BACKEND_BASE_URL = '/api/backend';

// FRED API - 通过后端代理
export const FRED_BASE_URL = `${BACKEND_BASE_URL}/fred`;
export const FRED_FED_RATE_SERIES = 'FEDFUNDS';
export const FRED_CPI_SERIES = 'CPIAUCSL';  // CPI All Urban Consumers

// FRED Commodity Series IDs
export const FRED_GOLD_SERIES = 'GOLDAMGBD228NLBM';   // LBMA Gold Price AM Fix ($/oz)
export const FRED_BRENT_SERIES = 'DCOILBRENTEU';      // Brent Crude Oil ($/barrel)
export const FRED_WTI_SERIES = 'DCOILWTICO';          // WTI Crude Oil ($/barrel)

// FRED Currency/Exchange Rate Series IDs
export const FRED_DXY_SERIES = 'DTWEXBGS';            // Trade Weighted Dollar Index (Broad)
export const FRED_USDCNY_SERIES = 'DEXCHUS';          // China/U.S. Foreign Exchange Rate

// FRED US Treasury Yield Series IDs (美债收益率)
export const FRED_TREASURY_SERIES = {
  DGS10: 'DGS10',   // 10-Year Treasury Constant Maturity Rate
  DGS2: 'DGS2',     // 2-Year Treasury Constant Maturity Rate
  DGS30: 'DGS30',   // 30-Year Treasury Constant Maturity Rate
  DGS3MO: 'DGS3MO', // 3-Month Treasury Constant Maturity Rate
} as const;

// FRED US Market & Macro Leading Indicators (美股市场与先行指标)
export const FRED_MARKET_SERIES = {
  VIX: 'VIXCLS',        // CBOE Volatility Index (VIX) - 恐慌指数, 日频
  INITIAL_CLAIMS: 'ICSA',    // Initial Jobless Claims - 初请失业金, 周频(千人)
  ISM_PMI: 'CFNAI',    // Chicago Fed National Activity Index - 芝加哥联储活动指数, 月频(0=趋势线) [ISM PMI(NAPM)已从 FRED 下架, 以 CFNAI 替代]
  MICH_SENTIMENT: 'UMCSENT', // University of Michigan Consumer Sentiment - 消费者信心, 月频
  YIELD_SPREAD_10Y2Y: 'T10Y2Y', // 10-Year minus 2-Year Treasury spread - 收益率利差, 日频
  RECESSION: 'USREC',  // NBER based Recession Indicator - 衰退标志, 月频(0/1)
} as const;

// FRED China Economic Indicators Series IDs (中国经济指标)
export const FRED_CHINA_SERIES = {
  GDP: 'CHNGDPNQDSMEI',       // China Gross Domestic Product (Quarterly)
  CPI: 'CHNCPIALLMINMEI',     // China Consumer Price Index
  // IP: 'CHNIPNINDXMEI',     // China Industrial Production Index (series已失效)
} as const;

// BLS API - 通过后端代理 (去掉尾部斜杠避免307重定向)
export const BLS_BASE_URL = `${BACKEND_BASE_URL}/bls/timeseries/data`;

// BLS series IDs
export const BLS_SERIES = {
  NFP: 'CES0000000001',              // Nonfarm Payrolls (thousands)
  UNEMPLOYMENT_RATE: 'LNS14000000',  // Unemployment Rate (%)
  CPI: 'CUSR0000SA0',                // CPI All Items
  CPI_CORE: 'CUSR0000SA0L1E',        // Core CPI (excludes food/energy)
} as const;

// Alpha Vantage API - 通过后端代理
export const ALPHA_VANTAGE_BASE_URL = `${BACKEND_BASE_URL}/alphavantage/query`;

// Alpha Vantage symbols for US indices
export const ALPHA_VANTAGE_SYMBOLS = {
  DOW_JONES: 'DIA',           // Dow Jones Industrial Average ETF
  NASDAQ: 'QQQ',              // Nasdaq-100 ETF
  SP500: 'SPY',               // S&P 500 ETF
} as const;

// Binance API - 通过后端代理
export const BINANCE_BASE_URL = `${BACKEND_BASE_URL}/binance`;

// yfinance API - 通过后端代理（无key，无日配额，5分钟缓存）
export const YFINANCE_BASE_URL = `${BACKEND_BASE_URL}/yfinance`;

// Coinbase API - 通过后端代理（溢价指数 = Coinbase BTC/USD - Binance BTC/USDT）
export const COINBASE_BASE_URL = `${BACKEND_BASE_URL}/coinbase`;

// 加密牛熊信号 - 通过后端代理（恐惧贪婪+200日均线偏离+PiCycle）
export const CRYPTO_SIGNALS_BASE_URL = `${BACKEND_BASE_URL}/crypto-signals`;

// 加密市场市占率 + 山寨季 - 通过后端代理（CoinGecko, 1h缓存）
export const MARKET_DOMINANCE_BASE_URL = `${BACKEND_BASE_URL}/market-dominance`;

// BTC 链上数据 - 通过后端代理（mempool.space, 30min缓存）
export const ONCHAIN_BASE_URL = `${BACKEND_BASE_URL}/onchain`;

// 经济日历 - 通过后端代理（Finnhub, 1h缓存）
export const ECONOMIC_CALENDAR_BASE_URL = `${BACKEND_BASE_URL}/economic-calendar`;

// FOMC 会议日历 + 倒计时 - 通过后端代理（公开日程, 1h缓存）
export const FEDWATCH_BASE_URL = `${BACKEND_BASE_URL}/fedwatch`;

export const RATE_LIMITS = {
  FRED: { maxCallsPerDay: 1000, minIntervalMs: 100, cacheTtlMs: 300000 },
  // BLS free tier = 25 calls/day. 后端已有30分钟缓存+API key配额管控，前端不再硬限速。
  // 共用同一'BLS' rateLimiter计数器会让多个BLS hook串行排队1小时，导致面板永远加载不出来。
  BLS: { maxCallsPerDay: 25, minIntervalMs: 100, cacheTtlMs: 1800000 },
  // Alpha Vantage free tier = 25 calls/day. 同上，后端已缓存1小时，前端不再叠加限速。
  AlphaVantage: { maxCallsPerDay: 25, minIntervalMs: 100, cacheTtlMs: 3600000 },
} as const;