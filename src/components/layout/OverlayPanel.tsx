import { useFedRate } from '../../hooks/useFedRate';
import { useCrypto } from '../../hooks/useCrypto';
import { useInflationSubMetrics } from '../../hooks/useInflationSubMetrics';
import { usePCEData } from '../../hooks/usePCEData';
import { useChineseIndices } from '../../hooks/useChineseIndices';
import { usePBOCRate } from '../../hooks/usePBOCRate';
import { OverlayComparisonChart } from '../charts/OverlayComparisonChart';
import { NormalizedIndicator } from '../../types/indicator';

/**
 * Dashboard panel integrating OverlayComparisonChart.
 * Gathers all available indicators from Wave 1-3 hooks.
 * Shows available data immediately - doesn't block on individual data sources.
 */
export function OverlayPanel() {
  // Gather all indicators from hooks
  const fedRate = useFedRate();
  const crypto = useCrypto();
  const inflation = useInflationSubMetrics();
  const pce = usePCEData();
  const chineseIndices = useChineseIndices();
  const pbocRate = usePBOCRate();

  // Combine all available indicators (ignore loading state for partial display)
  const pbocIndicators = pbocRate.data ? [pbocRate.data.lpr, pbocRate.data.omo7d] : [];

  const allIndicators: NormalizedIndicator[] = [
    fedRate.data ? [fedRate.data] : [],
    crypto.data || [],
    inflation.data || [],
    pce.data || [],
    chineseIndices.data || [],
    pbocIndicators,
  ].flat();

  // Show chart if we have at least 2 indicators
  const hasEnoughData = allIndicators.length >= 2;

  // Check if ALL data sources failed (no data and not loading)
  const allFailed = allIndicators.length === 0 &&
    !fedRate.isLoading &&
    !crypto.isLoading &&
    !inflation.isLoading &&
    !pce.isLoading &&
    !chineseIndices.isLoading &&
    !pbocRate.isLoading;

  return (
    <div className="p-4 bg-[#0d1117] rounded-lg">
      <h2 className="text-[#c9d1d9] text-lg mb-4">跨市场对比分析</h2>

      {allFailed ? (
        <div className="flex items-center justify-center h-[400px] text-[#8b949e]">
          数据加载失败，请检查网络连接或API配置
        </div>
      ) : !hasEnoughData ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <OverlayComparisonChart availableIndicators={allIndicators} height={450} />
      )}
    </div>
  );
}