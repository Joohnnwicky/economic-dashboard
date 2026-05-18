# Domain Pitfalls: Financial Data Real-Time Dashboard

**Domain:** 金融数据实时看板 (Financial Data Real-Time Dashboard)
**Researched:** 2026-05-18
**Confidence:** MEDIUM (Based on project requirements, React 18 docs, and domain knowledge; external API documentation verification limited due to tool access restrictions)

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or user-facing failures.

### Pitfall 1: API Rate Limit Exhaustion from Parallel Requests

**What goes wrong:** Dashboard loads all data sources simultaneously on mount. Each API (FRED, BLS, CoinGecko, Alpha Vantage, Chinese stock APIs) has daily/hourly limits. A few refresh cycles exhaust quotas, causing 429 errors across ALL indicators.

**Why it happens:** Developers underestimate rate limits for free tiers:
- FRED: ~1,000 requests/day (varies by endpoint)
- BLS: 25 requests/day (free tier)
- CoinGecko: 10-50 calls/minute (free tier)
- Alpha Vantage: 5 calls/minute, 500 calls/day
- Chinese APIs (East Money/Sina): Often undocumented, aggressive blocking

**Consequences:**
- Complete dashboard failure (no data)
- Cascading errors if retry logic not implemented
- IP bans on aggressive retry
- User loses trust in tool reliability

**Prevention:**
1. **Staggered initialization:** Load critical indicators first (Fed rates, employment), then secondary (crypto, stocks)
2. **Request caching:** LocalStorage/IndexedDB with TTL (time-to-live):
   - Economic data: 5-15 minute cache (updates monthly/quarterly anyway)
   - Crypto: 10-30 second cache for seconds-level updates
   - Stock indices: 60 second cache for minute-level updates
3. **Request deduplication:** Single API call serves multiple components
4. **Fallback strategy:** Show cached data with "stale" indicator when API fails

**Detection:**
- Console warnings when approaching rate limits (log remaining quota)
- Dashboard shows "last updated" timestamps older than expected
- Sudden 429 errors in network tab

**Phase mapping:** Phase 1 (API Integration) - MUST implement caching and rate limiting before adding multiple data sources.

---

### Pitfall 2: Timestamp Misalignment in Cross-Market Comparison

**What goes wrong:** Overlaying Fed rate decisions with BTC price or A-share indices shows false correlations. Data points appear aligned on chart but represent different time zones, market sessions, or data release timing.

**Why it happens:**
- Fed announcements: US Eastern Time (EST/EDT)
- A-share market: China Standard Time (CST, UTC+8)
- Crypto: 24/7 global, no time zone
- Employment data: Released 8:30 AM ET, but dashboard may poll later
- Market holidays: Different countries have different market closure days

**Consequences:**
- Users draw incorrect conclusions about market reactions
- "Fed rate hike → BTC drop" may actually be 12-hour delayed reaction
- A-share reaction to US data shows wrong day on chart
- Undermines the core value proposition (cross-market comparison)

**Prevention:**
1. **UTC normalization:** Store all timestamps in UTC internally
2. **Time zone display:** Show data in user's local time zone, but store in UTC
3. **Market session indicators:** Highlight when each market is open/closed
4. **Data release markers:** Show vertical lines for scheduled economic releases
5. **Gap handling:** Don't interpolate across market closures (weekends for stocks, different holidays)

**Detection:**
- Cross-market correlation analysis shows unexpected patterns
- User reports "reaction happened before announcement" (time zone inversion)
- Charts show data during market closure hours

**Phase mapping:** Phase 2 (Cross-Market Comparison) - Critical to solve before implementing overlay feature.

---

### Pitfall 3: React State Update Storms from Real-Time Data

**What goes wrong:** WebSocket crypto updates arrive every 1-2 seconds. Each update triggers React re-render of entire chart component. Dashboard becomes sluggish, CPU spikes, charts flicker or lag.

**Why it happens:**
- Each WebSocket message triggers `setState`
- React re-renders entire component tree on every update
- No batching across multiple data sources
- ECharts re-renders full chart on data change

**Consequences:**
- UI becomes unresponsive
- Chart animations stutter
- User cannot interact (click, zoom) during updates
- Browser memory leaks from accumulated render cycles

**Prevention:**
1. **Use React 18 batching:** Updates in same tick are automatically batched (from React 18 docs)
2. **`useTransition` for non-urgent updates:**
   ```javascript
   const [isPending, startTransition] = useTransition();
   // Urgent: user typing
   setInputValue(input);
   // Non-urgent: chart data update
   startTransition(() => {
     setChartData(newData);
   });
   ```
