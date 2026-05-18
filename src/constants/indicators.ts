export const INDICATORS = {
  FED_RATE: {
    id: 'fed-rate',
    name: '美联储利率',
    unit: '%',
    source: 'FRED',
    seriesId: 'FEDFUNDS',
  },
} as const;