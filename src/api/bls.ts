import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { BLS_BASE_URL, RATE_LIMITS } from '../constants/api';
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