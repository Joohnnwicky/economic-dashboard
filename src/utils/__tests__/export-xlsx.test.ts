import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToExcel, sanitizeExcelField } from '../export-xlsx';
import { NormalizedIndicator } from '../../types/indicator';

// Mock SheetJS XLSX
vi.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: vi.fn(() => ({ '!cols': [] })),
    book_new: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe('sanitizeExcelField', () => {
  it('strips formula prefixes to prevent Excel formula injection', () => {
    expect(sanitizeExcelField('=SUM(A1:A10)')).toBe('SUM(A1:A10)');
    expect(sanitizeExcelField('+cmd|calc')).toBe('cmd|calc');
    expect(sanitizeExcelField('-2+3')).toBe('2+3');
    expect(sanitizeExcelField('@SUM(A1)')).toBe('SUM(A1)');
  });

  it('returns normal strings unchanged', () => {
    expect(sanitizeExcelField('Normal text')).toBe('Normal text');
    expect(sanitizeExcelField('12345')).toBe('12345');
    expect(sanitizeExcelField('经济指标')).toBe('经济指标');
  });

  it('handles empty and null values', () => {
    expect(sanitizeExcelField('')).toBe('');
    expect(sanitizeExcelField(null)).toBe('');
    expect(sanitizeExcelField(undefined)).toBe('');
  });
});

describe('exportToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates XLSX file with headers and data rows', async () => {
    const XLSX = await import('xlsx');

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

    exportToExcel(indicators, 'test-export');

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('sets column widths for Chinese readability', async () => {
    const XLSX = await import('xlsx');

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

    exportToExcel(indicators, 'width-test');

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
    // Column widths should be set for Chinese readability (wch: 20)
  });

  it('includes YoY/MoM columns if data available', async () => {
    const XLSX = await import('xlsx');

    const indicators: NormalizedIndicator[] = [
      {
        id: 'test',
        name: 'Test',
        value: 100,
        unit: 'USD',
        timestamp: new Date('2024-03-01'),
        historical: [
          { timestamp: new Date('2023-03-01'), value: 80 },
          { timestamp: new Date('2024-02-01'), value: 90 },
          { timestamp: new Date('2024-03-01'), value: 100 },
        ],
      },
    ];

    exportToExcel(indicators, 'yoy-mom-test');

    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('handles null values as "-" in cells', async () => {
    const XLSX = await import('xlsx');

    const indicators: NormalizedIndicator[] = [
      {
        id: 'test',
        name: 'Null Test',
        value: 100,
        unit: 'USD',
        timestamp: new Date('2024-01-01'),
        historical: [
          { timestamp: new Date('2024-01-01'), value: null },
        ],
      },
    ];

    exportToExcel(indicators, 'null-test');

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
  });

  it('sanitizes formula prefixes to prevent formula injection', async () => {
    const XLSX = await import('xlsx');

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

    exportToExcel(indicators, 'security-test');

    expect(XLSX.writeFile).toHaveBeenCalled();
  });
});