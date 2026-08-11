import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { getChineseIndices, parseTencentIndices } from '../eastmoney';

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

// 腾讯格式行构造器: 类型~名称~代码~当前价~涨跌额~涨跌幅~成交量~成交额~~
function tencentLine(code: string, name: string, price: string, change: string, pct: string): string {
  return `v_s_sh${code}="1~${name}~${code}~${price}~${change}~${pct}~627233137~131508420~~";`;
}

describe('parseTencentIndices', () => {
  it('parses 3 indices (SSE, SZSE, ChiNext)', () => {
    const text = [
      tencentLine('000001', '上证指数', '3150.23', '47.12', '1.5'),
      tencentLine('399001', '深证成指', '9500.67', '-76.43', '-0.8'),
      tencentLine('399006', '创业板指', '1850.45', '41.78', '2.3'),
    ].join('\n');

    const result = parseTencentIndices(text);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('sh000001');
    expect(result[0].name).toBe('上证指数');
    expect(result[1].id).toBe('sh399001');
    expect(result[1].name).toBe('深证成指');
    expect(result[2].id).toBe('sh399006');
    expect(result[2].name).toBe('创业板指');
  });

  it('normalizes Tencent field positions (parts[3]=price, parts[4]=change, parts[5]=percentage)', () => {
    const text = tencentLine('000001', '上证指数', '3150.23', '47.12', '1.5');
    const result = parseTencentIndices(text);

    expect(result[0].value).toBe(3150.23);
    expect(result[0].name).toBe('上证指数');
    expect(result[0].unit).toBe('index');
    expect(result[0].change?.value).toBe(47.12);
    expect(result[0].change?.percentage).toBe(1.5);
    expect(result[0].change?.period).toBe('daily');
    expect(result[0].historical).toEqual([]); // Tencent provides current snapshot only
  });

  it('returns empty array for text without v_s_sh lines', () => {
    expect(parseTencentIndices('garbage response')).toEqual([]);
    expect(parseTencentIndices('')).toEqual([]);
  });

  it('skips lines with non-numeric price', () => {
    const text = tencentLine('000001', '上证指数', 'N/A', '47.12', '1.5');
    expect(parseTencentIndices(text)).toEqual([]);
  });
});

describe('getChineseIndices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed indices when backend responds with data', async () => {
    const indices = [
      {
        id: 'sh000001',
        name: '上证指数',
        value: 3150.23,
        unit: 'index',
        timestamp: new Date(),
        change: { value: 47.12, percentage: 1.5, period: 'daily' as const },
        historical: [],
      },
    ];
    vi.mocked(axios.get).mockResolvedValueOnce({ data: indices } as any);

    const result = await getChineseIndices();
    expect(result).toEqual(indices);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('throws if response data is empty (parse failed or no data)', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: [] } as any);
    await expect(getChineseIndices()).rejects.toThrow('腾讯财经API返回数据为空或解析失败');
  });

  it('handles network error gracefully', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network Error'));
    await expect(getChineseIndices()).rejects.toThrow('Network Error');
  });
});
