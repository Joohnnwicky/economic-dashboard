import { useCpiData } from '../../hooks/useCpiData';
import { LineChart } from '../charts/LineChart';
import { useDashboardStore } from '../../stores/dashboardStore';

export function InflationPanel() {
  const timeRange = useDashboardStore((state) => state.timeRange);
  const { data, isLoading, error } = useCpiData(timeRange);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#58a6ff]"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-2 bg-red-900/20 rounded text-red-400">
        加载失败: {error.message}
      </div>
    );
  }

  if (!data) return null;

  return <LineChart data={data} timeRange={timeRange} height={300} gridLeft="6%" />;
}
