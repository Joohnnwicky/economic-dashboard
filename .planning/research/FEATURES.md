# Feature Landscape

**Domain:** Financial Data Real-Time Dashboard (金融数据实时看板)
**Researched:** 2026-05-18
**Confidence:** MEDIUM (Based on project requirements and domain knowledge; external verification limited due to tool access restrictions)

---

## Executive Summary

This document categorizes features for a personal financial dashboard that displays global economic indicators including Federal Reserve rates, US employment/inflation data, cryptocurrency markets, Chinese A-shares, US stock indices, and China central bank rates. The product targets individual users seeking a consolidated view of macroeconomic data with professional terminal-style presentation.

**Key Insight:** This is a personal tool, not a public service. Features should prioritize depth over breadth, quality of analysis over quantity of indicators, and local-first reliability over real-time collaboration.

---

## Table Stakes

Features users expect in any financial dashboard. Missing these makes the product feel incomplete or unusable.

| Feature | Why Expected | Complexity | Priority | Notes |
|---------|--------------|------------|----------|-------|
| **Real-time Price Display** | Users assume current values; stale data undermines trust | Low | P0 | Crypto seconds-level, indices minutes-level acceptable |
| **Historical Price Charts** | Cannot analyze trends without history; fundamental to any financial tool | Medium | P0 | Min 1-year history; interactive line charts expected |
| **Time Range Selection** | Users need to zoom into specific periods; standard UI pattern | Low | P0 | Preset ranges (1D, 1W, 1M, 3M, 6M, 1Y, ALL) + custom |
| **Data Refresh Indicator** | Users need to know data freshness; trust indicator | Low | P0 | Last updated timestamp per data source |
| **Basic Tooltips** | Hover to see exact values; universal expectation | Low | P0 | Show date/time, value, optional change |
| **Dark Theme** | Standard for financial terminals; reduces eye strain during extended use | Low | P0 | Terminal-style aesthetic expected |
| **Responsive Grid Layout** | Multiple indicators visible simultaneously; dashboard definition | Medium | P0 | 2-3 column layout on desktop |
| **Data Accuracy** | Wrong data is worse than no data; core trust factor | High | P0 | Validate API responses, handle errors gracefully |
| **Indicator Labels** | Users must know what each chart represents | Low | P0 | Chinese labels for Chinese audience |
| **Basic Performance** | Dashboard must load within acceptable time; users abandon slow tools | Medium | P0 | Target <3s initial load, <1s subsequent updates |

**Rationale:** These 10 features form the baseline. A financial dashboard without real-time display, charts, or time selection is not viable. Users have seen TradingView, Bloomberg, Yahoo Finance - expectations are set.

---

## Differentiators

Features that create competitive advantage. Not universally expected, but highly valued by target users.

| Feature | Value Proposition | Complexity | Priority | Notes |
|---------|-------------------|------------|----------|-------|
| **Cross-Market Comparison** | Unique ability to overlay Fed rates + crypto + A-shares in one view; reveals correlations invisible in siloed tools | High | P1 | Core differentiator from project context; drives insight generation |
| **Fed Rate Decision Details** | Not just the rate - show meeting outcomes, statements, voting records; deep context for rate moves | Medium | P1 | Goes beyond typical dashboards that show only the number |
| **Employment Sub-Indicators** | Unemployment rate alone is insufficient; break down by sector, demographics, revisions | Medium | P1 | NFP, labor force participation, wage growth - macro analysis requires depth |
| **Inflation Component Breakdown** | CPI/PCE headline vs core; food/energy/healthcare components reveal inflation drivers | Medium | P1 | Critical for understanding inflation trajectory |
| **China-US Market Overlay** | Simultaneous view of Chinese A-shares and US indices; shows divergence/convergence patterns | Medium | P1 | Valuable for investors with cross-border exposure |
| **YoY/MoM Comparison** | Automatic calculation of year-over-year and month-over-month changes; saves manual calculation | Low | P1 | Standard in professional terminals, often missing in personal tools |
| **Chart Zoom/Pan** | Interactive examination of specific periods; goes beyond static time range presets | Medium | P2 | Data zoom, brush selection - expected in professional tools |
| **Data Export (CSV/Excel)** | Download for offline analysis; enables further work in spreadsheet tools | Low | P2 | Professional users expect this |
| **Multi-Scale Y-Axis** | Compare indicators with different value ranges (e.g., BTC $60K vs Fed rate 5%) | High | P2 | Technical challenge; enables meaningful overlay |
| **Annotation/Markers** | Mark key events (FOMC meetings, CPI releases) on charts | Medium | P2 | Context layer for price movements |
| **WebSocket Real-time (Crypto)** | Sub-second price updates for volatile assets; critical for crypto traders | Medium | P2 | REST API polling insufficient for seconds-level crypto |
| **Offline Data Cache** | Continue viewing last-known data when APIs unavailable | Medium | P2 | Local-first reliability |

