# Phase 3: Professional Experience - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers professional-level chart interaction capabilities and WebSocket real-time cryptocurrency updates:
- Chart zoom/dataZoom for examining specific time periods
- FOMC meeting markers with decision context on interest rate charts
- WebSocket-based real-time crypto price updates (1-second intervals)
- WebSocket auto-reconnection with exponential backoff

**In scope:**
- dataZoom slider component on all time-series charts
- FOMC meeting point markers with tooltip (decision type + rate)
- CoinGecko WebSocket for BTC/ETH real-time prices
- WebSocket connection state indicator
- Exponential backoff reconnection strategy

**Out of scope:**
- Additional cryptocurrencies beyond BTC/ETH (future extension)
- WebSocket for other indicators (only crypto needs sub-second updates)
- Complex FOMC statement analysis (decision type only)

</domain>

<decisions>
## Implementation Decisions

### WebSocket Architecture
- **D-01:** Use Binance WebSocket endpoint (`wss://stream.binance.com:9443/ws/btcusdt@trade`) for BTC real-time prices — FREE public endpoint, no subscription required
  - ETH: `wss://stream.binance.com:9443/ws/ethusdt@trade`
  - Note: Binance streams use lowercase symbol + usdt suffix (btcusdt, ethusdt)
- **D-02:** WebSocket updates sync to TanStack Query cache via `setQueryData` — single data source for all components
- **D-03:** Display WebSocket connection state indicator (green/red/yellow) — user knows if data is real-time
- **D-04:** Architecture supports dynamic subscription management (future extension), but Phase 3 implements fixed BTC/ETH subscriptions
- **D-05:** Parse WebSocket JSON messages directly (no Zod validation for performance)
- **D-06:** Client-side ping heartbeat every 30 seconds to keep connection alive

### dataZoom Interaction
- **D-07:** Use ECharts `dataZoom` type: 'slider' positioned at chart bottom
- **D-08:** Initial zoom shows all data (start: 0, end: 100) — user can zoom as needed
- **D-09:** Slider styling uses existing DARK_THEME colors (background, gridLine, text) — visual consistency

### FOMC Marker Format
- **D-10:** Use point markers (scatter series) on Fed rate chart for FOMC meetings
- **D-11:** Tooltip shows: decision type (加息/降息/维持) + new rate value
- **D-12:** Color coding: 加息 = red (accent[2]), 降息 = green (accent[1]), 维持 = gray
- **D-13:** FOMC data source: FRED automatic detection (DFEDTARU/DFEDTARL rate change points)
- **D-14:** Historical range: show FOMC meetings from past 1 year (matches rate data range)

### WebSocket Reconnection Strategy
- **D-15:** Exponential backoff: initial 1s delay, doubles each retry, max 30s
- **D-16:** Max retry count: 5 attempts before stopping
- **D-17:** After max retries: show connection failed state with manual refresh button

### Claude's Discretion
- WebSocket implementation details (hook structure, message handler design)
- dataZoom exact styling values (height, handle size)
- FOMC marker exact positioning logic (align to rate change points)
- Connection state indicator placement (near crypto panel header)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Chart Patterns (ECharts)
- `src/components/charts/LineChart.tsx` — Base chart component pattern, ReactECharts usage
- `src/components/charts/MultiSeriesChart.tsx` — Multi-series overlay, dual Y-axis pattern
- `src/constants/colors.ts` — DARK_THEME color definitions for chart styling

### Crypto Data Patterns
- `src/hooks/useCrypto.ts` — Existing polling pattern, TanStack Query setup
- `src/api/coingecko.ts` — CoinGecko REST API client (for fallback/historical)
- `src/api/rate-limiter.ts` — Rate limiting pattern (not for WebSocket)

### State Management
- `src/stores/dashboardStore.ts` — Zustand store pattern (optional for WebSocket state)

### No External Specs
No external specs for this phase — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LineChart.tsx`: Base chart component without dataZoom — can be enhanced with dataZoom option
- `useCrypto.ts`: TanStack Query pattern for crypto — `setQueryData` can receive WebSocket updates
- `DARK_THEME`: Color palette — can be used directly for dataZoom slider styling

### Established Patterns
- ReactECharts: Chart component wrapper — dataZoom is native ECharts feature
- TanStack Query cache: Single data source pattern — WebSocket updates sync to same cache
- Rate limiter: API call throttling pattern — NOT needed for WebSocket (different paradigm)

### Integration Points
- `LineChart.tsx`: Add dataZoom to existing option object
- `useCrypto.ts`: Add WebSocket connection, onMessage updates `queryClient.setQueryData`
- Crypto panels: Add connection state indicator near header
- Fed rate chart: Add FOMC markers as scatter series overlay

</code_context>

<specifics>
## Specific Ideas

- dataZoom slider should feel like professional trading terminal (minimal, dark theme)
- FOMC markers should clearly indicate decision type without cluttering chart
- WebSocket connection state should be visible but not intrusive
- Real-time crypto updates should feel "live" (1-second refresh is target)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-professional-experience*
*Context gathered: 2026-05-18*