# Phase 2: Cross-Market Analysis - Research

**Researched:** 2026-05-18
**Domain:** Chinese A-share indices, PBOC rates, dual Y-axis charts, YoY/MoM calculations, data export
**Confidence:** MEDIUM (Chinese APIs lack official documentation, verified via community sources)

## Summary

Phase 2 extends the dashboard with cross-market comparison capabilities, Chinese market data integration, inflation/employment sub-metrics, and data export functionality. The primary challenge is integrating Chinese data sources (East Money/Sina Finance) which lack official public API documentation and require using community-discovered endpoints.

**Primary recommendation:** Use East Money push2 API (unofficial but widely used) for A-share indices with aggressive caching; implement dual Y-axis with ECharts using yAxisIndex pattern; use SheetJS (xlsx) for Excel export with UTF-8 BOM prefix for Chinese character compatibility.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| A-share data fetching | API/Backend | — | External API calls, rate limiting, caching (same pattern as Phase 1) |
| PBOC rate data | API/Backend | — | Historical data fetch, no real-time component needed |
| YoY/MoM calculations | API/Backend | — | Pure computation, applied to fetched historical data |
| Dual Y-axis charts | Browser/Client | — | ECharts configuration, no backend processing needed |
| Multi-series overlay | Browser/Client | — | Chart component configuration |
| CSV/Excel export | Browser/Client | API/Backend | File generation in browser, data preparation in hooks |
| FOMC meeting display | API/Backend | Browser/Client | Fetch meeting dates from FRED, display as chart markers |
| Employment sub-metrics | API/Backend | — | Fetch additional BLS series (labor participation, wage growth) |
| Inflation sub-metrics | API/Backend | — | Fetch CPI components and PCE data |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| xlsx (SheetJS) | 0.18.5 [VERIFIED: npm registry] | Excel export | Industry standard for browser Excel generation, handles UTF-8 |
| ECharts | 5.5.1 (existing) [VERIFIED: package.json] | Dual Y-axis charts | Already in use, native dual-axis support via yAxis array |
| PapaParse | 5.5.3 [VERIFIED: npm registry] | CSV generation | Lightweight, handles UTF-8 streaming, no dependencies |
| date-fns | 4.1.0 (existing) [VERIFIED: npm registry] | Date manipulation for YoY/MoM | Already in use, provides subYears/subMonths utilities |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| axios | 1.7.9 (existing) | East Money/Sina API calls | All Chinese data fetches (same pattern as Phase 1) |
| @tanstack/react-query | 5.100.10 (existing) | Cache management for new APIs | Chinese indices, PBOC rates (different cache TTL needed) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| East Money push2 API | Tushare Pro (Python) | Tushare requires backend proxy, token registration; East Money is browser-accessible but unofficial |
| SheetJS xlsx | ExcelJS | ExcelJS has better styling but larger bundle (~500KB vs ~300KB); SheetJS sufficient for simple data export |
| PapaParse | Manual CSV string building | Manual approach risks encoding errors; PapaParse handles edge cases |

**Installation:**

```bash
npm install xlsx papaparse
```

**Version verification performed:** All package versions verified via npm registry on 2026-05-18.

## Architecture Patterns

### System Architecture Diagram

```
[User selects export]
        │
        ▼
[Export Dialog UI] ──────► [Data Preparation Hook]
        │                       │
        │                       ▼
        │                  [Format Historical Data]
        │                  [Calculate YoY/MoM]
        │                       │
        ▼                       ▼
[CSV Export]              [Excel Export]
    │                          │
    ▼                          ▼
[PapaParse.unparse]       [XLSX.utils.aoa_to_sheet]
    │                          │
    ▼                          ▼
[Add UTF-8 BOM]           [XLSX.writeFile]
    │                          │
    ▼                          ▼
[Browser download]        [Browser download]

[A-share Index Request]
        │
        ▼
[useChineseIndices Hook] ◄─── [TanStack Query Cache]
        │                           │
        ▼                           ▼
[East Money API Call] ─────► [Rate Limiter]
        │                           │
        ▼                           ▼
[Normalize Response]       [Cache for 60 min]
        │
        ▼
[ChineseIndicesPanel]

[Dual Y-Axis Chart]
        │
        ▼
[MultiSeriesChart Component]
        │
        ├─► [Series 1: yAxisIndex: 0 (left)]
        │       │
        │       ▼
        │   [Fed Rate Data] ◄─── [useFedRate Hook]
        │
        ├─► [Series 2: yAxisIndex: 1 (right)]
        │       │
        │       ▼
        │   [BTC Price Data] ◄─── [useCrypto Hook]
        │
        ▼
[ECharts option with yAxis[2]]
```

