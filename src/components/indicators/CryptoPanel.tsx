import { useCryptoPrice, useCryptoHistories, useCryptoMultiDayChanges, useCryptoDailyHistories } from '../../hooks/useCrypto';
import { IndicatorCard } from '../ui/IndicatorCard';
import { MiniChart } from '../charts/MiniChart';
import { BTC, ETH } from '../../constants/indicators';
import { DARK_THEME } from '../../constants/colors';

// Helper component for displaying multi-day change
function ChangeBadge({ label, value }: { label: string; value: number | undefined }) {
  if (value === undefined) return null;
  const isPositive = value >= 0;
  const color = isPositive ? DARK_THEME.positive : DARK_THEME.negative;
  return (
    <span className="ml-2 px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${color}20`, color }}>
      {label}: {isPositive ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

export function CryptoPanel() {
  // 30秒轮询更新，不再使用WebSocket实时更新
  const { btcPrice, ethPrice, isLoading: priceLoading, error } = useCryptoPrice();
  const { btcHistory, ethHistory, isLoading: historyLoading } = useCryptoHistories();
  const { btc7dChange, btc30dChange, eth7dChange, eth30dChange, isLoading: multiDayLoading } = useCryptoMultiDayChanges();
  const { btcDailyHistory, ethDailyHistory, isLoading: dailyLoading } = useCryptoDailyHistories();

  const isLoading = priceLoading || historyLoading || multiDayLoading || dailyLoading;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium" style={{ color: DARK_THEME.text }}>
          加密货币行情（Crypto Prices）
        </h3>
      </div>

      {error && (
        <div className="p-2 rounded" style={{ backgroundColor: 'rgba(248, 81, 73, 0.2)', color: DARK_THEME.error }}>
          加载失败: {error.message}
        </div>
      )}

      {isLoading && !btcPrice && !ethPrice && (
        <div className="p-4 rounded" style={{ backgroundColor: DARK_THEME.panel, color: DARK_THEME.textMuted }}>
          正在加载加密货币数据...
        </div>
      )}

      {/* Price Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* BTC Card */}
        <div>
          <IndicatorCard
            title={BTC.name}
            value={btcPrice?.price || 0}
            unit={BTC.unit}
            change={btcPrice ? {
              value: btcPrice.price * (btcPrice.change24h / 100),
              percentage: btcPrice.change24h,
            } : undefined}
            lastUpdated={btcPrice?.timestamp}
          />
          {/* Multi-day changes */}
          <div className="mt-2 flex flex-wrap items-center">
            <ChangeBadge label="7d" value={btc7dChange} />
            <ChangeBadge label="30d" value={btc30dChange} />
          </div>
        </div>

        {/* ETH Card */}
        <div>
          <IndicatorCard
            title={ETH.name}
            value={ethPrice?.price || 0}
            unit={ETH.unit}
            change={ethPrice ? {
              value: ethPrice.price * (ethPrice.change24h / 100),
              percentage: ethPrice.change24h,
            } : undefined}
            lastUpdated={ethPrice?.timestamp}
          />
          {/* Multi-day changes */}
          <div className="mt-2 flex flex-wrap items-center">
            <ChangeBadge label="7d" value={eth7dChange} />
            <ChangeBadge label="30d" value={eth30dChange} />
          </div>
        </div>
      </div>

      {/* Mini Charts - Hourly */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {btcHistory && <MiniChart data={btcHistory} />}
        {ethHistory && <MiniChart data={ethHistory} />}
      </div>

      {/* Daily Trend Charts - 30 days */}
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2" style={{ color: DARK_THEME.textMuted }}>
          日趋势图 (30天)
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {btcDailyHistory && <MiniChart data={btcDailyHistory} height={100} isDaily={true} />}
          {ethDailyHistory && <MiniChart data={ethDailyHistory} height={100} isDaily={true} />}
        </div>
      </div>

      {/* Update Frequency Notice */}
      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        数据每1分钟更新一次 (Binance API)
      </p>
    </div>
  );
}