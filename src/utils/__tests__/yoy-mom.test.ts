import { describe, it, expect } from 'vitest';
import { calculateYoY, calculateMoM, calculateYoYForPoint, calculateMoMForPoint } from '../yoy-mom';
import { HistoricalDataPoint } from '../../types/indicator';

describe('calculateYoY', () => {
  it('returns null for first year (no prior data)', () => {
    const data: HistoricalDataPoint[] = [
      { timestamp: new Date('2024-01-01'), value: 100 },
      { timestamp: new Date('2024-02-01'), value: 105 },
    ];
    const result = calculateYoY(data);
    expect(result).toEqual([null, null]);
  });

  it('computes ((current - prior) / prior) * 100 for matching months', () => {
    const data: HistoricalDataPoint[] = [
      { timestamp: new Date('2023-01-01'), value: 100 },
      { timestamp: new Date('2023-06-01'), value: 110 },
      { timestamp: new Date('2024-01-01'), value: 120 }, // YoY = (120-100)/100 * 100 = 20%
      { timestamp: new Date('2024-06-01'), value: 132 }, // YoY = (132-110)/110 * 100 = 20%
    ];
    const result = calculateYoY(data);
    expect(result[0]).toBeNull(); // 2023-01: no prior year
    expect(result[1]).toBeNull(); // 2023-06: no prior year
    expect(result[2]).toBeCloseTo(20, 1); // 2024-01 vs 2023-01
    expect(result[3]).toBeCloseTo(20, 1); // 2024-06 vs 2023-06
  });

  it('returns null when prior value is 0 (division by zero protection)', () => {
    const data: HistoricalDataPoint[] = [
      { timestamp: new Date('2023-01-01'), value: 0 },
      { timestamp: new Date('2024-01-01'), value: 100 },
    ];
    const result = calculateYoY(data);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull(); // division by zero
  });

  it('handles null values in historical data', () => {
    const data: HistoricalDataPoint[] = [
      { timestamp: new Date('2023-01-01'), value: null },
      { timestamp: new Date('2023-06-01'), value: 100 },
      { timestamp: new Date('2024-01-01'), value: 120 },
      { timestamp: new Date('2024-06-01'), value: null },
    ];
    const result = calculateYoY(data);
    expect(result[0]).toBeNull(); // no prior year
    expect(result[1]).toBeNull(); // no prior year
    expect(result[2]).toBeNull(); // prior is null
    expect(result[3]).toBeNull(); // current is null
  });
});

describe('calculateMoM', () => {
  it('returns null for first month', () => {
    const data: HistoricalDataPoint[] = [
      { timestamp: new Date('2024-01-01'), value: 100 },
      { timestamp: new Date('2024-02-01'), value: 105 },
    ];
    const result = calculateMoM(data);
    expect(result[0]).toBeNull(); // first month
    expect(result[1]).toBeCloseTo(5, 1); // (105-100)/100 * 100 = 5%
  });

  it('computes ((current - previous) / previous) * 100', () => {
    const data: HistoricalDataPoint[] = [
      { timestamp: new Date('2024-01-01'), value: 100 },
      { timestamp: new Date('2024-02-01'), value: 110 }, // MoM = 10%
      { timestamp: new Date('2024-03-01'), value: 99 },  // MoM = (99-110)/110 * 100 = -10%
    ];
    const result = calculateMoM(data);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeCloseTo(10, 1);
    expect(result[2]).toBeCloseTo(-10, 1);
  });

  it('handles null values', () => {
    const data: HistoricalDataPoint[] = [
      { timestamp: new Date('2024-01-01'), value: null },
      { timestamp: new Date('2024-02-01'), value: 100 },
      { timestamp: new Date('2024-03-01'), value: null },
      { timestamp: new Date('2024-04-01'), value: 110 },
    ];
    const result = calculateMoM(data);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull(); // previous is null
    expect(result[2]).toBeNull(); // current is null
    expect(result[3]).toBeNull(); // previous is null
  });
});

describe('calculateYoYForPoint', () => {
  it('calculates YoY for a single data point', () => {
    const historical: HistoricalDataPoint[] = [
      { timestamp: new Date('2023-01-15'), value: 100 },
      { timestamp: new Date('2024-01-15'), value: 120 },
    ];
    const result = calculateYoYForPoint(new Date('2024-01-15'), historical);
    expect(result).toBeCloseTo(20, 1);
  });

  it('returns null when no prior year data exists', () => {
    const historical: HistoricalDataPoint[] = [
      { timestamp: new Date('2024-01-15'), value: 120 },
    ];
    const result = calculateYoYForPoint(new Date('2024-01-15'), historical);
    expect(result).toBeNull();
  });
});

describe('calculateMoMForPoint', () => {
  it('calculates MoM for a single data point', () => {
    const historical: HistoricalDataPoint[] = [
      { timestamp: new Date('2024-01-01'), value: 100 },
      { timestamp: new Date('2024-02-01'), value: 105 },
    ];
    const result = calculateMoMForPoint(new Date('2024-02-01'), historical);
    expect(result).toBeCloseTo(5, 1);
  });

  it('returns null when no previous month data exists', () => {
    const historical: HistoricalDataPoint[] = [
      { timestamp: new Date('2024-02-01'), value: 105 },
    ];
    const result = calculateMoMForPoint(new Date('2024-02-01'), historical);
    expect(result).toBeNull();
  });
});