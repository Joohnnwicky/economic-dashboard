import { useInflationSubMetrics } from '../../hooks/useInflationSubMetrics';
import { usePCEData } from '../../hooks/usePCEData';
import { calculateYoY } from '../../utils/yoy-mom';
import { formatPercentage } from '../../utils/formatters';
import { DARK_THEME } from '../../constants/colors';
import { MultiSeriesChart } from '../charts/MultiSeriesChart';
import { LineChart } from '../charts/LineChart';

// 根据单位格式化数值
function formatValue(value: number, unit: string): string {
  if (unit === '%') {
    return formatPercentage(value);
  }
  if (unit === 'index') {
    return value.toFixed(2);
  }
  return value.toLocaleString('zh-CN');
}

export function InflationSubMetricsPanel() {
  const cpiData = useInflationSubMetrics();
  const pceData = usePCEData();

  if (cpiData.isLoading && pceData.isLoading) {
    return (
      <div className="flex items-center justify-center h-20" style={{ color: DARK_THEME.textMuted }}>
        Loading...
      </div>
    );
  }

  // Combine CPI and PCE for overlay chart
  const chartSeries = [
    ...(cpiData.data?.filter((d) => d.id.includes('core')).map((d) => ({
      data: d,
      axisPosition: 'left' as const,
    })) || []),
    ...(pceData.data?.filter((d) => d.id.includes('pcepilfe')).map((d) => ({
      data: d,
      axisPosition: 'right' as const,
    })) || []),
  ];

  return (
    <>
      {/* CPI Components Grid */}
      {cpiData.data && cpiData.data.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {cpiData.data.map((indicator) => {
            const yoy = calculateYoY(indicator.historical);
            const latestYoy = yoy[yoy.length - 1];

            return (
              <div
                key={indicator.id}
                className="p-2 rounded"
                style={{ backgroundColor: DARK_THEME.background }}
              >
                <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>
                  {indicator.name}
                </div>
                <div className="text-lg" style={{ color: DARK_THEME.accent[0] }}>
                  {formatValue(indicator.value, indicator.unit)}
                </div>
                <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>
                  同比: {latestYoy !== null ? formatPercentage(latestYoy) : '-'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CPI vs PCE Overlay Chart */}
      {chartSeries.length >= 2 && (
        <div className="mb-4">
          <h4 className="text-sm mb-2" style={{ color: DARK_THEME.text }}>
            CPI vs PCE 通胀对比
          </h4>
          <MultiSeriesChart series={chartSeries} height={200} />
        </div>
      )}

      {/* PCE Trend Charts */}
      {pceData.data && pceData.data.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm mb-2" style={{ color: DARK_THEME.text }}>
            PCE物价指数趋势
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {pceData.data.map((indicator) => (
              <div key={indicator.id}>
                <div className="text-xs mb-1" style={{ color: DARK_THEME.textMuted }}>
                  {indicator.name}: {formatValue(indicator.value, indicator.unit)}
                </div>
                <LineChart data={indicator} height={300} gridLeft="8%" />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
