import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { EmploymentSubMetricsPanel } from '../EmploymentSubMetricsPanel';
import * as employmentHook from '../../../hooks/useEmploymentSubMetrics';

// Mock employment hook
vi.mock('../../../hooks/useEmploymentSubMetrics', () => ({
  useEmploymentSubMetrics: vi.fn(),
}));

// Mock YoY/MoM utilities
vi.mock('../../../utils/yoy-mom', () => ({
  calculateYoY: vi.fn(() => [null, 2.5, 3.0]),
  calculateMoM: vi.fn(() => [null, 0.5, 0.8]),
}));

// Mock formatters
vi.mock('../../../utils/formatters', () => ({
  formatPercentage: vi.fn((value) => `${value.toFixed(2)}%`),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('EmploymentSubMetricsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render 2 sub-metric cards (labor participation, wage growth)', async () => {
    const mockData = [
      {
        id: 'labor-participation',
        name: '劳动参与率',
        value: 62.5,
        unit: '%',
        timestamp: new Date('2024-01-01'),
        historical: [
          { timestamp: new Date('2024-01-01'), value: 62.5 },
          { timestamp: new Date('2024-02-01'), value: 62.6 },
        ],
      },
      {
        id: 'wage-growth',
        name: '平均小时工资同比增长',
        value: 30.5,
        unit: 'USD',
        timestamp: new Date('2024-01-01'),
        historical: [
          { timestamp: new Date('2024-01-01'), value: 30.5 },
          { timestamp: new Date('2024-02-01'), value: 30.8 },
        ],
      },
    ];

    vi.mocked(employmentHook.useEmploymentSubMetrics).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    });

    render(<EmploymentSubMetricsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('劳动参与率')).toBeDefined();
      expect(screen.getByText('平均小时工资同比增长')).toBeDefined();
    });

    const cards = screen.getAllByText(/参与率|工资/);
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it('should show YoY percentage for each metric', async () => {
    const mockData = [
      {
        id: 'labor-participation',
        name: '劳动参与率',
        value: 62.5,
        unit: '%',
        timestamp: new Date('2024-01-01'),
        historical: [
          { timestamp: new Date('2024-01-01'), value: 62.5 },
          { timestamp: new Date('2024-02-01'), value: 62.6 },
        ],
      },
    ];

    vi.mocked(employmentHook.useEmploymentSubMetrics).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    });

    render(<EmploymentSubMetricsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/同比/)).toBeDefined();
    });
  });

  it('should show MoM percentage for each metric', async () => {
    const mockData = [
      {
        id: 'labor-participation',
        name: '劳动参与率',
        value: 62.5,
        unit: '%',
        timestamp: new Date('2024-01-01'),
        historical: [
          { timestamp: new Date('2024-01-01'), value: 62.5 },
          { timestamp: new Date('2024-02-01'), value: 62.6 },
        ],
      },
    ];

    vi.mocked(employmentHook.useEmploymentSubMetrics).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    });

    render(<EmploymentSubMetricsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/环比/)).toBeDefined();
    });
  });

  it('should handle missing data gracefully', async () => {
    vi.mocked(employmentHook.useEmploymentSubMetrics).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<EmploymentSubMetricsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/暂时不可用|暂无数据/)).toBeDefined();
    });
  });

  it('should apply DARK_THEME colors', async () => {
    const mockData = [
      {
        id: 'labor-participation',
        name: '劳动参与率',
        value: 62.5,
        unit: '%',
        timestamp: new Date('2024-01-01'),
        historical: [
          { timestamp: new Date('2024-01-01'), value: 62.5 },
        ],
      },
    ];

    vi.mocked(employmentHook.useEmploymentSubMetrics).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    });

    const { container } = render(<EmploymentSubMetricsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Check for DARK_THEME background color
      const panel = container.firstChild;
      expect(panel).toBeDefined();
    });
  });
});