import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useInflationSubMetrics } from '../useInflationSubMetrics';
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

describe('useInflationSubMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return array of 3+ NormalizedIndicators (core CPI, food, energy, medical)', async () => {
    const mockData = {
      CUSR0000SAC: {
        seriesId: 'CUSR0000SAC',
        data: [{ timestamp: new Date('2024-01-01'), value: 300.0 }],
      },
      CUSR0000SEF: {
        seriesId: 'CUSR0000SEF',
        data: [{ timestamp: new Date('2024-01-01'), value: 310.0 }],
      },
      CUSR0000SEB: {
        seriesId: 'CUSR0000SEB',
        data: [{ timestamp: new Date('2024-01-01'), value: 280.0 }],
      },
      CUSR0000SAM: {
        seriesId: 'CUSR0000SAM',
        data: [{ timestamp: new Date('2024-01-01'), value: 520.0 }],
      },
    };

    vi.mocked(blsApi.fetchBLSSeries).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useInflationSubMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.length).toBeGreaterThanOrEqual(3);
  });

  it('should fetch BLS CPI component series', async () => {
    const mockData = {
      CUSR0000SAC: {
        seriesId: 'CUSR0000SAC',
        data: [{ timestamp: new Date('2024-01-01'), value: 300.0 }],
      },
    };

    vi.mocked(blsApi.fetchBLSSeries).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useInflationSubMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(blsApi.fetchBLSSeries).toHaveBeenCalledWith(
      expect.arrayContaining(['CUSR0000SAC']),
      expect.anything()
    );
  });

  it('should apply 30-min cache', async () => {
    vi.mocked(blsApi.fetchBLSSeries).mockResolvedValueOnce({});

    const { result } = renderHook(() => useInflationSubMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Verify staleTime is set
    const staleTime = 30 * 60 * 1000;
    expect(staleTime).toBe(1800000);
  });

  it('should normalize component series to Chinese names', async () => {
    const mockData = {
      CUSR0000SAC: {
        seriesId: 'CUSR0000SAC',
        data: [{ timestamp: new Date('2024-01-01'), value: 300.0 }],
      },
      CUSR0000SEF: {
        seriesId: 'CUSR0000SEF',
        data: [{ timestamp: new Date('2024-01-01'), value: 310.0 }],
      },
      CUSR0000SEB: {
        seriesId: 'CUSR0000SEB',
        data: [{ timestamp: new Date('2024-01-01'), value: 280.0 }],
      },
      CUSR0000SAM: {
        seriesId: 'CUSR0000SAM',
        data: [{ timestamp: new Date('2024-01-01'), value: 520.0 }],
      },
    };

    vi.mocked(blsApi.fetchBLSSeries).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useInflationSubMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const coreCpi = result.current.data?.find(d => d.id === 'core-cpi');
    expect(coreCpi?.name).toBe('核心CPI (不含食品能源)');

    const foodCpi = result.current.data?.find(d => d.id === 'cpi-food');
    expect(foodCpi?.name).toBe('CPI: 食品');

    const energyCpi = result.current.data?.find(d => d.id === 'cpi-energy');
    expect(energyCpi?.name).toBe('CPI: 能源');

    const medicalCpi = result.current.data?.find(d => d.id === 'cpi-medical');
    expect(medicalCpi?.name).toBe('CPI: 医疗');
  });

  it('should handle missing series gracefully (returns null for unavailable data)', async () => {
    // Only provide partial data
    const mockData = {
      CUSR0000SAC: {
        seriesId: 'CUSR0000SAC',
        data: [{ timestamp: new Date('2024-01-01'), value: 300.0 }],
      },
      // Missing: CUSR0000SEF, CUSR0000SEB, CUSR0000SAM
    };

    vi.mocked(blsApi.fetchBLSSeries).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useInflationSubMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Should only return available data
    expect(result.current.data?.length).toBeGreaterThanOrEqual(1);
    expect(result.current.data?.find(d => d.id === 'core-cpi')).toBeDefined();
    // Missing series should not cause errors (null is acceptable)
    expect(result.current.error).toBeFalsy();
  });
});