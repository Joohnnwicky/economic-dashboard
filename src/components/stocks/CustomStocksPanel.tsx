import { useState } from 'react';
import { useCustomStocksStore } from '../../stores/customStocksStore';
import { useCustomStockQuotes } from '../../hooks/useCustomStockQuotes';
import { StockCard } from './StockCard';
import { StockSearchDialog } from './StockSearchDialog';
import { DARK_THEME } from '../../constants/colors';

export function CustomStocksPanel() {
  const [searchOpen, setSearchOpen] = useState(false);

  const stocks = useCustomStocksStore((state) => state.stocks);
  const removeStock = useCustomStocksStore((state) => state.removeStock);
  const clearAll = useCustomStocksStore((state) => state.clearAll);
  const { quotes, isLoading, error } = useCustomStockQuotes();

  // Empty state
  if (stocks.length === 0) {
    return (
      <div className="text-center py-6" style={{ color: DARK_THEME.textMuted }}>
        <p className="mb-2">暂无自选股</p>
        <button
          onClick={() => setSearchOpen(true)}
          className="px-4 py-2 rounded border hover:bg-black"
          style={{ borderColor: DARK_THEME.accent[0], color: DARK_THEME.accent[0] }}
        >
          + 添加自选股
        </button>
        <StockSearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    );
  }

  // 刷新期间保留上次数据原地更新（react-query 语义），仅在完全没有数据时才显示加载/错误
  const hasData = quotes.length > 0;

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: DARK_THEME.textMuted }}>
          {hasData ? '盘中5秒 · 休市10分钟自动刷新' : ''}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="px-3 py-1 rounded text-sm hover:bg-black"
            style={{ color: DARK_THEME.accent[0] }}
          >
            + 添加
          </button>
          {stocks.length > 1 && (
            <button
              onClick={clearAll}
              className="px-3 py-1 rounded text-sm hover:bg-black"
              style={{ color: DARK_THEME.textMuted }}
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* 完全没有数据时才显示加载/错误状态 */}
      {!hasData && isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-[#e91d2a] border-t-transparent rounded-full" />
        </div>
      )}

      {!hasData && error && (
        <div className="text-center py-4" style={{ color: DARK_THEME.negative }}>
          数据加载失败，请检查后端服务是否启动
        </div>
      )}

      {/* Stock Cards Grid（数据到位后常驻，刷新时原地更新） */}
      {hasData && (
        <div className="grid grid-cols-2 gap-3">
          {quotes.map((quote) => {
            const code = quote.id.replace('stock-', '');
            return (
              <StockCard
                key={quote.id}
                code={code}
                data={quote}
                onRemove={() => removeStock(code)}
              />
            );
          })}
        </div>
      )}

      {hasData && error && (
        <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
          最近一次刷新失败，当前显示的是上次成功数据
        </p>
      )}

      {/* Footer */}
      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        通达信行情 · 自选股已保存到本地
      </p>

      <StockSearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
