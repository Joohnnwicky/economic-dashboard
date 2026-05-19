import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { InflationSubMetricsPanel } from '../InflationSubMetricsPanel';
import * as inflationHook from '../../../hooks/useInflationSubMetrics';
import * as pceHook from '../../../hooks/usePCEData';

// Mock hooks
vi.mock('../../../hooks/useInflationSubMetrics', () => ({
  useInflationSubMetrics: vi.fn(),
}));

vi.mock('../../../hooks/usePCEData', () => ({
  usePCEData: vi.fn(),
}));

// Mock YoY/MoM utilities
vi.mock('../../../utils/yoy-mom', () => ({
  calculateYoY: vi.fn(() => [null, 2.5, 3.0]),
  calculateMoM: vi.fn(() => [null, 0.5, 0.8]),
}));

vi.mock('../../../utils/formatters', () => ({
  formatPercentage: vi.fn((value: number) => `${value.toFixed(2)}%`),
  formatChineseNumber: vi.fn((value: number) => value.toLocaleString('zh-CN')),
}));

// Mock MultiSeriesChart
vi.mock('../../charts/MultiSeriesChart', () => ({
  MultiSeriesChart: vi.fn(() => <div data-testid="multi-series-chart">Chart</div>),
}));

// Mock LineChart
vi.mock('../../charts/LineChart', () => ({
  LineChart: vi.fn(() => <div data-testid="line-chart">Line Chart</div>),
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

describe('InflationSubMetricsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render CPI component cards (core, food, energy, medical)', async () => {
    const mockCpiData = [
      {
        id: 'core-cpi',
        name: '核心CPI (不含食品能源)',
        value: 300.0,
        unit: 'index',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 300.0 }],
      },
      {
        id: 'cpi-food',
        name: 'CPI: 食品',
        value: 310.0,
        unit: 'index',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 310.0 }],
      },
      {
        id: 'cpi-energy',
        name: 'CPI: 能源',
        value: 280.0,
        unit: 'index',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 280.0 }],
      },
      {
        id: 'cpi-medical',
        name: 'CPI: 医疗',
        value: 520.0,
        unit: 'index',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 520.0 }],
      },
    ];

    const mockPceData = [
      {
        id: 'pcepi',
        name: 'PCE物价指数',
        value: 100.5,
        unit: 'index',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 100.5 }],
      },
      {
        id: 'pcepilfe',
        name: '核心PCE物价指数',
        value: 101.2,
        unit: 'index',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 101.2 }],
      },
    ];

    vi.mocked(inflationHook.useInflationSubMetrics).mockReturnValue({
      data: mockCpiData,
      isLoading: false,
      error: null,
    });

    vi.mocked(pceHook.usePCEData).mockReturnValue({
      data: mockPceData,
      isLoading: false,
      error: null,
    });

    render(<InflationSubMetricsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('核心CPI (不含食品能源)')).toBeDefined();
      expect(screen.getByText('CPI: 食品')).toBeDefined();
      expect(screen.getByText('CPI: 能源')).toBeDefined();
      expect(screen.getByText('CPI: 医疗')).toBeDefined();
    });
  });

  it('should render PCE comparison section (overall PCE, core PCE)', async () => {
    const mockPceData = [
      {
        id: 'pcepi',
        name: 'PCE物价指数',
        value: 100.5,
        unit: 'index',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 100.5 }],
      },
      {
        id: 'pcepilfe',
        name: '核心PCE物价指数',
        value: 101.2,
        unit: 'index',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 101.2 }],
      },
    ];

    vi.mocked(inflationHook.useInflationSubMetrics).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    vi.mocked(pceHook.usePCEData).mockReturnValue({
      data: mockPceData,
      isLoading: false,
      error: null,
    });

    render(<InflationSubMetricsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('PCE物价指数趋势')).toBeDefined();
    });
  });

  it('should show YoY/MoM for all metrics', async () => {
    const mockCpiData = [
      {
        id: 'core-cpi',
        name: '核心CPI',
        value: 300.0,
        unit: 'index',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 300.0 }],
      },
    ];

    vi.mocked(inflationHook.useInflationSubMetrics).mockReturnValue({
      data: mockCpiData,
      isLoading: false,
      error: null,
    });

    vi.mocked(pceHook.usePCEData).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<InflationSubMetricsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/同比:/)).toBeDefined();
    });
  });

  it('should use MultiSeriesChart for CPI vs PCE overlay', async () => {
    const mockCpiData = [
      {
        id: 'core-cpi',
        name: '核心CPI',
        value: 300.0,
        unit: 'index',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 300.0 }],
      },
    ];

    const mockPceData = [
      {
        id: 'pcepilfe',
        name: '核心PCE',
        value: 101.2,
        unit: 'index',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 101.2 }],
      },
    ];

    vi.mocked(inflationHook.useInflationSubMetrics).mockReturnValue({
      data: mockCpiData,
      isLoading: false,
      error: null,
    });

    vi.mocked(pceHook.usePCEData).mockReturnValue({
      data: mockPceData,
      isLoading: false,
      error: null,
    });

    render(<InflationSubMetricsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('multi-series-chart')).toBeDefined();
    });
  });

  it('should handle missing CPI components gracefully', async () => {
    vi.mocked(inflationHook.useInflationSubMetrics).mockReturnValue({
      data: [], // Missing components
      isLoading: false,
      error: null,
    });

    vi.mocked(pceHook.usePCEData).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<InflationSubMetricsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('inflation-sub-metrics-panel')).toBeDefined();
    });
  });
});