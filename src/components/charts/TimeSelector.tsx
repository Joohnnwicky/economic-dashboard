import { TimeRange } from '../../types/api';

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
          className="px-3 py-1 text-sm font-sans font-bold transition-colors"
          style={{
            backgroundColor: value === option ? '#000000' : '#ffffff',
            color: value === option ? '#ffffff' : '#000000',
            border: '1px solid #000000',
          }}
        >
          {TIME_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
