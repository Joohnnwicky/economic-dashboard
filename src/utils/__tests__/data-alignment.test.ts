import { describe, it, expect } from 'vitest';
import { alignTimestamps } from '../data-alignment';
import { NormalizedIndicator } from '../../types/indicator';

describe('alignTimestamps', () => {
  it('merges timestamps from two series and returns union sorted chronologically', () => {
    const series1: NormalizedIndicator = {
      id: 'fed-rate',
      name: 'Federal Funds Rate',
      value: 5.25,
      unit: '%',
      timestamp: new Date('2024-01-01'),
      historical: [
        { timestamp: new Date('2024-01-01'), value: 5.25 },
        { timestamp: new Date('2024-02-01'), value: 5.25 },
        { timestamp: new Date('2024-03-01'), value: 5.50 },
      ],
    };

    const series2: NormalizedIndicator = {
      id: 'btc-price',
      name: 'Bitcoin Price',
      value: 50000,
      unit: 'USD',
      timestamp: new Date('2024-01-15'),
      historical: [
        { timestamp: new Date('2024-01-15'), value: 42000 },
        { timestamp: new Date('2024-02-15'), value: 50000 },
        { timestamp: new Date('2024-03-15'), value: 65000 },
      ],
    };

    const result = alignTimestamps([series1, series2]);

    expect(result).toHaveLength(6); // 3 + 3 unique timestamps
    expect(result[0]).toEqual(new Date('2024-01-01'));
    expect(result[1]).toEqual(new Date('2024-01-15'));
    expect(result[5]).toEqual(new Date('2024-03-15'));
  });

  it('handles series with different timestamp frequencies (monthly vs daily)', () => {
    const monthly: NormalizedIndicator = {
      id: 'employment',
      name: 'Employment Rate',
      value: 3.7,
      unit: '%',
      timestamp: new Date('2024-03-01'),
      historical: [
        { timestamp: new Date('2024-01-01'), value: 3.8 },
        { timestamp: new Date('2024-02-01'), value: 3.7 },
        { timestamp: new Date('2024-03-01'), value: 3.7 },
      ],
    };

    const daily: NormalizedIndicator = {
      id: 'btc-daily',
      name: 'BTC Daily',
      value: 65000,
      unit: 'USD',
      timestamp: new Date('2024-03-15'),
      historical: [
        { timestamp: new Date('2024-03-01'), value: 60000 },
        { timestamp: new Date('2024-03-02'), value: 61000 },
        { timestamp: new Date('2024-03-03'), value: 62000 },
        { timestamp: new Date('2024-03-15'), value: 65000 },
      ],
    };

    const result = alignTimestamps([monthly, daily]);

    expect(result).toHaveLength(6); // 3 monthly + 4 daily - 1 overlap (2024-03-01) = 6 unique
    // Verify sorted
    for (let i = 1; i < result.length; i++) {
      expect(result[i].getTime()).toBeGreaterThan(result[i - 1].getTime());
    }
  });

  it('returns empty array if all series have no historical data', () => {
    const empty: NormalizedIndicator = {
      id: 'empty',
      name: 'Empty Series',
      value: 0,
      unit: '',
      timestamp: new Date(),
      historical: [],
    };

    const result = alignTimestamps([empty]);
    expect(result).toEqual([]);
  });

  it('deduplicates identical timestamps across series', () => {
    const series1: NormalizedIndicator = {
      id: 's1',
      name: 'Series 1',
      value: 1,
      unit: '',
      timestamp: new Date('2024-01-01'),
      historical: [
        { timestamp: new Date('2024-01-01'), value: 1 },
        { timestamp: new Date('2024-02-01'), value: 2 },
      ],
    };

    const series2: NormalizedIndicator = {
      id: 's2',
      name: 'Series 2',
      value: 3,
      unit: '',
      timestamp: new Date('2024-01-01'),
      historical: [
        { timestamp: new Date('2024-01-01'), value: 3 },
        { timestamp: new Date('2024-02-01'), value: 4 },
      ],
    };

    const result = alignTimestamps([series1, series2]);
    expect(result).toHaveLength(2); // deduplicated
  });
});