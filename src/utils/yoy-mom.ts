import { subYears, subMonths, isSameMonth, isSameDay } from 'date-fns';
import { HistoricalDataPoint } from '../types/indicator';

/**
 * Calculate year-over-year percentage change for a historical data series.
 * Returns null for first year (no prior data) or when division by zero would occur.
 */
export function calculateYoY(data: HistoricalDataPoint[]): (number | null)[] {
  return data.map((point, index) => {
    // Find same month one year ago
    const priorDate = subYears(point.timestamp, 1);
    const priorPoint = data.find((d) => isSameMonth(d.timestamp, priorDate));

    if (!priorPoint || priorPoint.value === null || point.value === null) {
      return null;
    }

    // Division by zero protection
    if (priorPoint.value === 0) {
      return null;
    }

    return ((point.value - priorPoint.value) / priorPoint.value) * 100;
  });
}

/**
 * Calculate month-over-month percentage change for a historical data series.
 * Returns null for first month or when division by zero would occur.
 */
export function calculateMoM(data: HistoricalDataPoint[]): (number | null)[] {
  return data.map((point, index) => {
    if (index === 0) {
      return null; // First month has no previous
    }

    const previousPoint = data[index - 1];

    if (!previousPoint || previousPoint.value === null || point.value === null) {
      return null;
    }

    // Division by zero protection
    if (previousPoint.value === 0) {
      return null;
    }

    return ((point.value - previousPoint.value) / previousPoint.value) * 100;
  });
}

/**
 * Calculate YoY for a single data point by looking up prior year in historical data.
 */
export function calculateYoYForPoint(
  timestamp: Date,
  historical: HistoricalDataPoint[]
): number | null {
  const priorDate = subYears(timestamp, 1);
  const priorPoint = historical.find((d) => isSameMonth(d.timestamp, priorDate));

  if (!priorPoint || priorPoint.value === null) {
    return null;
  }

  const currentPoint = historical.find((d) => isSameDay(d.timestamp, timestamp) || isSameMonth(d.timestamp, timestamp));
  if (!currentPoint || currentPoint.value === null) {
    return null;
  }

  if (priorPoint.value === 0) {
    return null;
  }

  return ((currentPoint.value - priorPoint.value) / priorPoint.value) * 100;
}

/**
 * Calculate MoM for a single data point by looking up previous month in historical data.
 */
export function calculateMoMForPoint(
  timestamp: Date,
  historical: HistoricalDataPoint[]
): number | null {
  const previousDate = subMonths(timestamp, 1);
  const previousPoint = historical.find((d) => isSameMonth(d.timestamp, previousDate));

  if (!previousPoint || previousPoint.value === null) {
    return null;
  }

  const currentPoint = historical.find((d) => isSameDay(d.timestamp, timestamp) || isSameMonth(d.timestamp, timestamp));
  if (!currentPoint || currentPoint.value === null) {
    return null;
  }

  if (previousPoint.value === 0) {
    return null;
  }

  return ((currentPoint.value - previousPoint.value) / previousPoint.value) * 100;
}