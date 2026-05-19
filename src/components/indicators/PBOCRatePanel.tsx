import { usePBOCRate } from '../../hooks/usePBOCRate';
import { LineChart } from '../charts/LineChart';
import { GridPanel } from '../layout/GridPanel';
import { useDashboardStore } from '../../stores/dashboardStore';

export function PBOCRatePanel() {
  const timeRange = useDashboardStore((state) => state.timeRange);
  const { data, isLoading, error, dataUpdatedAt } = usePBOCRate();

  return (
    <GridPanel
      title="中国贷款市场报价利率（LPR Loan Prime Rate）"
      isLoading={isLoading}
      lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
    >
      {error && (
        <div className="p-2 bg-red-900/20 rounded text-red-400 mb-2">
          加载失败: {error.message}
        </div>
      )}
      {data && (
        <LineChart data={data} timeRange={timeRange} height={250} gridLeft="3%" />
      )}
    </GridPanel>
  );
}