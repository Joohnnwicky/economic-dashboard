import { create } from 'zustand';
import { TimeRange } from '../types/api';

interface DashboardState {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  timeRange: '1Y',
  setTimeRange: (range) => set({ timeRange: range }),
}));