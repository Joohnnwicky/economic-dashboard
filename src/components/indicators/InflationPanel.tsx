import { useCpiData } from '../../hooks/useCpiData';
import { LineChart } from '../charts/LineChart';
import { GridPanel } from '../layout/GridPanel';
import { useDashboardStore } from '../../stores/dashboardStore';
import { DARK_THEME } from '../../constants/colors';

export function InflationPanel() {
  const timeRange = useDashboardStore((state) => state.timeRange);
  const { data, isLoading, error, dataUpdatedAt } = useCpiData(timeRange);

  return (
    <div>
      <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
        美国消费者物价指数（CPI Consumer Price Index）
      </h3>

      <GridPanel
        title={data?.name || '美国消费者物价指数（CPI Consumer Price Index）'}
        isLoading={isLoading}
        lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
      >
        {error && (
          <div className="p-2 bg-red-900/20 rounded text-red-400 mb-2">
            加载失败: {error.message}
          </div>
        )}
        {data && <LineChart data={data} timeRange={timeRange} height={250} />}
      </GridPanel>
    </div>
  );
}