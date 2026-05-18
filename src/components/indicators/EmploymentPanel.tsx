import { useEmploymentData } from '../../hooks/useBlsData';
import { LineChart } from '../charts/LineChart';
import { GridPanel } from '../layout/GridPanel';
import { useDashboardStore } from '../../stores/dashboardStore';
import { DARK_THEME } from '../../constants/colors';

export function EmploymentPanel() {
  const timeRange = useDashboardStore((state) => state.timeRange);
  const { data, isLoading, error, dataUpdatedAt } = useEmploymentData();

  return (
    <div>
      <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
        美国就业数据
      </h3>

      <div className="grid grid-cols-1 gap-4">
        {data?.map((indicator) => (
          <GridPanel
            key={indicator.id}
            title={indicator.name}
            isLoading={isLoading}
            lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
          >
            {error && (
              <div className="p-2 bg-red-900/20 rounded text-red-400 mb-2">
                加载失败: {error.message}
              </div>
            )}
            <LineChart data={indicator} timeRange={timeRange} height={250} />
          </GridPanel>
        ))}
      </div>
    </div>
  );
}