import { useState } from 'react';
import { NormalizedIndicator } from '../../types/indicator';
import { MultiSeriesChart } from './MultiSeriesChart';

interface OverlayComparisonChartProps {
  availableIndicators: NormalizedIndicator[];
  height?: number;
}

/**
 * Wrapper component for MultiSeriesChart with interactive indicator selection UI.
 * Per RESEARCH.md Pattern 1, dual Y-axis is for scale/unit mismatch.
 * Use cases: Fed Rate vs BTC Price, NFP vs Labor Participation, CPI vs PCE.
 */
export function OverlayComparisonChart({
  availableIndicators,
  height = 400,
}: OverlayComparisonChartProps) {
  const [leftIndicatorId, setLeftIndicatorId] = useState<string>('');
  const [rightIndicatorId, setRightIndicatorId] = useState<string>('');

  const leftIndicator = availableIndicators.find((ind) => ind.id === leftIndicatorId);
  const rightIndicator = availableIndicators.find((ind) => ind.id === rightIndicatorId);

  // Build series array for MultiSeriesChart
  const series = [
    leftIndicator ? { data: leftIndicator, axisPosition: 'left' as const } : null,
    rightIndicator ? { data: rightIndicator, axisPosition: 'right' as const } : null,
  ].filter(Boolean) as Array<{ data: NormalizedIndicator; axisPosition: 'left' | 'right' }>;

  // Show placeholder only when no indicators available at all
  if (availableIndicators.length === 0) {
    return (
      <div
        className="bg-[#161b22] rounded-lg p-4 flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <p className="text-[#8b949e]">选择指标以进行跨市场对比</p>
      </div>
    );
  }

  // Filter right options to exclude left indicator
  const rightIndicatorOptions = availableIndicators.filter(
    (ind) => ind.id !== leftIndicatorId
  );

  return (
    <div className="bg-[#161b22] rounded-lg p-4">
      {/* Indicator Selectors */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="text-[#8b949e] text-sm mb-1 block">
            左侧指标 (Y轴1)
            <select
              value={leftIndicatorId}
              onChange={(e) => setLeftIndicatorId(e.target.value)}
              className="w-full mt-2 bg-[#0d1117] text-[#c9d1d9] border border-[#21262d] rounded px-3 py-2"
            >
              <option value="">-- 选择指标 --</option>
              {availableIndicators.map((ind) => (
                <option key={ind.id} value={ind.id}>{ind.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex-1">
          <label className="text-[#8b949e] text-sm mb-1 block">
            右侧指标 (Y轴2)
            <select
              value={rightIndicatorId}
              onChange={(e) => setRightIndicatorId(e.target.value)}
              className="w-full mt-2 bg-[#0d1117] text-[#c9d1d9] border border-[#21262d] rounded px-3 py-2"
            >
              <option value="">-- 选择指标 --</option>
              {rightIndicatorOptions.map((ind) => (
                <option key={ind.id} value={ind.id}>{ind.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Dual Y-Axis Chart */}
      <MultiSeriesChart series={series} height={height - 80} />
    </div>
  );
}