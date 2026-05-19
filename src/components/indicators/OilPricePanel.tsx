import { useOilPrices } from '../../hooks/useOilPrice';
import { useDashboardStore } from '../../stores/dashboardStore';
import { IndicatorCard } from '../ui/IndicatorCard';
import { MiniChart } from '../charts/MiniChart';
import { DARK_THEME } from '../../constants/colors';

export function OilPricePanel() {
  const timeRange = useDashboardStore((state) => state.timeRange);
  const { brent, wti, isLoading, errors, isFetching } = useOilPrices(timeRange);

  if (isLoading && !brent && !wti) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
          国际油价（Oil Price）
        </h3>
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
        </div>
      </div>
    );
  }

  if (errors.length > 0 && !brent && !wti) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
          国际油价（Oil Price）
        </h3>
        <div className="p-4 bg-red-900/20 rounded text-red-400">
          加载失败
        </div>
      </div>
    );
  }

  if (!brent && !wti) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
          国际油价（Oil Price）
        </h3>
        <div className="text-sm" style={{ color: DARK_THEME.textMuted }}>
          暂无数据
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium" style={{ color: DARK_THEME.text }}>
          国际油价（Oil Price）
          {isFetching && (
            <span className="ml-2 text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>
              更新中...
            </span>
          )}
        </h3>
      </div>

      {/* Price Cards */}
      <div className="grid grid-cols-2 gap-4">
        {brent && (
          <IndicatorCard
            title={brent.name}
            value={brent.value}
            unit={brent.unit}
            change={brent.change ? {
              value: brent.change.value,
              percentage: brent.change.percentage,
            } : undefined}
            lastUpdated={brent.timestamp}
          />
        )}

        {wti && (
          <IndicatorCard
            title={wti.name}
            value={wti.value}
            unit={wti.unit}
            change={wti.change ? {
              value: wti.change.value,
              percentage: wti.change.percentage,
            } : undefined}
            lastUpdated={wti.timestamp}
          />
        )}
      </div>

      {/* Mini Charts */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {brent && brent.historical && brent.historical.length > 0 && (
          <MiniChart data={brent} height={80} />
        )}
        {wti && wti.historical && wti.historical.length > 0 && (
          <MiniChart data={wti} height={80} />
        )}
      </div>

      {/* Update Frequency Notice */}
      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        数据每日更新 (FRED API · Brent布伦特 · WTI西德州)
      </p>
    </div>
  );
}