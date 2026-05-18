export type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export interface APIConfig {
  endpoint: string;
  rateLimit: {
    maxCallsPerDay: number;
    minIntervalMs: number;
    cacheTtlMs: number;
  };
}

export interface APIResponse<T> {
  data: T;
  timestamp: Date;
  error?: string;
}