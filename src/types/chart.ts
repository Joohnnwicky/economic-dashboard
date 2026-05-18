import { TimeRange } from './api';

export interface ChartOptions {
  timeRange: TimeRange;
  showTooltip: boolean;
  connectNulls: boolean;
}