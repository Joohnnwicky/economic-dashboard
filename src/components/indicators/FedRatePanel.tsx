import { useFedRate } from '../../hooks/useFedRate';
import { useFOMCTargetRates } from '../../hooks/useFOMCTargetRates';
import { FedRateChart } from '../charts/FedRateChart';
import { GridPanel } from '../layout/GridPanel';
import { useDashboardStore } from '../../stores/dashboardStore';

export function FedRatePanel() {
  const timeRange = useDashboardStore((state) => state.timeRange);
  const { data: fedRateData, isLoading: rateLoading, error: rateError, dataUpdatedAt } = useFedRate(timeRange);
  const { data: fomcData, isLoading: fomcLoading, error: fomcError } = useFOMCTargetRates(timeRange);

  const isLoading = rateLoading || fomcLoading;

  return (
    <GridPanel
      title="美国联邦基金利率（FFR Federal Funds Rate）"
      isLoading={isLoading}
      lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
    >
      {rateError && (
        <div className="p-2 bg-red-900/20 rounded text-red-400 mb-2">
          加载失败: {rateError.message}
        </div>
      )}
      {fomcError && (
        <div className="p-2 bg-yellow-900/20 rounded text-yellow-400 mb-2">
          FOMC数据加载失败: {fomcError.message}
        </div>
      )}
      {fedRateData && fomcData && (
        <FedRateChart data={fedRateData} fomcData={fomcData} timeRange={timeRange} />
      )}
    </GridPanel>
  );
}