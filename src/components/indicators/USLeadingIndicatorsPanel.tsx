import { useUSLeadingIndicators } from '../../hooks/useUSLeadingIndicators';
import { MiniChart } from '../charts/MiniChart';
import { LastUpdated } from '../ui/LastUpdated';
import { DARK_THEME } from '../../constants/colors';
import { NormalizedIndicator } from '../../types/indicator';

// PMI: 50 为荣枯线, >50 扩张, <50 收缩
function pmiBand(v: number) {
  if (v >= 50) return { label: '扩张', color: DARK_THEME.positive };
  return { label: '收缩', color: DARK_THEME.negative };
}

// 密歇根消费者信心: 历史区间约 50-110
function sentimentBand(v: number) {
  if (v >= 90) return { label: '乐观', color: DARK_THEME.positive };
  if (v >= 60) return { label: '中性', color: DARK_THEME.warning };
  return { label: '悲观', color: DARK_THEME.negative };
}

function MetricRow({
  title, data, band, fmt = (v: number) => v.toFixed(1),
}: {
  title: string;
  data: NormalizedIndicator;
  band: { label: string; color: string };
  fmt?: (v: number) => string;
}) {
  const change = data.change;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: DARK_THEME.textMuted }}>{title}</span>
        <span className="px-1.5 py-0.5 text-xs font-bold" style={{ color: DARK_THEME.text, backgroundColor: band.color }}>
          {band.label}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold" style={{ color: DARK_THEME.text, fontFamily: 'Arial Black, sans-serif' }}>
          {fmt(data.value)}
        </div>
        {change && (
          <div className="text-xs" style={{ color: change.percentage >= 0 ? DARK_THEME.positive : DARK_THEME.negative }}>
            {change.percentage >= 0 ? '+' : ''}{change.percentage.toFixed(2)}%
          </div>
        )}
      </div>
      {data.historical.length > 0 && (
        <MiniChart data={data} height={80} isDaily />
      )}
    </div>
  );
}

export function USLeadingIndicatorsPanel() {
  const { data, isLoading, error, isFetching } = useUSLeadingIndicators();

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 bg-red-900/20 rounded text-red-400">
        加载失败: {error.message}
      </div>
    );
  }

  if (!data || (!data.pmi && !data.sentiment)) {
    return <div className="text-sm" style={{ color: DARK_THEME.textMuted }}>暂无数据</div>;
  }

  const latest = data.pmi ?? data.sentiment;

  return (
    <div className="space-y-4">
      {isFetching && (
        <span className="text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>
          更新中...
        </span>
      )}

      {data.pmi && (
        <MetricRow
          title="ISM 制造业 PMI"
          data={data.pmi}
          band={pmiBand(data.pmi.value)}
        />
      )}

      {data.sentiment && (
        <MetricRow
          title="密歇根消费者信心"
          data={data.sentiment}
          band={sentimentBand(data.sentiment.value)}
        />
      )}

      {latest && <LastUpdated timestamp={latest.timestamp} />}

      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        数据每月更新 (FRED API · NAPM / UMSCONF) | PMI &gt;50 扩张, &lt;50 收缩
      </p>
    </div>
  );
}
