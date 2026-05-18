export const INDICATORS = {
  FED_RATE: {
    id: 'fed-rate',
    name: '美联储利率',
    unit: '%',
    source: 'FRED',
    seriesId: 'FEDFUNDS',
  },
} as const;

export const BTC = {
  id: 'btc',
  name: '比特币',
  unit: 'USD',
  source: 'CoinGecko',
  coinGeckoId: 'bitcoin',
} as const;

export const ETH = {
  id: 'eth',
  name: '以太坊',
  unit: 'USD',
  source: 'CoinGecko',
  coinGeckoId: 'ethereum',
} as const;