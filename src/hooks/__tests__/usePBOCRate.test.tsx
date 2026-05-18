import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePBOCRate } from '../usePBOCRate';

// Mock fetch for loading static JSON
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('usePBOCRate', () => {
  it('returns NormalizedIndicator with id="pboc-rate"', async () => {
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

    const mockData = [
      { date: '2024-10-21', rate: 3.10, type: 'LPR-1Y' },
      { date: '2024-07-22', rate: 3.35, type: 'LPR-1Y' },
    ];

    mockFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    const { result } = renderHook(() => usePBOCRate(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.id).toBe('pboc-rate');
  });

  it('parses pboc-rates.json correctly into historical data', async () => {
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

    const mockData = [
      { date: '2024-10-21', rate: 3.10, type: 'LPR-1Y' },
      { date: '2024-07-22', rate: 3.35, type: 'LPR-1Y' },
    ];

    mockFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    const { result } = renderHook(() => usePBOCRate(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const historical = result.current.data?.historical;
    expect(historical).toHaveLength(2);
    expect(historical?.[0].value).toBe(3.10); // Sorted descending, latest first (2024-10-21)
    expect(historical?.[1].value).toBe(3.35); // Older entry (2024-07-22)
  });

  it('sets unit="%" for rate display', async () => {
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

    const mockData = [
      { date: '2024-10-21', rate: 3.10, type: 'LPR-1Y' },
    ];

    mockFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    const { result } = renderHook(() => usePBOCRate(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.unit).toBe('%');
  });

  it('latest value is most recent rate from JSON', async () => {
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

    const mockData = [
      { date: '2024-07-22', rate: 3.35, type: 'LPR-1Y' },
      { date: '2024-10-21', rate: 3.10, type: 'LPR-1Y' }, // More recent
    ];

    mockFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    const { result } = renderHook(() => usePBOCRate(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.value).toBe(3.10); // Most recent rate
    expect(result.current.data?.timestamp).toEqual(new Date('2024-10-21'));
  });
});