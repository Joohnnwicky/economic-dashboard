import axios from 'axios';
import { FEDWATCH_BASE_URL } from '../constants/api';

export interface FomcMeeting {
  date: string;             // YYYY-MM-DD
  days_until: number;
  hours_until: number;
  is_past: boolean;
  tentative: boolean;
}

export interface FedWatch {
  next_meeting: FomcMeeting | null;
  upcoming: FomcMeeting[];
  timestamp: string;
}

/** 获取 FOMC 会议日历 + 下次会议倒计时(1h 缓存)。 */
export async function getFedWatch(): Promise<FedWatch> {
  const response = await axios.get(FEDWATCH_BASE_URL, { timeout: 10000 });
  return response.data;
}
