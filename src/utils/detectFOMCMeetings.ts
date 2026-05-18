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

    // Only mark actual rate changes (prev !== curr)
    if (prev !== curr) {
      // Determine decision type per D-12
      const decision: '加息' | '降息' | '维持' =
        curr > prev ? '加息' : curr < prev ? '降息' : '维持';

      // Color coding per D-12
      const color = decision === '加息'
        ? DARK_THEME.accent[2]  // Red (#f85149)
        : decision === '降息'
          ? DARK_THEME.accent[1]  // Green (#3fb950)
          : DARK_THEME.textMuted; // Gray (#8b949e) - for holds (unlikely when prev !== curr)

      events.push({
        timestamp: historical[i].timestamp,
        rate: curr,
        decision,
        color,
      });
    }
  }

  // Filter to past 1 year per D-14
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return events.filter(e => e.timestamp >= oneYearAgo);
}