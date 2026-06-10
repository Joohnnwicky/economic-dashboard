import { usePBOCRate } from '../../hooks/usePBOCRate';
import { MultiSeriesChart } from '../charts/MultiSeriesChart';
import { GridPanel } from '../layout/GridPanel';
import { DARK_THEME } from '../../constants/colors';

export function PBOCRatePanel() {
  const { data, isLoading, error, dataUpdatedAt } = usePBOCRate();

  return (
    <GridPanel
      title="中国央行利率（PBOC Interest Rates）"
      isLoading={isLoading}
      lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
    >
      {error && (
        <div className="p-2 bg-red-900/20 rounded text-red-400 mb-2">
          加载失败: {error.message}
        </div>
      )}
      {data && (
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
      )}
    </GridPanel>
  );
}
