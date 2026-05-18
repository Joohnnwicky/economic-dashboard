import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { OverlayComparisonChart } from '../OverlayComparisonChart';
import * as multiSeriesChart from '../MultiSeriesChart';

// Mock MultiSeriesChart
vi.mock('../MultiSeriesChart', () => ({
  MultiSeriesChart: vi.fn(({ series, height }) => (
    <div data-testid="multi-series-chart" data-series-count={series.length} style={{ height: `${height}px` }}>
      Mocked MultiSeriesChart
    </div>
  )),
}));

describe('OverlayComparisonChart', () => {
  const mockIndicators = [
    { id: 'fed-rate', name: '美联储利率', value: 5.25, unit: '%', timestamp: new Date(), historical: [{ timestamp: new Date('2024-01-01'), value: 5.0 }] },
    { id: 'btc-price', name: 'BTC 价格', value: 67000, unit: 'USD', timestamp: new Date(), historical: [{ timestamp: new Date('2024-01-01'), value: 42000 }] },
    { id: 'nfp', name: '非农就业', value: 275000, unit: '千人', timestamp: new Date(), historical: [{ timestamp: new Date('2024-01-01'), value: 250000 }] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders indicator selection dropdowns for left and right axis', () => {
    render(<OverlayComparisonChart availableIndicators={mockIndicators} />);

    expect(screen.getByLabelText('左侧指标 (Y轴1)')).toBeInTheDocument();
    expect(screen.getByLabelText('右侧指标 (Y轴2)')).toBeInTheDocument();
  });

  it('shows placeholder text in select options when no indicators selected', () => {
    render(<OverlayComparisonChart availableIndicators={mockIndicators} />);

    // Two placeholder options exist (one in each select)
    const placeholders = screen.getAllByText('-- 选择指标 --');
    expect(placeholders.length).toBe(2);
  });

  it('shows placeholder message when no indicators available', () => {
    render(<OverlayComparisonChart availableIndicators={[]} />);

    expect(screen.getByText('选择指标以进行跨市场对比')).toBeInTheDocument();
  });

  it('updates chart when left indicator selected', () => {
    render(<OverlayComparisonChart availableIndicators={mockIndicators} />);

    const leftSelect = screen.getByLabelText('左侧指标 (Y轴1)');
    fireEvent.change(leftSelect, { target: { value: 'fed-rate' } });

    // MultiSeriesChart should be called with 1 series (left only)
    expect(vi.mocked(multiSeriesChart.MultiSeriesChart)).toHaveBeenCalledWith(
      expect.objectContaining({ series: expect.arrayContaining([expect.objectContaining({ axisPosition: 'left' })]) }),
      expect.anything()
    );
  });

  it('updates chart when both indicators selected', () => {
    render(<OverlayComparisonChart availableIndicators={mockIndicators} />);

    const leftSelect = screen.getByLabelText('左侧指标 (Y轴1)');
    const rightSelect = screen.getByLabelText('右侧指标 (Y轴2)');

    fireEvent.change(leftSelect, { target: { value: 'fed-rate' } });
    fireEvent.change(rightSelect, { target: { value: 'btc-price' } });

    // MultiSeriesChart should be called with 2 series
    const calls = vi.mocked(multiSeriesChart.MultiSeriesChart).mock.calls;
    // Find the call with 2 series
    const callWithTwo = calls.find(call => call[0].series.length === 2);
    expect(callWithTwo).toBeDefined();
  });

  it('filters right indicator options to exclude left selection', () => {
    render(<OverlayComparisonChart availableIndicators={mockIndicators} />);

    const leftSelect = screen.getByLabelText('左侧指标 (Y轴1)');
    fireEvent.change(leftSelect, { target: { value: 'fed-rate' } });

    // Get the right select's options via the parent label
    const rightLabel = screen.getByText('右侧指标 (Y轴2)').parentElement;
    if (!rightLabel) throw new Error('Right label parent not found');
    const rightSelect = within(rightLabel).getByRole('combobox');
    const rightOptions = rightSelect.querySelectorAll('option');

    // Right select should not have fed-rate as an option (except placeholder)
    const fedRateOption = Array.from(rightOptions).find(opt => opt.value === 'fed-rate');
    expect(fedRateOption).toBeUndefined();
  });

  it('allows swapping indicators between axes', () => {
    render(<OverlayComparisonChart availableIndicators={mockIndicators} />);

    const leftSelect = screen.getByLabelText('左侧指标 (Y轴1)');
    const rightSelect = screen.getByLabelText('右侧指标 (Y轴2)');

    // Select fed-rate on left, btc on right
    fireEvent.change(leftSelect, { target: { value: 'fed-rate' } });
    fireEvent.change(rightSelect, { target: { value: 'btc-price' } });

    // Clear left and select btc on left
    fireEvent.change(leftSelect, { target: { value: 'btc-price' } });

    // Now fed-rate should be available on right
    const rightLabel = screen.getByText('右侧指标 (Y轴2)').parentElement;
    if (!rightLabel) throw new Error('Right label parent not found');
    const rightSelectElement = within(rightLabel).getByRole('combobox');
    const rightOptions = rightSelectElement.querySelectorAll('option');
    const fedRateOption = Array.from(rightOptions).find(opt => opt.value === 'fed-rate');
    expect(fedRateOption).toBeDefined();
  });

  it('applies DARK_THEME colors to container', () => {
    const { container } = render(<OverlayComparisonChart availableIndicators={mockIndicators} />);

    // Panel should have dark background
    const panel = container.querySelector('[class*="bg-[#161b22]"]');
    expect(panel).toBeInTheDocument();
  });

  it('applies custom height prop', () => {
    render(<OverlayComparisonChart availableIndicators={mockIndicators} height={500} />);

    // Chart height should be height - 80 (for selectors)
    const chart = screen.getByTestId('multi-series-chart');
    expect(chart.style.height).toBe('420px'); // 500 - 80
  });
});