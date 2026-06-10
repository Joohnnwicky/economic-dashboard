import { useFedRate } from '../../hooks/useFedRate';
import { useFOMCTargetRates } from '../../hooks/useFOMCTargetRates';
import { FedRateChart } from '../charts/FedRateChart';
import { useDashboardStore } from '../../stores/dashboardStore';

export function FedRatePanel() {
  const timeRange = useDashboardStore((state) => state.timeRange);
  const { data: fedRateData, isLoading: rateLoading, error: rateError } = useFedRate(timeRange);
  const { data: fomcData, isLoading: fomcLoading, error: fomcError } = useFOMCTargetRates(timeRange);

  const isLoading = rateLoading || fomcLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#58a6ff]"></div>
      </div>
    );
  }

  return (
    <>
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
    </>
  );
}
