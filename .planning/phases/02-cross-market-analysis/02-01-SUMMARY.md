---
phase: 02-cross-market-analysis
plan: 01
subsystem: cross-market-foundation
tags: [utilities, charts, export, tdd]
dependencies:
  requires: [Phase 1 - Core Data Infrastructure]
  provides: [YoY/MoM calculations, data alignment, dual Y-axis charts, CSV/Excel export]
  affects: [Wave 2 plans will consume these utilities]
tech_stack:
  added: [vitest, @testing-library/react, jsdom, papaparse, xlsx]
  patterns: [TDD, dual Y-axis ECharts, UTF-8 BOM for CSV]
key_files:
  created:
    - src/utils/yoy-mom.ts
    - src/utils/data-alignment.ts
    - src/components/charts/MultiSeriesChart.tsx
    - src/utils/export-csv.ts
    - src/utils/export-xlsx.ts
  modified:
    - vite.config.ts
    - package.json
decisions:
  - Use date-fns subYears/subMonths for YoY/MoM to handle leap years correctly
  - UTF-8 BOM essential for Excel Chinese character recognition
  - SheetJS handles UTF-8 encoding automatically for XLSX (no BOM needed)
  - grid.right set to 15% when dual Y-axis present to prevent label cutoff
  - Formula injection sanitization applied to both CSV and Excel exports
metrics:
  duration: ~12 minutes
  completed_date: 2025-05-18
  test_coverage: 37 tests across 5 files
  commits: 6
---

# Phase 2 Plan 01: Cross-Market Foundation Summary

**One-liner:** Foundation utilities for cross-market analysis: YoY/MoM calculations, dual Y-axis charts, timestamp alignment, and CSV/Excel export with security sanitization.

## Tasks Completed

| Task | Name | Commit | Files Created |
|------|------|--------|---------------|
| 1 | YoY/MoM calculation utilities | 7a12406, 6d10f4b | src/utils/yoy-mom.ts |
| 2 | Data alignment utility | e1861ee | src/utils/data-alignment.ts |
| 3 | MultiSeriesChart component | c37dee3 | src/components/charts/MultiSeriesChart.tsx |
| 4 | CSV export utility | 35c592e | src/utils/export-csv.ts |
| 5 | Excel export utility | 4a5ef74 | src/utils/export-xlsx.ts |

## Key Implementation Details

### YoY/MoM Calculations (yoy-mom.ts)
- `calculateYoY`: Finds same month one year ago, computes ((current - prior) / prior) * 100
- `calculateMoM`: Compares current with previous month
- Division-by-zero protection: returns `null` if prior value is 0
- Null value handling: returns `null` if current or prior values are null
- Single-point helpers: `calculateYoYForPoint`, `calculateMoMForPoint` for export utilities

### Data Alignment (data-alignment.ts)
- `alignTimestamps`: Merges unique timestamps from all series, returns chronologically sorted array
- Uses Set for deduplication, handles different frequencies (monthly vs daily)
- No interpolation: shows gaps where data is missing (per PITFALLS.md)

### MultiSeriesChart (MultiSeriesChart.tsx)
- Dual Y-axis support: yAxis array with left (index 0) and right (index 1)
- `grid.right = '15%'` when right axis present (critical for label visibility)
- Uses `alignTimestamps` for unified x-axis timeline
- DARK_THEME styling: background, text, gridLine, accent colors
- Placeholder "No data to display" for empty series

### CSV Export (export-csv.ts)
- UTF-8 BOM prefix (`﻿`) for Excel Chinese character recognition
- PapaParse.unparse with `quotes: true` for proper field quoting
- Headers: 指标, 日期, 数值, 单位, 同比%, 环比%
- `sanitizeCSVField`: Strips formula prefixes (=, +, -, @) for security
- Filename sanitization: removes path separators and dangerous characters

