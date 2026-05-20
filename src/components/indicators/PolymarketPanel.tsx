import { usePolymarketTrending } from '../../hooks/usePolymarketTrending';
import { DARK_THEME } from '../../constants/colors';

export function PolymarketPanel() {
  const { markets, isLoading, error, isFetching } = usePolymarketTrending(8);

  if (isLoading && markets.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
          Polymarket
        </h3>
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
        </div>
      </div>
    );
  }

  if (error && markets.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: DARK_THEME.text }}>
          Polymarket
        </h3>
        <div className="p-4 bg-red-900/20 rounded text-red-400">
          加载失败: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium" style={{ color: DARK_THEME.text }}>
          Polymarket
          {isFetching && (
            <span className="ml-2 text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>
              更新中...
            </span>
          )}
        </h3>
        <a
          href="https://polymarket.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs hover:underline"
          style={{ color: DARK_THEME.accent[0] }}
        >
          Polymarket →
        </a>
      </div>

      <div className="space-y-2">
        {markets.map((market, index) => (
          <a
            key={index}
            href={market.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-3 flex items-center justify-between hover:opacity-80 transition-opacity"
            style={{ backgroundColor: DARK_THEME.panel }}
          >
            <div className="flex-1 mr-3">
              <p className="text-sm font-medium" style={{ color: DARK_THEME.text }}>
                {market.question}
              </p>
              {market.volume && (
                <p className="text-xs mt-1" style={{ color: DARK_THEME.textMuted }}>
                  交易量: {market.volume}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-1 rounded text-xs font-bold"
                style={{
                  backgroundColor: market.yesPrice > 50 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: market.yesPrice > 50 ? '#22c55e' : '#ef4444'
                }}
              >
                Yes {market.yesPrice.toFixed(0)}%
              </span>
              <span
                className="px-2 py-1 rounded text-xs"
                style={{ backgroundColor: 'rgba(100, 100, 100, 0.2)', color: DARK_THEME.textMuted }}
              >
                No {market.noPrice.toFixed(0)}%
              </span>
            </div>
          </a>
        ))}
      </div>

      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        按24小时交易量排序 · Gamma API · 预测市场
      </p>
    </div>
  );
}