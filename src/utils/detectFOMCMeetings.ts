import { HistoricalDataPoint } from '../types/indicator';
import { DARK_THEME } from '../constants/colors';

export interface FOMCEvent {
  timestamp: Date;
  rate: number;
  decision: '加息' | '降息' | '维持';
  color: string;
}

export function detectFOMCMeetings(historical: HistoricalDataPoint[]): FOMCEvent[] {
  const events: FOMCEvent[] = [];

  // Iterate from i=1 to compare historical[i-1] to historical[i]
  for (let i = 1; i < historical.length; i++) {
    const prev = historical[i - 1].value;
    const curr = historical[i].value;

    // Skip if prev or curr is null
    if (prev === null || curr === null) {
      continue;
    }

    // Mark all FOMC meeting points (rate changes)
    if (prev !== curr) {
      events.push({
        timestamp: historical[i].timestamp,
        rate: curr,
        decision: '', // 去掉加息/降息字样，只显示利率
        color: '#f85149', // 统一用红色标记FOMC会议点
      });
    }
  }

  // Filter to past 1 year
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return events.filter(e => e.timestamp >= oneYearAgo);
}