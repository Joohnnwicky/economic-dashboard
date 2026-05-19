import { useChineseIndicesWithHistory } from '../../hooks/useChineseIndices';
import { IndicatorCard } from '../ui/IndicatorCard';
import { LineChart } from '../charts/LineChart';
import { DARK_THEME } from '../../constants/colors';

export function ChineseIndicesPanel() {
  const { data, isLoading, error, dataUpdatedAt } = useChineseIndicesWithHistory();

  // 只有在完全没有数据且正在加载时才显示loading
  if (isLoading && (!data || data.length === 0)) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
          中国股市指数（Chinese Stock Indices）
        </h3>
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.primary }}></div>
        </div>
      </div>
    );
  }

  // 如果有错误且没有数据，显示错误
  if (error && (!data || data.length === 0)) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
          中国股市指数（Chinese Stock Indices）
        </h3>
        <div className="p-4 bg-red-900/20 rounded text-red-400">
          加载失败: {error.message}
        </div>
      </div>
    );
  }

  // 如果完全没有数据，显示提示
  if (!data || data.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
          中国股市指数（Chinese Stock Indices）
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
      <h3 className="text-lg font-medium" style={{ color: DARK_THEME.text }}>
        中国股市指数（Chinese Stock Indices）
      </h3>

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

      {/* Historical Trend Charts */}
      {data.some(index => index.historical.length > 0) && (
        <div className="mt-4 space-y-4">
          {data.map((index) => (
            index.historical.length > 0 && (
              <div key={`chart-${index.id}`}>
                <h4 className="text-sm font-medium mb-2" style={{ color: DARK_THEME.textMuted }}>
                  {index.name} 近一年走势
                </h4>
                <LineChart data={index} timeRange="1Y" height={200} gridLeft="6%" />
              </div>
            )
          ))}
        </div>
      )}

      {/* No History Notice */}
      {data.every(index => index.historical.length === 0) && (
        <div className="mt-4 p-3 rounded" style={{ backgroundColor: DARK_THEME.panel }}>
          <p className="text-sm" style={{ color: DARK_THEME.textMuted }}>
            注：历史走势数据暂时无法获取（东方财富API不稳定）
          </p>
          <p className="text-xs mt-1" style={{ color: DARK_THEME.textMuted }}>
            当前价格数据每1小时更新 (腾讯财经API)
          </p>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="mt-2 p-2 rounded bg-orange-900/20 text-orange-400 text-xs">
          部分数据加载异常: {error.message}
        </div>
      )}
    </div>
  );
}