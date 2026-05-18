import Papa from 'papaparse';
import { NormalizedIndicator } from '../types/indicator';
import { calculateYoYForPoint, calculateMoMForPoint } from './yoy-mom';
import { format } from 'date-fns';

/**
 * Sanitize CSV field to prevent formula injection.
 * Strips formula prefixes (=, +, -, @) that could execute in Excel.
 */
export function sanitizeCSVField(value: string | number | null | undefined): string {
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
 * Sanitize filename to prevent path traversal and XSS.
 * Only allows alphanumeric, underscore, hyphen, and Chinese characters.
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  return filename
    .replace(/[\/\\]/g, '_')
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '_');
}

export interface CSVExportConfig {
  filename?: string;
  includeYoY?: boolean;
  includeMoM?: boolean;
}

/**
 * Export indicators to CSV with UTF-8 BOM for Excel Chinese compatibility.
 * Uses PapaParse for robust CSV generation with proper quoting.
 */
export function exportToCSV(
  indicators: NormalizedIndicator[],
  filename: string = '经济指标导出',
  config: CSVExportConfig = {}
): void {
  const { includeYoY = true, includeMoM = true } = config;

  // Build rows
  const rows: Record<string, string | number | null>[] = [];

  for (const indicator of indicators) {
    for (const point of indicator.historical) {
      const row: Record<string, string | number | null> = {
        指标: sanitizeCSVField(indicator.name),
        日期: format(point.timestamp, 'yyyy-MM-dd'),
        数值: point.value,
        单位: sanitizeCSVField(indicator.unit),
      };

      // Add YoY and MoM if available
      if (includeYoY && indicator.historical.length > 1) {
        const yoy = calculateYoYForPoint(point.timestamp, indicator.historical);
        row['同比%'] = yoy !== null ? yoy.toFixed(2) : '-';
      } else {
        row['同比%'] = '-';
      }

      if (includeMoM && indicator.historical.length > 1) {
        const mom = calculateMoMForPoint(point.timestamp, indicator.historical);
        row['环比%'] = mom !== null ? mom.toFixed(2) : '-';
      } else {
        row['环比%'] = '-';
      }

      rows.push(row);
    }
  }

  // Generate CSV with PapaParse
  const csvContent = Papa.unparse(rows, {
    header: true,
    quotes: true, // Quote all fields containing commas
  });

  // Prepend UTF-8 BOM for Excel Chinese character recognition
  const bom = '﻿';
  const csvWithBom = bom + csvContent;

  // Create blob and trigger download
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${sanitizeFilename(filename)}.csv`);
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}