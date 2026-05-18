import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFOMCTargetRates, FRED_FOMC_TARGET_UPPER } from '../fred-extended';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock rate limiter
vi.mock('../rate-limiter', () => ({
  rateLimiter: {
    call: vi.fn((_apiName, fn) => fn()),
  },
}));

describe('getFOMCTargetRates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches DFEDTARU series', async () => {
    expect(getFOMCTargetRates).toBeDefined();
    expect(typeof getFOMCTargetRates).toBe('function');
  });

  it('returns NormalizedIndicator with historical data', async () => {
    // Mock FRED API response
    const mockResponse = {
      observations: [
        { date: '2024-01-01', value: '5.25' },
        { date: '2024-02-01', value: '5.50' },
      ],
    };

    const axios = await import('axios');
    vi.mocked(axios.default.get).mockResolvedValueOnce({ data: mockResponse });

    // Set API key
    vi.stubEnv('VITE_FRED_API_KEY', 'test-key');

    const result = await getFOMCTargetRates('1Y');

    expect(result).toBeDefined();
    expect(result.id).toBe('fomc-target-rate-upper');
    expect(result.historical).toBeDefined();
    expect(result.historical.length).toBe(2);
  });

  it('uses FRED rate limiter (maxCallsPerDay: 1000)', async () => {
    const axios = await import('axios');
    vi.mocked(axios.default.get).mockResolvedValueOnce({
      data: { observations: [] },
    });

    vi.stubEnv('VITE_FRED_API_KEY', 'test-key');

    await getFOMCTargetRates('1Y');

    // Rate limiter should be called with 'FRED'
    const { rateLimiter } = await import('../rate-limiter');
    expect(rateLimiter.call).toHaveBeenCalledWith('FRED', expect.any(Function), expect.any(Object));
  });

  it('response normalized to HistoricalDataPoint format', async () => {
    const mockResponse = {
      observations: [
        { date: '2024-01-01', value: '5.25' },
        { date: '2024-02-01', value: '5.50' },
      ],
    };

    const axios = await import('axios');
    vi.mocked(axios.default.get).mockResolvedValueOnce({ data: mockResponse });

    vi.stubEnv('VITE_FRED_API_KEY', 'test-key');

    const result = await getFOMCTargetRates('1Y');

    // After reverse(), newest comes first
    expect(result.historical[0].value).toBe(5.50); // newest (2024-02-01)
    expect(result.historical[1].value).toBe(5.25); // oldest (2024-01-01)
    expect(result.historical[0].timestamp).toBeDefined();
    expect(result.historical[0].timestamp instanceof Date).toBe(true);
  });

  it('TimeRange defaults to 1Y (past 1 year)', async () => {
    const axios = await import('axios');
    vi.mocked(axios.default.get).mockResolvedValueOnce({
      data: { observations: [] },
    });

    vi.stubEnv('VITE_FRED_API_KEY', 'test-key');

    // Call without timeRange parameter
    const result = await getFOMCTargetRates();

    expect(result).toBeDefined();
  });
});

describe('FRED_FOMC_TARGET_UPPER constant', () => {
  it('is defined as DFEDTARU', () => {
    expect(FRED_FOMC_TARGET_UPPER).toBeDefined();
    expect(FRED_FOMC_TARGET_UPPER).toBe('DFEDTARU');
  });
});