### Recommended Project Structure

```
src/
├── api/
│   ├── eastmoney.ts      # East Money API client for A-share indices
│   ├── pboc.ts           # PBOC rate data fetcher
│   └── fred-extended.ts  # PCE data, FOMC meeting dates
├── components/
│   ├── charts/
│   │   ├── MultiSeriesChart.tsx  # Dual Y-axis overlay chart
│   │   └── ChartWithMarkers.tsx  # Charts with event markers
│   └── ui/
│       ├── ExportDialog.tsx      # Export modal with format selection
│       └── SubMetricsPanel.tsx   # Employment/inflation breakdown
├── hooks/
│   ├── useChineseIndices.ts      # A-share indices fetch
│   ├── usePBOCRate.ts            # PBOC rate history
│   ├── usePCEData.ts             # PCE inflation data
│   └── useEmploymentSubMetrics.ts # Labor participation, wages
├── utils/
│   ├── yoy-mom.ts                # YoY/MoM calculation functions
│   ├── export-csv.ts             # CSV export with UTF-8 BOM
│   └── export-xlsx.ts            # Excel export with SheetJS
│   └── data-alignment.ts         # Align data timestamps across sources
└── constants/
    └── chinese-indices.ts        # A-share index codes, East Money fields
```

### Pattern 1: Dual Y-Axis with ECharts

**What:** Overlay two metrics with different scales on single chart (e.g., Fed rate 0-5% vs BTC $20k-$100k)

**When to use:** Cross-market comparison where units/scales differ significantly

**Example:**

```typescript
// Source: https://echarts.apache.org/en/option.html#yAxis [CITED: ECharts docs]
const dualAxisOption = {
  yAxis: [
    {
      type: 'value',
      name: '利率 (%)',
      position: 'left',
      nameTextStyle: { color: DARK_THEME.textMuted },
      axisLabel: { formatter: (val: number) => `${val}%` }
    },
    {
      type: 'value',
      name: '价格 ($)',
      position: 'right',
      nameTextStyle: { color: DARK_THEME.textMuted },
      axisLabel: { formatter: (val: number) => `$${val.toLocaleString()}` }
    }
  ],
  series: [
    {
      name: '美联储利率',
      type: 'line',
      yAxisIndex: 0,  // Uses LEFT axis
      data: fedRateData,
      lineStyle: { color: '#22c55e' }
    },
    {
      name: '比特币价格',
      type: 'line',
      yAxisIndex: 1,  // Uses RIGHT axis
      data: btcPriceData,
      lineStyle: { color: '#f59e0b' }
    }
  ],
  grid: { right: '15%' }  // Extra space for right axis labels
};
```

### Pattern 2: UTF-8 BOM for Excel-Compatible CSV

**What:** Add UTF-8 Byte Order Mark (BOM) prefix to CSV file for Excel Chinese character recognition

**When to use:** All CSV exports containing Chinese characters

**Example:**

```typescript
// Source: [ASSUMED] - widely documented community pattern
export function exportToCSV(data: NormalizedIndicator[], filename: string): void {
  const csvContent = Papa.unparse(data, {
    header: true,
    columns: ['日期', '数值', '同比', '环比']
  });

  // UTF-8 BOM: Excel recognizes this and displays Chinese correctly
  const bom = '﻿';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
```

### Pattern 3: YoY/MoM Calculation

**What:** Calculate year-over-year and month-over-month percentage changes from historical data

**When to use:** All indicators with time-series data (employment, inflation, rates)

**Example:**

