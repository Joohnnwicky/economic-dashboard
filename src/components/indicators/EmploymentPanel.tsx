import { useEmploymentData } from '../../hooks/useBlsData';
import { LineChart } from '../charts/LineChart';
import { DARK_THEME } from '../../constants/colors';
import { useDashboardStore } from '../../stores/dashboardStore';

export function EmploymentPanel() {
  const timeRange = useDashboardStore((state) => state.timeRange);
  const { data, isLoading, error } = useEmploymentData();

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

  return (
    <div className="grid grid-cols-1 gap-4">
      {data?.map((indicator) => (
        <div key={indicator.id}>
          <h4 className="text-sm font-medium mb-2" style={{ color: DARK_THEME.textMuted }}>
            {indicator.name}
          </h4>
          <LineChart
            data={indicator}
            timeRange={timeRange}
            height={300}
            gridLeft="6%"
          />
        </div>
      ))}
    </div>
  );
}
