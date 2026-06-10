import { useState } from 'react';
import { useCustomStocksStore } from '../../stores/customStocksStore';
import { useCustomStockQuotes } from '../../hooks/useCustomStockQuotes';
import { StockCard } from './StockCard';
import { StockSearchDialog } from './StockSearchDialog';
import { StockKlineChart } from './StockKlineChart';
import { DARK_THEME } from '../../constants/colors';

export function CustomStocksPanel() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [selectedStockName, setSelectedStockName] = useState<string>('');

  const stocks = useCustomStocksStore((state) => state.stocks);
  const removeStock = useCustomStocksStore((state) => state.removeStock);
  const clearAll = useCustomStocksStore((state) => state.clearAll);
  const { quotes, isLoading, isFetching, error } = useCustomStockQuotes();

  // Empty state
  if (stocks.length === 0) {
    return (
      <div className="text-center py-6" style={{ color: DARK_THEME.textMuted }}>
        <p className="mb-2">暂无自选股</p>
        <button
          onClick={() => setSearchOpen(true)}
          className="px-4 py-2 rounded border hover:bg-[#21262d]"
          style={{ borderColor: DARK_THEME.accent[0], color: DARK_THEME.accent[0] }}
        >
          + 添加自选股
        </button>
        <StockSearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        {isFetching && (
          <span className="text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>
            更新中...
          </span>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="px-3 py-1 rounded text-sm hover:bg-[#21262d]"
            style={{ color: DARK_THEME.accent[0] }}
          >
            + 添加
          </button>
          {stocks.length > 1 && (
            <button
              onClick={clearAll}
              className="px-3 py-1 rounded text-sm hover:bg-[#21262d]"
              style={{ color: DARK_THEME.textMuted }}
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* Loading/Error states */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-[#58a6ff] border-t-transparent rounded-full" />
        </div>
      )}

      {error && (
        <div className="text-center py-4" style={{ color: DARK_THEME.negative }}>
          数据加载失败，请检查后端服务是否启动
        </div>
      )}

      {/* Stock Cards Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-2 gap-3">
          {quotes.map((quote) => {
            const code = quote.id.replace('stock-', '');
            return (
              <StockCard
                key={quote.id}
                data={quote}
                onViewChart={() => {
                  setSelectedStock(code);
                  setSelectedStockName(quote.name);
                }}
                onRemove={() => removeStock(code)}
              />
            );
          })}
        </div>
      )}

      {/* Selected Stock K-line Chart */}
      {selectedStock && (
        <div className="mt-4">
          <StockKlineChart
            code={selectedStock}
            name={selectedStockName}
            onClose={() => setSelectedStock(null)}
          />
        </div>
      )}

      {/* Footer */}
      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        数据每1分钟更新一次 (通达信后端) · 自选股已保存到本地
      </p>

      <StockSearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
