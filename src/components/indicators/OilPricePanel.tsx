import { useOilPrices } from '../../hooks/useOilPrice';
import { IndicatorCard } from '../ui/IndicatorCard';
import { MiniChart } from '../charts/MiniChart';
import { DARK_THEME } from '../../constants/colors';

export function OilPricePanel() {
  const { domestic, international, isLoading, error, isFetching } = useOilPrices();

  if (isLoading && !domestic && !international) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
      </div>
    );
  }

  if (error && !domestic && !international) {
    return (
      <div className="p-4 bg-red-900/20 rounded text-red-400">
        加载失败
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isFetching && (
        <span className="text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>
          更新中...
        </span>
      )}

      <div className="grid grid-cols-2 gap-4">
        {domestic && (
          <IndicatorCard
            title={domestic.name}
            value={domestic.value}
            unit={domestic.unit}
            change={domestic.change ? {
              value: domestic.change.value,
              percentage: domestic.change.percentage,
            } : undefined}
            lastUpdated={domestic.timestamp}
          />
        )}
        {international && (
          <IndicatorCard
            title={international.name}
            value={international.value}
            unit={international.unit}
            change={international.change ? {
              value: international.change.value,
              percentage: international.change.percentage,
            } : undefined}
            lastUpdated={international.timestamp}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {domestic && domestic.historical.length > 0 && (
          <MiniChart data={domestic} height={80} />
        )}
        {international && international.historical.length > 0 && (
          <MiniChart data={international} height={80} />
        )}
      </div>

      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        数据每日更新 (AkShare · 上海原油SC + WTI原油)
      </p>
    </div>
  );
}
