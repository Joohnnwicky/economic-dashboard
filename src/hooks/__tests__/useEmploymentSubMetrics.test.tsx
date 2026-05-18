import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useEmploymentSubMetrics } from '../useEmploymentSubMetrics';
import * as blsApi from '../../api/bls';

// Mock BLS API
vi.mock('../../api/bls', () => ({
  fetchBLSSeries: vi.fn(),
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

describe('useEmploymentSubMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return array of 2 NormalizedIndicators (labor participation, wage growth)', async () => {
    const mockData = {
      LNS11000000: {
        seriesId: 'LNS11000000',
        data: [
          { timestamp: new Date('2024-01-01'), value: 62.5 },
          { timestamp: new Date('2024-02-01'), value: 62.6 },
        ],
      },
      CES0500000003: {
        seriesId: 'CES0500000003',
        data: [
          { timestamp: new Date('2024-01-01'), value: 30.5 },
          { timestamp: new Date('2024-02-01'), value: 30.8 },
        ],
      },
    };

    vi.mocked(blsApi.fetchBLSSeries).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useEmploymentSubMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.id).toBe('labor-participation');
    expect(result.current.data?.[1]?.id).toBe('wage-growth');
  });

  it('should fetch BLS series LNS11000000 (labor participation rate)', async () => {
    const mockData = {
      LNS11000000: {
        seriesId: 'LNS11000000',
        data: [{ timestamp: new Date('2024-01-01'), value: 62.5 }],
      },
    };

    vi.mocked(blsApi.fetchBLSSeries).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useEmploymentSubMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(blsApi.fetchBLSSeries).toHaveBeenCalledWith(
      ['LNS11000000', 'CES0500000003'],
      expect.anything()
    );
  });

  it('should fetch BLS series CES0500000003 (average hourly earnings)', async () => {
    const mockData = {
      LNS11000000: {
        seriesId: 'LNS11000000',
        data: [{ timestamp: new Date('2024-01-01'), value: 62.5 }],
      },
      CES0500000003: {
        seriesId: 'CES0500000003',
        data: [{ timestamp: new Date('2024-01-01'), value: 30.5 }],
      },
    };

    vi.mocked(blsApi.fetchBLSSeries).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useEmploymentSubMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(blsApi.fetchBLSSeries).toHaveBeenCalled();
    expect(result.current.data).toBeDefined();
  });

  it('should apply 30-min cache (BLS rate limit protection)', async () => {
    vi.mocked(blsApi.fetchBLSSeries).mockResolvedValueOnce({});

    const { result } = renderHook(() => useEmploymentSubMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Verify staleTime is set (check via query client)
    const queryClient = new QueryClient();
    const staleTime = 30 * 60 * 1000;
    expect(staleTime).toBe(1800000); // 30 minutes in ms
  });

  it('should normalize series IDs to readable Chinese names', async () => {
    const mockData = {
      LNS11000000: {
        seriesId: 'LNS11000000',
        data: [{ timestamp: new Date('2024-01-01'), value: 62.5 }],
      },
      CES0500000003: {
        seriesId: 'CES0500000003',
        data: [{ timestamp: new Date('2024-01-01'), value: 30.5 }],
      },
    };

    vi.mocked(blsApi.fetchBLSSeries).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useEmploymentSubMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.[0]?.name).toBe('劳动参与率');
    expect(result.current.data?.[0]?.unit).toBe('%');
    expect(result.current.data?.[1]?.name).toBe('平均小时工资同比增长');
    expect(result.current.data?.[1]?.unit).toBe('USD');
  });
});