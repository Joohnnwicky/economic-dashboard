import { NormalizedIndicator } from '../../types/indicator';
import { DARK_THEME } from '../../constants/colors';

interface StockCardProps {
  data: NormalizedIndicator;
  onViewChart?: () => void;
  onRemove?: () => void;
}

export function StockCard({ data, onViewChart, onRemove }: StockCardProps) {
  const isPositive = data.change?.percentage >= 0;
  const changeColor = isPositive ? DARK_THEME.positive : DARK_THEME.negative;

  const formatValue = (val: number) => {
    if (val >= 100) return val.toFixed(2);
    return val.toFixed(3);
  };

  return (
    <div
      className="p-3 rounded-lg border relative group"
      style={{
        backgroundColor: DARK_THEME.panel,
        borderColor: DARK_THEME.gridLine,
      }}
    >
      {/* Header: Name + Remove button */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium truncate" style={{ color: DARK_THEME.text }}>
          {data.name}
        </h4>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#21262d] transition-opacity"
          style={{ color: DARK_THEME.textMuted }}
          title="移除"
        >
          ✕
        </button>
      </div>

      {/* Price */}
      <div className="text-xl font-bold" style={{ color: DARK_THEME.text }}>
        {formatValue(data.value)}
      </div>

      {/* Change */}
      {data.change && (
        <div className="mt-1 text-sm" style={{ color: changeColor }}>
          {isPositive ? '+' : ''}
          {data.change.percentage.toFixed(2)}%
          <span className="ml-2 opacity-70">
            ({isPositive ? '+' : ''}{data.change.value.toFixed(2)})
          </span>
        </div>
      )}

      {/* View Chart button */}
      {onViewChart && data.historical && data.historical.length > 0 && (
        <button
          onClick={onViewChart}
          className="mt-2 text-xs px-2 py-1 rounded hover:bg-[#21262d]"
          style={{ color: DARK_THEME.accent[0] }}
        >
          查看趋势
        </button>
      )}
    </div>
  );
}