**Rationale:** The cross-market comparison is the signature feature. Most dashboards show US markets OR crypto OR Chinese markets - combining them reveals macro linkages. Sub-indicator depth (employment components, inflation breakdown) separates serious analytical tools from casual price tickers.

---

## Anti-Features

Features to explicitly NOT build. Documented to prevent scope creep.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Mobile Responsive Design** | PC-only use case per requirements; mobile adds 3-5x complexity for 5% of usage | Single desktop layout optimized for 1920x1080+ |
| **User Authentication** | Personal tool, single user; auth adds backend complexity, security surface | Local-first, no login required |
| **Cloud Deployment** | localhost only per requirements; cloud adds hosting costs, availability concerns | Run via `npm start` locally |
| **Paid Data Sources** | No budget; paid APIs would require subscription management, payment processing | Aggregate free public APIs (FRED, BLS, CoinGecko, Alpha Vantage) |
| **Complex Correlation Algorithms** | Project scope excludes coefficient calculations; over-engineering for MVP | Show data overlays; users draw their own conclusions |
| **Push Notifications** | Local tool without background service; push requires cloud infrastructure, mobile integration | Users refresh dashboard manually; visual indicators for significant moves |
| **Multi-language Support** | Chinese-only audience per requirements; i18n adds complexity, testing burden | Chinese labels throughout; no translation layer |
| **Alert/Price Watch System** | Requires background service, persistent state, notification system | Users monitor actively; no passive alerting |
| **Portfolio Tracking** | Position management, P&L calculation requires separate data model, security considerations | Focus on market data; not personal finance management |
| **Social/Sharing Features** | Personal tool; sharing requires cloud storage, authentication | Screenshots for manual sharing |
| **Backtesting Engine** | Historical simulation requires complex data pipeline, computation engine | Export data for external analysis in Python/R |
| **Predictive Analytics** | ML models require training data, feature engineering, model maintenance | Descriptive analytics only; show what happened, not what will happen |
| **Real-time News Feed** | News aggregation requires RSS/web scraping, NLP for relevance | Users visit dedicated news sources; dashboard shows quantitative data |

**Rationale:** These exclusions keep scope manageable for a single-developer personal tool. Each anti-feature would add 2-8 weeks of development and ongoing maintenance. The line between "financial dashboard" and "trading platform" or "portfolio tracker" is deliberately drawn.

---

## Feature Dependencies

```
Core Data Layer (no dependencies)
├── Fed Interest Rates API
├── Employment Data API (BLS)
├── Inflation Data API (BLS/FRED)
├── Crypto Price APIs (CoinGecko)
├── A-Share Indices API (East Money/Sina)
├── US Stock Indices API (Alpha Vantage)
└── China Central Bank Rates API

Visualization Layer (depends on Core Data)
├── Historical Charts ← requires time-series data
├── Time Range Selection ← requires historical data depth
├── Tooltips ← requires data point metadata
├── YoY/MoM Calculation ← requires historical data
└── Cross-Market Overlay ← requires synchronized timestamps

Enhanced Features (depends on Visualization)
├── Data Export ← requires data formatting
├── Chart Zoom/Pan ← requires interactive chart library
├── Multi-Scale Y-Axis ← requires dual-axis chart capability
└── Event Markers ← requires event data integration
```

**Build Order Rationale:**
1. Data layer first - nothing works without APIs
2. Single indicator visualization - validate each data source
3. Cross-market overlay - combine validated sources
4. Enhanced interactions - polish after core functionality

---

## MVP Recommendation

**Phase 1 (Must Have):**
1. Fed Interest Rates - historical chart (1 year)
2. Employment Data - headline NFP + unemployment rate
3. Inflation Data - CPI headline + core
4. Crypto Prices - BTC/ETH current + 24h chart
5. Stock Indices - US indices current values
6. Basic time range selection
7. Dark terminal theme
8. Last updated timestamps

