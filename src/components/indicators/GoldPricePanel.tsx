import { useGoldPrice } from '../../hooks/useGoldPrice';
import { IndicatorCard } from '../ui/IndicatorCard';
import { MiniChart } from '../charts/MiniChart';
import { DARK_THEME } from '../../constants/colors';

export function GoldPricePanel() {
  const { data, isLoading, error, isFetching } = useGoldPrice();

  if (isLoading && !data) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
          国际金价（Gold Price）
        </h3>
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
          国际金价（Gold Price）
        </h3>
        <div className="p-4 bg-red-900/20 rounded text-red-400">
          加载失败: {error.message}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
          国际金价（Gold Price）
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
          国际金价（Gold Price）
          {isFetching && (
            <span className="ml-2 text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>
              更新中...
            </span>
          )}
        </h3>
      </div>

      {/* Price Card */}
      <IndicatorCard
        title={data.name}
        value={data.value}
        unit={data.unit}
        change={data.change ? {
          value: data.change.value,
          percentage: data.change.percentage,
        } : undefined}
        lastUpdated={data.timestamp}
      />

      {/* Mini Chart */}
      {data.historical && data.historical.length > 0 && (
        <MiniChart data={data} height={100} />
      )}

      {/* Update Frequency Notice */}
      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        数据每日更新 (Alpha Vantage · GLD黄金ETF)
      </p>
    </div>
  );
}