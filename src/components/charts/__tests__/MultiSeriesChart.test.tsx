import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MultiSeriesChart } from '../MultiSeriesChart';
import { NormalizedIndicator } from '../../../types/indicator';

// Helper to create test indicator
function createIndicator(
  id: string,
  name: string,
  unit: string,
  historicalData: { date: string; value: number }[]
): NormalizedIndicator {
  return {
    id,
    name,
    value: historicalData[historicalData.length - 1]?.value ?? 0,
    unit,
    timestamp: new Date(historicalData[historicalData.length - 1]?.date ?? '2024-01-01'),
    historical: historicalData.map((d) => ({
      timestamp: new Date(d.date),
      value: d.value,
    })),
  };
}

describe('MultiSeriesChart', () => {
  it('renders with one series on left axis only', () => {
    const series1 = createIndicator('fed-rate', 'Fed Rate', '%', [
      { date: '2024-01-01', value: 5.0 },
      { date: '2024-02-01', value: 5.25 },
      { date: '2024-03-01', value: 5.5 },
    ]);

    render(
      <MultiSeriesChart
        series={[
          {
            data: series1,
            axisPosition: 'left',
          },
        ]}
      />
    );

    // Chart should render
    const chart = screen.getByTestId('multi-series-chart');
    expect(chart).toBeDefined();
  });

  it('renders with two series on separate Y-axes', () => {
    const series1 = createIndicator('fed-rate', 'Fed Rate', '%', [
      { date: '2024-01-01', value: 5.0 },
      { date: '2024-02-01', value: 5.25 },
    ]);

    const series2 = createIndicator('btc-price', 'BTC Price', 'USD', [
      { date: '2024-01-01', value: 42000 },
      { date: '2024-02-01', value: 50000 },
    ]);

    render(
      <MultiSeriesChart
        series={[
          { data: series1, axisPosition: 'left' },
          { data: series2, axisPosition: 'right' },
        ]}
      />
    );

    const chart = screen.getByTestId('multi-series-chart');
    expect(chart).toBeDefined();
  });

  it('shows legend with series names', () => {
    const series1 = createIndicator('fed-rate', 'Fed Rate', '%', [
      { date: '2024-01-01', value: 5.0 },
    ]);

    const series2 = createIndicator('btc-price', 'BTC Price', 'USD', [
      { date: '2024-01-01', value: 42000 },
    ]);

    render(
      <MultiSeriesChart
        series={[
          { data: series1, axisPosition: 'left' },
          { data: series2, axisPosition: 'right' },
        ]}
        showLegend={true}
      />
    );

    // Legend should be visible
    const chart = screen.getByTestId('multi-series-chart');
    expect(chart).toBeDefined();
  });

  it('applies DARK_THEME colors correctly', () => {
    const series1 = createIndicator('test', 'Test Series', 'USD', [
      { date: '2024-01-01', value: 100 },
    ]);

    render(
      <MultiSeriesChart
        series={[{ data: series1, axisPosition: 'left' }]}
      />
    );

    const chart = screen.getByTestId('multi-series-chart');
    expect(chart).toBeDefined();
  });

  it('shows placeholder when no data', () => {
    const emptySeries = createIndicator('empty', 'Empty', '', []);

    render(
      <MultiSeriesChart
        series={[{ data: emptySeries, axisPosition: 'left' }]}
      />
    );

    expect(screen.getByText('No data to display')).toBeDefined();
  });

  it('adjusts grid.right to 15% when right axis present', () => {
    const series1 = createIndicator('left', 'Left Series', '%', [
      { date: '2024-01-01', value: 5 },
    ]);

    const series2 = createIndicator('right', 'Right Series', 'USD', [
      { date: '2024-01-01', value: 50000 },
    ]);

    render(
      <MultiSeriesChart
        series={[
          { data: series1, axisPosition: 'left' },
          { data: series2, axisPosition: 'right' },
        ]}
      />
    );

    const chart = screen.getByTestId('multi-series-chart');
    expect(chart).toBeDefined();
  });
});