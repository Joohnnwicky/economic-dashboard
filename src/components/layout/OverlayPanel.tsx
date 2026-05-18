import { useFedRate } from '../../hooks/useFedRate';
import { useCrypto } from '../../hooks/useCrypto';
import { useEmploymentSubMetrics } from '../../hooks/useEmploymentSubMetrics';
import { useInflationSubMetrics } from '../../hooks/useInflationSubMetrics';
import { usePCEData } from '../../hooks/usePCEData';
import { useChineseIndices } from '../../hooks/useChineseIndices';
import { usePBOCRate } from '../../hooks/usePBOCRate';
import { OverlayComparisonChart } from '../charts/OverlayComparisonChart';
import { NormalizedIndicator } from '../../types/indicator';

/**
 * Dashboard panel integrating OverlayComparisonChart.
 * Gathers all available indicators from Wave 1-3 hooks.
 */
export function OverlayPanel() {
  // Gather all indicators from hooks
  const fedRate = useFedRate();
  const crypto = useCrypto();
  const employment = useEmploymentSubMetrics();
  const inflation = useInflationSubMetrics();
  const pce = usePCEData();
  const chineseIndices = useChineseIndices();
  const pbocRate = usePBOCRate();

  // Check loading state
  const isLoading =
    fedRate.isLoading ||
    crypto.isLoading ||
    employment.isLoading ||
    inflation.isLoading ||
    pce.isLoading ||
    chineseIndices.isLoading ||
    pbocRate.isLoading;

  // Combine all indicators into single array
  const allIndicators: NormalizedIndicator[] = [
    fedRate.data ? [fedRate.data] : [],
    crypto.data || [],
    employment.data || [],
    inflation.data || [],
    pce.data || [],
    chineseIndices.data || [],
    pbocRate.data ? [pbocRate.data] : [],
  ].flat();

  return (
    <div className="p-4 bg-[#0d1117] rounded-lg">
      <h2 className="text-[#c9d1d9] text-lg mb-4">跨市场对比分析</h2>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <OverlayComparisonChart availableIndicators={allIndicators} height={450} />
      )}
    </div>
  );
}