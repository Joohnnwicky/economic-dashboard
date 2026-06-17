import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { BLS_BASE_URL, BLS_SERIES, RATE_LIMITS } from '../constants/api';
import { NormalizedIndicator } from '../types/indicator';
import { TimeRange } from '../types/api';
import { BLSResponse } from './types';
import { parseBLSDate, calculateStartDate } from '../utils/utc';

// Track daily call count for quota warning
let blsCallCount = 0;
const MAX_BLS_CALLS_PER_DAY = 25;

export interface BLSSeriesData {
  seriesId: string;
  data: Array<{ timestamp: Date; value: number }>;
}

export async function fetchBLSSeries(seriesIds: string[], timeRange: TimeRange): Promise<Record<string, BLSSeriesData>> {
  // API Key由后端注入，前端不传递
  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);

  // BLS API requires POST for multiple series
  const body = {
    seriesid: seriesIds,
    startyear: startDate.getFullYear().toString(),
    endyear: endDate.getFullYear().toString(),
  };

  return rateLimiter.call('BLS', async () => {
    const response = await axios.post<BLSResponse & { error?: string }>(BLS_BASE_URL, body);

    if (response.data?.error) {
      throw new Error(response.data.error);
    }

    if (!response.data?.Results?.series) {
      throw new Error('BLS response missing Results.series');
    }

    const result: Record<string, BLSSeriesData> = {};

    for (const series of response.data.Results.series) {
      const dataPoints = series.data
        .filter(d => d.value !== '-') // BLS uses '-' for missing
        .map(d => ({
          timestamp: parseBLSDate(d.year, d.period),
          value: parseFloat(d.value),
        }))
        .reverse(); // BLS returns newest first, we want chronological

      result[series.seriesID] = {
        seriesId: series.seriesID,
        data: dataPoints,
      };
    }

    return result;
  }, RATE_LIMITS.BLS);
}

// Get Employment data (NFP + Unemployment Rate)
export async function getEmploymentData(timeRange: TimeRange): Promise<NormalizedIndicator[]> {
  const seriesIds = [BLS_SERIES.NFP, BLS_SERIES.UNEMPLOYMENT_RATE];
  const data = await fetchBLSSeries(seriesIds, timeRange);

  return seriesIds.map(seriesId => {
    const seriesData = data[seriesId];
    const current = seriesData?.data[seriesData.data.length - 1];

    return {
      id: seriesId === BLS_SERIES.NFP ? 'nfp' : 'unemployment-rate',
      name: seriesId === BLS_SERIES.NFP ? '非农就业人数（NFP Nonfarm Payrolls）' : '失业率（UR Unemployment Rate）',
      value: current?.value || 0,
      unit: seriesId === BLS_SERIES.NFP ? 'K' : '%',
      timestamp: current?.timestamp || new Date(),
      historical: seriesData?.data || [],
    };
  });
}

// Get CPI inflation data
export async function getInflationData(timeRange: TimeRange): Promise<NormalizedIndicator> {
  const seriesIds = [BLS_SERIES.CPI];
  const data = await fetchBLSSeries(seriesIds, timeRange);

  const cpiData = data[BLS_SERIES.CPI]?.data || [];
  const current = cpiData[cpiData.length - 1];

  return {
    id: 'cpi',
    name: 'CPI消费者物价指数',
    value: current?.value || 0,
    unit: 'index',
    timestamp: current?.timestamp || new Date(),
    historical: cpiData,
  };
}