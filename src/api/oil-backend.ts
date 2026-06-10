import axios from 'axios';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';

/**
 * 从后端获取国内+国际油价数据
 */
export async function getOilPriceFromBackend(): Promise<{
  domestic: NormalizedIndicator | null;
  international: NormalizedIndicator | null;
}> {
  const response = await axios.get('/api/backend/oil-price');
  const d = response.data;

  // 新格式: { domestic: {...}, international: {...} }
  const mapToIndicator = (item: any): NormalizedIndicator | null => {
    if (!item) return null;
    const historical: HistoricalDataPoint[] = (item.historical || []).map((h: { timestamp: string; value: number }) => ({
      timestamp: new Date(h.timestamp),
      value: h.value,
    }));
    return {
      id: item.seriesId?.toLowerCase() || 'oil',
      name: item.name || '',
      value: item.value || 0,
      unit: item.unit || '',
      timestamp: new Date(item.timestamp || new Date()),
      change: item.change ? {
        value: item.change.value,
        percentage: item.change.percentage,
        period: 'daily' as const,
      } : undefined,
      historical,
    };
  };

  return {
    domestic: mapToIndicator(d.domestic),
    international: mapToIndicator(d.international),
  };
}
