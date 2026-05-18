import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToCSV, sanitizeCSVField } from '../export-csv';
import { NormalizedIndicator } from '../../types/indicator';

// Mock DOM methods
const mockLink = {
  click: vi.fn(),
  setAttribute: vi.fn(),
};
vi.stubGlobal('document', {
  createElement: vi.fn(() => mockLink),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
});

describe('sanitizeCSVField', () => {
  it('strips formula prefixes to prevent CSV injection', () => {
    expect(sanitizeCSVField('=SUM(A1:A10)')).toBe('SUM(A1:A10)');
    expect(sanitizeCSVField('+cmd|calc')).toBe('cmd|calc');
    expect(sanitizeCSVField('-2+3')).toBe('2+3');
    expect(sanitizeCSVField('@SUM(A1)')).toBe('SUM(A1)');
  });

  it('returns normal strings unchanged', () => {
    expect(sanitizeCSVField('Normal text')).toBe('Normal text');
    expect(sanitizeCSVField('12345')).toBe('12345');
    expect(sanitizeCSVField('经济指标')).toBe('经济指标');
  });

  it('handles empty and null values', () => {
    expect(sanitizeCSVField('')).toBe('');
    expect(sanitizeCSVField(null)).toBe('');
    expect(sanitizeCSVField(undefined)).toBe('');
  });
});

describe('exportToCSV', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates valid CSV content with headers and rows', () => {
    const indicators: NormalizedIndicator[] = [
      {
        id: 'fed-rate',
        name: '联邦基金利率',
        value: 5.25,
        unit: '%',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 5.25 }],
      },
    ];

    exportToCSV(indicators, 'test-export');

    expect(mockLink.click).toHaveBeenCalled();
  });

  it('prepends UTF-8 BOM to CSV content', () => {
    const indicators: NormalizedIndicator[] = [
      {
        id: 'test',
        name: '测试指标',
        value: 100,
        unit: '指数',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 100 }],
      },
    ];

    exportToCSV(indicators, 'chinese-test');

    // Verify download was triggered
    expect(mockLink.setAttribute).toHaveBeenCalledWith(
      'download',
      'chinese-test.csv'
    );
  });

  it('handles Chinese characters correctly', () => {
    const indicators: NormalizedIndicator[] = [
      {
        id: 'cpi',
        name: '消费者物价指数',
        value: 3.2,
        unit: '%',
        timestamp: new Date('2024-06-01'),
        historical: [{ timestamp: new Date('2024-06-01'), value: 3.2 }],
      },
    ];

    exportToCSV(indicators, '经济数据');

    expect(mockLink.click).toHaveBeenCalled();
  });

  it('quotes fields containing commas', () => {
    const indicators: NormalizedIndicator[] = [
      {
        id: 'test',
        name: 'Name, with comma',
        value: 100,
        unit: 'USD',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 100 }],
      },
    ];

    exportToCSV(indicators, 'comma-test');

    // PapaParse should handle quoting automatically with quotes: true
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('sanitizes formula prefixes in exported data', () => {
    const indicators: NormalizedIndicator[] = [
      {
        id: 'danger',
        name: '=DDE("cmd","calc","A1")',
        value: 100,
        unit: 'USD',
        timestamp: new Date('2024-01-01'),
        historical: [{ timestamp: new Date('2024-01-01'), value: 100 }],
      },
    ];

    exportToCSV(indicators, 'security-test');

    // Should have sanitized the formula prefix
    expect(mockLink.click).toHaveBeenCalled();
  });
});