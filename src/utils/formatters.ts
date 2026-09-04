import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { TimeRange } from '../types/api';

export function formatPercentage(value: number, decimals: number = 2): string {
  // If value is < 1, assume it's already a decimal (0.05 = 5%)
  const percentage = value < 1 && value > -1 ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
}

export function formatPrice(value: number, unit: string): string {
  // For indices, use Chinese format
  if (unit === 'index') {
    return formatChineseNumber(value);
  }

  // For USD, use standard format
  if (unit === 'USD') {
    return `$${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // For BTC/ETH, format with unit
  if (unit === 'BTC' || unit === 'ETH') {
    return `${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
  }

  // For Gold (USD per ounce)
  if (unit === 'USD/oz') {
    return `$${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/oz`;
  }

  // For Oil (USD per barrel)
  if (unit === 'USD/barrel') {
    return `$${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/桶`;
  }

  // Default: number with unit
  return `${value.toLocaleString('zh-CN')} ${unit}`;
}

// Format large numbers in Chinese convention (万, 亿)
export function formatChineseNumber(value: number): string {
  if (Math.abs(value) >= 100000000) {
    return `${(value / 100000000).toFixed(2)}亿`;
  }
  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(2)}万`;
  }
  return value.toLocaleString('zh-CN');
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
      return format(date, 'MM/dd', { locale: zhCN });
    case '3M':
    case '6M':
    case '1Y':
      return format(date, 'yyyy-MM', { locale: zhCN });
    case 'ALL':
      return format(date, 'yyyy');
    default:
      return format(date, 'yyyy-MM-dd', { locale: zhCN });
  }
}

/**
 * 按全局时间范围切片历史数据（顶部 FilterBar 选择器驱动所有趋势图）。
 * 切片后不足 2 个点（如月度/季度宏观数据配短窗口）时回退全量，避免空图。
 */
const RANGE_DAYS: Partial<Record<TimeRange, number>> = {
  '1M': 31,
  '3M': 92,
  '6M': 183,
  '1Y': 366,
};

export function sliceByTimeRange<T extends { timestamp: Date | string }>(points: T[], range: TimeRange): T[] {
  const days = RANGE_DAYS[range];
  if (!days) return points; // ALL 或未知范围
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  const sliced = points.filter((p) => new Date(p.timestamp).getTime() >= cutoff);
  return sliced.length >= 2 ? sliced : points;
}
