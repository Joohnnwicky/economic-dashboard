import { useQuery } from '@tanstack/react-query';
import { getCryptoPrice, getCryptoHistory, CryptoPriceData } from '../api/coingecko';
import { BTC, ETH } from '../constants/indicators';
import { NormalizedIndicator } from '../types/indicator';

/**
 * Hook for fetching current BTC and ETH prices
 * Auto-refetches every 60 seconds for real-time updates (REAL-03)
 */
export function useCryptoPrice() {
  const query = useQuery({
    queryKey: ['crypto-price'],
    queryFn: async () => {
      return getCryptoPrice([BTC.coinGeckoId, ETH.coinGeckoId]);
    },
    staleTime: 60 * 1000,        // 1 minute - crypto needs freshness
    gcTime: 5 * 60 * 1000,       // Keep in cache 5 min
    refetchInterval: 60 * 1000,  // Auto refetch every 60s (REAL-03)
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    btcPrice: query.data?.[BTC.coinGeckoId],
    ethPrice: query.data?.[ETH.coinGeckoId],
    isPending: query.isFetching,
  };
}

/**
 * Hook for 24h price history (mini chart data)
 * @param coinId - CoinGecko coin ID (e.g., 'bitcoin')
 * @param days - Number of days of history (default 1 for 24h)
 */
export function useCryptoHistory(coinId: string, days: number = 1) {
  return useQuery({
    queryKey: ['crypto-history', coinId, days],
    queryFn: async () => {
      return getCryptoHistory(coinId, days);
    },
    staleTime: 60 * 1000,        // 1 minute
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,  // Auto refetch every 60s
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for both BTC and ETH history (parallel fetch)
 */
export function useCryptoHistories() {
  const btcQuery = useCryptoHistory(BTC.coinGeckoId, 1);
  const ethQuery = useCryptoHistory(ETH.coinGeckoId, 1);

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
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return query;
}

export type { CryptoPriceData };