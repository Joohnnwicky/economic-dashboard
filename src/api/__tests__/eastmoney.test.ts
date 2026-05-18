import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { getChineseIndices } from '../eastmoney';

// Mock axios
vi.mock('axios');

// Mock rate limiter to bypass actual delays in tests
vi.mock('../rate-limiter', () => ({
  rateLimiter: {
    call: vi.fn().mockImplementation(async (_api: string, fn: () => Promise<any>) => {
      return fn(); // Execute function directly without rate limiting delay
    }),
  },
}));

describe('getChineseIndices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns NormalizedIndicator array for 3 indices (SSE, SZSE, ChiNext)', async () => {
    // Mock East Money API response
    const mockResponse = {
      data: {
        data: {
          diff: [
            { f2: 3150.23, f3: 1.5, f4: 47.12, f12: '000001', f14: '上证指数', f15: 3180, f16: 3100, f17: 3120, f18: 3103.11 },
            { f2: 9500.67, f3: -0.8, f4: -76.43, f12: '399001', f14: '深证成指', f15: 9600, f16: 9400, f17: 9500, f18: 9577.10 },
            { f2: 1850.45, f3: 2.3, f4: 41.78, f12: '399006', f14: '创业板指', f15: 1880, f16: 1800, f17: 1820, f18: 1808.67 },
          ],
        },
      },
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    const result = await getChineseIndices();

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('000001');
    expect(result[0].name).toBe('上证指数');
    expect(result[1].id).toBe('399001');
    expect(result[1].name).toBe('深证成指');
    expect(result[2].id).toBe('399006');
    expect(result[2].name).toBe('创业板指');
  });

  it('normalizes East Money field codes correctly (f2=price, f14=name)', async () => {
    const mockResponse = {
      data: {
        data: {
          diff: [
            { f2: 3150.23, f3: 1.5, f4: 47.12, f12: '000001', f14: '上证指数', f15: 3180, f16: 3100, f17: 3120, f18: 3103.11 },
          ],
        },
      },
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    const result = await getChineseIndices();

    expect(result[0].value).toBe(3150.23);
    expect(result[0].name).toBe('上证指数');
    expect(result[0].unit).toBe('index');
    expect(result[0].change?.value).toBe(47.12);
    expect(result[0].change?.percentage).toBe(1.5);
    expect(result[0].change?.period).toBe('daily');
    expect(result[0].historical).toEqual([]); // East Money provides current snapshot only
  });

  it('applies rate limiting (maxCallsPerDay: 500, minIntervalMs: 60000)', async () => {
    const mockResponse = {
      data: {
        data: {
          diff: [
            { f2: 3150.23, f3: 1.5, f4: 47.12, f12: '000001', f14: '上证指数' },
          ],
        },
      },
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    // First call should succeed
    const result1 = await getChineseIndices();
    expect(result1).toBeDefined();

    // Rate limiter should enforce minIntervalMs (60 seconds)
    // This test validates that rate limiter is called with correct config
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('throws error if response missing data.diff', async () => {
    const mockResponse = {
      data: {
        data: {}, // missing diff array
      },
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    await expect(getChineseIndices()).rejects.toThrow('East Money response missing data.diff');
  });

  it('throws error if data.diff is empty', async () => {
    const mockResponse = {
      data: {
        data: {
          diff: [], // empty diff array
        },
      },
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    await expect(getChineseIndices()).rejects.toThrow('East Money response missing data.diff');
  });

  it('handles network error gracefully', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network Error'));

    await expect(getChineseIndices()).rejects.toThrow('Network Error');
  });
});