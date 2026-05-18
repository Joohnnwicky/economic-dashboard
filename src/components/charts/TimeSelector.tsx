import { TimeRange } from '../../types/api';
import { DARK_THEME } from '../../constants/colors';

interface TimeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const TIME_OPTIONS: TimeRange[] = ['1M', '3M', '6M', '1Y', 'ALL'];

const TIME_LABELS: Record<TimeRange, string> = {
  '1D': '1天',
  '1W': '1周',
  '1M': '1月',
  '3M': '3月',
  '6M': '6月',
  '1Y': '1年',
  'ALL': '全部',
};

export function TimeSelector({ value, onChange }: TimeSelectorProps) {
  return (
    <div className="flex gap-2">
      {TIME_OPTIONS.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className="px-3 py-1 rounded text-sm transition-colors"
          style={{
            backgroundColor: value === option ? DARK_THEME.accent[0] : DARK_THEME.panel,
            color: value === option ? DARK_THEME.background : DARK_THEME.text,
            border: `1px solid ${DARK_THEME.gridLine}`,
          }}
        >
          {TIME_LABELS[option]}
        </button>
      ))}
    </div>
  );
}