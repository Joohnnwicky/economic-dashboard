import axios from 'axios';
import { rateLimiter } from './rate-limiter';
import { FRED_BASE_URL, FRED_MARKET_SERIES, RATE_LIMITS } from '../constants/api';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';
import { TimeRange } from '../types/api';
import { FredSeriesResponse } from './types';
import { parseUTCDate } from '../utils/utc';
import { format, subYears, subMonths, subDays } from 'date-fns';
import { downsampleData } from '../utils/downsampling';

function calculateStartDate(timeRange: TimeRange): Date {
  const now = new Date();
  switch (timeRange) {
    case '1D': return subDays(now, 1);
    case '1W': return subDays(now, 7);
    case '1M': return subMonths(now, 1);
    case '3M': return subMonths(now, 3);
    case '6M': return subMonths(now, 6);
    case '1Y': return subYears(now, 1);
    case 'ALL': return new Date(1970, 0, 1);
    default: return subYears(now, 1);
  }
}

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

type ChangePeriod = 'daily' | 'weekly' | 'monthly';

/**
 * 通用 FRED 序列规范化。与 forex.ts::normalizeForexData 同模式,
 * 支持指定 change 周期(日/周/月)。
 */
function normalizeFredSeries(
  response: FredSeriesResponse,
  id: string,
  name: string,
  unit: string,
  changePeriod: ChangePeriod,
): NormalizedIndicator {
  const historical: HistoricalDataPoint[] = response.observations
    .filter((obs) => obs.value !== '.')
    .map((obs) => ({
      timestamp: parseUTCDate(obs.date),
      value: parseFloat(obs.value),
    }));

  const current = historical[historical.length - 1];
  const previous = historical[historical.length - 2];

  let change = undefined;
  if (current && previous && previous.value !== null && current.value !== null) {
    const changeValue = current.value - previous.value;
    // previous.value 为 0 时跳过百分比(避免除零),仅保留绝对变化
    const changePct = previous.value !== 0 ? (changeValue / Math.abs(previous.value)) * 100 : 0;
    change = { value: changeValue, percentage: changePct, period: changePeriod };
  }

  return {
    id,
    name,
    value: current?.value ?? 0,
    unit,
    timestamp: current?.timestamp ?? new Date(),
    change,
    historical,
  };
}

async function fetchFredSeries(
  seriesId: string,
  timeRange: TimeRange,
  id: string,
  name: string,
  unit: string,
  changePeriod: ChangePeriod,
): Promise<NormalizedIndicator> {
  const endDate = new Date();
  const startDate = calculateStartDate(timeRange);
  const url = `${FRED_BASE_URL}/series/observations?series_id=${seriesId}&observation_start=${formatDate(startDate)}&observation_end=${formatDate(endDate)}`;

  return rateLimiter.call('FRED', async () => {
    const response = await axios.get<FredSeriesResponse>(url);
    if (!response.data?.observations) {
      throw new Error(`FRED ${seriesId} response missing observations`);
    }
    const data = normalizeFredSeries(response.data, id, name, unit, changePeriod);
    if (data.historical.length > 365) {
      data.historical = downsampleData(data.historical, 365);
    }
    return data;
  }, RATE_LIMITS.FRED);
}

/** VIX 恐慌指数 (CBOE Volatility Index, 日频收盘)。 */
export function getVix(timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  return fetchFredSeries(
    FRED_MARKET_SERIES.VIX, timeRange,
    'vix', 'VIX 恐慌指数（CBOE Volatility Index）', 'index', 'daily',
  );
}

/** 初请失业金 (Initial Jobless Claims, 周频, 单位:千人)。 */
export function getInitialClaims(timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  return fetchFredSeries(
    FRED_MARKET_SERIES.INITIAL_CLAIMS, timeRange,
    'initial-claims', '初请失业金人数（Initial Jobless Claims）', 'K', 'weekly',
  );
}

/** ISM 制造业 PMI (月频, 50=荣枯线)。 */
export function getIsmPmi(timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  return fetchFredSeries(
    FRED_MARKET_SERIES.ISM_PMI, timeRange,
    'ism-pmi', 'ISM 制造业 PMI（ISM Manufacturing PMI）', 'index', 'monthly',
  );
}

/** 密歇根大学消费者信心指数 (月频)。 */
export function getMichiganSentiment(timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  return fetchFredSeries(
    FRED_MARKET_SERIES.MICH_SENTIMENT, timeRange,
    'michigan-sentiment', '密歇根消费者信心指数（UM Consumer Sentiment）', 'index', 'monthly',
  );
}

/** 10Y-2Y 国债收益率利差 (日频, FRED 预计算序列 T10Y2Y)。 */
export function getYieldSpread(timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  return fetchFredSeries(
    FRED_MARKET_SERIES.YIELD_SPREAD_10Y2Y, timeRange,
    'yield-spread-10y2y', '10Y-2Y 国债收益率利差（Yield Curve Spread）', '%', 'daily',
  );
}

/** NBER 衰退标志 (月频, 0/1)。用于利差图衰退期阴影。 */
export function getRecessionFlag(timeRange: TimeRange = '1Y'): Promise<NormalizedIndicator> {
  return fetchFredSeries(
    FRED_MARKET_SERIES.RECESSION, timeRange,
    'us-recession', 'NBER 衰退标志（US Recession Indicator）', 'index', 'monthly',
  );
}
