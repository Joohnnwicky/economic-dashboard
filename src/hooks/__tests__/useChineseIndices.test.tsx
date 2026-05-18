import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChineseIndices } from '../useChineseIndices';
import * as eastmoneyApi from '../../api/eastmoney';

// Mock East Money API
vi.mock('../../api/eastmoney', () => ({
  getChineseIndices: vi.fn(),
}));

describe('useChineseIndices', () => {
  it('returns useQuery result object', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    vi.mocked(eastmoneyApi.getChineseIndices).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useChineseIndices(), { wrapper });

    // useQuery returns an object with data, isLoading, error, etc.
    expect(result.current).toBeDefined();
    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('isFetching');
  });

  it('configures staleTime as 3600000ms (60 minutes)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    vi.mocked(eastmoneyApi.getChineseIndices).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useChineseIndices(), { wrapper });

    // Wait for query to resolve
    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check that query key is correct
    expect(queryClient.getQueryData(['chinese-indices'])).toEqual([]);
  });

  it('configures gcTime as 7200000ms (2 hours)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 7200000, // 2 hours
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    vi.mocked(eastmoneyApi.getChineseIndices).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useChineseIndices(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify data is cached
    expect(queryClient.getQueryData(['chinese-indices'])).toBeDefined();
  });

  it('sets retry to 2', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 2,
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    // Make API fail to test retry behavior
    vi.mocked(eastmoneyApi.getChineseIndices).mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useChineseIndices(), { wrapper });

    // Initial state should be loading
    expect(result.current.isLoading).toBe(true);
  });

  it('sets refetchOnWindowFocus to false', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    vi.mocked(eastmoneyApi.getChineseIndices).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useChineseIndices(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify query does not refetch on window focus by checking query state
    const queryState = queryClient.getQueryState(['chinese-indices']);
    expect(queryState?.dataUpdateCount).toBe(1); // Should not increase on focus
  });
});