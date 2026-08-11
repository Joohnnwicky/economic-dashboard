import { describe, it, expect } from 'vitest';
import { DEFAULT_ORDER, PANEL_TITLES } from '../layoutConfig';

describe('layoutConfig', () => {
  it('does not include the U.S. labor market panel in the dashboard order', () => {
    expect(DEFAULT_ORDER).not.toContain('employment');
    expect(Object.values(PANEL_TITLES)).not.toContain('美国劳动力市场（U.S. Labor Market）');
  });
});
