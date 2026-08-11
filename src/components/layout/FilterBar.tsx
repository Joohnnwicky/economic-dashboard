import { useDashboardStore } from '../../stores/dashboardStore';
import { TimeSelector } from '../charts/TimeSelector';

export function FilterBar() {
  const timeRange = useDashboardStore((state) => state.timeRange);
  const setTimeRange = useDashboardStore((state) => state.setTimeRange);

  return (
    <div
      className="p-4 mb-4 flex items-center gap-4"
      style={{ backgroundColor: '#fff', border: '1px solid #000' }}
    >
      <span className="font-sans font-bold text-sm" style={{ color: '#000' }}>时间范围:</span>
      <TimeSelector value={timeRange} onChange={setTimeRange} />
    </div>
  );
}
