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

  // 检测是否是6位数字代码（可以直接添加）
  const isStockCode = /^\d{6}$/.test(keyword);
  const getMarketFromCode = (code: string): 'sh' | 'sz' => {
    // 6开头是上海，其他是深圳
    return code.startsWith('6') ? 'sh' : 'sz';
  };

  const handleDirectAdd = () => {
    if (!isStockCode) return;
    const market = getMarketFromCode(keyword);
    handleAddStock({
      code: keyword,
      name: `股票${keyword}`,  // 名称会在获取行情时自动更新
      market,
    });
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

        {/* 搜索结果列表 */}
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

        {/* 直接输入代码添加 */}
        {keyword.length >= 1 && !isLoading && results && results.length === 0 && (
          <div className="mt-4">
            {isStockCode ? (
              <button
                onClick={handleDirectAdd}
                className="w-full p-3 rounded border hover:bg-[#21262d]"
                style={{
                  borderColor: DARK_THEME.accent[0],
                  color: DARK_THEME.accent[0],
                }}
              >
                直接添加代码 {keyword} ({getMarketFromCode(keyword) === 'sh' ? '沪市' : '深市'})
              </button>
            ) : (
              <div className="text-center py-4" style={{ color: DARK_THEME.textMuted }}>
                未找到匹配的股票，请输入6位股票代码直接添加
              </div>
            )}
          </div>
        )}

        <p
          className="mt-4 text-xs"
          style={{ color: DARK_THEME.textMuted }}
        >
          支持200+常用A股搜索，或输入任意6位代码直接添加
        </p>
      </div>
    </div>
  );
}