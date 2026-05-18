export interface NormalizedIndicator {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  change?: {
    value: number;
    percentage: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  };
  historical: HistoricalDataPoint[];
}

export interface HistoricalDataPoint {
  timestamp: Date;
  value: number | null;
}