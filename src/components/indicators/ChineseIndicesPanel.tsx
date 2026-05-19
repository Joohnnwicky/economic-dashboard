import { useChineseIndicesWithHistory } from '../../hooks/useChineseIndices';
import { LineChart } from '../charts/LineChart';
import { GridPanel } from '../layout/GridPanel';
import { DARK_THEME } from '../../constants/colors';

export function ChineseIndicesPanel() {
  const { data, isLoading, error, dataUpdatedAt } = useChineseIndicesWithHistory();

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
        中国股市指数（Chinese Stock Indices）
      </h3>

      <div className="space-y-4">
        {data.map((index) => (
          <GridPanel
            key={index.id}
            title={index.name}
            isLoading={isLoading}
            lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
          >
            {error && (
              <div className="p-2 bg-red-900/20 rounded text-red-400 mb-2">
                加载失败: {error.message}
              </div>
            )}
            {index.historical.length > 0 && (
              <LineChart data={index} timeRange="1Y" height={300} gridLeft="6%" />
            )}
            {index.historical.length === 0 && !isLoading && (
              <div className="text-sm" style={{ color: DARK_THEME.textMuted }}>
                暂无历史数据
              </div>
            )}
          </GridPanel>
        ))}
      </div>

      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        数据每小时更新一次 (东方财富API)
      </p>
    </div>
  );
}