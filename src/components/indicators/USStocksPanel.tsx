import { useUSStocks } from '../../hooks/useUSStocks';
import { IndicatorCard } from '../ui/IndicatorCard';
import { DARK_THEME } from '../../constants/colors';
import { USStockQuote } from '../../api/us-stocks';

const CATEGORY_LABELS: Record<USStockQuote['category'], string> = {
  'mag7': 'Magnificent 7',
  'semiconductor': '半导体扩展',
  'spacex-proxy': 'SpaceX 代理',
};

const CATEGORY_ORDER: USStockQuote['category'][] = ['mag7', 'semiconductor', 'spacex-proxy'];

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

  // 是否所有股票都被 Alpha Vantage 配额限制
  const allRateLimited = data.every(s => s.warning);

  return (
    <div className="space-y-6">
      {allRateLimited && (
        <p
          className="text-sm p-3 rounded"
          style={{
            color: DARK_THEME.textMuted,
            backgroundColor: 'rgba(248, 199, 0, 0.08)',
            border: `1px solid rgba(248, 199, 0, 0.2)`,
          }}
        >
          ⚠️ Alpha Vantage 免费配额（25次/天）已用完，数据将在配额刷新后恢复
        </p>
      )}

      <p className="text-sm" style={{ color: DARK_THEME.textMuted }}>
        美股头部追踪 · Alpha Vantage 日线收盘价 · 缓存 1 小时
        <br />
        SpaceX 通过 DXYZ ETF 代理（持仓近 50% SpaceX，盘中实时反映二级市场估值）
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
          配额限制中…
        </span>
      </div>
    );
  }

  return (
    <IndicatorCard
      title={`${stock.symbol} — ${stock.name}`}
      value={stock.value}
      unit="USD"
      change={stock.change}
      lastUpdated={stock.timestamp}
    />
  );
}
