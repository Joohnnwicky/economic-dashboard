import { create } from 'zustand';

export interface ExportState {
  selectedIndicatorIds: string[];
  exportFormat: 'csv' | 'excel';
  filename: string;

  toggleIndicator: (id: string) => void;
  setFormat: (format: 'csv' | 'excel') => void;
  setFilename: (name: string) => void;
  clearSelection: () => void;
}

/**
 * Zustand store for export dialog state.
 * Manages selected indicators, export format, and filename.
 * Pattern matches Phase 1 dashboardStore for time range selection.
 */
export const useExportStore = create<ExportState>((set) => ({
  selectedIndicatorIds: [],
  exportFormat: 'csv',
  filename: '经济指标数据',

  toggleIndicator: (id) =>
    set((state) => ({
      selectedIndicatorIds: state.selectedIndicatorIds.includes(id)
        ? state.selectedIndicatorIds.filter((i) => i !== id)
        : [...state.selectedIndicatorIds, id],
    })),

  setFormat: (format) => set({ exportFormat: format }),

  setFilename: (name) => set({ filename: name }),

  clearSelection: () => set({ selectedIndicatorIds: [] }),
}));