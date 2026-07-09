import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OverlayPanel } from '../OverlayPanel';
import * as fedRateHook from '../../../hooks/useFedRate';
import * as cryptoHook from '../../../hooks/useCrypto';
import * as inflationHook from '../../../hooks/useInflationSubMetrics';
import * as pceHook from '../../../hooks/usePCEData';
import * as chineseHook from '../../../hooks/useChineseIndices';
import * as pbocHook from '../../../hooks/usePBOCRate';

// Mock all hooks
vi.mock('../../../hooks/useFedRate', () => ({
  useFedRate: vi.fn(),
}));

vi.mock('../../../hooks/useCrypto', () => ({
  useCrypto: vi.fn(),
}));

vi.mock('../../../hooks/useInflationSubMetrics', () => ({
  useInflationSubMetrics: vi.fn(),
}));

vi.mock('../../../hooks/usePCEData', () => ({
  usePCEData: vi.fn(),
}));

vi.mock('../../../hooks/useChineseIndices', () => ({
  useChineseIndices: vi.fn(),
}));

vi.mock('../../../hooks/usePBOCRate', () => ({
  usePBOCRate: vi.fn(),
}));

// Mock OverlayComparisonChart
vi.mock('../../charts/OverlayComparisonChart', () => ({
  OverlayComparisonChart: vi.fn(({ availableIndicators }) => (
    <div
      data-testid="overlay-comparison-chart"
      data-indicator-count={availableIndicators.length}
      data-indicator-ids={availableIndicators.map((ind: { id?: string }) => ind.id).join(',')}
    >
      Mocked OverlayComparisonChart
    </div>
  )),
}));

describe('OverlayPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock returns
    vi.mocked(fedRateHook.useFedRate).mockReturnValue({
      data: { id: 'fed-rate', name: '美联储利率', value: 5.25, unit: '%', timestamp: new Date(), historical: [] },
      isLoading: false,
      isSuccess: true,
    } as any);

    vi.mocked(cryptoHook.useCrypto).mockReturnValue({
      data: [
        { id: 'btc', name: 'BTC', value: 67000, unit: 'USD', timestamp: new Date(), historical: [] },
        { id: 'eth', name: 'ETH', value: 3500, unit: 'USD', timestamp: new Date(), historical: [] },
      ],
      isLoading: false,
      isSuccess: true,
    } as any);

    vi.mocked(inflationHook.useInflationSubMetrics).mockReturnValue({
      data: [
        { id: 'core-cpi', name: '核心CPI', value: 310.0, unit: 'index', timestamp: new Date(), historical: [] },
      ],
      isLoading: false,
    } as any);

    vi.mocked(pceHook.usePCEData).mockReturnValue({
      data: [
        { id: 'pce', name: 'PCE', value: 115.0, unit: 'index', timestamp: new Date(), historical: [] },
      ],
      isLoading: false,
    } as any);

    vi.mocked(chineseHook.useChineseIndices).mockReturnValue({
      data: [
        { id: 'shanghai', name: '上证指数', value: 3150, unit: 'index', timestamp: new Date(), historical: [] },
      ],
      isLoading: false,
      isSuccess: true,
    } as any);

    vi.mocked(pbocHook.usePBOCRate).mockReturnValue({
      data: {
        lpr: { id: 'pboc-lpr', name: 'LPR 1年', value: 3.45, unit: '%', timestamp: new Date(), historical: [] },
        omo7d: { id: 'pboc-omo-7d', name: '7天逆回购', value: 1.5, unit: '%', timestamp: new Date(), historical: [] },
      },
      isLoading: false,
      isSuccess: true,
    } as any);
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('renders OverlayComparisonChart with gathered indicators', () => {
    render(<OverlayPanel />, { wrapper: createWrapper() });

    expect(screen.getByTestId('overlay-comparison-chart')).toBeInTheDocument();
    expect(screen.getByText('跨市场对比分析')).toBeInTheDocument();
  });

  it('gathers all available indicators from hooks', () => {
    render(<OverlayPanel />, { wrapper: createWrapper() });

    // Check that OverlayComparisonChart received all indicators
    const chart = screen.getByTestId('overlay-comparison-chart');
    const indicatorCount = chart.getAttribute('data-indicator-count');
    expect(parseInt(indicatorCount || '0')).toBeGreaterThanOrEqual(7);
  });

  it('passes both PBOC indicators to the comparison chart', () => {
    render(<OverlayPanel />, { wrapper: createWrapper() });

    const chart = screen.getByTestId('overlay-comparison-chart');
    expect(chart.getAttribute('data-indicator-ids')).toContain('pboc-lpr');
    expect(chart.getAttribute('data-indicator-ids')).toContain('pboc-omo-7d');
    expect(chart.getAttribute('data-indicator-ids')).not.toContain('undefined');
  });

  it('shows failed message when all data sources fail', () => {
    // All hooks return no data and not loading
    vi.mocked(fedRateHook.useFedRate).mockReturnValue({
      isLoading: false,
      data: undefined,
    } as any);
    vi.mocked(cryptoHook.useCrypto).mockReturnValue({
      isLoading: false,
      data: [],
    } as any);
    vi.mocked(inflationHook.useInflationSubMetrics).mockReturnValue({
      isLoading: false,
      data: [],
    } as any);
    vi.mocked(pceHook.usePCEData).mockReturnValue({
      isLoading: false,
      data: [],
    } as any);
    vi.mocked(chineseHook.useChineseIndices).mockReturnValue({
      isLoading: false,
      data: [],
    } as any);
    vi.mocked(pbocHook.usePBOCRate).mockReturnValue({
      isLoading: false,
      data: undefined,
    } as any);

    render(<OverlayPanel />, { wrapper: createWrapper() });

    // Should show failed message when all sources failed
    expect(screen.getByText('跨市场对比分析')).toBeInTheDocument();
    expect(screen.getByText('数据加载失败，请检查网络连接或API配置')).toBeInTheDocument();
  });

  it('shows panel even when some hooks fail', () => {
    vi.mocked(fedRateHook.useFedRate).mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    } as any);

    render(<OverlayPanel />, { wrapper: createWrapper() });

    // Panel should still render with available data
    expect(screen.getByTestId('overlay-comparison-chart')).toBeInTheDocument();
  });

  it('applies DARK_THEME colors', () => {
    const { container } = render(<OverlayPanel />, { wrapper: createWrapper() });

    // Panel should have dark background
    const panel = container.querySelector('[class*="bg-[#0d1117]"]');
    expect(panel).toBeInTheDocument();
  });
});