import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CustomStock {
  code: string;
  name: string;
  market: 'sh' | 'sz';
  addedAt: string;  // ISO date string
}

interface CustomStocksState {
  stocks: CustomStock[];

  addStock: (stock: CustomStock) => void;
  addStocks: (stocks: CustomStock[]) => void;
  removeStock: (code: string) => void;
  clearAll: () => void;
}

// 军工板块默认自选股列表
const DEFAULT_STOCKS: CustomStock[] = [
  { code: '000519', name: '中兵红箭', market: 'sz', addedAt: new Date().toISOString() },
  { code: '002414', name: '高德红外', market: 'sz', addedAt: new Date().toISOString() },
  { code: '600072', name: '中船科技', market: 'sh', addedAt: new Date().toISOString() },
  { code: '600877', name: '中国嘉陵', market: 'sh', addedAt: new Date().toISOString() },
  { code: '600184', name: '光电股份', market: 'sh', addedAt: new Date().toISOString() },
  { code: '600435', name: '北方导航', market: 'sh', addedAt: new Date().toISOString() },
  { code: '000738', name: '航发控制', market: 'sz', addedAt: new Date().toISOString() },
  { code: '600372', name: '中航电子', market: 'sh', addedAt: new Date().toISOString() },
  { code: '600862', name: '中航高科', market: 'sh', addedAt: new Date().toISOString() },
  { code: '600765', name: '中航重机', market: 'sh', addedAt: new Date().toISOString() },
  { code: '000901', name: '航天科技', market: 'sz', addedAt: new Date().toISOString() },
  { code: '600271', name: '航天信息', market: 'sh', addedAt: new Date().toISOString() },
  { code: '600151', name: '航天动力', market: 'sh', addedAt: new Date().toISOString() },
  { code: '600879', name: '航天电子', market: 'sh', addedAt: new Date().toISOString() },
  { code: '000065', name: '北方国际', market: 'sz', addedAt: new Date().toISOString() },
  { code: '000001', name: '平安银行', market: 'sz', addedAt: new Date().toISOString() },
  { code: '002246', name: '北化股份', market: 'sz', addedAt: new Date().toISOString() },
  { code: '600967', name: '内蒙一机', market: 'sh', addedAt: new Date().toISOString() },
  { code: '600480', name: '凌云股份', market: 'sh', addedAt: new Date().toISOString() },
  { code: '002204', name: '大连重工', market: 'sz', addedAt: new Date().toISOString() },
];

/**
 * Zustand store for user's custom stock list with localStorage persistence.
 */
export const useCustomStocksStore = create<CustomStocksState>()(
  persist(
    (set) => ({
      stocks: DEFAULT_STOCKS,  // 默认军工板块股票

      addStock: (stock) =>
        set((state) => {
          // Avoid duplicates
          if (state.stocks.some((s) => s.code === stock.code)) {
            return state;
          }
          return {
            stocks: [...state.stocks, stock],
          };
        }),

      addStocks: (newStocks) =>
        set((state) => {
          const existingCodes = state.stocks.map((s) => s.code);
          const uniqueNew = newStocks.filter((s) => !existingCodes.includes(s.code));
          return {
            stocks: [...state.stocks, ...uniqueNew],
          };
        }),

      removeStock: (code) =>
        set((state) => ({
          stocks: state.stocks.filter((s) => s.code !== code),
        })),

      clearAll: () => set({ stocks: [] }),
    }),
    {
      name: 'custom-stocks-storage',  // localStorage key
      version: 2,  // 版本升级，使用新的默认列表
    }
  )
);