import axios from 'axios';
import { ECONOMIC_CALENDAR_BASE_URL } from '../constants/api';

export interface CalendarEvent {
  date: string | null;        // "2026-08-14"
  time: string | null;        // "20:30" (北京时间)
  event: string | null;
  impact: string | null;      // high / medium / low
  approximate: boolean;       // true=节奏估算(约), false=精确(如 NFP)
}

export interface EconomicCalendar {
  events: CalendarEvent[];
  note: string | null;
  timestamp: Date;
}

/** 获取未来主要宏观数据发布日历(纯计算, 1h 缓存)。NFP 精确, 其余节奏估算。 */
export async function getEconomicCalendar(): Promise<EconomicCalendar> {
  const response = await axios.get(ECONOMIC_CALENDAR_BASE_URL, { timeout: 15000 });
  const d = response.data;
  return { ...d, timestamp: new Date(d.timestamp) };
}
