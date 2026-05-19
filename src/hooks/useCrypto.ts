import { useQuery } from '@tanstack/react-query';
import { getCryptoPrices, getCryptoHistoryFromBinance } from '../api/binance';
import { BTC, ETH } from '../constants/indicators';
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
 */
export function useCrypto() {
  const query = useQuery({
    queryKey: ['crypto-normalized'],
    queryFn: async () => {
      const btcData = await getCryptoHistory(BTC.coinGeckoId, 365);
      const ethData = await getCryptoHistory(ETH.coinGeckoId, 365);
      const prices = await getCryptoPrice([BTC.coinGeckoId, ETH.coinGeckoId]);

      const indicators: NormalizedIndicator[] = [];

      // BTC
      const btcPrice = prices[BTC.coinGeckoId];
      if (btcData && btcPrice) {
        indicators.push({
          ...btcData,
          value: btcPrice.price,
          timestamp: btcPrice.timestamp,
          change: {
            value: btcPrice.price * (btcPrice.change24h / 100),
            percentage: btcPrice.change24h,
            period: 'daily',
          },
        });
      }

      // ETH
      const ethPrice = prices[ETH.coinGeckoId];
      if (ethData && ethPrice) {
        indicators.push({
          ...ethData,
          value: ethPrice.price,
          timestamp: ethPrice.timestamp,
          change: {
            value: ethPrice.price * (ethPrice.change24h / 100),
            percentage: ethPrice.change24h,
            period: 'daily',
          },
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