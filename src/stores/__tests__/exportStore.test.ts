import { describe, it, expect, beforeEach } from 'vitest';
import { useExportStore } from '../exportStore';

describe('exportStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useExportStore.setState({
      selectedIndicatorIds: [],
      exportFormat: 'csv',
      filename: '经济指标数据',
    });
  });

  it('initializes with empty selectedIndicators and default format CSV', () => {
    const state = useExportStore.getState();

    expect(state.selectedIndicatorIds).toEqual([]);
    expect(state.exportFormat).toBe('csv');
    expect(state.filename).toBe('经济指标数据');
  });

  it('toggleIndicator adds indicator ID when not present', () => {
    const { toggleIndicator } = useExportStore.getState();

    toggleIndicator('fed-rate');

    const state = useExportStore.getState();
    expect(state.selectedIndicatorIds).toContain('fed-rate');
    expect(state.selectedIndicatorIds.length).toBe(1);
  });

  it('toggleIndicator removes indicator ID when already present', () => {
    const { toggleIndicator } = useExportStore.getState();

    toggleIndicator('fed-rate');
    toggleIndicator('btc-price');
    toggleIndicator('fed-rate'); // Remove again

    const state = useExportStore.getState();
    expect(state.selectedIndicatorIds).not.toContain('fed-rate');
    expect(state.selectedIndicatorIds).toContain('btc-price');
    expect(state.selectedIndicatorIds.length).toBe(1);
  });

  it('setFormat switches between csv and excel', () => {
    const { setFormat } = useExportStore.getState();

    setFormat('excel');

    const state = useExportStore.getState();
    expect(state.exportFormat).toBe('excel');

    setFormat('csv');
    expect(useExportStore.getState().exportFormat).toBe('csv');
  });

  it('setFilename updates filename', () => {
    const { setFilename } = useExportStore.getState();

    setFilename('custom-export-name');

    const state = useExportStore.getState();
    expect(state.filename).toBe('custom-export-name');
  });

  it('clearSelection resets selectedIndicators to empty', () => {
    const { toggleIndicator, clearSelection } = useExportStore.getState();

    toggleIndicator('fed-rate');
    toggleIndicator('btc-price');
    toggleIndicator('cpi');

    clearSelection();

    const state = useExportStore.getState();
    expect(state.selectedIndicatorIds).toEqual([]);
  });
});