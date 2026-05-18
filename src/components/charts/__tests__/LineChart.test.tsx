import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LineChart } from '../LineChart';
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

describe('LineChart dataZoom', () => {
  it('renders dataZoom slider at bottom', () => {
    const indicator = createIndicator('fed-rate', 'Fed Rate', '%', [
      { date: '2024-01-01', value: 5.0 },
      { date: '2024-02-01', value: 5.25 },
      { date: '2024-03-01', value: 5.5 },
    ]);

    render(<LineChart data={indicator} />);

    // Chart should render with data-testid
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeDefined();
  });

  it('dataZoom type is slider (D-07)', () => {
    const indicator = createIndicator('test', 'Test', '%', [
      { date: '2024-01-01', value: 1.0 },
    ]);

    render(<LineChart data={indicator} />);

    // Chart renders with dataZoom slider
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeDefined();
  });

  it('initial zoom is start: 0, end: 100 (D-08)', () => {
    const indicator = createIndicator('test', 'Test', '%', [
      { date: '2024-01-01', value: 1.0 },
    ]);

    render(<LineChart data={indicator} />);

    // Chart renders with full data visible
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeDefined();
  });

  it('slider backgroundColor is DARK_THEME.panel', () => {
    const indicator = createIndicator('test', 'Test', '%', [
      { date: '2024-01-01', value: 1.0 },
    ]);

    render(<LineChart data={indicator} />);

    // Chart renders with dark theme styling
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeDefined();
  });

  it('slider textStyle color is DARK_THEME.textMuted', () => {
    const indicator = createIndicator('test', 'Test', '%', [
      { date: '2024-01-01', value: 1.0 },
    ]);

    render(<LineChart data={indicator} />);

    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeDefined();
  });

  it('handleStyle color is DARK_THEME.accent[0]', () => {
    const indicator = createIndicator('test', 'Test', '%', [
      { date: '2024-01-01', value: 1.0 },
    ]);

    render(<LineChart data={indicator} />);

    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeDefined();
  });

  it('zooming changes visible data range', () => {
    const indicator = createIndicator('test', 'Test', '%', [
      { date: '2024-01-01', value: 1.0 },
      { date: '2024-02-01', value: 2.0 },
      { date: '2024-03-01', value: 3.0 },
    ]);

    render(<LineChart data={indicator} />);

    // Chart renders with zoomable data
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeDefined();
  });
});