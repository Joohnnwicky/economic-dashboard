import { useChineseIndices } from '../../hooks/useChineseIndices';
import { GridPanel } from '../layout/GridPanel';
import { DARK_THEME } from '../../constants/colors';

export function ChineseIndicesPanel() {
  const { data, isLoading, error, dataUpdatedAt } = useChineseIndices();

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
        A股指数
      </h3>

      <div className="space-y-2">
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
            {!error && (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold" style={{ color: DARK_THEME.text }}>
                    {index.value.toFixed(2)}
                  </span>
                  <span className="text-sm ml-2" style={{ color: DARK_THEME.textMuted }}>
                    {index.unit}
                  </span>
                </div>
                {index.change && (
                  <div
                    className="text-sm"
                    style={{
                      color: index.change.percentage >= 0
                        ? DARK_THEME.accent[1]
                        : DARK_THEME.accent[2],
                    }}
                  >
                    {index.change.percentage >= 0 ? '+' : ''}
                    {index.change.percentage.toFixed(2)}%
                    <span className="ml-1">
                      ({index.change.value >= 0 ? '+' : ''}{index.change.value.toFixed(2)})
                    </span>
                  </div>
                )}
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