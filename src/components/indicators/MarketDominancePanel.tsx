import ReactECharts from 'echarts-for-react';
import { useMarketDominance } from '../../hooks/useMarketDominance';
import { LastUpdated } from '../ui/LastUpdated';
import { DARK_THEME } from '../../constants/colors';

function formatUsd(v: number | null): string {
  if (v === null || v === undefined) return '-';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toLocaleString()}`;
}

// 山寨季指数解读
function altseasonBand(index: number | null) {
  if (index === null) return { label: '-', color: DARK_THEME.textMuted };
  if (index >= 75) return { label: '山寨季', color: DARK_THEME.positive };
  if (index < 50) return { label: 'BTC 季', color: DARK_THEME.warning };
  return { label: '过渡期', color: DARK_THEME.info };
}

export function MarketDominancePanel() {
  const { data, isLoading, error, isFetching } = useMarketDominance();

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

  const btcDom = data.btc_dominance;
  const ethDom = data.eth_dominance;
  const othersDom = (btcDom != null && ethDom != null) ? Math.max(0, 100 - btcDom - ethDom) : null;
  const band = altseasonBand(data.index);

  const donutOption = btcDom != null && ethDom != null ? {
    backgroundColor: 'transparent',
    series: [{
      type: 'pie',
      radius: ['55%', '78%'],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      data: [
        { value: btcDom, name: 'BTC', itemStyle: { color: DARK_THEME.accent[0] } },
        { value: ethDom, name: 'ETH', itemStyle: { color: DARK_THEME.accent[5] } },
        { value: othersDom, name: '其他', itemStyle: { color: DARK_THEME.textMuted } },
      ],
    }],
    tooltip: {
      trigger: 'item',
      backgroundColor: DARK_THEME.panel,
      borderColor: DARK_THEME.gridLine,
      textStyle: { color: DARK_THEME.text, fontSize: 12 },
      formatter: (p: { name: string; value: number }) => `${p.name}: ${p.value.toFixed(2)}%`,
    },
  } : null;

  return (
    <div className="space-y-3">
      {isFetching && (
        <span className="text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>
          更新中...
        </span>
      )}

      {/* Dominance 数值 + donut */}
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-2">
          <div>
            <div className="text-3xl font-bold" style={{ color: DARK_THEME.accent[0], fontFamily: 'Arial Black, sans-serif' }}>
              {btcDom != null ? `${btcDom.toFixed(1)}%` : '-'}
            </div>
            <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>BTC 市占率</div>
          </div>
          <div>
            <div className="text-xl font-bold" style={{ color: DARK_THEME.accent[5] }}>
              {ethDom != null ? `${ethDom.toFixed(1)}%` : '-'}
            </div>
            <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>ETH 市占率</div>
          </div>
          <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>
            总市值: {formatUsd(data.total_market_cap)}
            {data.market_cap_change_24h != null && (
              <span style={{ color: data.market_cap_change_24h >= 0 ? DARK_THEME.positive : DARK_THEME.negative }}>
                {' '}({data.market_cap_change_24h >= 0 ? '+' : ''}{data.market_cap_change_24h.toFixed(2)}%)
              </span>
            )}
          </div>
        </div>
        {donutOption && (
          <div style={{ width: 110, height: 110 }}>
            <ReactECharts option={donutOption} style={{ height: '110px', width: '110px' }} opts={{ renderer: 'canvas' }} />
          </div>
        )}
      </div>

      {/* 山寨季指数 */}
      <div className="flex items-center justify-between p-2" style={{ border: `1px solid ${DARK_THEME.border}` }}>
        <div>
          <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>山寨季指数(30日)</div>
          <div className="text-2xl font-bold" style={{ color: DARK_THEME.text, fontFamily: 'Arial Black, sans-serif' }}>
            {data.index != null ? data.index : '-'}
            <span className="text-sm ml-1" style={{ color: DARK_THEME.textMuted }}>/100</span>
          </div>
        </div>
        <span className="px-2 py-1 text-sm font-bold" style={{ color: DARK_THEME.text, backgroundColor: band.color }}>
          {band.label}
        </span>
      </div>

      {/* Top 5 币种 90 日涨幅 */}
      {data.top_coins.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-bold" style={{ color: DARK_THEME.textMuted }}>Top 5 (30日涨幅)</div>
          {data.top_coins.map((c) => (
            <div key={c.symbol} className="flex justify-between text-xs">
              <span style={{ color: DARK_THEME.text }}>{c.symbol}</span>
              <span style={{ color: (c.change_30d ?? 0) >= 0 ? DARK_THEME.positive : DARK_THEME.negative }}>
                {c.change_30d != null ? `${c.change_30d >= 0 ? '+' : ''}${c.change_30d.toFixed(1)}%` : '-'}
              </span>
            </div>
          ))}
        </div>
      )}

      <LastUpdated timestamp={data.timestamp} />

      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        数据每小时更新 (CoinGecko) | 山寨季指数 &gt;=75 为山寨季, &lt;50 为 BTC 季
      </p>
    </div>
  );
}
