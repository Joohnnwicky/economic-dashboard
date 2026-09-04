import { useEffect, useRef, useState } from 'react';
import { NormalizedIndicator } from '../../types/indicator';
import { DARK_THEME } from '../../constants/colors';
import { StockSparkline } from './StockSparkline';

interface StockCardProps {
  code: string;
  data: NormalizedIndicator;
  onRemove?: () => void;
}

export function StockCard({ code, data, onRemove }: StockCardProps) {
  const isPositive = (data.change?.percentage ?? 0) >= 0;
  const changeColor = isPositive ? DARK_THEME.positive : DARK_THEME.negative;

  // 价格变动时的跳色提示：涨闪红 / 跌闪绿，900ms 后回到黑色（原地更新不闪烁）
  const [tickDir, setTickDir] = useState<0 | 1 | -1>(0);
  const prevValue = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevValue.current;
    prevValue.current = data.value;
    if (prev === null || prev === data.value) return;
    setTickDir(data.value > prev ? 1 : -1);
    const timer = setTimeout(() => setTickDir(0), 900);
    return () => clearTimeout(timer);
  }, [data.value]);

  const priceColor =
    tickDir === 0 ? DARK_THEME.text : tickDir > 0 ? DARK_THEME.positive : DARK_THEME.negative;

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
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black transition-opacity"
          style={{ color: DARK_THEME.textMuted }}
          title="移除"
        >
          ✕
        </button>
      </div>

      {/* Price */}
      <div className="text-xl font-bold transition-colors duration-500" style={{ color: priceColor }}>
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

      {/* 近90日迷你走势图（常显，悬停可看价格） */}
      <div className="mt-2">
        <StockSparkline code={code} color={changeColor} />
      </div>
    </div>
  );
}
