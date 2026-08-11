import { describe, it, expect } from 'vitest';
import { classifyRegime } from '../marketRegime';

describe('classifyRegime', () => {
  it('crisis: VIX>=30 且 利差倒挂', () => {
    const r = classifyRegime({ vix: 35, spread: -0.5 });
    expect(r.key).toBe('crisis');
    expect(r.label).toBe('危机模式');
  });

  it('recession-warning: 利差倒挂但 VIX 未达 30', () => {
    const r = classifyRegime({ vix: 18, spread: -0.2 });
    expect(r.key).toBe('recession-warning');
  });

  it('panic: VIX>=30 但利差未倒挂', () => {
    const r = classifyRegime({ vix: 32, spread: 0.3 });
    expect(r.key).toBe('panic');
  });

  it('high-vol: VIX 25-30, 利差正常', () => {
    const r = classifyRegime({ vix: 27, spread: 0.5 });
    expect(r.key).toBe('high-vol');
  });

  it('low-vol: VIX<20, 利差正常', () => {
    const r = classifyRegime({ vix: 14, spread: 1.0 });
    expect(r.key).toBe('low-vol');
  });

  it('neutral: VIX 20-25', () => {
    const r = classifyRegime({ vix: 22, spread: 0.4 });
    expect(r.key).toBe('neutral');
  });

  it('危机优先级高于单纯倒挂(VIX>=30+倒挂=crisis 而非 recession-warning)', () => {
    const r = classifyRegime({ vix: 40, spread: -1.0 });
    expect(r.key).toBe('crisis');
  });

  it('null 输入降级为 neutral', () => {
    const r = classifyRegime({ vix: null, spread: null });
    expect(r.key).toBe('neutral');
  });

  it('signals 包含 VIX 与利差两项', () => {
    const r = classifyRegime({ vix: 30, spread: -0.1 });
    expect(r.signals).toHaveLength(2);
    expect(r.signals[0].name).toContain('VIX');
    expect(r.signals[1].name).toContain('利差');
  });
});
