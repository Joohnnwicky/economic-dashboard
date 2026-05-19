import { useState } from 'react';
import { useStockSearch } from '../../hooks/useStockSearch';
import { useCustomStocksStore } from '../../stores/customStocksStore';
import { DARK_THEME } from '../../constants/colors';

interface StockSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StockSearchDialog({ isOpen, onClose }: StockSearchDialogProps) {
  const [keyword, setKeyword] = useState('');
  const { data: results, isLoading } = useStockSearch(keyword);
  const addStock = useCustomStocksStore((state) => state.addStock);
  const existingStocks = useCustomStocksStore((state) => state.stocks);

  if (!isOpen) return null;

  const handleAddStock = (stock: { code: string; name: string; market: 'sh' | 'sz' }) => {
    // Check if already added
    if (existingStocks.some((s) => s.code === stock.code)) {
      return;  // Already in list
    }

    addStock({
      code: stock.code,
      name: stock.name,
      market: stock.market,
      addedAt: new Date().toISOString(),
    });
    setKeyword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="w-full max-w-md p-4 rounded-lg shadow-xl"
        style={{ backgroundColor: DARK_THEME.panel }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg" style={{ color: DARK_THEME.text }}>
            添加自选股
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#21262d]"
            style={{ color: DARK_THEME.textMuted }}
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          placeholder="输入股票代码或名称..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          autoFocus
          className="w-full p-3 rounded border outline-none focus:border-[#58a6ff]"
          style={{
            backgroundColor: DARK_THEME.background,
            color: DARK_THEME.text,
            borderColor: DARK_THEME.gridLine,
          }}
        />

        {isLoading && (
          <div className="mt-4 text-center" style={{ color: DARK_THEME.textMuted }}>
            搜索中...
          </div>
        )}

        {results && results.length > 0 && (
          <ul className="mt-4 space-y-1 max-h-60 overflow-y-auto">
            {results.map((stock) => {
              const isAdded = existingStocks.some((s) => s.code === stock.code);
              return (
                <li
                  key={stock.code}
                  className={`p-3 rounded cursor-pointer flex items-center justify-between ${
                    isAdded ? 'opacity-50' : 'hover:bg-[#21262d]'
                  }`}
                  onClick={() => !isAdded && handleAddStock(stock)}
                  style={{ borderColor: DARK_THEME.gridLine }}
                >
                  <div>
                    <span style={{ color: DARK_THEME.text }}>{stock.name}</span>
                    <span
                      className="ml-2 text-sm"
                      style={{ color: DARK_THEME.textMuted }}
                    >
                      ({stock.market === 'sh' ? '沪' : '深'}{stock.code})
                    </span>
                  </div>
                  {isAdded && (
                    <span className="text-sm" style={{ color: DARK_THEME.textMuted }}>
                      已添加
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {keyword.length >= 1 && !isLoading && results && results.length === 0 && (
          <div className="mt-4 text-center" style={{ color: DARK_THEME.textMuted }}>
            未找到匹配的股票
          </div>
        )}

        <p
          className="mt-4 text-xs"
          style={{ color: DARK_THEME.textMuted }}
        >
          支持常用A股股票搜索，输入代码或名称
        </p>
      </div>
    </div>
  );
}