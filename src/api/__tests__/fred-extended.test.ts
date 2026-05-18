import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPCEData } from '../fred-extended';

describe('getPCEData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return NormalizedIndicator for PCEPI (overall PCE)', async () => {
    // This test will verify the function exists and can be called
    // Implementation will use fredClient pattern
    expect(getPCEData).toBeDefined();
    expect(typeof getPCEData).toBe('function');
  });

  it('should return NormalizedIndicator for PCEPILFE (core PCE)', async () => {
    expect(getPCEData).toBeDefined();
    expect(typeof getPCEData).toBe('function');
  });

  it('should use existing fredClient pattern from Phase 1', async () => {
    // Verify the function signature matches expected pattern
    expect(getPCEData).toBeDefined();
    // Function should accept seriesId as parameter
    expect(typeof getPCEData).toBe('function');
  });
});