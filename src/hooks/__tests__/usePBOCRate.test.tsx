import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePBOCRate } from '../usePBOCRate';

// Mock fetch for loading static JSON
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('usePBOCRate', () => {
  it('returns PBOCRates with lpr and omo7d', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const mockData = [
      { date: '2024-10-21', rate: 3.10, type: 'LPR-1Y' },
      { date: '2024-07-22', rate: 3.35, type: 'LPR-1Y' },
      { date: '2024-10-21', rate: 1.50, type: 'OMO-7D' },
      { date: '2024-07-22', rate: 1.80, type: 'OMO-7D' },
    ];

    mockFetch.mockResolvedValueOnce({ json: async () => mockData });

    const { result } = renderHook(() => usePBOCRate(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.lpr.id).toBe('pboc-lpr');
    expect(result.current.data?.omo7d.id).toBe('pboc-omo-7d');
  });

  it('parses historical data correctly', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const mockData = [
      { date: '2024-10-21', rate: 3.10, type: 'LPR-1Y' },
      { date: '2024-07-22', rate: 3.35, type: 'LPR-1Y' },
      { date: '2024-10-21', rate: 1.50, type: 'OMO-7D' },
    ];

    mockFetch.mockResolvedValueOnce({ json: async () => mockData });

    const { result } = renderHook(() => usePBOCRate(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.lpr.historical).toHaveLength(2);
    expect(result.current.data?.lpr.unit).toBe('%');
    expect(result.current.data?.lpr.value).toBe(3.10);
    expect(result.current.data?.omo7d.value).toBe(1.50);
  });
});