```typescript
// Source: [ASSUMED] - standard financial calculation
export function calculateYoY(data: HistoricalDataPoint[]): (number | null)[] {
  const yoy: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    // Find same month one year ago
    const current = data[i];
    const oneYearAgo = findDataPointYearAgo(data, current.timestamp);
    
    if (oneYearAgo && oneYearAgo.value !== null && current.value !== null) {
      const change = ((current.value - oneYearAgo.value) / oneYearAgo.value) * 100;
      yoy.push(change);
    } else {
      yoy.push(null);  // No prior year data or missing value
    }
  }
  
  return yoy;
}

export function calculateMoM(data: HistoricalDataPoint[]): (number | null)[] {
  const mom: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      mom.push(null);  // No prior month for first point
      continue;
    }
    
    const current = data[i];
    const previous = data[i - 1];
    
    if (previous.value !== null && current.value !== null && previous.value !== 0) {
      const change = ((current.value - previous.value) / previous.value) * 100;
      mom.push(change);
    } else {
      mom.push(null);
    }
  }
  
  return mom;
}
```

### Pattern 4: East Money API Request

**What:** Fetch real-time A-share index data from East Money's unofficial push2 API

**When to use:** All Chinese index data fetches (上证指数, 深证成指, 创业板)

**Example:**

```typescript
// Source: [CITED: Community documentation] https://github.com/search?q=eastmoney+push2
const EASTMONEY_BASE = 'https://push2.eastmoney.com/api/qt/ulist.np';

// Index codes: 1.000001 (上证), 0.399001 (深证), 0.399006 (创业板)
const secids = '1.000001,0.399001,0.399006';
const fields = 'f2,f3,f4,f12,f14,f15,f16,f17,f18';  // price, change, code, name, high, low, open, prevClose

const response = await axios.get(`${EASTMONEY_BASE}?fltt=2&secids=${secids}&fields=${fields}`);

// Response structure:
// data.diff = [{ f2: 3150.23, f3: 1.5, f12: "000001", f14: "上证指数" }]
```

### Anti-Patterns to Avoid

- **Using FRED's FOMC dates API for historical meetings:** FRED only has recent FOMC target rate series (DFEDTARU/DFEDTARL since 2008), not meeting date calendar. Use Fed's press release archive for historical dates. [ASSUMED]
- **Fetching East Money without rate limiting:** Even unofficial APIs can be blocked for abuse. Add same rate limiter pattern as Phase 1.
- **Excel export without UTF-8 BOM:** Chinese characters appear as garbage in Excel if BOM missing.
- **Dual Y-axis with identical scales:** Don't use dual axis if both metrics are same unit (e.g., CPI + Core CPI both percentages) — use single axis with two series instead.
- **MoM calculation on employment data:** BLS employment data is monthly, MoM meaningful; daily data (indices) MoM is noise. Apply context-aware calculation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV generation | String concatenation with commas | PapaParse.unparse | Handles escaping, quotes, edge cases |
| Excel file generation | Manual XML construction | SheetJS (xlsx) | XLSX format is complex XML; SheetJS handles structure |
| YoY/MoM calculation | Manual loop without null handling | Utility function with null safety | Missing data points must be handled (BLS uses '-' for missing) |
| Date manipulation for year/month offset | Manual Date math | date-fns subYears/subMonths | Handles edge cases (leap years, month end) |
| Dual Y-axis configuration | Custom D3 rendering | ECharts yAxis array | Already in project, native support, no new dependency |

**Key insight:** Chinese data sources are the most risky — no official documentation means implementation may break if East Money changes endpoints. Cache aggressively (60 min minimum), add fallback to manual data entry or historical static data if API fails.

## Runtime State Inventory

This phase is primarily greenfield (new API clients, new components). No rename/refactor operations.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no database in current architecture | N/A |
| Live service config | None — local-only application | N/A |
| OS-registered state | None | N/A |
| Secrets/env vars | VITE_EASTMONEY_TOKEN (optional) — East Money may require token for higher limits [ASSUMED] | Add to .env.local template |
| Build artifacts | None | N/A |

## Common Pitfalls

### Pitfall 1: East Money API Endpoint Changes

**What goes wrong:** Unofficial API endpoints change without notice, breaking data fetch

