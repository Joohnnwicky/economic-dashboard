export interface FredSeriesResponse {
  observations: FredObservation[];
}

export interface FredObservation {
  date: string;
  value: string;
}

// CoinGecko API response types
export interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change: number;
    last_updated_at: number;
  };
}

export interface CoinGeckoHistoryResponse {
  prices: Array<[number, number]>; // [timestamp, price]
}

// BLS API response structure
export interface BLSResponse {
  Results: {
    series: Array<{
      seriesID: string;
      data: Array<{
        year: string;
        period: string;      // M01, M02, etc.
        periodName: string;  // January, February, etc.
        value: string;       // BLS returns strings!
        footnotes: Array<{ code: string; text: string }>;
      }>;
    }>;
  };
}

// Alpha Vantage TIME_SERIES_DAILY response
export interface AlphaVantageDailyResponse {
  'Time Series (Daily)': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;    // We use close price
      '5. volume': string;
    };
  };
}

// Alpha Vantage QUOTE endpoint (current price)
export interface AlphaVantageQuoteResponse {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;    // Current price
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
}