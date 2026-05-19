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
  removeStock: (code: string) => void;
  clearAll: () => void;
}

/**
 * Zustand store for user's custom stock list with localStorage persistence.
 * This is the first store in the project that uses persist middleware.
 */
export const useCustomStocksStore = create<CustomStocksState>()(
  persist(
    (set) => ({
      stocks: [],

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

      removeStock: (code) =>
        set((state) => ({
          stocks: state.stocks.filter((s) => s.code !== code),
        })),

      clearAll: () => set({ stocks: [] }),
    }),
    {
      name: 'custom-stocks-storage',  // localStorage key
      version: 1,
    }
  )
);