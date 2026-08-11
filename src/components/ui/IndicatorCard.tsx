import { formatPrice, formatPercentage } from '../../utils/formatters';
import { DARK_THEME } from '../../constants/colors';
import { LastUpdated } from './LastUpdated';
import ReactECharts from 'echarts-for-react';

interface IndicatorCardProps {
  title: string;
  value: number;
  unit: string;
  change?: {
    value: number;
    percentage: number;
  };
  lastUpdated?: Date;
  sparklineData?: (number | null)[];
  sparklineColor?: string;
}

export function IndicatorCard({ title, value, unit, change, lastUpdated, sparklineData, sparklineColor }: IndicatorCardProps) {
  const isPositive = change !== undefined && change.percentage >= 0;
  const changeColor = isPositive ? DARK_THEME.accent[1] : DARK_THEME.accent[2]; // Red(涨) or Green(跌)

  const lineColor = sparklineColor ?? DARK_THEME.accent[0];
  const showSparkline = !!sparklineData && sparklineData.length > 0;

  // 极简 sparkline:无坐标轴/网格/tooltip/legend/dataZoom
  const sparklineOption = {
    backgroundColor: 'transparent',
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: 'category', show: false, boundaryGap: false },
    yAxis: { type: 'value', show: false, scale: true },
    series: [{
      type: 'line',
      data: sparklineData ?? [],
      smooth: true,
      symbol: 'none',
      lineStyle: { color: lineColor, width: 1.75 },
      areaStyle: { color: lineColor, opacity: 0.12 },
    }],
  };

  return (
    <div
      className="rounded-lg p-4 flex flex-col"
      style={{ backgroundColor: DARK_THEME.panel }}
    >
      <h4 className="text-sm mb-2" style={{ color: DARK_THEME.textMuted }}>
        {title}
      </h4>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ color: DARK_THEME.text }}>
          {formatPrice(value, unit)}
        </span>
      </div>

      {change && (
        <div className="flex items-center gap-2 mt-2">
          <span style={{ color: changeColor }}>
            {isPositive ? '+' : ''}{change.percentage.toFixed(2)}%
          </span>
          <span className="text-sm" style={{ color: DARK_THEME.textMuted }}>
            (24h)
          </span>
        </div>
      )}

      {lastUpdated && (
        <div className="mt-2">
          <LastUpdated timestamp={lastUpdated} />
        </div>
      )}

      {showSparkline && (
        <div className="mt-2">
          <ReactECharts
            option={sparklineOption}
            style={{ height: '32px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      )}
    </div>
  );
}