import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * WebSocket connection states (D-03)
 */
export interface WebSocketState {
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
  retryCount: number;
}

/**
 * Hook for WebSocket real-time cryptocurrency price updates (REAL-01)
 *
 * Features:
 * - Opens connections to Binance WebSocket for BTC and ETH (D-01)
 * - Updates TanStack Query cache via setQueryData (D-02)
 * - Exponential backoff reconnection: 1s → 30s (D-15)
 * - Max 5 retry attempts before stopping (D-16)
 * - Heartbeat ping every 30 seconds (D-06)
 *
 * Endpoints:
 * - BTC: wss://stream.binance.com:9443/ws/btcusdt@trade
 * - ETH: wss://stream.binance.com:9443/ws/ethusdt@trade
 */
export function useCryptoWebSocket(): WebSocketState {
  const queryClient = useQueryClient();
  const [state, setState] = useState<WebSocketState>({
    status: 'connecting',
    retryCount: 0,
  });

  // Refs for cleanup and state tracking (prevents stale closures)
  const btcWsRef = useRef<WebSocket | null>(null);
  const ethWsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0); // Track retry count in ref to avoid stale closure

  /**
   * Calculate exponential backoff delay with jitter (D-15)
   * Formula: min(1000 * 2^attempt, 30000) + random(0, 1000)
   */
  const getBackoffDelay = (attempt: number): number => {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = Math.random() * 1000; // Prevent thundering herd
    return exponentialDelay + jitter;
  };

  /**
   * Handle WebSocket message (D-02, D-05)
   * Parse JSON directly and extract price from data.p
   */
  const handleMessage = (symbol: string, event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      // Validate price is numeric (T-03-01 mitigation)
      if (typeof data.p !== 'string') {
        console.warn('[WebSocket] Invalid price format:', data);
        return;
      }

      const price = parseFloat(data.p);

      if (isNaN(price)) {
        console.warn('[WebSocket] Price parse failed:', data.p);
        return;
      }

      // Map symbol to coin ID
      const coinId = symbol === 'BTCUSDT' ? 'bitcoin' : 'ethereum';

      // Update TanStack Query cache (D-02)
      queryClient.setQueryData(['crypto-price'], (old: any) => {
        if (!old) {
          return {
            [coinId]: {
              price,
              timestamp: new Date(),
              change24h: 0,
            },
          };
        }

        return {
          ...old,
          [coinId]: {
            price,
            timestamp: new Date(),
            change24h: old[coinId]?.change24h ?? 0,
          },
        };
      });
    } catch (error) {
      console.error('[WebSocket] Parse error:', error);
    }
  };

  /**
   * Create WebSocket connection
   */
  const createConnection = (url: string, wsRef: React.MutableRefObject<WebSocket | null>) => {
    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      // Reset retry count on successful connection
      retryCountRef.current = 0;
      setState({ status: 'connected', retryCount: 0 });

      // Start heartbeat (D-06)
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      heartbeatRef.current = setInterval(() => {
        if (btcWsRef.current?.readyState === WebSocket.OPEN) {
          btcWsRef.current.send('ping');
        }
        if (ethWsRef.current?.readyState === WebSocket.OPEN) {
          ethWsRef.current.send('ping');
        }
      }, 30000);
    };

    wsRef.current.onmessage = (event) => {
      // Extract symbol from URL to determine which handler to use
      const isBtc = url.includes('btcusdt');
      const symbol = isBtc ? 'BTCUSDT' : 'ETHUSDT';
      handleMessage(symbol, event);
    };

    wsRef.current.onclose = () => {
      // Clear heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      // Exponential backoff reconnection (D-15, D-16)
      // Use ref to avoid stale closure issue
      const currentRetryCount = retryCountRef.current;

      if (currentRetryCount < 5) {
        retryCountRef.current = currentRetryCount + 1;
        setState({
          status: 'connecting',
          retryCount: retryCountRef.current,
        });

        const delay = getBackoffDelay(currentRetryCount);

        retryTimeoutRef.current = window.setTimeout(() => {
          createConnection(
            'wss://stream.binance.com:9443/ws/btcusdt@trade',
            btcWsRef
          );
          createConnection(
            'wss://stream.binance.com:9443/ws/ethusdt@trade',
            ethWsRef
          );
        }, delay);
      } else {
        // Max retries reached - show failed state (D-17)
        setState({ status: 'failed', retryCount: 5 });
      }
    };
  };

  /**
   * Initialize WebSocket connections on mount
   */
  useEffect(() => {
    // Open BTC WebSocket (D-01)
    createConnection(
      'wss://stream.binance.com:9443/ws/btcusdt@trade',
      btcWsRef
    );

    // Open ETH WebSocket (D-01)
    createConnection(
      'wss://stream.binance.com:9443/ws/ethusdt@trade',
      ethWsRef
    );

    /**
     * Cleanup on unmount
     * - Close WebSocket connections
     * - Clear retry timeout
     * - Clear heartbeat interval
     */
    return () => {
      if (btcWsRef.current) {
        btcWsRef.current.close();
        btcWsRef.current = null;
      }
      if (ethWsRef.current) {
        ethWsRef.current.close();
        ethWsRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, []);

  return state;
}