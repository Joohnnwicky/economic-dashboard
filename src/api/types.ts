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