**Why it happens:** East Money (东方财富) does not publish official API documentation; endpoints discovered by community reverse-engineering

**How to avoid:** 
1. Cache responses aggressively (60 min TTL)
2. Add fallback error UI with manual refresh option
3. Monitor console for 403/404 errors during development
4. Consider backup: static JSON with last-known values if API fails

**Warning signs:** Axios returns 403/404, response.data.diff is empty, field codes no longer match expected

### Pitfall 2: Excel UTF-8 Encoding Without BOM

**What goes wrong:** Chinese characters in exported CSV/Excel appear as gibberish (e.g., "ä¸­å›½" instead of "中国")

**Why it happens:** Excel defaults to system locale encoding (ANSI on older versions) without explicit UTF-8 marker

**How to avoid:** Always prefix CSV content with UTF-8 BOM (`﻿`) before creating Blob

**Warning signs:** Test export in Excel immediately after implementation; if Chinese characters corrupted, missing BOM

### Pitfall 3: Dual Y-Axis Scale Mismatch

**What goes wrong:** Left axis (rate 0-5%) and right axis (price $20k-$100k) overlap visually, making chart unreadable

**Why it happens:** ECharts auto-scales each axis independently; without grid.right adjustment, right axis labels cut off

**How to avoid:** 
1. Set `grid: { right: '15%' }` for right axis space
2. Consider log scale for extreme differences (ECharts supports `type: 'log'`)
3. Test with real data ranges before finalizing

**Warning signs:** Right axis labels truncated, series lines compressed to bottom/top of chart

### Pitfall 4: YoY/MoM Division by Zero

**What goes wrong:** Previous year/month value is zero, calculation throws error or produces Infinity

**Why it happens:** Some indicators can legitimately have zero values (e.g., Fed rate near zero)

**How to avoid:** Check for previous value === 0 before division; return null for that point

**Warning signs:** Chart shows Infinity or NaN values, console division errors

### Pitfall 5: Timezone Alignment for Cross-Market Data

**What goes wrong:** US data timestamped in UTC, Chinese data in Beijing time (UTC+8), aligning causes mismatched dates

**Why it happens:** Different APIs use different timezone conventions; East Money uses local Beijing time

**How to avoid:** 
1. Normalize all timestamps to UTC before storing (existing pattern in src/utils/utc.ts)
2. For same-day comparison, adjust for timezone offset
3. Store timezone metadata with each data source

**Warning signs:** Points appear off-by-one day when overlaying US + Chinese indices

### Pitfall 6: FOMC Meeting Date Display Without Historical Context

**What goes wrong:** Showing FOMC markers without decision context (rate hike/cut/hold) is meaningless

**Why it happens:** FRED provides rate series, not meeting outcome metadata

**How to avoid:** 
1. Fetch Fed press releases or FOMC statement archive for decision type
2. Or: Use color coding for markers (green=cut, red=hike, gray=hold)
3. Tooltip should show "FOMC: Cut to 4.75%" not just "FOMC meeting"

**Warning signs:** Markers appear but tooltip has no actionable information

## Code Examples

### East Money API Client

```typescript
// Source: [CITED: Community reverse-engineering] https://github.com/search?q=eastmoney+push2+api
import axios from 'axios';
import { rateLimiter } from './rate-limiter';

const EASTMONEY_INDEX_URL = 'https://push2.eastmoney.com/api/qt/ulist.np';

// Field codes discovered by community:
// f2 = latest price, f3 = change%, f4 = change amount, f12 = code, f14 = name
const EASTMONEY_FIELDS = 'f2,f3,f4,f12,f14,f15,f16,f17,f18';

// Exchange prefixes: 1 = Shanghai, 0 = Shenzhen
export const CHINESE_INDEX_CODES = {
  SSE_COMPOSITE: '1.000001',     // 上证指数
  SZSE_COMPONENT: '0.399001',    // 深证成指
  CHINEXT: '0.399006',           // 创业板指
} as const;

export async function getChineseIndices(): Promise<NormalizedIndicator[]> {
  const secids = Object.values(CHINESE_INDEX_CODES).join(',');
  
  return rateLimiter.call('EastMoney', async () => {
    const response = await axios.get(
      `${EASTMONEY_INDEX_URL}?fltt=2&secids=${secids}&fields=${EASTMONEY_FIELDS}`
    );
    
    if (!response.data?.data?.diff) {
      throw new Error('East Money response missing data.diff');
    }
    
    return response.data.data.diff.map((item: Record<string, unknown>) => ({
      id: String(item.f12),
      name: String(item.f14),
      value: Number(item.f2),
      unit: 'index',
      change: {
        value: Number(item.f4),
        percentage: Number(item.f3),
        period: 'daily'
      },
      timestamp: new Date()
    }));
  }, { maxCallsPerDay: 500, minIntervalMs: 60000, cacheTtlMs: 3600000 });
}
```

