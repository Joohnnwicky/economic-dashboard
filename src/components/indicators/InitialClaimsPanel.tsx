import { useInitialClaims } from '../../hooks/useInitialClaims';
import { MiniChart } from '../charts/MiniChart';
import { LastUpdated } from '../ui/LastUpdated';
import { DARK_THEME } from '../../constants/colors';
import { formatChineseNumber } from '../../utils/formatters';

// FRED ICSA 单位为实际人数(人), 按中文万/亿展示
function formatClaims(value: number): string {
  return formatChineseNumber(value);
}

export function InitialClaimsPanel() {
  const { data, isLoading, error, isFetching } = useInitialClaims();

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

  if (!data) {
    return <div className="text-sm" style={{ color: DARK_THEME.textMuted }}>暂无数据</div>;
  }

  // 4 周移动平均(行业惯例平滑周度噪音)
  const hist = data.historical;
  const last4 = hist.slice(-4).filter(p => p.value !== null).map(p => p.value as number);
  const ma4 = last4.length === 4 ? last4.reduce((a, b) => a + b, 0) / 4 : undefined;

  const change = data.change;
  // 初请失业金上升=劳动力市场恶化(坏/红), 下降=改善(好/绿), 与股价涨跌相反
  const changeColor = change && change.percentage >= 0 ? DARK_THEME.negative : DARK_THEME.positive;

  return (
    <div className="space-y-3">
      {isFetching && (
        <span className="text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>
          更新中...
        </span>
      )}

      {/* Current value + 4wk MA */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-bold" style={{ color: DARK_THEME.text, fontFamily: 'Arial Black, sans-serif' }}>
            {formatClaims(data.value)}
          </div>
          <div className="text-xs mt-1" style={{ color: DARK_THEME.textMuted }}>人(本周初请)</div>
        </div>
        {ma4 !== undefined && (
          <div className="text-right">
            <div className="text-lg font-bold" style={{ color: DARK_THEME.text }}>
              {formatClaims(ma4)}
            </div>
            <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>4周均值</div>
          </div>
        )}
      </div>

      {change && (
        <div className="text-sm" style={{ color: changeColor }}>
          {change.percentage >= 0 ? '+' : ''}{change.percentage.toFixed(2)}%
          <span className="ml-1" style={{ color: DARK_THEME.textMuted }}>(周变化)</span>
        </div>
      )}

      {/* History chart - 周频数据, 按日期显示 */}
      {hist.length > 0 && (
        <MiniChart data={data} height={120} isDaily />
      )}

      <LastUpdated timestamp={data.timestamp} />

      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        数据每周更新 (FRED API · ICSA) | 初请失业金上升预示劳动力市场走弱
      </p>
    </div>
  );
}
