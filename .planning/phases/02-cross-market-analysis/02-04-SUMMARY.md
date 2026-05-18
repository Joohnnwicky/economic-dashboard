---
gsd_state_version: 1.0
phase: 02-cross-market-analysis
plan: 04
subsystem: ui-export-overlay
tags: [export, dialog, overlay, comparison, integration, tdd]
requires: [02-01, 02-02, 02-03]
provides: [export-dialog, overlay-panel, cross-market-comparison, data-export-ui]
affects: [App.tsx, Header.tsx, Dashboard.tsx]
tech_stack:
  added: [export-dialog-modal, overlay-comparison-chart, zustand-export-store]
  patterns: [TDD, component-composition, hook-aggregation]
key_files:
  created:
    - src/stores/exportStore.ts
    - src/stores/__tests__/exportStore.test.ts
    - src/components/ui/ExportDialog.tsx
    - src/components/ui/__tests__/ExportDialog.test.tsx
    - src/components/charts/OverlayComparisonChart.tsx
    - src/components/charts/__tests__/OverlayComparisonChart.test.tsx
    - src/components/layout/OverlayPanel.tsx
    - src/components/layout/__tests__/OverlayPanel.test.tsx
  modified:
    - src/App.tsx
    - src/components/layout/Header.tsx
    - src/components/layout/Dashboard.tsx
    - src/hooks/useCrypto.ts
decisions:
  - Export store separate from dashboard store (modularity)
  - ExportDialog uses existing export-csv.ts and export-xlsx.ts from Wave 1
  - OverlayComparisonChart uses MultiSeriesChart from Wave 1
  - useCrypto wrapper hook added to return NormalizedIndicator format for export/overlay
metrics:
  duration_seconds: 895
  completed_date: "2026-05-18T09:33:00Z"
  task_count: 5
  test_count: 34
  file_count: 9
---

# Phase 2 Plan 04: Export UI & Overlay Comparison Summary

## One-liner
Export dialog modal and cross-market overlay comparison panel integrated into dashboard, consuming Wave 1-3 utilities and data hooks.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Export Zustand store | 04548b2 | exportStore.ts, exportStore.test.ts |
| 2 | ExportDialog component | 38d4784 | ExportDialog.tsx, ExportDialog.test.tsx |
| 3 | OverlayComparisonChart | a8238ea | OverlayComparisonChart.tsx, OverlayComparisonChart.test.tsx |
| 4 | OverlayPanel | c866b7e | OverlayPanel.tsx, OverlayPanel.test.tsx |
| 5 | App.tsx integration | aa6eb78 | App.tsx, Header.tsx, Dashboard.tsx, useCrypto.ts |

## Implementation Details

### Export Dialog
- Modal with CSV/Excel format selection (radio buttons)
- Filename input with sanitization (path traversal prevention per threat model T-02-14)
- Checkbox list for indicator selection
- Preview table showing selected data before export
- Uses `exportToCSV` and `exportToExcel` from Wave 1

### Overlay Comparison Panel
- Gathers all indicators from 7 hooks (Fed, Crypto, BLS employment/inflation, PCE, Chinese indices, PBOC)
- Uses `OverlayComparisonChart` with dual Y-axis selector UI
- Left/right dropdowns for indicator selection
- Right dropdown filters out left selection to prevent duplicates
- Loading spinner while data fetching

### Integration Points
- Header: Added "导出数据" button (green, right side)
- Dashboard: Added OverlayPanel as full-width section after main grid
- App.tsx: ExportDialog state management, indicator gathering from all hooks

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Critical Functionality] Added useCrypto wrapper hook**
- **Found during:** Task 5 TypeScript compilation
- **Issue:** useCrypto.ts only exported useCryptoPrice/useCryptoHistories, not a NormalizedIndicator array format needed for export dialog and overlay panel
- **Fix:** Added useCrypto hook that fetches 365-day history and returns NormalizedIndicator array
- **Files modified:** src/hooks/useCrypto.ts
- **Commit:** aa6eb78

**2. [Rule 1 - Bug] Fixed test text matching in ExportDialog and OverlayComparisonChart tests**
- **Found during:** Test execution
- **Issue:** Multiple elements with same text caused getByText to fail
- **Fix:** Used getAllByText and regex matching for flexible assertions
- **Files modified:** ExportDialog.test.tsx, OverlayComparisonChart.test.tsx
- **Commit:** included in parent commits

## Test Coverage

- 34 tests pass across 4 test files
- Export store: 6 tests (initialization, toggle, format, clear)
- ExportDialog: 14 tests (render, format selection, preview, export, sanitization)
- OverlayComparisonChart: 9 tests (dropdowns, placeholder, selection, filtering)
- OverlayPanel: 5 tests (render, indicator gathering, loading, error)

## Threat Model Compliance

| Threat ID | Status | Implementation |
|-----------|--------|----------------|
| T-02-14 | Mitigated | Filename sanitization: `/\/\\]/g` -> `_`, `..` removed |
| T-02-15 | Accepted | XSS in filename - sanitized, not displayed in dangerous context |
| T-02-16 | Mitigated | Formula injection handled by Wave 1 sanitizeCSVField/sanitizeExcelField |
| T-02-17 | Accepted | Public economic data, no secrets |
| T-02-18 | Accepted | Client-side chart rendering |

## Known Stubs

None - all features fully implemented.

## Self-Check

### Files Verified
- src/stores/exportStore.ts: EXISTS
- src/components/ui/ExportDialog.tsx: EXISTS
- src/components/charts/OverlayComparisonChart.tsx: EXISTS
- src/components/layout/OverlayPanel.tsx: EXISTS
- src/App.tsx: EXISTS (modified)

### Commits Verified
- 04548b2: test(02-04): add failing tests for export store
- 38d4784: feat(02-04): implement ExportDialog with format selection and preview
- a8238ea: feat(02-04): implement OverlayComparisonChart with indicator selectors
- c866b7e: feat(02-04): implement OverlayPanel for cross-market comparison
- aa6eb78: feat(02-04): integrate export dialog and overlay panel into dashboard

**Self-Check: PASSED**