3. **`useDeferredValue` for chart rendering:**
   ```javascript
   const deferredPrice = useDeferredValue(currentPrice);
   // Chart uses deferred value, doesn't block user input
   ```
4. **Throttle WebSocket updates:** Buffer updates, apply every 10s for chart, show live price in small text
5. **ECharts `setOption` with `notMerge: false`:** Update data without full re-render
6. **Memoize expensive chart components:** `React.memo` with custom comparison

**Detection:**
- Chrome DevTools Performance tab shows frequent "Commit" phases
- User input feels sluggish when crypto prices updating
- React DevTools Profiler shows excessive re-renders

**Phase mapping:** Phase 1 (Real-time Display) - Implement early to avoid architectural debt.

---

### Pitfall 4: Dark Theme Readability Failures

**What goes wrong:** "Professional dark terminal aesthetic" results in unreadable charts. Grid lines invisible, axis labels blend into background, color contrast insufficient for data points.

**Why it happens:**
- CSS dark themes designed for text, not data visualization
- ECharts default colors assume light background
- "Terminal green on black" aesthetic prioritized over legibility
- Color blindness not considered (red/green for up/down)

**Consequences:**
- Users cannot read chart values
- Strain during extended use (opposite of intended benefit)
- Cross-market comparison impossible when colors overlap
- Accessibility failure

