import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FedRatePanel } from '../FedRatePanel';
import * as useFedRateModule from '../../../hooks/useFedRate';
import * as useFOMCTargetRatesModule from '../../../hooks/useFOMCTargetRates';

// Mock hooks
vi.mock('../../../hooks/useFedRate', () => ({
  useFedRate: vi.fn(),
}));

vi.mock('../../../hooks/useFOMCTargetRates', () => ({
  useFOMCTargetRates: vi.fn(),
}));

vi.mock('../../../stores/dashboardStore', () => ({
  useDashboardStore: vi.fn(() => ({ timeRange: '1Y' })),
}));

vi.mock('../../charts/FedRateChart', () => ({
  FedRateChart: vi.fn(() => <div data-testid="fed-rate-chart">FedRateChart</div>),
}));

describe('FedRatePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it('calls useFedRate for rate history', () => {
    vi.mocked(useFedRateModule.useFedRate).mockReturnValue({
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
    } as any);

    vi.mocked(useFOMCTargetRatesModule.useFOMCTargetRates).mockReturnValue({
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
    } as any);

    render(<FedRatePanel />, { wrapper: createWrapper() });
    expect(screen.getByTestId('fed-rate-chart')).toBeInTheDocument();
  });

  it('calls useFOMCTargetRates for DFEDTARU data', () => {
    vi.mocked(useFedRateModule.useFedRate).mockReturnValue({
      data: {
        id: 'fed-rate',
        name: '美联储利率',
        value: 5.25,
        unit: '%',
        timestamp: new Date('2024-06-01'),
        historical: [],
      },
      isLoading: false,
      error: null,
      dataUpdatedAt: Date.now(),
    } as any);

    vi.mocked(useFOMCTargetRatesModule.useFOMCTargetRates).mockReturnValue({
      data: {
        id: 'fomc-target-rate-upper',
        name: '美联储目标利率上限',
        value: 5.25,
        unit: '%',
        timestamp: new Date('2024-06-01'),
        historical: [],
      },
      isLoading: false,
      error: null,
    } as any);

    render(<FedRatePanel />, { wrapper: createWrapper() });
    expect(useFOMCTargetRatesModule.useFOMCTargetRates).toHaveBeenCalled();
  });

  it('renders FedRateChart with both data sources', () => {
    vi.mocked(useFedRateModule.useFedRate).mockReturnValue({
      data: {
        id: 'fed-rate',
        name: '美联储利率',
        value: 5.25,
        unit: '%',
        timestamp: new Date('2024-06-01'),
        historical: [],
      },
      isLoading: false,
      error: null,
      dataUpdatedAt: Date.now(),
    } as any);

    vi.mocked(useFOMCTargetRatesModule.useFOMCTargetRates).mockReturnValue({
      data: {
        id: 'fomc-target-rate-upper',
        name: '美联储目标利率上限',
        value: 5.25,
        unit: '%',
        timestamp: new Date('2024-06-01'),
        historical: [],
      },
      isLoading: false,
      error: null,
    } as any);

    render(<FedRatePanel />, { wrapper: createWrapper() });
    expect(screen.getByTestId('fed-rate-chart')).toBeInTheDocument();
  });

  it('Loading state shows while fetching FOMC data', () => {
    vi.mocked(useFedRateModule.useFedRate).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      dataUpdatedAt: 0,
    } as any);

    vi.mocked(useFOMCTargetRatesModule.useFOMCTargetRates).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    } as any);

    render(<FedRatePanel />, { wrapper: createWrapper() });
    expect(screen.queryByTestId('fed-rate-chart')).not.toBeInTheDocument();
  });

  it('Error handling for FOMC fetch failure', () => {
    vi.mocked(useFedRateModule.useFedRate).mockReturnValue({
      data: {
        id: 'fed-rate',
        name: '美联储利率',
        value: 5.25,
        unit: '%',
        timestamp: new Date('2024-06-01'),
        historical: [],
      },
      isLoading: false,
      error: null,
      dataUpdatedAt: Date.now(),
    } as any);

    vi.mocked(useFOMCTargetRatesModule.useFOMCTargetRates).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('FOMC fetch failed'),
    } as any);

    render(<FedRatePanel />, { wrapper: createWrapper() });
    expect(screen.getByText(/FOMC数据加载失败/)).toBeInTheDocument();
  });
});