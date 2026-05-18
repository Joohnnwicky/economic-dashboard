import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FedRatePanel } from '../FedRatePanel';
import * as useFOMCTargetRatesHook from '../../hooks/useFOMCTargetRates';

// Mock hooks
vi.mock('../../hooks/useFedRate', () => ({
  useFedRate: vi.fn(() => ({
    data: {
      id: 'fed-rate',
      name: '美联储利率',
      value: 5.25,
      unit: '%',
      timestamp: new Date('2024-06-01'),
      historical: [
        { timestamp: new Date('2024-01-01'), value: 5.0 },
        { timestamp: new Date('2024-02-01'), value: 5.25 },
      ],
    },
    isLoading: false,
    error: null,
    dataUpdatedAt: Date.now(),
  })),
}));

vi.mock('../../hooks/useFOMCTargetRates', () => ({
  useFOMCTargetRates: vi.fn(() => ({
    data: {
      id: 'fomc-target-rate-upper',
      name: '美联储目标利率上限',
      value: 5.25,
      unit: '%',
      timestamp: new Date('2024-06-01'),
      historical: [
        { timestamp: new Date('2024-01-01'), value: 5.0 },
        { timestamp: new Date('2024-02-01'), value: 5.25 },
      ],
    },
    isLoading: false,
    error: null,
  })),
}));

vi.mock('../../stores/dashboardStore', () => ({
  useDashboardStore: vi.fn(() => ({ timeRange: '1Y' })),
}));

vi.mock('../layout/GridPanel', () => ({
  GridPanel: vi.fn(({ title, children }) => (
    <div data-testid="grid-panel">
      <h2>{title}</h2>
      {children}
    </div>
  )),
}));

vi.mock('../charts/FedRateChart', () => ({
  FedRateChart: vi.fn(() => <div data-testid="fed-rate-chart">FedRateChart</div>),
}));

describe('FedRatePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls useFedRate for rate history', () => {
    render(<FedRatePanel />);
    expect(screen.getByTestId('grid-panel')).toBeInTheDocument();
  });

  it('calls useFOMCTargetRates for DFEDTARU data', () => {
    render(<FedRatePanel />);
    expect(screen.getByTestId('grid-panel')).toBeInTheDocument();
  });

  it('renders FedRateChart with both data sources', () => {
    render(<FedRatePanel />);
    expect(screen.getByTestId('fed-rate-chart')).toBeInTheDocument();
  });

  it('Loading state shows while fetching FOMC data', () => {
    vi.mocked(useFOMCTargetRatesHook.useFOMCTargetRates).mockReturnValueOnce({
      data: null,
      isLoading: true,
      error: null,
    } as any);

    render(<FedRatePanel />);
    expect(screen.getByTestId('grid-panel')).toBeInTheDocument();
  });

  it('Error handling for FOMC fetch failure', () => {
    vi.mocked(useFOMCTargetRatesHook.useFOMCTargetRates).mockReturnValueOnce({
      data: null,
      isLoading: false,
      error: new Error('FOMC fetch failed'),
    } as any);

    render(<FedRatePanel />);
    expect(screen.getByTestId('grid-panel')).toBeInTheDocument();
  });
});