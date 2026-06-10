import { usePBOCRate } from '../../hooks/usePBOCRate';
import { MultiSeriesChart } from '../charts/MultiSeriesChart';
import { DARK_THEME } from '../../constants/colors';

export function PBOCRatePanel() {
  const { data, isLoading, error } = usePBOCRate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#58a6ff]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 bg-red-900/20 rounded text-red-400">
        加载失败: {error.message}
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      {/* Rate cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded text-center" style={{ backgroundColor: DARK_THEME.background }}>
          <div className="text-xs mb-1" style={{ color: DARK_THEME.textMuted }}>LPR 1年期</div>
          <div className="text-2xl font-semibold" style={{ color: DARK_THEME.text }}>
            {data.lpr.value.toFixed(2)}<span className="text-sm ml-1" style={{ color: DARK_THEME.textMuted }}>%</span>
          </div>
        </div>
        <div className="p-3 rounded text-center" style={{ backgroundColor: DARK_THEME.background }}>
          <div className="text-xs mb-1" style={{ color: DARK_THEME.textMuted }}>7天逆回购</div>
          <div className="text-2xl font-semibold" style={{ color: DARK_THEME.accent[0] }}>
            {data.omo7d.value.toFixed(2)}<span className="text-sm ml-1" style={{ color: DARK_THEME.textMuted }}>%</span>
          </div>
        </div>
      </div>

      {/* MultiSeries chart with dual lines */}
      <MultiSeriesChart
        series={[
          { data: data.lpr, axisPosition: 'left', yAxisConfig: { name: '%' } },
          { data: data.omo7d, axisPosition: 'left', yAxisConfig: { name: '%' } },
        ]}
        height={220}
        showLegend={true}
        timeRange="1Y"
      />

      {/* Data source */}
      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        数据来源: 手动维护 | 月度更新（每月20日）
      </p>
    </>
  );
}
