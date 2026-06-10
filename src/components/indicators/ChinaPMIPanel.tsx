import { useChinaMacro } from '../../hooks/useChinaMacroBackend';
import { chinaMacroBackendToNormalized } from '../../api/china-macro-backend';
import { MultiSeriesChart } from '../charts/MultiSeriesChart';
import { DARK_THEME } from '../../constants/colors';

export function ChinaPMIPanel() {
  const { pmi, isLoading, error } = useChinaMacro();

  if (isLoading && !pmi?.nbs_mfg) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
      </div>
    );
  }

  if (error && !pmi?.nbs_mfg) {
    return (
      <div className="p-4 bg-red-900/20 rounded text-red-400">
        加载失败: {error.message}
      </div>
    );
  }

  const pmiSeries = [
    { data: pmi?.nbs_mfg, label: '官方制造业' },
    { data: pmi?.nbs_non_mfg, label: '官方非制造业' },
    { data: pmi?.caixin_mfg, label: '财新制造业' },
    { data: pmi?.caixin_services, label: '财新服务业' },
  ].filter(s => s.data !== null && s.data !== undefined);

  // Build chart series data
  const chartSeries = pmiSeries.map((s) => ({
    data: chinaMacroBackendToNormalized(s.data!),
    axisPosition: 'left' as const,
    yAxisConfig: { name: 'PMI', min: 40, max: 60 },
  }));

  return (
    <div className="space-y-4">
      {/* PMI Indicator Cards - 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {pmiSeries.map((s) => {
          const value = s.data!.value;
          const isExpansion = value >= 50;
          return (
            <div key={s.data!.seriesId} className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: DARK_THEME.background }}>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm" style={{ color: DARK_THEME.text }}>
                  {s.label}
                </span>
                {s.data!.forecast != null && (
                  <span className="ml-1 text-xs" style={{ color: DARK_THEME.textMuted }}>
                    预期{s.data!.forecast.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="text-right flex items-center gap-1">
                <span className="text-lg font-semibold" style={{ color: isExpansion ? DARK_THEME.positive : DARK_THEME.negative }}>
                  {value.toFixed(1)}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{
                  backgroundColor: isExpansion ? `${DARK_THEME.positive}20` : `${DARK_THEME.negative}20`,
                  color: isExpansion ? DARK_THEME.positive : DARK_THEME.negative,
                }}>
                  {isExpansion ? '扩张' : '收缩'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MultiSeries Chart with 50 reference line */}
      {chartSeries.length > 0 && (
        <div style={{ position: 'relative' }}>
          <MultiSeriesChart
            series={chartSeries}
            height={280}
            showLegend={true}
            timeRange="1Y"
          />
          {/* 50-line indicator overlay */}
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            borderTop: `1px dashed ${DARK_THEME.textMuted}`,
            pointerEvents: 'none',
            opacity: 0.4,
          }} />
        </div>
      )}

      {/* Footer */}
      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        数据来源: AkShare (统计局/财新) | 月度更新 | 50为荣枯线
      </p>
    </div>
  );
}
