import { useCryptoPrice, useCryptoHistories } from '../../hooks/useCrypto';
import { IndicatorCard } from '../ui/IndicatorCard';
import { MiniChart } from '../charts/MiniChart';
import { BTC, ETH } from '../../constants/indicators';
import { DARK_THEME } from '../../constants/colors';

export function CryptoPanel() {
  // 30秒轮询更新，不再使用WebSocket实时更新
  const { btcPrice, ethPrice, isLoading: priceLoading, error } = useCryptoPrice();
  const { btcHistory, ethHistory, isLoading: historyLoading } = useCryptoHistories();

  const isLoading = priceLoading || historyLoading;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium" style={{ color: DARK_THEME.text }}>
          加密货币实时行情
        </h3>
      </div>

      {error && (
        <div className="p-2 rounded" style={{ backgroundColor: 'rgba(248, 81, 73, 0.2)', color: DARK_THEME.accent[2] }}>
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

        {/* ETH Card */}
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
      </div>

      {/* Mini Charts */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {btcHistory && <MiniChart data={btcHistory} />}
        {ethHistory && <MiniChart data={ethHistory} />}
      </div>

      {/* Update Frequency Notice */}
      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        数据每5分钟更新一次 (CoinGecko API)
      </p>
    </div>
  );
}