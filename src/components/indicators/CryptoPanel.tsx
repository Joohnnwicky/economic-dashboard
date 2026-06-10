import { useQuery } from '@tanstack/react-query';
import { getTopVolumeCrypto, TopVolumeCrypto } from '../../api/binance';
import { DARK_THEME } from '../../constants/colors';

function formatVolume(vol: number): string {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
  return `$${vol.toFixed(0)}`;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 1 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

function CryptoRow({ item }: { item: TopVolumeCrypto }) {
  const isPositive = item.change24h >= 0;
  const changeColor = isPositive ? DARK_THEME.positive : DARK_THEME.negative;

  return (
    <div
      className="flex items-center justify-between py-2 px-3 rounded"
      style={{ backgroundColor: DARK_THEME.background }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="font-medium text-sm shrink-0"
          style={{ color: DARK_THEME.text, minWidth: '48px' }}
        >
          {item.base}
        </span>
        <span style={{ color: DARK_THEME.textMuted }} className="text-xs">/USDT</span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-sm font-mono" style={{ color: DARK_THEME.text }}>
          {formatPrice(item.price)}
        </span>
        <span
          className="text-xs font-mono w-16 text-right"
          style={{ color: changeColor }}
        >
          {isPositive ? '+' : ''}{item.change24h.toFixed(2)}%
        </span>
        <span className="text-xs font-mono w-20 text-right" style={{ color: DARK_THEME.textMuted }}>
          {formatVolume(item.volume24h)}
        </span>
      </div>
    </div>
  );
}

export function CryptoPanel() {
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['crypto-top-volume'],
    queryFn: () => getTopVolumeCrypto(10),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="space-y-3">
      {isFetching && (
        <span className="text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>
          更新中...
        </span>
      )}

      {/* Column headers */}
      <div
        className="flex items-center justify-between px-3 text-xs"
        style={{ color: DARK_THEME.textMuted }}
      >
        <span>币种</span>
        <div className="flex items-center gap-4">
          <span className="w-20 text-right">价格</span>
          <span className="w-16 text-right">24h涨跌</span>
          <span className="w-20 text-right">24h成交额</span>
        </div>
      </div>

      {error && !data && (
        <div className="p-2 rounded" style={{ backgroundColor: 'rgba(248, 81, 73, 0.2)', color: DARK_THEME.error }}>
          加载失败: {error.message}
        </div>
      )}

      {isLoading && !data && (
        <div className="p-4 rounded" style={{ backgroundColor: DARK_THEME.background, color: DARK_THEME.textMuted }}>
          正在加载加密货币数据...
        </div>
      )}

      {/* Crypto list */}
      {data && (
        <div className="space-y-1">
          {data.map((item) => (
            <CryptoRow key={item.symbol} item={item} />
          ))}
        </div>
      )}

      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        币安USDT交易对24h成交额排行 · 每1分钟更新
      </p>
    </div>
  );
}
