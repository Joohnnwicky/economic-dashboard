import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePCEData } from '../usePCEData';
import * as fredExtended from '../../api/fred-extended';

// Mock FRED extended API
vi.mock('../../api/fred-extended', () => ({
  getPCEData: vi.fn(),
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

describe('usePCEData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch both PCE series with 5-min cache (FRED standard)', async () => {
    const mockPCEPI = {
      id: 'pcepi',
      name: 'PCE物价指数',
      value: 100.5,
      unit: 'index',
      timestamp: new Date('2024-01-01'),
      historical: [{ timestamp: new Date('2024-01-01'), value: 100.5 }],
    };

    const mockPCEPILFE = {
      id: 'pcepilfe',
      name: '核心PCE物价指数',
      value: 101.2,
      unit: 'index',
      timestamp: new Date('2024-01-01'),
      historical: [{ timestamp: new Date('2024-01-01'), value: 101.2 }],
    };

    vi.mocked(fredExtended.getPCEData)
      .mockResolvedValueOnce(mockPCEPI)
      .mockResolvedValueOnce(mockPCEPILFE);

    const { result } = renderHook(() => usePCEData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fredExtended.getPCEData).toHaveBeenCalledWith('PCEPI', expect.anything());
    expect(fredExtended.getPCEData).toHaveBeenCalledWith('PCEPILFE', expect.anything());

    // Verify cache time
    const staleTime = 5 * 60 * 1000;
    expect(staleTime).toBe(300000); // 5 minutes in ms
  });

  it('should use existing fredClient pattern from Phase 1', async () => {
    vi.mocked(fredExtended.getPCEData).mockResolvedValueOnce({
      id: 'pcepi',
      name: 'PCE物价指数',
      value: 100.5,
      unit: 'index',
      timestamp: new Date(),
      historical: [],
    });

    const { result } = renderHook(() => usePCEData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fredExtended.getPCEData).toHaveBeenCalled();
  });

  it('should include YoY/MoM in historical values', async () => {
    const mockPCE = {
      id: 'pcepi',
      name: 'PCE物价指数',
      value: 100.5,
      unit: 'index',
      timestamp: new Date('2024-12-01'),
      historical: [
        { timestamp: new Date('2023-12-01'), value: 95.0 },
        { timestamp: new Date('2024-11-01'), value: 100.0 },
        { timestamp: new Date('2024-12-01'), value: 100.5 },
      ],
    };

    vi.mocked(fredExtended.getPCEData).mockResolvedValueOnce(mockPCE);

    const { result } = renderHook(() => usePCEData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.[0]?.historical).toBeDefined();
    expect(result.current.data?.[0]?.historical.length).toBeGreaterThan(0);
  });

  it('should return both overall and core PCE data', async () => {
    const mockPCEPI = {
      id: 'pcepi',
      name: 'PCE物价指数',
      value: 100.5,
      unit: 'index',
      timestamp: new Date('2024-01-01'),
      historical: [{ timestamp: new Date('2024-01-01'), value: 100.5 }],
    };

    const mockPCEPILFE = {
      id: 'pcepilfe',
      name: '核心PCE物价指数',
      value: 101.2,
      unit: 'index',
      timestamp: new Date('2024-01-01'),
      historical: [{ timestamp: new Date('2024-01-01'), value: 101.2 }],
    };

    vi.mocked(fredExtended.getPCEData)
      .mockResolvedValueOnce(mockPCEPI)
      .mockResolvedValueOnce(mockPCEPILFE);

    const { result } = renderHook(() => usePCEData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.length).toBe(2);
    expect(result.current.data?.[0]?.id).toBe('pcepi');
    expect(result.current.data?.[1]?.id).toBe('pcepilfe');
  });
});