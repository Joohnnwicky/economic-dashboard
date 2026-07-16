import { useCoinbasePremium } from '../../hooks/useCoinbasePremium';
import { DARK_THEME } from '../../constants/colors';
import { MiniChart } from '../charts/MiniChart';
import { LastUpdated } from '../ui/LastUpdated';
import { NormalizedIndicator } from '../../types/indicator';

function formatUSD(v: number): string {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Coinbase 比特币溢价指数面板。
 * 溢价 = Coinbase BTC/USD 现货价 - Binance BTC/USDT 价
 * 正溢价（红）= Coinbase 高于 Binance，反映美股资金看多情绪；负溢价（绿）反之。
 */
export function CoinbasePremiumPanel() {
  const { data, isLoading, error } = useCoinbasePremium();

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e91d2a]"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-3 rounded" style={{ backgroundColor: DARK_THEME.background, color: DARK_THEME.error }}>
        加载失败: {error.message}
        <div className="text-xs mt-1" style={{ color: DARK_THEME.textMuted }}>
          Coinbase API 可能需要代理访问
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isPositive = data.premium >= 0;
  const premiumColor = isPositive ? DARK_THEME.positive : DARK_THEME.negative;

  const normalized: NormalizedIndicator = {
    id: 'coinbase-btc-premium',
    name: 'Coinbase 溢价',
    value: data.premium,
    unit: 'USD',
    timestamp: data.timestamp,
    historical: data.historical,
  };

  return (
    <div className="space-y-3">
      {/* 核心溢价数值 */}
      <div className="rounded-lg p-4" style={{ backgroundColor: DARK_THEME.panel }}>
        <div className="text-xs mb-1" style={{ color: DARK_THEME.textMuted }}>Coinbase 比特币溢价</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold" style={{ color: premiumColor }}>
            {isPositive ? '+' : ''}${formatUSD(data.premium)}
          </span>
          <span className="text-sm" style={{ color: premiumColor }}>
            ({isPositive ? '+' : ''}{data.premiumPercent.toFixed(4)}%)
          </span>
        </div>
        <div className="flex gap-4 mt-2 text-xs" style={{ color: DARK_THEME.textMuted }}>
          <span>Coinbase: ${data.coinbasePrice.toLocaleString('en-US', { maximumFractionDigits: 1 })}</span>
          <span>Binance: ${data.binancePrice.toLocaleString('en-US', { maximumFractionDigits: 1 })}</span>
        </div>
      </div>

      {/* 24h 溢价走势 */}
      {data.historical.length >= 2 && (
        <div>
          <div className="text-xs mb-1" style={{ color: DARK_THEME.textMuted }}>24h 溢价走势 (USD)</div>
          <MiniChart data={normalized} height={120} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <LastUpdated timestamp={data.timestamp} />
        <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
          Coinbase−Binance · 每1分钟更新
        </p>
      </div>
    </div>
  );
}
