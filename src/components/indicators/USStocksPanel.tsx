import { useUSStocks } from '../../hooks/useUSStocks';
import { DARK_THEME } from '../../constants/colors';
import { USStockQuote } from '../../api/us-stocks';
import { MiniChart } from '../charts/MiniChart';
import { LastUpdated } from '../ui/LastUpdated';
import { formatPrice } from '../../utils/formatters';
import { NormalizedIndicator } from '../../types/indicator';

const CATEGORY_LABELS: Record<USStockQuote['category'], string> = {
  'mag7': 'Magnificent 7',
  'semiconductor': '半导体扩展',
  'spacex': 'SpaceX',
};

const CATEGORY_ORDER: USStockQuote['category'][] = ['mag7', 'semiconductor', 'spacex'];

export function USStocksPanel() {
  const { data, isLoading, error } = useUSStocks();

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#58a6ff]"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-2 bg-red-900/20 rounded text-red-400">
        加载失败: {error.message}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  // Group stocks by category, preserving the configured order
  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    stocks: data.filter(s => s.category === cat),
  })).filter(g => g.stocks.length > 0);

  return (
    <div className="space-y-6">
      <p className="text-sm" style={{ color: DARK_THEME.textMuted }}>
        美股头部追踪 · yfinance 日线收盘价 · 缓存 5 分钟
      </p>

      {grouped.map(group => (
        <div key={group.category}>
          <h4
            className="text-sm font-medium mb-3"
            style={{ color: DARK_THEME.textMuted }}
          >
            {group.label}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {group.stocks.map(stock => (
              <USStockCard key={stock.symbol} stock={stock} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function USStockCard({ stock }: { stock: USStockQuote }) {
  if (stock.warning) {
    return (
      <div
        className="rounded-lg p-4 flex flex-col"
        style={{ backgroundColor: DARK_THEME.panel }}
      >
        <h4 className="text-sm mb-2" style={{ color: DARK_THEME.textMuted }}>
          {stock.symbol} <span className="text-xs">— {stock.name}</span>
        </h4>
        <span className="text-xs" style={{ color: DARK_THEME.textMuted }}>
          数据暂不可用
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-4 flex flex-col"
      style={{ backgroundColor: DARK_THEME.panel }}
    >
      <h4 className="text-sm mb-2" style={{ color: DARK_THEME.textMuted }}>
        {stock.symbol} <span className="text-xs">— {stock.name}</span>
      </h4>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ color: DARK_THEME.text }}>
          {formatPrice(stock.value, 'USD')}
        </span>
      </div>

      {stock.change && (
        <div className="flex items-center gap-2 mt-2">
          <span
            style={{
              color: stock.change.percentage >= 0 ? DARK_THEME.accent[1] : DARK_THEME.accent[2],
            }}
          >
            {stock.change.percentage >= 0 ? '+' : ''}{stock.change.percentage.toFixed(2)}%
          </span>
          <span className="text-sm" style={{ color: DARK_THEME.textMuted }}>
            (24h)
          </span>
        </div>
      )}

      {stock.historical.length >= 2 && (
        <div className="mt-3">
          <MiniChart
            data={toNormalized(stock)}
            height={60}
            isDaily={true}
          />
        </div>
      )}

      <div className="mt-2">
        <LastUpdated timestamp={stock.timestamp} />
      </div>
    </div>
  );
}

/** 把 USStockQuote 转成 MiniChart 期望的 NormalizedIndicator 形状 */
function toNormalized(stock: USStockQuote): NormalizedIndicator {
  return {
    id: `us-stock-${stock.symbol.toLowerCase()}`,
    name: stock.symbol,
    value: stock.value,
    unit: 'USD',
    timestamp: stock.timestamp,
    change: stock.change
      ? { ...stock.change, period: 'daily' }
      : undefined,
    historical: stock.historical,
  };
}
