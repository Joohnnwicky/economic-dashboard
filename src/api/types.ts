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