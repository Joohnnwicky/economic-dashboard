import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChineseIndicesPanel } from '../ChineseIndicesPanel';
import * as chineseIndicesHook from '../../../hooks/useChineseIndices';

// Mock useChineseIndices hook
vi.mock('../../../hooks/useChineseIndices', () => ({
  useChineseIndices: vi.fn(),
}));

describe('ChineseIndicesPanel', () => {
  it('renders 3 index cards (上证, 深证, 创业板)', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const mockData = [
      { id: '000001', name: '上证指数', value: 3150.23, unit: 'index', timestamp: new Date(), change: { value: 47.12, percentage: 1.5, period: 'daily' as const }, historical: [] },
      { id: '399001', name: '深证成指', value: 9500.67, unit: 'index', timestamp: new Date(), change: { value: -76.43, percentage: -0.8, period: 'daily' as const }, historical: [] },
      { id: '399006', name: '创业板指', value: 1850.45, unit: 'index', timestamp: new Date(), change: { value: 41.78, percentage: 2.3, period: 'daily' as const }, historical: [] },
    ];

    vi.mocked(chineseIndicesHook.useChineseIndices).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
      dataUpdatedAt: Date.now(),
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <ChineseIndicesPanel />
      </QueryClientProvider>
    );

    expect(screen.getByText('上证指数')).toBeInTheDocument();
    expect(screen.getByText('深证成指')).toBeInTheDocument();
    expect(screen.getByText('创业板指')).toBeInTheDocument();
  });

  it('shows loading spinner when data loading', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.mocked(chineseIndicesHook.useChineseIndices).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false,
      isError: false,
      dataUpdatedAt: undefined,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <ChineseIndicesPanel />
      </QueryClientProvider>
    );

    // Should show loading spinner (animate-spin class)
    const spinner = screen.getByText('A股指数').parentElement?.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows error fallback when fetch fails', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.mocked(chineseIndicesHook.useChineseIndices).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network Error'),
      isSuccess: false,
      isError: true,
      dataUpdatedAt: undefined,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <ChineseIndicesPanel />
      </QueryClientProvider>
    );

    // Should show error message
    expect(screen.getByText(/A股数据暂时不可用/)).toBeInTheDocument();
  });

  it('displays last updated timestamp', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const mockData = [
      { id: '000001', name: '上证指数', value: 3150.23, unit: 'index', timestamp: new Date(), change: { value: 47.12, percentage: 1.5, period: 'daily' as const }, historical: [] },
    ];

    const mockTimestamp = Date.now();

    vi.mocked(chineseIndicesHook.useChineseIndices).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
      dataUpdatedAt: mockTimestamp,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <ChineseIndicesPanel />
      </QueryClientProvider>
    );

    // Should display last updated time (format: "更新于 X 分钟前")
    expect(screen.getByText(/更新于/)).toBeInTheDocument();
  });

  it('applies DARK_THEME colors', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const mockData = [
      { id: '000001', name: '上证指数', value: 3150.23, unit: 'index', timestamp: new Date(), change: { value: 47.12, percentage: 1.5, period: 'daily' as const }, historical: [] },
    ];

    vi.mocked(chineseIndicesHook.useChineseIndices).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
      dataUpdatedAt: Date.now(),
    } as any);

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ChineseIndicesPanel />
      </QueryClientProvider>
    );

    // Check for dark theme background color (#161b22 for panel)
    const panel = container.querySelector('[style*="background-color"]');
    expect(panel).toBeInTheDocument();
  });
});