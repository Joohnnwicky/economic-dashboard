import { useDollarIndex } from '../../hooks/useDollarIndex';
import { IndicatorCard } from '../ui/IndicatorCard';
import { MiniChart } from '../charts/MiniChart';
import { DARK_THEME } from '../../constants/colors';

export function DollarIndexPanel() {
  const { data, isLoading, error, isFetching } = useDollarIndex();

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 bg-red-900/20 rounded text-red-400">
        加载失败: {error.message}
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm" style={{ color: DARK_THEME.textMuted }}>暂无数据</div>;
  }

  return (
    <div className="space-y-4">
      {isFetching && (
        <span className="text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>
          更新中...
        </span>
      )}

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
        数据每日更新 (FRED API · DTWEXBGS贸易加权美元指数)
      </p>
    </div>
  );
}
