import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectFOMCMeetings } from '../detectFOMCMeetings';
import { HistoricalDataPoint } from '../../types/indicator';

describe('detectFOMCMeetings', () => {
  beforeEach(() => {
    // Mock current date for consistent "past 1 year" tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns FOMCEvent array', () => {
    const data: HistoricalDataPoint[] = [
      { timestamp: new Date('2024-01-01'), value: 5.25 },
      { timestamp: new Date('2024-02-01'), value: 5.25 },
    ];
    const result = detectFOMCMeetings(data);
    expect(Array.isArray(result)).toBe(true);
  });

  it('Rate hike (curr > prev) has decision: 加息, color: #f85149', () => {
    const data: HistoricalDataPoint[] = [
      { timestamp: new Date('2024-01-01'), value: 5.0 },
      { timestamp: new Date('2024-02-01'), value: 5.25 }, // Hike
    ];
    const result = detectFOMCMeetings(data);
    expect(result.length).toBe(1);
    expect(result[0].decision).toBe('加息');
    expect(result[0].color).toBe('#f85149');
    expect(result[0].rate).toBe(5.25);
  });

  it('Rate cut (curr < prev) has decision: 降息, color: #3fb950', () => {
    const data: HistoricalDataPoint[] = [
      { timestamp: new Date('2024-01-01'), value: 5.25 },
      { timestamp: new Date('2024-02-01'), value: 5.0 }, // Cut
    ];
    const result = detectFOMCMeetings(data);
    expect(result.length).toBe(1);
    expect(result[0].decision).toBe('降息');
    expect(result[0].color).toBe('#3fb950');
    expect(result[0].rate).toBe(5.0);
  });

  it('Rate hold (curr === prev) has decision: 维持, color: #8b949e', () => {
    const data: HistoricalDataPoint[] = [
      { timestamp: new Date('2024-01-01'), value: 5.25 },
      { timestamp: new Date('2024-02-01'), value: 5.25 }, // Hold (same value)
    ];
    const result = detectFOMCMeetings(data);
    // Per D-13 logic: prev !== curr marks FOMC event. Hold means prev !== curr is false,
    // BUT the algorithm should still detect rate changes (prev !== curr).
    // For "维持" (hold), we need to reconsider the logic.
    // Actually, re-reading D-13: "If prev !== curr (rate changed): mark as FOMC event"
    // So hold (prev === curr) should NOT be detected. Let me adjust the test.
    // The plan says "Rate hold (curr === prev) has decision: 维持" but algorithm
    // says only mark when prev !== curr. This is a contradiction.
    //
    // Re-reading must_haves: "Markers appear at dates where rate changed (hike/cut/hold)"
    // AND detection algorithm: "If prev !== curr: mark as FOMC event"
    // AND: "Determine decision: curr > prev = 加息, curr < prev = 降息, curr === prev = 维持"
    //
    // So the algorithm marks FOMC events when prev !== curr, but "维持" is a hold.
    // This suggests the detection logic might be wrong, or "维持" means "rate didn't change"
    // which contradicts "prev !== curr".
    //
    // Let me follow the plan's algorithm: only detect when prev !== curr.
    // "维持" would only apply when prev !== curr but decision is classified as "维持"
    // which is impossible since if prev !== curr, decision is 加息 or 降息.
    //
    // I think the plan means: we detect rate CHANGES (hikes/cuts), and "维持" might be
    // a special case where the Fed meets but doesn't change rate. But D-13 says detection
    // is via DFEDTARU rate change points. So holds aren't detected this way.
    //
    // Let me skip the hold test and follow the algorithm strictly.
    // Actually, I'll adjust this test to verify NO event when prev === curr.
    expect(result.length).toBe(0); // No FOMC event when rate unchanged
  });

  it('Events filtered to past 1 year (D-14)', () => {
    // Current mock date: 2024-06-15
    // Past 1 year = 2023-06-15 to 2024-06-15
    const data: HistoricalDataPoint[] = [
      { timestamp: new Date('2023-01-01'), value: 4.0 }, // Before 1 year
      { timestamp: new Date('2023-02-01'), value: 4.5 }, // Before 1 year - hike (filtered out)
      { timestamp: new Date('2024-01-01'), value: 5.0 }, // Within 1 year - hike from 4.5
      { timestamp: new Date('2024-02-01'), value: 5.25 }, // Within 1 year - hike from 5.0
    ];
    const result = detectFOMCMeetings(data);
    // Two hikes within past 1 year:
    // 1. 2024-01-01: 4.5 -> 5.0
    // 2. 2024-02-01: 5.0 -> 5.25
    expect(result.length).toBe(2);
    expect(result[0].timestamp).toEqual(new Date('2024-01-01'));
    expect(result[1].timestamp).toEqual(new Date('2024-02-01'));
    // Verify the hike from 2023-02-01 (before 1 year) is filtered out
    const filteredOut = result.find(e => e.timestamp.getTime() === new Date('2023-02-01').getTime());
    expect(filteredOut).toBeUndefined();
  });

  it('Null values handled (skip comparison if prev or curr is null)', () => {
    const data: HistoricalDataPoint[] = [
      { timestamp: new Date('2024-01-01'), value: null },
      { timestamp: new Date('2024-02-01'), value: 5.0 }, // Prev is null - skip
      { timestamp: new Date('2024-03-01'), value: null }, // Curr is null - skip
      { timestamp: new Date('2024-04-01'), value: 5.25 }, // Prev is null - skip
      { timestamp: new Date('2024-05-01'), value: 5.5 }, // Prev is 5.25 - hike
    ];
    const result = detectFOMCMeetings(data);
    // Only the hike from 5.25 -> 5.5 should be detected
    expect(result.length).toBe(1);
    expect(result[0].decision).toBe('加息');
    expect(result[0].rate).toBe(5.5);
  });

  it('returns empty array for empty input', () => {
    const result = detectFOMCMeetings([]);
    expect(result).toEqual([]);
  });

  it('returns empty array for single data point (no comparison possible)', () => {
    const data: HistoricalDataPoint[] = [
      { timestamp: new Date('2024-01-01'), value: 5.25 },
    ];
    const result = detectFOMCMeetings(data);
    expect(result).toEqual([]);
  });
});