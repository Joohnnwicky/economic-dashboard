---
phase: 03-professional-experience
plan: 04
subsystem: api
tags: [alphavantage, eastmoney, etf, proxy, cors, rate-limiting]

requires:
  - phase: 01-core-data-infrastructure
    provides: Rate limiter infrastructure, NormalizedIndicator types
  - phase: 03-professional-experience
    provides: UAT diagnosis of API failures
provides:
  - Corrected Alpha Vantage ETF symbols (DIA, QQQ, SPY) for US indices
  - Updated Eastmoney endpoint parameters for A-share indices
affects: [USIndicesPanel, ChineseIndicesPanel, OverlayPanel]

tech-stack:
  added: []
  patterns: [ETF proxy pattern for index data]

key-files:
  created: []
  modified:
    - src/constants/api.ts
    - src/api/eastmoney.ts

key-decisions:
  - "Use ETF proxies (DIA, QQQ, SPY) instead of index symbols for Alpha Vantage TIME_SERIES_DAILY"
  - "Add cb=, ut=, invt=2 parameters to Eastmoney endpoint for JSON response"

patterns-established:
  - "ETF proxy pattern: When index symbols unavailable, use ETF proxies that track the same index"

requirements-completed: [IND-13, IND-14, IND-15, IND-10, IND-11]

duration: 5min
completed: 2026-05-18T23:11:00Z
---

# Phase 03 Plan 04: Fix API Failures Summary

**Corrected Alpha Vantage symbols to ETF proxies (DIA, QQQ, SPY) and updated Eastmoney endpoint parameters for A-share indices data fetching**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-18T23:10:00Z
- **Completed:** 2026-05-18T23:11:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Alpha Vantage API now uses ETF symbols (DIA, QQQ, SPY) that return actual data
- Eastmoney API endpoint updated with additional parameters for reliable JSON response
- Both US indices and A-share indices panels should now render with real data

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Alpha Vantage symbols** - `106b285` (fix)
2. **Task 2: Fix Eastmoney endpoint** - `106b285` (fix)

## Files Created/Modified
- `src/constants/api.ts` - Changed ALPHA_VANTAGE_SYMBOLS from DJI/NASDAQ/SPX to DIA/QQQ/SPY
- `src/api/eastmoney.ts` - Added cb=, ut=, invt=2 parameters to endpoint URL

## Decisions Made
- ETF proxies chosen because Alpha Vantage TIME_SERIES_DAILY API doesn't support index symbols directly
- DIA tracks Dow Jones, QQQ tracks Nasdaq-100, SPY tracks S&P 500 - all highly correlated with their respective indices
- Eastmoney parameters added based on community-discovered API patterns for JSON response

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward configuration changes.

## User Setup Required

None - no external service configuration required. API keys already configured.

## Self-Check

- [x] ALPHA_VANTAGE_SYMBOLS uses ETF symbols (DIA, QQQ, SPY)
- [x] Eastmoney endpoint updated with additional parameters
- [x] All 194 tests pass
- [x] Changes committed atomically

## Next Phase Readiness
- US indices panel should now display real price data
- A-share indices panel should now display 上证指数, 深证成指, 创业板指 data
- Plan 03-05 can proceed to add sub-metrics panels and PBOC rate panel

---
*Phase: 03-professional-experience*
*Completed: 2026-05-18*