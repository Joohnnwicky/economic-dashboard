import * as XLSX from 'xlsx';
import { NormalizedIndicator } from '../types/indicator';
import { calculateYoYForPoint, calculateMoMForPoint } from './yoy-mom';
import { format } from 'date-fns';

/**
 * Sanitize Excel field to prevent formula injection.
 * Strips formula prefixes (=, +, -, @) that could execute in Excel.
 */
export function sanitizeExcelField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const strValue = String(value);

  // Check for formula prefixes
  if (/^[=+\-@]/.test(strValue)) {
    return strValue.substring(1);
  }

  return strValue;
}

/**
 * Sanitize filename to prevent path traversal.
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[\/\\]/g, '_')
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '_');
}

export interface ExcelExportConfig {
  filename?: string;
  sheetName?: string;
  includeYoY?: boolean;
  includeMoM?: boolean;
}

/**
 * Export indicators to Excel (XLSX) with SheetJS.
 * Column widths set for Chinese readability.
 */
export function exportToExcel(
  indicators: NormalizedIndicator[],
  filename: string = '经济指标导出',
  config: ExcelExportConfig = {}
): void {
  const { sheetName = '经济指标', includeYoY = true, includeMoM = true } = config;

  // Build headers
  const headers = ['指标', '日期', '数值', '单位'];
  if (includeYoY) headers.push('同比%');
  if (includeMoM) headers.push('环比%');

  // Build rows
  const rows: (string | number)[][] = [headers];

  for (const indicator of indicators) {
    for (const point of indicator.historical) {
      const row: (string | number)[] = [
        sanitizeExcelField(indicator.name),
        format(point.timestamp, 'yyyy-MM-dd'),
        point.value ?? '-',
        sanitizeExcelField(indicator.unit),
      ];

      // Add YoY
      if (includeYoY) {
        if (indicator.historical.length > 1 && point.value !== null) {
          const yoy = calculateYoYForPoint(point.timestamp, indicator.historical);
          row.push(yoy !== null ? yoy.toFixed(2) : '-');
        } else {
          row.push('-');
        }
      }

      // Add MoM
      if (includeMoM) {
        if (indicator.historical.length > 1 && point.value !== null) {
          const mom = calculateMoMForPoint(point.timestamp, indicator.historical);
          row.push(mom !== null ? mom.toFixed(2) : '-');
        } else {
          row.push('-');
        }
      }

      rows.push(row);
    }
  }

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for Chinese readability
  worksheet['!cols'] = [
    { wch: 20 }, // 指标 (Chinese metric name needs more width)
    { wch: 12 }, // 日期
    { wch: 12 }, // 数值
    { wch: 8 },  // 单位
    ...(includeYoY ? [{ wch: 10 }] : []), // 同比%
    ...(includeMoM ? [{ wch: 10 }] : []), // 环比%
  ];

  // Create workbook and append sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Write file
  XLSX.writeFile(workbook, `${sanitizeFilename(filename)}.xlsx`);
}