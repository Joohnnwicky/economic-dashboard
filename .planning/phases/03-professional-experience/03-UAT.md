---
status: testing
phase: 03-professional-experience
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: 2026-05-18T20:20:00.000Z
updated: 2026-05-18T23:41:00.000Z
---

## Current Test

number: 3
name: WebSocket Reconnection
expected: |
  Auto-reconnect with exponential backoff when connection drops.
  After network interruption, indicator should briefly show "断开" then reconnect.
  After 5 failed attempts, indicator shows "连接失败" (red).
awaiting: user verification

## Session Notes

UAT testing revealed CORS, WebSocket, and API configuration bugs.

### Fixed Issues (during UAT)

1. **WebSocket stale closure bug** - onclose handler using stale state.retryCount
   - Fix: Use retryCountRef instead
   - Commit: 6b840c4

2. **CORS blocking all external APIs** - Browser blocked FRED, BLS, CoinGecko, Alpha Vantage, Eastmoney
   - Fix: Added Vite proxy configuration for all APIs
   - Commit: 4b7801d

3. **WebSocket ping response parsing** - Binance returned non-JSON ping response
   - Fix: Filter non-JSON responses
   - Commit: 4b7801d

4. **Missing A股指数面板** - Phase 2 feature not added to Dashboard
   - Fix: Created ChineseIndicesPanel and added to layout
   - Commit: fb1b668

5. **Alpha Vantage symbols incorrect** - Code uses DJI, NASDAQ, SPX but Alpha Vantage TIME_SERIES_DAILY doesn't support index symbols
   - Fix: Changed to ETF proxies (DIA, QQQ, SPY)
   - Commit: 106b285 (gap closure 03-04)

6. **Eastmoney API endpoint not responding** - A股 indices data fetch fails
   - Fix: Added cb=, ut=, invt=2 parameters to endpoint
   - Commit: 106b285 (gap closure 03-04)

7. **中国央行利率 has no dedicated panel** - PBOCRate data only used in OverlayPanel
   - Fix: Created PBOCRatePanel component and added to Dashboard
   - Commit: 781fb6b (gap closure 03-05)

8. **CPI/OverlayPanel spinning forever** - BLS series IDs incorrect + OverlayPanel cascade blocking
   - Fix: Corrected BLS series IDs (CUSR0000SAF, CUSR0000SA0E), fixed OverlayPanel partial data display
   - Commit: 2b94265

## Tests

### 1. WebSocket Connection Indicator
expected: Crypto panel displays connection indicator with color-coded dot (green=实时, yellow=连接中, red=失败)
result: pass
note: WebSocket stale closure bug fixed during testing

### 2. Real-Time Crypto Prices
expected: BTC/ETH prices update via WebSocket within 1 second
result: partial
reported: "WebSocket connected shows '实时', but CoinGecko historical data has 429 rate limit error"
note: Real-time prices from Binance WS work, CoinGecko REST API rate limited

### 3. WebSocket Reconnection
expected: Auto-reconnect with exponential backoff on network interruption. After 5 failed attempts, shows red "连接失败"
result: blocked
blocked_by: api-data
reason: "用户报告多个数据面板不显示，需先修复API问题才能继续测试"

### 4. dataZoom Slider on Charts
expected: Slider appears at bottom of LineChart and MultiSeriesChart with dark theme styling
result: pending

### 5. dataZoom Zoom Functionality
expected: Drag slider handles to zoom into specific time periods. Tooltip shows correct values when zoomed.
result: pending

### 6. FOMC Markers on Fed Rate Chart
expected: Circular markers appear on Fed rate history chart at FOMC meeting dates
result: pending

### 7. FOMC Marker Colors
expected: Red markers for 加息 (hike), green for 降息 (cut), gray for 维持 (hold)
result: pending

### 8. FOMC Marker Tooltip
expected: Hover over marker shows decision type (加息/降息/维持) and the new rate value
result: pending

## Summary

total: 8
passed: 1
issues: 0
pending: 5
blocked: 2
skipped: 0

## Gaps

- truth: "美股大盘指数面板显示道琼斯、纳斯达克、标普500数据"
  status: resolved
  reason: "Alpha Vantage symbols changed to ETF proxies (DIA, QQQ, SPY)"
  severity: major
  test: N/A
  root_cause: "Alpha Vantage symbols incorrect - DJI, NASDAQ, SPX not supported by TIME_SERIES_DAILY API"
  resolution_plan: "03-04"
  artifacts:
    - path: "src/constants/api.ts"
      issue: "ALPHA_VANTAGE_SYMBOLS uses index symbols instead of ETF symbols"
  missing:
    - "Change DOW_JONES to DIA, NASDAQ to QQQ, SP500 to SPY"
  debug_session: ""

- truth: "A股指数面板显示上证指数、深证成指、沪深300数据"
  status: resolved
  reason: "Eastmoney endpoint updated with cb=, ut=, invt=2 parameters"
  severity: major
  test: N/A
  root_cause: "Eastmoney API endpoint not responding - push2.eastmoney.com returns no data"
  resolution_plan: "03-04"
  artifacts:
    - path: "src/api/eastmoney.ts"
      issue: "Endpoint may have changed or requires different parameters"
  missing:
    - "Verify and update Eastmoney endpoint, or find alternative data source"
  debug_session: ""

- truth: "CPI消费者物价指数面板显示核心CPI、食品CPI、能源CPI数据"
  status: resolved
  reason: "InflationSubMetricsPanel added to Dashboard layout"
  severity: major
  test: N/A
  root_cause: "API works but panel not visible in Dashboard"
  resolution_plan: "03-05"
  artifacts:
    - path: "src/components/layout/InflationSubMetricsPanel.tsx"
      issue: "Panel exists but not imported in Dashboard"
  missing:
    - "Add to Dashboard layout below InflationPanel"
  debug_session: ""

- truth: "跨市场对比分析面板显示所有指标数据用于对比"
  status: resolved
  reason: "Underlying API issues fixed by 03-04, OverlayPanel now loads successfully"
  severity: major
  test: N/A
  root_cause: "OverlayPanel depends on all data sources - multiple API failures cascade"
  resolution_plan: "03-04"
  artifacts:
    - path: "src/components/layout/OverlayPanel.tsx"
      issue: "Panel shows loading spinner when any data source fails"
  missing:
    - "Fix underlying API issues (Alpha Vantage, Eastmoney)"
  debug_session: ""

- truth: "中国央行利率作为独立面板显示"
  status: resolved
  reason: "PBOCRatePanel component created and added to Dashboard"
  severity: minor
  test: N/A
  root_cause: "PBOCRate data only used in OverlayPanel, no dedicated panel component exists"
  resolution_plan: "03-05"
  artifacts:
    - path: "src/components/layout/Dashboard.tsx"
      issue: "PBOCRate not in Dashboard layout"
  missing:
    - "Create PBOCRatePanel component and add to Dashboard"
  debug_session: ""

## Commits Made During UAT

- 6b840c4: fix WebSocket stale closure
- a860580: fix CORS - FRED/BLS proxy
- 4b7801d: fix CORS - all APIs + WebSocket ping filter
- fb1b668: add A股面板 + eastmoney proxy headers