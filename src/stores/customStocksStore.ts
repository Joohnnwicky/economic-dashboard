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

// 军工核心自选股列表（v4：仅保留这6只）
const DEFAULT_STOCKS: CustomStock[] = [
  { code: '000519', name: '中兵红箭', market: 'sz', addedAt: new Date().toISOString() },
  { code: '600877', name: '电科芯片', market: 'sh', addedAt: new Date().toISOString() },
  { code: '000065', name: '北方国际', market: 'sz', addedAt: new Date().toISOString() },
  { code: '002246', name: '北化股份', market: 'sz', addedAt: new Date().toISOString() },
  { code: '600967', name: '内蒙一机', market: 'sh', addedAt: new Date().toISOString() },
  { code: '600698', name: '湖南天雁', market: 'sh', addedAt: new Date().toISOString() },
];

// v3 -> v4: 自选股收敛为军工核心6只（强制重置，覆盖本地旧列表）
function migrateToV4(_persisted: unknown): CustomStocksState {
  // persist 迁移只负责数据部分，action 由 create 的初始 store 提供
  return { stocks: DEFAULT_STOCKS.map((s) => ({ ...s })) } as CustomStocksState;
}

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
      version: 4,
      migrate: (persisted: unknown) => migrateToV4(persisted),
    }
  )
);
