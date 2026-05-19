import { useQuery } from '@tanstack/react-query';
import { getCryptoPrices, getCryptoHistoryFromBinance } from '../api/binance';
import { NormalizedIndicator } from '../types/indicator';

/**
 * Hook for fetching current BTC and ETH prices from Binance
 *
 * Binance API rate limit: 1200 requests/minute (much higher than CoinGecko)
 * 1分钟轮询完全安全
 */
export function useCryptoPrice() {
  const query = useQuery({
    queryKey: ['crypto-price'],
    queryFn: async () => {
      return getCryptoPrices();
    },
    staleTime: 60 * 1000,        // 1分钟
    gcTime: 5 * 60 * 1000,       // Keep in cache 5 min
    refetchInterval: 60 * 1000,  // 每1分钟自动刷新
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    btcPrice: query.data?.bitcoin,
    ethPrice: query.data?.ethereum,
    isPending: query.isFetching,
  };
}

/**
 * Hook for 24h price history from Binance (mini chart data)
 * @param symbol - Binance symbol (e.g., 'BTCUSDT')
 */
export function useCryptoHistory(symbol: string, interval: string = '1h', limit: number = 24) {
  return useQuery({
    queryKey: ['crypto-history', symbol, interval, limit],
    queryFn: async () => {
      return getCryptoHistoryFromBinance(symbol, interval, limit);
    },
    staleTime: 60 * 1000,        // 1分钟
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,  // 每1分钟自动刷新
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for both BTC and ETH history (parallel fetch from Binance)
 */
export function useCryptoHistories() {
  const btcQuery = useCryptoHistory('BTCUSDT', '1h', 24);
  const ethQuery = useCryptoHistory('ETHUSDT', '1h', 24);

  return {
    btcHistory: btcQuery.data,
    ethHistory: ethQuery.data,
    isLoading: btcQuery.isLoading || ethQuery.isLoading,
    isError: btcQuery.isError || ethQuery.isError,
    btcError: btcQuery.error,
    ethError: ethQuery.error,
  };
}

/**
 * Hook for crypto data in NormalizedIndicator format.
 * Returns BTC and ETH as NormalizedIndicator array for export dialog and overlay panel.
 * Uses Binance API for 365 days of daily history (interval='1d', limit=365).
 */
export function useCrypto() {
  const query = useQuery({
    queryKey: ['crypto-normalized'],
    queryFn: async () => {
      // Fetch 365 days of daily history from Binance (interval='1d', limit=365)
      const btcData = await getCryptoHistoryFromBinance('BTCUSDT', '1d', 365);
      const ethData = await getCryptoHistoryFromBinance('ETHUSDT', '1d', 365);
      const prices = await getCryptoPrices();

      const indicators: NormalizedIndicator[] = [];

      // BTC
      const btcPrice = prices.bitcoin;
      if (btcData && btcPrice) {
        indicators.push({
          id: 'bitcoin',
          name: '比特币（BTC Bitcoin）',
          value: btcPrice.price,
          unit: 'USD',
          timestamp: btcPrice.timestamp,
          change: {
            value: btcPrice.price * (btcPrice.change24h / 100),
            percentage: btcPrice.change24h,
            period: 'daily',
          },
          historical: btcData.historical,
        });
      }

      // ETH
      const ethPrice = prices.ethereum;
      if (ethData && ethPrice) {
        indicators.push({
          id: 'ethereum',
          name: '以太坊（ETH Ethereum）',
          value: ethPrice.price,
          unit: 'USD',
          timestamp: ethPrice.timestamp,
          change: {
            value: ethPrice.price * (ethPrice.change24h / 100),
            percentage: ethPrice.change24h,
            period: 'daily',
          },
          historical: ethData.historical,
        });
      }

      return indicators;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return query;
}

export type { CryptoPriceData };