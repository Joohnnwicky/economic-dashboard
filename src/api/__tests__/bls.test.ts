import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchBLSSeries } from '../bls';

vi.mock('axios');

vi.mock('../rate-limiter', () => ({
  rateLimiter: {
    call: vi.fn().mockImplementation(async (_api: string, fn: () => Promise<unknown>) => fn()),
  },
}));

describe('fetchBLSSeries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws the backend error message when BLS proxy returns an error payload', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { error: '网络连接失败: ConnectTimeout' },
    });

    await expect(fetchBLSSeries(['CES0000000001', 'LNS14000000'], '1Y'))
      .rejects.toThrow('网络连接失败: ConnectTimeout');
  });
});
