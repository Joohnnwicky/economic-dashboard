import ReactECharts from 'echarts-for-react';
import { useOnchain } from '../../hooks/useOnchain';
import { LastUpdated } from '../ui/LastUpdated';
import { DARK_THEME } from '../../constants/colors';
import { format } from 'date-fns';

function formatHashrate(hs: number | null): string {
  if (hs === null || hs === undefined) return '-';
  // H/s -> EH/s
  return `${(hs / 1e18).toFixed(1)} EH/s`;
}

function formatDifficulty(d: number | null): string {
  if (d === null || d === undefined) return '-';
  // difficulty ~1e14 -> T
  return `${(d / 1e12).toFixed(2)} T`;
}

/** 根据历史趋势判断算力水平 */
function assessHashrate(
  currentEh: number | null,
  trend: Array<{ hashrate_eh: number }>,
): { label: string; color: string } | null {
  if (currentEh === null || trend.length < 3) return null;
  const values = trend.map(p => p.hashrate_eh);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const ratio = currentEh / avg;
  if (ratio >= 1.15) return { label: '算力强劲 (ATH 附近)', color: DARK_THEME.positive };
  if (ratio >= 1.05) return { label: '算力偏高', color: DARK_THEME.positive };
  if (ratio >= 0.95) return { label: '算力正常', color: DARK_THEME.textMuted };
  if (ratio >= 0.85) return { label: '算力偏低', color: DARK_THEME.warning };
  return { label: '算力显著下降', color: DARK_THEME.error };
}

/** 手续费拥堵等级 */
function assessFees(satPerVb: number | null): { label: string; color: string } | null {
  if (satPerVb === null || satPerVb === undefined) return null;
  if (satPerVb >= 30) return { label: '严重拥堵', color: DARK_THEME.error };
  if (satPerVb >= 10) return { label: '网络拥堵', color: DARK_THEME.warning };
  if (satPerVb >= 3) return { label: '正常', color: DARK_THEME.positive };
  return { label: '空闲', color: DARK_THEME.positive };
}

export function OnchainPanel() {
  const { data, isLoading, error, isFetching } = useOnchain();

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

  // 难度调整变化着色: 正=难度上升(矿工竞争加剧), 负=下降
  const diffChange = data.difficulty_change_percent;
  const diffChangeColor = diffChange != null && diffChange >= 0 ? DARK_THEME.positive : DARK_THEME.negative;
  const retargetDate = data.expected_retarget_date
    ? format(new Date(data.expected_retarget_date), 'yyyy-MM-dd')
    : '-';

  const trend = data.trend || [];
  const hasTrend = trend.length > 1;
  const hashrateEh = data.hashrate_hs != null ? data.hashrate_hs / 1e18 : null;
  const hashrateAssess = assessHashrate(hashrateEh, trend);
  const feeAssess = assessFees(data.hour);

  const trendOption = hasTrend ? {
    backgroundColor: 'transparent',
    grid: { left: '12%', right: '5%', top: '8%', bottom: '18%' },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: { color: DARK_THEME.textMuted, fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: { color: DARK_THEME.textMuted, fontSize: 10, formatter: (v: number) => `${v.toFixed(0)}` },
      splitLine: { show: false },
    },
    series: [{
      type: 'line',
      data: trend.map((p) => [p.timestamp, p.hashrate_eh]),
      smooth: false,
      symbol: 'none',
      lineStyle: { color: DARK_THEME.accent[6], width: 2 },
      areaStyle: { color: DARK_THEME.accent[6], opacity: 0.1 },
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: DARK_THEME.panel,
      borderColor: DARK_THEME.gridLine,
      textStyle: { color: DARK_THEME.text, fontSize: 12 },
      formatter: (params: unknown) => {
        const arr = params as Array<{ value: [number, number] }>;
        if (!arr || arr.length === 0) return '';
        const [ts, val] = arr[0].value;
        const d = new Date(ts);
        return `${format(d, 'MM-dd HH:mm')}<br/>算力: ${val.toFixed(1)} EH/s`;
      },
    },
  } : null;

  return (
    <div className="space-y-3">
      {isFetching && (
        <span className="text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>
          更新中...
        </span>
      )}

      {/* 算力 + 难度 */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-bold" style={{ color: DARK_THEME.text, fontFamily: 'Arial Black, sans-serif' }}>
            {formatHashrate(data.hashrate_hs)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs" style={{ color: DARK_THEME.textMuted }}>BTC 网络算力</span>
            {hashrateAssess && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: hashrateAssess.color, backgroundColor: hashrateAssess.color + '18', border: `1px solid ${hashrateAssess.color}40` }}>
                {hashrateAssess.label}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: DARK_THEME.text }}>
            {formatDifficulty(data.difficulty)}
          </div>
          <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>难度</div>
        </div>
      </div>

      {/* 算力趋势 */}
      {trendOption && (
        <ReactECharts option={trendOption} style={{ height: '90px', width: '100%' }} opts={{ renderer: 'canvas' }} />
      )}

      {/* 手续费 */}
      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between p-1.5" style={{ border: `1px solid ${DARK_THEME.border}` }}>
            <span style={{ color: DARK_THEME.textMuted }}>快速</span>
            <span style={{ color: DARK_THEME.error }}>{data.fastest ?? '-'} sat/vB</span>
          </div>
          <div className="flex justify-between p-1.5" style={{ border: `1px solid ${DARK_THEME.border}` }}>
            <span style={{ color: DARK_THEME.textMuted }}>1小时</span>
            <span style={{ color: DARK_THEME.warning }}>{data.hour ?? '-'} sat/vB</span>
          </div>
        </div>
        {feeAssess && (
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: DARK_THEME.textMuted }}>链上拥堵:</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: feeAssess.color, backgroundColor: feeAssess.color + '18', border: `1px solid ${feeAssess.color}40` }}>
              {feeAssess.label}
            </span>
          </div>
        )}
      </div>

      {/* 难度调整 */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span style={{ color: DARK_THEME.textMuted }}>下次难度调整</span>
          <span style={{ color: DARK_THEME.text }}>{retargetDate}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: DARK_THEME.textMuted }}>进度</span>
          <span style={{ color: DARK_THEME.text }}>
            {data.progress_percent != null ? `${data.progress_percent.toFixed(1)}%` : '-'}
            {data.remaining_blocks != null && ` (剩${data.remaining_blocks}块)`}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: DARK_THEME.textMuted }}>预计变化</span>
          <span style={{ color: diffChangeColor }}>
            {diffChange != null ? `${diffChange >= 0 ? '+' : ''}${diffChange.toFixed(2)}%` : '-'}
          </span>
        </div>
      </div>

      <LastUpdated timestamp={data.timestamp} />

      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        数据每 30 分钟更新 (mempool.space) | 算力反映网络安全, 手续费反映拥堵
      </p>
    </div>
  );
}