### SheetJS Excel Export

```typescript
// Source: [CITED: SheetJS docs] https://docs.sheetjs.com
import * as XLSX from 'xlsx';

export function exportToExcel(
  indicators: NormalizedIndicator[],
  filename: string
): void {
  // Build array-of-arrays (aoa) format
  const headers = ['指标', '日期', '数值', '单位', '同比%', '环比%'];
  const rows = indicators.map(ind => {
    const latest = ind.historical[ind.historical.length - 1];
    const yoy = calculateYoYForPoint(ind.historical, latest);
    const mom = calculateMoMForPoint(ind.historical, latest);
    
    return [
      ind.name,
      format(latest.timestamp, 'yyyy-MM-dd'),
      latest.value,
      ind.unit,
      yoy?.toFixed(2) ?? '-',
      mom?.toFixed(2) ?? '-'
    ];
  });
  
  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  
  // Column widths for Chinese readability
  ws['!cols'] = [
    { wch: 20 },  // 指标
    { wch: 12 },  // 日期
    { wch: 10 },  // 数值
    { wch: 8 },   // 单位
    { wch: 10 },  // 同比
    { wch: 10 },  // 环比
  ];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '经济指标');
  
  // XLSX.writeFile handles encoding internally (UTF-8 by default)
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
```

### CSV Export with UTF-8 BOM

```typescript
// Source: [ASSUMED] - community best practice for Excel Chinese compatibility
import Papa from 'papaparse';

export function exportToCSV(
  indicators: NormalizedIndicator[],
  filename: string
): void {
  const rows = indicators.map(ind => {
    const latest = ind.historical[ind.historical.length - 1];
    return {
      指标: ind.name,
      日期: format(latest.timestamp, 'yyyy-MM-dd'),
      数值: latest.value,
      单位: ind.unit,
      同比: calculateYoYForPoint(ind.historical, latest)?.toFixed(2) ?? '-',
      环比: calculateMoMForPoint(ind.historical, latest)?.toFixed(2) ?? '-'
    };
  });
  
  const csv = Papa.unparse(rows, {
    header: true,
    quotes: true,  // Quote fields containing commas
    delimiter: ','
  });
  
  // UTF-8 BOM is CRITICAL for Excel Chinese character recognition
  const bom = '﻿';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
```

### Multi-Series Dual Y-Axis Chart Component

