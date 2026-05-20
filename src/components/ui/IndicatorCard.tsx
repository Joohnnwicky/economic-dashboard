import { formatPrice, formatPercentage } from '../../utils/formatters';
import { DARK_THEME } from '../../constants/colors';
import { LastUpdated } from './LastUpdated';

interface IndicatorCardProps {
  title: string;
  value: number;
  unit: string;
  change?: {
    value: number;
    percentage: number;
  };
  lastUpdated?: Date;
}

export function IndicatorCard({ title, value, unit, change, lastUpdated }: IndicatorCardProps) {
  const isPositive = change !== undefined && change.percentage >= 0;
  const changeColor = isPositive ? DARK_THEME.accent[1] : DARK_THEME.accent[2]; // Red(涨) or Green(跌)

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
    </div>
  );
}