**Prevention:**
1. **Contrast ratios:** WCAG AA minimum (4.5:1 for text, 3:1 for large text)
2. **Color palette design:**
   - Background: Near-black (#0d1117, #1a1a1a), not pure black
   - Grid lines: Subtle gray (#30363d), not invisible
   - Text: Off-white (#c9d1d9), not pure white
   - Data colors: High contrast palette (#58a6ff, #3fb950, #f85149, #d29922)
3. **Color blind safe:** Avoid red/green only; use patterns, shapes, or color blind safe palettes
4. **Test in real conditions:** View in daylight, at night, on different monitors
5. **ECharts theme configuration:** Define custom dark theme, don't rely on defaults

**Detection:**
- Users squint to read labels
- Screenshots unclear when shared
- Data points overlap invisibly

**Phase mapping:** Phase 1 (Dark Theme) - Test before implementing multiple indicators.

---

### Pitfall 5: Chart Rendering Crash on Large Datasets

**What goes wrong:** Loading 5 years of daily Fed rate data + crypto tick data + stock daily bars in single chart causes browser freeze, out-of-memory crash, or 10+ second render times.

**Why it happens:**
- 5 years daily = ~1,800 data points per series
- Crypto tick data = thousands of points per hour
- Multiple series on same chart = exponential DOM/Canvas elements
- ECharts renders all points, not just visible pixels

**Consequences:**
- Dashboard unusable for historical analysis
- Browser tab crash
- User abandons tool for Excel/Python

**Prevention:**
1. **Data downsampling:** Render only visible points:
   - Daily granularity for > 1 year view
   - Hourly for 1-3 months
   - Full resolution for < 1 week
2. **ECharts `dataZoom`:** Load full dataset, but only render visible range
3. **WebGL rendering:** Use `echarts-gl` for large datasets
4. **Lazy loading:** Fetch historical data on demand (user zooms in)
5. **Virtual scrolling:** Render only points in current viewport
6. **Aggregation:** Pre-aggregate data on client or cache aggregated versions

**Detection:**
- Chart takes > 1 second to render
- Browser memory > 1GB
- Fan spins up when opening historical view

**Phase mapping:** Phase 1 (Historical Charts) - Implement downsampling strategy before adding multiple year history.

---

## Moderate Pitfalls

### Pitfall 6: Missing Data Points Displayed as Zero

**What goes wrong:** API returns sparse data (economic indicators released monthly). Chart shows zeros for missing months, creating false "crashes" or misleading trends.

**Why it happens:**
- Chart libraries fill gaps with zero by default
- Economic data (CPI, NFP) released monthly, but chart expects daily
- Holiday gaps in stock data

**Prevention:**
- Configure ECharts to `connectNulls: false` (show gaps, not zeros)
- Visual indicator for missing data (dashed line, gray gap)
- Forward-fill last known value for visual continuity (with clear labeling)

**Phase mapping:** Phase 1 (API Integration)

---

### Pitfall 7: Local Storage Overflow

**What goes wrong:** Dashboard caches 5 years of multi-source data in LocalStorage. Quota exceeded (5-10MB), writes fail silently, data lost.

**Why it happens:**
- LocalStorage has 5-10MB limit per origin
- 5 years of daily data for 10+ indicators exceeds limit
- No eviction policy implemented

**Prevention:**
- Use IndexedDB for larger datasets (no practical limit)
- Implement LRU (least recently used) cache eviction
- Store only essential fields, not full API responses
- Compression for cached JSON

**Phase mapping:** Phase 2 (Offline Cache)

---

### Pitfall 8: API Key Exposure in Client-Side Code

**What goes wrong:** Free API keys (FRED, Alpha Vantage, CoinGecko) embedded in React bundle. Keys scraped, rate limits exhausted by abuse, dashboard blocked.

**Why it happens:**
- Local-only tool, no backend to proxy keys
- "It's free anyway, what's the risk?"
- Keys visible in browser DevTools

**Prevention:**
- Environment variables (`.env.local`) for keys
- Document that keys should be rotated if compromised
- Acceptable for personal tool (single user), but document risk
- Consider backend proxy if tool expands beyond personal use

**Phase mapping:** Phase 1 (API Integration)

---

### Pitfall 9: Exchange Rate API Failure Cascades

**What goes wrong:** Single API failure (e.g., CoinGecko down) causes entire dashboard to show loading spinners or crash. No graceful degradation.

**Why it happens:**
- All data sources initialized in parallel
- Error in one source not caught
- UI expects all data before rendering

**Prevention:**
- Error boundaries per data source
- Render available data even if some APIs fail
- Show "Data unavailable" for failed sections, not full-page error
- Retry logic with exponential backoff

**Phase mapping:** Phase 1 (API Integration)

---

### Pitfall 10: Inconsistent Number Formatting

**What goes wrong:** Fed rate shows "5.25%" and "0.0525" in same view. BTC shows "67543.21" and "67,543.21". Users cannot compare values at a glance.

**Why it happens:**
- Different APIs return different formats
- No centralized formatting layer
- Locale inconsistencies (Chinese vs US number formats)

**Prevention:**
- Central formatting utility:
  ```javascript
  formatPercentage(0.0525) // "5.25%"
  formatPrice(67543.21, 'USD') // "$67,543.21"
  formatPrice(67543.21, 'BTC') // "₿ 67,543.21"
  ```
- Define format for each indicator type
- Chinese number format (10,000 as 万) for A-shares

**Phase mapping:** Phase 1 (Core Data Display)

---

### Pitfall 11: Chart Axis Scale Manipulation Misinterpretation

**What goes wrong:** Y-axis auto-scales to data range. Small 0.1% change in Fed rate looks like massive spike. User misinterprets magnitude.

**Why it happens:**
- Auto-scale prioritizes fitting data, not showing magnitude
- Fed rates (0-6%) vs BTC ($60K-$70K) on same chart requires dual axis
- Visual comparison implies magnitude that doesn't exist

**Prevention:**
- Fixed Y-axis ranges for known indicators (Fed: 0-6%)
- Dual Y-axis for cross-market comparison
- Clear labeling of axis scale
- Sparklines for relative change, full charts for absolute

**Phase mapping:** Phase 2 (Cross-Market Comparison)

---

### Pitfall 12: WebSocket Connection Instability

**What goes wrong:** Crypto WebSocket disconnects during network hiccup. No reconnection logic. Price shows stale data indefinitely.

**Why it happens:**
- WebSocket connections unstable in browsers
- No heartbeat/keepalive
- No reconnection on error/close events

**Prevention:**
- Exponential backoff reconnection
- Heartbeat/ping messages
- Fallback to REST API polling if WebSocket fails
- Visual indicator for live vs stale data

**Phase mapping:** Phase 2 (WebSocket Real-time)

---

## Minor Pitfalls

### Pitfall 13: Hardcoded API Endpoints

**What goes wrong:** API changes endpoint URL or response format. Dashboard breaks. No easy way to update without code changes.

**Prevention:**
- Configuration file for API endpoints
- Version API integration code
- Monitor API changelogs (FRED, BLS announce changes)

**Phase mapping:** Ongoing maintenance

---

### Pitfall 14: No Data Freshness Indicator

**What goes wrong:** Dashboard shows 2-hour-old Fed rate data as "current." User makes decisions on stale data.

**Prevention:**
- "Last updated: [timestamp]" per data source
- Visual stale indicator (yellow/red highlight) for old data
- Auto-refresh with visual countdown

**Phase mapping:** Phase 1 (Real-time Display)

---

### Pitfall 15: Chinese Character Encoding Issues

**What goes wrong:** A-share company names, Chinese economic indicator labels show garbled text (mojibake).

**Why it happens:**
- API returns GBK/GB2312 encoding
- Browser expects UTF-8
- Inconsistent encoding in data pipeline

**Prevention:**
- Explicit UTF-8 encoding in fetch requests
- Test with Chinese characters early
- Validate encoding on API responses

**Phase mapping:** Phase 1 (Chinese Data Sources)

---

### Pitfall 16: Holiday/Schedule Data Gaps

**What goes wrong:** US market holiday, but dashboard shows flat line for US indices. User thinks data frozen.

**Why it happens:**
- API returns no data for holidays
- Chart shows gap or interpolated line
- No market status indicator

**Prevention:**
- Market holiday calendar
- Visual indicator for market closure
- Gray dashed line for closure periods

**Phase mapping:** Phase 1 (Stock Indices)

---

### Pitfall 17: Mobile Accidental Zoom on Desktop

**What goes wrong:** Dashboard designed for desktop but responsive CSS makes it tiny on certain monitor sizes. Or, chart touch-zoom on laptop trackpad is too sensitive.

**Prevention:**
- Set minimum width (e.g., 1200px)
- Disable touch zoom if not mobile-targeted
- Test on various screen sizes

**Phase mapping:** Phase 1 (UI Layout)

---

### Pitfall 18: CSV Export Data Corruption

**What goes wrong:** Export to CSV has encoding issues, number format issues (comma as decimal separator vs thousands separator), or missing data.

**Prevention:**
- UTF-8 BOM for Excel compatibility
- Consistent number format (no locale ambiguity)
- Test import in Excel, Google Sheets, Python pandas

**Phase mapping:** Phase 2 (Data Export)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **API Integration** | Rate limit exhaustion (#1) | Implement caching first, then add sources |
| **Real-time Display** | React state update storms (#3) | Use `useTransition`, throttle updates |
| **Historical Charts** | Rendering crash on large datasets (#5) | Downsampling, lazy loading |
| **Dark Theme** | Readability failures (#4) | Test contrast, use color blind safe palette |
| **Cross-Market Comparison** | Timestamp misalignment (#2) | UTC normalization, market session indicators |
| **Chinese Data Sources** | Encoding issues (#15) | Test Chinese characters early |
| **WebSocket (Crypto)** | Connection instability (#12) | Reconnection logic, REST fallback |
| **Offline Cache** | LocalStorage overflow (#7) | IndexedDB, LRU eviction |

---

## Personal Tool Relaxations

Since this is a personal tool (not public service), some pitfalls are less critical:

| Pitfall | Public Service Severity | Personal Tool Severity | Rationale |
|---------|------------------------|------------------------|-----------|
| API Key Exposure | Critical | Low | Single user, free keys, easy rotation |
| Rate Limit Exhaustion | Critical | Medium | Only one user, but still can exhaust quotas |
| Mobile Responsive | High | N/A | Desktop-only per requirements |
| Error Recovery | High | Medium | User can refresh, but shouldn't need to |
| Accessibility | Required | Nice-to-have | Personal tool, but dark theme should be readable |
| Data Validation | High | Medium | Free APIs may have errors, validate gracefully |

---

## Detection Strategies

### Early Warning Signs (Phase 1)

1. **Console log monitoring:** Track API response times, rate limit headers
2. **Render timing:** Log chart render duration, warn if > 500ms
3. **Memory usage:** Monitor heap size, warn if > 500MB
4. **State update frequency:** Log state updates per second, warn if > 10/sec

### Ongoing Monitoring (Phase 2+)

1. **Data freshness:** Alert if any source > 2x expected update interval
2. **API quota tracking:** Log remaining quota per API
3. **User interaction lag:** Track time from click to response

---

## Sources

**Confidence Level:** MEDIUM

- **HIGH confidence:** React 18 batching/transition documentation (retrieved from react.dev)
- **MEDIUM confidence:** Domain knowledge of financial dashboard challenges (training data, may be outdated)
- **MEDIUM confidence:** ECharts performance patterns (training data, general best practices)
- **LOW confidence:** API rate limits (not verified from official docs due to access restrictions)

**Recommended Verification:**
- FRED API rate limits: https://fred.stlouisfed.org/docs/api/fred/rate_limit_stack.html
- CoinGecko API rate limits: https://www.coingecko.com/api/documentation
- Alpha Vantage rate limits: https://www.alphavantage.co/support/#api-key
- ECharts large data: https://echarts.apache.org/handbook/en/best-practices/large-data
- BLS API documentation: https://www.bls.gov/developers/

**Next Steps for Verification:**
1. Test API endpoints manually during development to verify rate limits
2. Load test with historical data to measure rendering performance
3. User test dark theme in various lighting conditions