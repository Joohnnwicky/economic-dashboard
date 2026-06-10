import { useChinaMacro } from '../../hooks/useChinaMacroBackend';
import { chinaMacroBackendToNormalized } from '../../api/china-macro-backend';
import { MultiSeriesChart } from '../charts/MultiSeriesChart';
import { DARK_THEME } from '../../constants/colors';

function formatLargeNumber(value: number, unit: string): string {
  if (unit === '亿美元') {
    if (value >= 10000) return `${(value / 10000).toFixed(1)}万亿`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}千亿`;
    return value.toFixed(0);
  }
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}`;
}

export function ChinaTradePanel() {
  const { trade, isLoading, error } = useChinaMacro();

  if (isLoading && !trade?.exports_yoy) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
      </div>
    );
  }

  if (error && !trade?.exports_yoy) {
    return (
      <div className="p-4 bg-red-900/20 rounded text-red-400">
        加载失败: {error.message}
      </div>
    );
  }

  const indicators = [
    { data: trade?.exports_yoy, label: '出口同比' },
    { data: trade?.imports_yoy, label: '进口同比' },
    { data: trade?.trade_balance, label: '贸易差额' },
  ].filter(s => s.data !== null && s.data !== undefined);

  // Build chart series - exports/imports on left Y (percentage), trade balance on right Y (USD)
  const chartSeries = indicators.map((s) => ({
    data: chinaMacroBackendToNormalized(s.data!),
    axisPosition: s.data!.unit === '亿美元' ? 'right' as const : 'left' as const,
    yAxisConfig: s.data!.unit === '亿美元'
      ? { name: '亿美元', min: undefined }
      : { name: '%', min: undefined },
  }));

  return (
    <div className="space-y-4">
      {/* Indicator Cards - 3 columns */}
      <div className="grid grid-cols-3 gap-3">
        {indicators.map((s) => {
          const value = s.data!.value;
          const isPercent = s.data!.unit === '%';
          const isPositive = value >= 0;
          return (
            <div key={s.data!.seriesId} className="p-3 rounded text-center" style={{ backgroundColor: DARK_THEME.background }}>
              <div className="text-xs mb-1" style={{ color: DARK_THEME.textMuted }}>{s.label}</div>
              <div className="text-xl font-semibold" style={{ color: isPercent ? (isPositive ? DARK_THEME.positive : DARK_THEME.negative) : DARK_THEME.text }}>
                {formatLargeNumber(value, s.data!.unit)}
              </div>
              <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>{s.data!.unit}</div>
            </div>
          );
        })}
      </div>

      {/* MultiSeries Chart - dual Y axis */}
      {chartSeries.length > 0 && (
        <MultiSeriesChart
          series={chartSeries}
          height={250}
          showLegend={true}
          timeRange="1Y"
        />
      )}

      {/* Footer */}
      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        数据来源: AkShare (海关总署) | 月度更新
      </p>
    </div>
  );
}