**Phase 2 (Should Have):**
1. Cross-market comparison overlay
2. Employment sub-indicators
3. Inflation component breakdown
4. A-Share indices
5. China central bank rates
6. YoY/MoM calculations
7. Data export (CSV)

**Phase 3 (Nice to Have):**
1. Fed decision details (meeting outcomes)
2. Chart zoom/pan
3. Multi-scale Y-axis
4. Event markers on charts
5. WebSocket real-time (crypto)
6. Offline cache

**Defer Indefinitely:** All anti-features listed above.

---

## Personal Tool vs Public Service Considerations

| Dimension | Personal Tool Approach | Public Service Approach | Chosen |
|-----------|------------------------|-------------------------|--------|
| **User Management** | None needed | Authentication, profiles, preferences | Personal |
| **Rate Limiting** | Permissive (single user) | Strict limits, caching tiers | Personal |
| **Error Handling** | Show error, log to console | Graceful degradation, retry queues | Personal |
| **Performance** | Acceptable if works | SLA targets, uptime monitoring | Personal |
| **Data Freshness** | Best effort | Guaranteed update frequency | Personal |
| **Mobile** | Not needed | Critical for engagement | Personal |
| **Cost** | Free tier APIs | Premium APIs for reliability | Personal |
| **Backup** | Git repo | Database backups, disaster recovery | Personal |

**Implication:** Design for developer experience, not end-user onboarding. Console logs acceptable. Manual refresh acceptable. API rate limits permissive for single IP.

---

## Feature Complexity Estimates

| Feature | Effort | Risk | Dependencies |
|---------|--------|------|--------------|
| API Integration (single source) | 2-3 days | Low | API docs, test data |
| Historical Chart | 1-2 days | Low | Charting library |
| Cross-Market Overlay | 3-5 days | Medium | Time synchronization, multi-axis |
| Data Export | 1 day | Low | CSV/Excel libraries |
| YoY/MoM Calculations | 1 day | Low | Historical data available |
| Sub-Indicator Breakdown | 2-3 days | Low | Additional API endpoints |
| Fed Decision Details | 2 days | Medium | FRED FOMC data structure |
| WebSocket Real-time | 2-3 days | Medium | Exchange WebSocket APIs |
| Offline Cache | 2-3 days | Medium | LocalStorage/IndexedDB |
| Multi-Scale Y-Axis | 1-2 days | Medium | Chart library capability |

---

## Gaps and Open Questions

**Unresolved:**
1. **Data Source Priority:** If API rate limits hit, which indicators take priority? (Recommendation: Fed rates > Employment > Inflation > Crypto > Stocks)
2. **Historical Depth:** Beyond 1 year, how much history to support? (Recommendation: 5 years for key indicators, configurable)
3. **Chart Library Final Decision:** ECharts vs Recharts - ECharts has more financial features, Recharts is React-native. (Recommendation: ECharts for candlestick/financial chart support)
4. **Update Frequency Strategy:** WebSocket for crypto, polling interval for others? (Recommendation: 10s crypto, 60s indices, 5min economic data)

**Requires Phase-Specific Research:**
1. **API Integration Phase:** Verify FRED, BLS, CoinGecko, Alpha Vantage endpoints, rate limits, response formats
2. **Chart Library Phase:** ECharts React integration, financial chart examples, performance benchmarks
3. **Real-time Phase:** WebSocket availability for crypto exchanges, fallback strategies

---

## Sources

**Confidence Level:** MEDIUM

- PROJECT.md requirements analysis (HIGH confidence - project-defined)
- Domain knowledge of financial dashboards (MEDIUM confidence - training data, may be outdated)
- Financial terminal feature patterns (MEDIUM confidence - general industry patterns)
- No external verification available due to tool access restrictions

**Recommended Verification:**
- ECharts financial chart documentation: https://echarts.apache.org/handbook/en/how-to/chart-types/candlestick
- FRED API documentation: https://fred.stlouisfed.org/docs/api/fred/
- BLS API documentation: https://www.bls.gov/developers/
- CoinGecko API documentation: https://www.coingecko.com/api/documentation
- Alpha Vantage documentation: https://www.alphavantage.co/documentation/