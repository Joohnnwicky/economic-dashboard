import axios from 'axios';
import { ONCHAIN_BASE_URL } from '../constants/api';

export interface HashratePoint {
  timestamp: number;   // unix ms
  hashrate_eh: number; // EH/s
}

export interface OnchainData {
  hashrate_hs: number | null;        // H/s
  difficulty: number | null;
  trend: HashratePoint[];
  // fees (sat/vB)
  fastest: number | null;
  half_hour: number | null;
  hour: number | null;
  minimum: number | null;
  // difficulty adjustment
  progress_percent: number | null;   // 0-100
  difficulty_change_percent: number | null;
  remaining_blocks: number | null;
  expected_retarget_date: number | null; // unix ms
  timestamp: Date;
}

/** 获取 BTC 链上数据（mempool.space, 30min 缓存）。 */
export async function getOnchain(): Promise<OnchainData> {
  const response = await axios.get(ONCHAIN_BASE_URL, { timeout: 15000 });
  const d = response.data;
  return { ...d, timestamp: new Date(d.timestamp) };
}
