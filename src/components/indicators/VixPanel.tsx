import { useVix } from '../../hooks/useVix';
import { MiniChart } from '../charts/MiniChart';
import { LastUpdated } from '../ui/LastUpdated';
import { DARK_THEME } from '../../constants/colors';

// VIX 解读带: <20 平静, 20-30 警惕, >=30 恐慌
function getVixBand(vix: number) {
  if (vix < 20) return { label: '平静', desc: '市场情绪乐观, 波动率低', color: DARK_THEME.success };
  if (vix < 30) return { label: '警惕', desc: '波动加剧, 不确定性上升', color: DARK_THEME.warning };
  return { label: '恐慌', desc: '市场恐慌, 风险规避情绪强', color: DARK_THEME.error };
}

export function VixPanel() {
  const { data, isLoading, error, isFetching } = useVix();

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

  const band = getVixBand(data.value);
  const change = data.change;
  const changeColor = change && change.percentage >= 0 ? DARK_THEME.negative : DARK_THEME.positive;
  // VIX 上升=恐慌升温(红/坏), 下降=情绪缓和(绿/好), 与股价涨跌相反, 故取反色

  return (
    <div className="space-y-3">
      {isFetching && (
        <span className="text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>
          更新中...
        </span>
      )}

      {/* Current value + band badge */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-bold" style={{ color: DARK_THEME.text, fontFamily: 'Arial Black, sans-serif' }}>
            {data.value.toFixed(2)}
          </div>
          {change && (
            <div className="text-sm mt-1" style={{ color: changeColor }}>
              {change.percentage >= 0 ? '+' : ''}{change.percentage.toFixed(2)}%
              <span className="ml-1" style={{ color: DARK_THEME.textMuted }}>(日变化)</span>
            </div>
          )}
        </div>
        <span
          className="px-2 py-1 text-sm font-bold"
          style={{ color: DARK_THEME.text, backgroundColor: band.color }}
        >
          {band.label}
        </span>
      </div>

      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        {band.desc}
      </p>

      {/* History chart - VIX 为日频数据 */}
      {data.historical && data.historical.length > 0 && (
        <MiniChart data={data} height={120} isDaily />
      )}

      <div className="flex items-center justify-between">
        <LastUpdated timestamp={data.timestamp} />
      </div>

      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        数据每日更新 (FRED API · VIXCLS) | VIX &lt;20 平静, 20-30 警惕, &gt;30 恐慌
      </p>
    </div>
  );
}
