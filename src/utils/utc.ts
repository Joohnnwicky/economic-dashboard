import { subYears, subMonths, subDays } from 'date-fns';
import { TimeRange } from '../types/api';

export function parseUTCDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// Parse BLS year+period format to UTC Date
export function parseBLSDate(year: string, period: string): Date {
  const month = parseInt(period.replace('M', '')) - 1; // M01 = January = 0
  return new Date(Date.UTC(parseInt(year), month, 1));
}

// Calculate start date based on time range
export function calculateStartDate(timeRange: TimeRange): Date {
  const now = new Date();
  switch (timeRange) {
    case '1D': return subDays(now, 1);
    case '1W': return subDays(now, 7);
    case '1M': return subMonths(now, 1);
    case '3M': return subMonths(now, 3);
    case '6M': return subMonths(now, 6);
    case '1Y': return subYears(now, 1);
    case 'ALL': return new Date(1950, 0, 1);
    default: return subYears(now, 1);
  }
}

export function toUTC(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    )
  );
}

export function nowUTC(): Date {
  return toUTC(new Date());
}