```typescript
// Source: [CITED: ECharts docs] https://echarts.apache.org/en/option.html#yAxis
import ReactECharts from 'echarts-for-react';
import { DARK_THEME } from '../../constants/colors';

interface MultiSeriesChartProps {
  series: Array<{
    data: NormalizedIndicator;
    axisPosition: 'left' | 'right';
  }>;
  height?: number;
}

export function MultiSeriesChart({ series, height = 400 }: MultiSeriesChartProps) {
  // Group series by axis position
  const leftAxis = series.filter(s => s.axisPosition === 'left');
  const rightAxis = series.filter(s => s.axisPosition === 'right');
  
  const option = {
    backgroundColor: DARK_THEME.background,
    textStyle: { color: DARK_THEME.text },
    grid: { 
      left: '10%', 
      right: rightAxis.length > 0 ? '15%' : '5%', 
      top: '15%', 
      bottom: '15%' 
    },
    legend: {
      data: series.map(s => s.data.name),
      textStyle: { color: DARK_THEME.text },
      top: 0
    },
    xAxis: {
      type: 'category',
      data: alignTimestamps(series),
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: { color: DARK_THEME.textMuted }
    },
    yAxis: [
      {
        type: 'value',
        name: leftAxis[0]?.data.unit ?? '',
        position: 'left',
        nameTextStyle: { color: DARK_THEME.textMuted },
        axisLabel: { color: DARK_THEME.textMuted },
        splitLine: { lineStyle: { color: DARK_THEME.gridLine, opacity: 0.3 } }
      },
      rightAxis.length > 0 ? {
        type: 'value',
        name: rightAxis[0]?.data.unit ?? '',
        position: 'right',
        nameTextStyle: { color: DARK_THEME.textMuted },
        axisLabel: { color: DARK_THEME.textMuted },
        splitLine: { show: false }  // Avoid overlapping split lines
      } : undefined
    ].filter(Boolean),
    series: series.map((s, idx) => ({
      name: s.data.name,
      type: 'line',
      yAxisIndex: s.axisPosition === 'left' ? 0 : 1,
      data: s.data.historical.map(d => d.value),
      smooth: false,
      symbol: 'none',
      lineStyle: { color: DARK_THEME.accent[idx % DARK_THEME.accent.length], width: 2 }
    })),
    tooltip: {
      trigger: 'axis',
      backgroundColor: DARK_THEME.panel,
      borderColor: DARK_THEME.gridLine,
      textStyle: { color: DARK_THEME.text }
    }
  };
  
  return (
    <ReactECharts
      option={option}
      style={{ height: `${height}px`, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Official Chinese stock APIs (paid) | Unofficial East Money/Sina endpoints | 2020+ | Free access but undocumented, requires community knowledge |
| Excel export with ANSI encoding | UTF-8 BOM prefix | ~2015 | Chinese characters now display correctly in Excel |
| Single Y-axis for all series | Dual Y-axis via yAxisIndex | ECharts 3.0+ (2016) | Cross-market comparison possible without separate charts |
| Manual YoY/MoM calculation in spreadsheet | Automatic calculation in dashboard | This phase | Real-time percentage change visible without export |

**Deprecated/outdated:**
- Sina Finance old API format (hq.sinajs.cn): Replaced by new endpoint structure, some community code still references old format [ASSUMED]
- Microsoft Excel default ANSI encoding: Now supports UTF-8 but requires BOM marker for auto-recognition

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | East Money push2 API endpoint format (push2.eastmoney.com/api/qt/ulist.np) is stable | Standard Stack / Code Examples | API endpoint changes break data fetch; need fallback |
| A2 | East Money field codes (f2=price, f3=change%, etc.) remain consistent | Code Examples | Field mapping breaks, data misinterpreted |
| A3 | UTF-8 BOM (﻿) is sufficient for Excel Chinese recognition | Pattern 2 | CSV exports show corrupted Chinese in older Excel versions |
| A4 | FRED does not have historical FOMC meeting date calendar (only rate target series) | Anti-Patterns | Implementation attempts FRED FOMC API that doesn't exist |
| A5 | PBOC historical rate data available via scraping or manual JSON (no public API) | Data Sources | Cannot programmatically fetch PBOC rates; need manual data entry |
| A6 | SheetJS writeFile handles UTF-8 encoding automatically | Code Examples | Excel exports show corrupted Chinese |
| A7 | East Money may require token for higher rate limits | Runtime State Inventory | Rate limited to low calls/day without token |

**Recommendation for planner:** Tasks involving Chinese APIs (API-05) should include validation step testing with live endpoint. Tasks involving export (EXPORT-01/02) should include manual Excel verification for Chinese character display.

## Open Questions

1. **PBOC Historical Rate Data Source**
   - What we know: PBOC (中国人民银行) publishes rate decisions on official website, but no public API identified
   - What's unclear: Whether historical rate data (pre-2020) is available in machine-readable format
   - Recommendation: 
     - Option A: Manual JSON file with historical PBOC rates (static, updated manually)
     - Option B: Scrape PBOC website for rate history (risky, may violate terms)
     - Option C: Use Macrotrends or Trading Economics API (paid, out of scope per REQUIREMENTS.md)
     - **Default to Option A** for Phase 2, add note in implementation for manual update process

2. **FOMC Meeting Historical Context**
   - What we know: FRED has DFEDTARU/DFEDTARL (target bounds since 2008), FedWire has press release archive
   - What's unclear: How to programmatically map meeting dates to decision type (hike/cut/hold) and statement summary
   - Recommendation:
     - Phase 2: Show FOMC dates as markers with tooltip showing "Rate decision" (no outcome type initially)
     - Phase 3 or manual: Enhance with decision type (fetch from Fed press release archive manually)

3. **East Money API Stability**
   - What we know: Community has used push2 API successfully since 2020, no official documentation
   - What's unclear: Whether East Money will maintain or change endpoint without notice
   - Recommendation: 
     - Implement with aggressive caching (60 min)
     - Add error boundary with manual refresh fallback
     - Document endpoint URL in constants for easy update if changed

4. **BLS Sub-Metrics Series IDs**
   - What we know: Labor participation rate (LNS11000000) verified, average hourly earnings (CES0500000003) verified
   - What's unclear: Exact series IDs for CPI components (food, energy, medical) — search returned partial results
   - Recommendation: Use BLS series finder tool during implementation:
     - CPI Food: Likely CUSR0000SEF (search result incomplete) [ASSUMED]
     - CPI Energy: Likely CUSR0000SEB (search result incomplete) [ASSUMED]
     - CPI Medical: Search didn't return specific ID [ASSUMED]
     - **Verify during implementation** via BLS Data Tools website

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| xlsx (SheetJS) | Excel export | ✓ (npm install) | 0.18.5 | — |
| PapaParse | CSV export | ✓ (npm install) | 5.5.3 | Manual string building (not recommended) |
| axios | East Money API | ✓ (existing) | 1.7.9 | — |
| ECharts | Dual Y-axis | ✓ (existing) | 5.5.1 | — |
| date-fns | YoY/MoM calc | ✓ (existing) | 4.1.0 | — |
| TanStack Query | Chinese data caching | ✓ (existing) | 5.100.10 | — |
| East Money API endpoint | A-share indices | ⚠ Unstable [ASSUMED] | — | Static JSON fallback |

**Missing dependencies with no fallback:**
- None (all required packages are npm-installable or already present)

**Missing dependencies with fallback:**
- East Money API endpoint (unofficial): If blocked, use static JSON with last-known index values (manual update process)

## Security Domain

> Security enforcement enabled. Including ASVS analysis for Phase 2 stack.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Project is local-only tool, no authentication per REQUIREMENTS.md |
| V3 Session Management | No | No user sessions |
| V4 Access Control | No | No user roles |
| V5 Input Validation | Yes | **Zod** for export dialog inputs (filename validation) |
| V6 Cryptography | No | No encryption needed for local export |
| V7 Error Handling | Yes | **ErrorBoundary** for API failures (existing pattern) |
| V8 Data Protection | Partial | Export files contain no secrets; sanitize filename before download |
| V9 Communication | No | All API calls use HTTPS (FRED, BLS, East Money all HTTPS) |
| V10 Malicious Code | No | No user code execution |

### Known Threat Patterns for Phase 2 Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Filename injection in export | Tampering | Validate filename with regex (alphanumeric + underscore only) |
| XSS via chart tooltip | Spoofing | ECharts tooltip content is auto-escaped; use formatter functions |
| API key exposure in browser | Information Disclosure | VITE_* prefix for env vars (Vite convention), keys in .env.local not committed |
| CSV injection (formula injection) | Tampering | PapaParse quotes fields; sanitize formula prefixes (=, +, -) in data |
| Excessive API calls (quota exhaustion) | Denial of Service | Rate limiter (existing), cache-first policy |

**CSV injection mitigation note:** Excel interprets cells starting with `=`, `+`, `-`, `@` as formulas. If indicator names or values could contain these prefixes, sanitize before export. Current data sources (FRED, BLS, CoinGecko) do not produce formula-like content, but Chinese indicator names like "=上证指数" could trigger. **Validation:** Strip formula prefixes from all exported string fields.

## Sources

### Primary (HIGH confidence)

- [npm registry] - xlsx@0.18.5, papaparse@5.5.3, echarts@5.5.1 (verified via npm view)
- [ECharts Official Docs] https://echarts.apache.org/en/option.html#yAxis - dual Y-axis configuration
- [BLS Series LNS11000000] https://data.bls.gov/timeseries/LNS11000000 - labor force participation rate (verified)
- [BLS Series CES0500000003] https://www.bls.gov/news.release/empsit.t19.htm - average hourly earnings (verified)

### Secondary (MEDIUM confidence)

- [Tushare Pro Documentation] https://tushare.pro/document/2 - A-share index codes (cross-referenced for East Money codes)
- [Community East Money API] GitHub search results for "eastmoney push2 api" - endpoint structure (not official docs)
- [SheetJS Docs] https://docs.sheetjs.com - export methods (partial fetch, version verified)

### Tertiary (LOW confidence - flagged for validation)

- East Money field codes (f2, f3, f4, etc.) - [ASSUMED] from community reverse-engineering, not official docs
- PBOC historical rate data availability - [ASSUMED] no public API found, manual data entry recommended
- CPI component series IDs (food CUSR0000SEF, energy CUSR0000SEB) - [ASSUMED] search incomplete, verify during implementation
- FOMC meeting decision type data source - [ASSUMED] FRED doesn't provide, Fed press release archive manual fetch

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - all packages verified via npm, versions confirmed
- Architecture patterns: HIGH - ECharts dual Y-axis is official feature, YoY/MoM are standard calculations
- Chinese data sources: LOW - East Money endpoint is unofficial, no official documentation; PBOC no API found
- Export functionality: HIGH - SheetJS/PapaParse are standard, UTF-8 BOM pattern is well-documented
- FRED/BLS series IDs: MEDIUM - core series verified, sub-metrics need verification during implementation

**Research date:** 2026-05-18
**Valid until:** 2026-06-18 (30 days) - Chinese API endpoints may change without notice; re-verify East Money endpoint before implementation

---

## Phase Requirements Coverage

| ID | Description | Research Support |
|----|-------------|------------------|
| API-05 | 东方财富/新浪财经数据源集成 | East Money push2 API documented (unofficial, LOW confidence); fallback strategy defined |
| API-06 | 中国央行利率数据源集成 | No public API found; manual JSON approach recommended; open question logged |
| DATA-03 | 同比(YoY)自动计算 | Standard calculation formula documented; code example provided; utility function pattern |
| DATA-04 | 环比(MoM)自动计算 | Standard calculation formula documented; code example provided; null handling pattern |
| IND-02 | 美联储决议详情展示 | FRED target rate series (DFEDTARU/DFEDTARL) for current; historical decisions need manual data; open question logged |
| IND-04 | 就业分项指标展示 | BLS series IDs verified: LNS11000000 (labor participation), CES0500000003 (hourly earnings) |
| IND-06 | 通胀分项数据展示 | CPI components partially identified (food, energy, medical); verification needed during implementation |
| IND-07 | PCE通胀数据展示 | FRED series IDs: PCEPI (overall), PCEPILFE (core) documented |
| IND-10 | 上证指数展示 | East Money code: 1.000001 documented |
| IND-11 | 深证成指展示 | East Money code: 0.399001 documented |
| IND-12 | 创业板指数展示 | East Money code: 0.399006 documented |
| IND-16 | 中国央行利率走势展示 | Same as API-06; manual data recommended |
| CHART-06 | 双Y轴图表支持 | ECharts dual Y-axis pattern documented with yAxisIndex; code example provided |
| CHART-07 | 多指标叠加图表实现 | MultiSeriesChart component pattern documented; alignTimestamps utility needed |
| UI-06 | 数据导出对话框 | Modal pattern; format selection (CSV/Excel) UI design |
| EXPORT-01 | CSV格式数据导出 | PapaParse + UTF-8 BOM pattern documented; code example provided |
| EXPORT-02 | Excel格式数据导出 | SheetJS xlsx.writeFile pattern documented; code example provided |
| EXPORT-03 | UTF-8编码导出 | UTF-8 BOM (﻿) for CSV, SheetJS auto-UTF-8 for Excel documented |