import { format } from 'date-fns';
import { TimeRange } from '../types/api';

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatPrice(value: number, unit: string): string {
  return unit === 'USD' ? `$${value.toLocaleString()}` : `${value.toLocaleString()} ${unit}`;
}

export function formatLargeNumber(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}

export function formatChartDate(date: Date, timeRange: TimeRange): string {
  switch (timeRange) {
    case '1D':
      return format(date, 'HH:mm');
    case '1W':
    case '1M':
      return format(date, 'MM/dd');
    case '3M':
    case '6M':
    case '1Y':
      return format(date, 'yyyy-MM');
    case 'ALL':
      return format(date, 'yyyy');
    default:
      return format(date, 'yyyy-MM-dd');
  }
}