### Excel Export (export-xlsx.ts)
- SheetJS (xlsx v0.18.5) for XLSX generation
- Array-of-arrays format with `aoa_to_sheet`
- Column widths: `{ wch: 20 }` for 指标 (Chinese metric names need more width)
- Formula injection sanitization applied
- Null values displayed as '-' in cells

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test assertion for timestamp count**
- **Found during:** Task 2 - Data alignment tests
- **Issue:** Test expected 7 unique timestamps but there was overlap (2024-03-01 in both series)
- **Fix:** Corrected test assertion to expect 6 unique timestamps
- **Commit:** e1861ee
- **Files:** src/utils/__tests__/data-alignment.test.ts

**2. [Rule 1 - Bug] Fixed TypeScript unused parameter warning**
- **Found during:** Overall verification
- **Issue:** `index` parameter declared but never used in calculateYoY
- **Fix:** Removed unused parameter from function signature
- **Commit:** 6d10f4b
- **Files:** src/utils/yoy-mom.ts

**3. [Rule 3 - Blocking] Fixed TypeScript import path in test file**
- **Found during:** Overall verification
- **Issue:** Import path `../../types/indicator` incorrect from `__tests__/` directory
- **Fix:** Corrected to `../../../types/indicator` (3 levels up)
- **Commit:** 6d10f4b
- **Files:** src/components/charts/__tests__/MultiSeriesChart.test.tsx

### TDD Process Note
- Initial commit (7a12406) included both test and implementation files together
- Proper TDD would commit tests first (RED), then implementation (GREEN) separately
- This is noted as a process deviation but tests still validate correct behavior

## Security Considerations

Per threat model in PLAN.md:
- **T-02-01 (Tampering - filename sanitization):** Mitigated - path traversal characters removed
- **T-02-02 (Tampering - formula injection):** Mitigated - prefixes (=, +, -, @) stripped from string fields
- **T-02-03 (Information Disclosure):** Accepted - tooltip shows data values, no secrets
- **T-02-04 (Denial of Service):** Accepted - client-side only, no external dependency

## Interface Contracts for Wave 2

```typescript
// From src/utils/yoy-mom.ts
export function calculateYoY(data: HistoricalDataPoint[]): (number | null)[]
export function calculateMoM(data: HistoricalDataPoint[]): (number | null)[]
export function calculateYoYForPoint(timestamp: Date, historical: HistoricalDataPoint[]): number | null
export function calculateMoMForPoint(timestamp: Date, historical: HistoricalDataPoint[]): number | null

// From src/utils/data-alignment.ts
export function alignTimestamps(series: NormalizedIndicator[]): Date[]

// From src/components/charts/MultiSeriesChart.tsx
interface SeriesConfig {
  data: NormalizedIndicator;
  axisPosition: 'left' | 'right';
  yAxisConfig?: { name?: string; min?: number; max?: number };
}
export function MultiSeriesChart({ series, height?, showLegend?, timeRange? }: MultiSeriesChartProps)

// From src/utils/export-csv.ts
export function sanitizeCSVField(value: string | number | null | undefined): string
export function exportToCSV(indicators: NormalizedIndicator[], filename?: string, config?: CSVExportConfig): void

// From src/utils/export-xlsx.ts
export function sanitizeExcelField(value: string | number | null | undefined): string
export function exportToExcel(indicators: NormalizedIndicator[], filename?: string, config?: ExcelExportConfig): void
```

## Verification Results

- All 37 tests pass across 5 test files
- TypeScript compiles without errors
- Test infrastructure (vitest + jsdom) properly configured

## Self-Check: PASSED

- [x] src/utils/yoy-mom.ts exists
- [x] src/utils/data-alignment.ts exists
- [x] src/components/charts/MultiSeriesChart.tsx exists
- [x] src/utils/export-csv.ts exists
- [x] src/utils/export-xlsx.ts exists
- [x] All commits exist in git log
- [x] All tests pass
- [x] TypeScript compiles cleanly