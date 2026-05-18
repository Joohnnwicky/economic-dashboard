import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CryptoPanel } from '../CryptoPanel';
import * as useCryptoModule from '../../../hooks/useCrypto';
import * as useWebSocketModule from '../../../hooks/useCryptoWebSocket';

// Mock hooks
vi.mock('../../../hooks/useCrypto', () => ({
  useCryptoPrice: vi.fn(),
  useCryptoHistories: vi.fn(),
}));

vi.mock('../../../hooks/useCryptoWebSocket', () => ({
  useCryptoWebSocket: vi.fn(),
}));

describe('CryptoPanel with WebSocket Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  describe('WebSocket integration', () => {
    it('calls useCryptoWebSocket to get connection state', () => {
      // Mock useCryptoWebSocket to return connected state
      vi.mocked(useWebSocketModule.useCryptoWebSocket).mockReturnValue({
        status: 'connected',
        retryCount: 0,
      });

      // Mock useCryptoPrice to return price data
      vi.mocked(useCryptoModule.useCryptoPrice).mockReturnValue({
        btcPrice: { price: 45000, change24h: 2.5, timestamp: new Date() },
        ethPrice: { price: 2500, change24h: 1.5, timestamp: new Date() },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        data: undefined,
      } as any);

      // Mock useCryptoHistories
      vi.mocked(useCryptoModule.useCryptoHistories).mockReturnValue({
        btcHistory: undefined,
        ethHistory: undefined,
        isLoading: false,
        isError: false,
        btcError: null,
        ethError: null,
      });

      render(<CryptoPanel />, { wrapper: createWrapper() });

      // Verify useCryptoWebSocket was called
      expect(useWebSocketModule.useCryptoWebSocket).toHaveBeenCalled();
    });

    it('displays ConnectionIndicator showing WebSocket status', () => {
      // Mock WebSocket connected state
      vi.mocked(useWebSocketModule.useCryptoWebSocket).mockReturnValue({
        status: 'connected',
        retryCount: 0,
      });

      // Mock price data
      vi.mocked(useCryptoModule.useCryptoPrice).mockReturnValue({
        btcPrice: { price: 45000, change24h: 2.5, timestamp: new Date() },
        ethPrice: { price: 2500, change24h: 1.5, timestamp: new Date() },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        data: undefined,
      } as any);

      vi.mocked(useCryptoModule.useCryptoHistories).mockReturnValue({
        btcHistory: undefined,
        ethHistory: undefined,
        isLoading: false,
        isError: false,
        btcError: null,
        ethError: null,
      });

      render(<CryptoPanel />, { wrapper: createWrapper() });

      // ConnectionIndicator should show "实时" for connected state
      expect(screen.getByText('实时')).toBeInTheDocument();
    });

    it('displays ConnectionIndicator near panel header', () => {
      vi.mocked(useWebSocketModule.useCryptoWebSocket).mockReturnValue({
        status: 'connecting',
        retryCount: 0,
      });

      vi.mocked(useCryptoModule.useCryptoPrice).mockReturnValue({
        btcPrice: undefined,
        ethPrice: undefined,
        isLoading: true,
        isFetching: true,
        isError: false,
        error: null,
        data: undefined,
      } as any);

      vi.mocked(useCryptoModule.useCryptoHistories).mockReturnValue({
        btcHistory: undefined,
        ethHistory: undefined,
        isLoading: true,
        isError: false,
        btcError: null,
        ethError: null,
      });

      render(<CryptoPanel />, { wrapper: createWrapper() });

      // Should show connecting state
      expect(screen.getByText('连接中...')).toBeInTheDocument();
    });

    it('displays failed state when WebSocket fails after 5 retries', () => {
      vi.mocked(useWebSocketModule.useCryptoWebSocket).mockReturnValue({
        status: 'failed',
        retryCount: 5,
      });

      vi.mocked(useCryptoModule.useCryptoPrice).mockReturnValue({
        btcPrice: undefined,
        ethPrice: undefined,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        data: undefined,
      } as any);

      vi.mocked(useCryptoModule.useCryptoHistories).mockReturnValue({
        btcHistory: undefined,
        ethHistory: undefined,
        isLoading: false,
        isError: false,
        btcError: null,
        ethError: null,
      });

      render(<CryptoPanel />, { wrapper: createWrapper() });

      // Should show failed state
      expect(screen.getByText('连接失败')).toBeInTheDocument();
    });
  });

  describe('Price display with WebSocket updates', () => {
    it('reads from crypto-price cache updated by WebSocket', () => {
      vi.mocked(useWebSocketModule.useCryptoWebSocket).mockReturnValue({
        status: 'connected',
        retryCount: 0,
      });

      // Price data that WebSocket would update
      vi.mocked(useCryptoModule.useCryptoPrice).mockReturnValue({
        btcPrice: { price: 43250, change24h: 3.2, timestamp: new Date() },
        ethPrice: { price: 2250, change24h: 2.1, timestamp: new Date() },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        data: undefined,
      } as any);

      vi.mocked(useCryptoModule.useCryptoHistories).mockReturnValue({
        btcHistory: undefined,
        ethHistory: undefined,
        isLoading: false,
        isError: false,
        btcError: null,
        ethError: null,
      });

      render(<CryptoPanel />, { wrapper: createWrapper() });

      // Price should be displayed
      expect(screen.getByText('比特币')).toBeInTheDocument();
      expect(screen.getByText('以太坊')).toBeInTheDocument();
    });
  });
});