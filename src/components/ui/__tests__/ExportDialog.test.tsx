import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportDialog } from '../ExportDialog';
import { useExportStore } from '../../../stores/exportStore';
import * as csvExport from '../../../utils/export-csv';
import * as xlsxExport from '../../../utils/export-xlsx';

// Mock export functions
vi.mock('../../../utils/export-csv', () => ({
  exportToCSV: vi.fn(),
}));

vi.mock('../../../utils/export-xlsx', () => ({
  exportToExcel: vi.fn(),
}));

describe('ExportDialog', () => {
  const mockIndicators = [
    { id: 'fed-rate', name: '美联储利率', value: 5.25, unit: '%', timestamp: new Date(), historical: [] },
    { id: 'btc-price', name: 'BTC 价格', value: 67000, unit: 'USD', timestamp: new Date(), historical: [] },
    { id: 'nfp', name: '非农就业', value: 275000, unit: '千人', timestamp: new Date(), historical: [] },
  ];

  beforeEach(() => {
    // Reset store
    useExportStore.setState({
      selectedIndicatorIds: [],
      exportFormat: 'csv',
      filename: '经济指标数据',
    });
    vi.clearAllMocks();
  });

  it('renders modal with title "数据导出"', () => {
    render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
        availableIndicators={mockIndicators}
      />
    );

    expect(screen.getByText('数据导出')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ExportDialog
        isOpen={false}
        onClose={() => {}}
        availableIndicators={mockIndicators}
      />
    );

    expect(screen.queryByText('数据导出')).not.toBeInTheDocument();
  });

  it('shows radio buttons for CSV and Excel format selection', () => {
    render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
        availableIndicators={mockIndicators}
      />
    );

    expect(screen.getByLabelText('CSV')).toBeInTheDocument();
    expect(screen.getByLabelText('Excel')).toBeInTheDocument();
  });

  it('shows checkbox list of available indicators', () => {
    render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
        availableIndicators={mockIndicators}
      />
    );

    expect(screen.getByLabelText('美联储利率')).toBeInTheDocument();
    expect(screen.getByLabelText('BTC 价格')).toBeInTheDocument();
    expect(screen.getByLabelText('非农就业')).toBeInTheDocument();
  });

  it('shows filename input with default value', () => {
    render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
        availableIndicators={mockIndicators}
      />
    );

    const filenameInput = screen.getByDisplayValue('经济指标数据');
    expect(filenameInput).toBeInTheDocument();
  });

  it('shows preview table when indicators selected', () => {
    // Select one indicator
    useExportStore.setState({ selectedIndicatorIds: ['fed-rate'] });

    render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
        availableIndicators={mockIndicators}
      />
    );

    expect(screen.getByText(/预览/)).toBeInTheDocument();
    expect(screen.getAllByText('美联储利率').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('5.25')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('export button is disabled when no indicators selected', () => {
    render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
        availableIndicators={mockIndicators}
      />
    );

    const exportButton = screen.getByText('导出');
    expect(exportButton).toBeDisabled();
  });

  it('export button triggers CSV export when format is CSV', () => {
    useExportStore.setState({ selectedIndicatorIds: ['fed-rate'], exportFormat: 'csv' });

    render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
        availableIndicators={mockIndicators}
      />
    );

    const exportButton = screen.getByText('导出');
    fireEvent.click(exportButton);

    expect(csvExport.exportToCSV).toHaveBeenCalled();
    expect(xlsxExport.exportToExcel).not.toHaveBeenCalled();
  });

  it('export button triggers Excel export when format is Excel', () => {
    useExportStore.setState({ selectedIndicatorIds: ['fed-rate'], exportFormat: 'excel' });

    render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
        availableIndicators={mockIndicators}
      />
    );

    const exportButton = screen.getByText('导出');
    fireEvent.click(exportButton);

    expect(xlsxExport.exportToExcel).toHaveBeenCalled();
    expect(csvExport.exportToCSV).not.toHaveBeenCalled();
  });

  it('toggles indicator selection when checkbox clicked', () => {
    render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
        availableIndicators={mockIndicators}
      />
    );

    const checkbox = screen.getByLabelText('美联储利率');
    fireEvent.click(checkbox);

    const state = useExportStore.getState();
    expect(state.selectedIndicatorIds).toContain('fed-rate');
  });

  it('sanitizes filename on export', () => {
    useExportStore.setState({
      selectedIndicatorIds: ['fed-rate'],
      exportFormat: 'csv',
      filename: 'test/file:name.csv',
    });

    render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
        availableIndicators={mockIndicators}
      />
    );

    const exportButton = screen.getByText('导出');
    fireEvent.click(exportButton);

    // Filename should be sanitized (special chars replaced)
    expect(csvExport.exportToCSV).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringMatching(/^[^\/\\:]*$/) // No path chars
    );
  });

  it('calls onClose after export', () => {
    const onClose = vi.fn();
    useExportStore.setState({ selectedIndicatorIds: ['fed-rate'] });

    render(
      <ExportDialog
        isOpen={true}
        onClose={onClose}
        availableIndicators={mockIndicators}
      />
    );

    const exportButton = screen.getByText('导出');
    fireEvent.click(exportButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button clicked', () => {
    const onClose = vi.fn();

    render(
      <ExportDialog
        isOpen={true}
        onClose={onClose}
        availableIndicators={mockIndicators}
      />
    );

    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('applies DARK_THEME colors', () => {
    const { container } = render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
        availableIndicators={mockIndicators}
      />
    );

    // Panel should have dark background
    const panel = container.querySelector('[class*="bg-[#161b22]"]');
    expect(panel).toBeInTheDocument();
  });
});