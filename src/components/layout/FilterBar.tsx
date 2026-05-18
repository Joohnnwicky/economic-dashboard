import { useDashboardStore } from '../../stores/dashboardStore';
import { TimeSelector } from '../charts/TimeSelector';
import { DARK_THEME } from '../../constants/colors';

export function FilterBar() {
  const timeRange = useDashboardStore((state) => state.timeRange);
  const setTimeRange = useDashboardStore((state) => state.setTimeRange);

  return (
    <div
      className="p-4 rounded-lg mb-4 flex items-center gap-4"
      style={{ backgroundColor: DARK_THEME.panel }}
    >
      <span style={{ color: DARK_THEME.textMuted }}>时间范围:</span>
      <TimeSelector value={timeRange} onChange={setTimeRange} />
    </div>
  );
}