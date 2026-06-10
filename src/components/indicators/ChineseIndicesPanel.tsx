import { useChineseIndices } from '../../hooks/useChineseIndices';
import { IndicatorCard } from '../ui/IndicatorCard';
import { DARK_THEME } from '../../constants/colors';

export function ChineseIndicesPanel() {
  const { data, isLoading, error } = useChineseIndices();

  if (isLoading && (!data || data.length === 0)) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
      </div>
    );
  }

  if (error && (!data || data.length === 0)) {
    return (
      <div className="p-4 bg-red-900/20 rounded text-red-400">
        加载失败: {error.message}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="text-sm" style={{ color: DARK_THEME.textMuted }}>暂无数据</div>;
  }

  return (
    <div className="space-y-4">
      {/* Price Cards */}
      <div className="grid grid-cols-3 gap-4">
        {data.map((index) => (
          <IndicatorCard
            key={index.id}
            title={index.name}
            value={index.value}
            unit="index"
            change={index.change ? {
              value: index.change.value,
              percentage: index.change.percentage,
            } : undefined}
            lastUpdated={index.timestamp}
          />
        ))}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="mt-2 p-2 rounded bg-orange-900/20 text-orange-400 text-xs">
          部分数据加载异常: {error.message}
        </div>
      )}

      {/* Update Frequency Notice */}
      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        数据每1小时更新一次 (腾讯财经API)
      </p>
    </div>
  );
}
