# Roadmap: 全球经济指标看板

## Overview

本路线图将项目从零基础构建为一个功能完整的全球经济指标实时监控看板。Phase 1建立核心数据基础设施，实现API集成、数据规范化和基础图表展示；Phase 2扩展跨市场分析能力，支持多指标叠加、细分数据展示和数据导出；Phase 3增强专业体验，提供高级图表交互和实时WebSocket推送。

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Core Data Infrastructure** - 建立可靠的数据获取管道和基础展示能力
- [ ] **Phase 2: Cross-Market Analysis** - 跨市场对比、细分数据展示、数据导出
- [ ] **Phase 3: Professional Experience** - 高级图表交互、事件标记、实时WebSocket

## Phase Details

### Phase 1: Core Data Infrastructure
**Goal**: 建立可靠的数据获取管道，用户能查看核心经济指标的实时走势和基础图表
**Depends on**: Nothing (first phase)
**Requirements**: API-01~04, API-07, API-08, DATA-01, DATA-02, DATA-05, DATA-06, IND-01, IND-03, IND-05, IND-08, IND-09, IND-13~15, CHART-01~03, CHART-05, UI-01~05, UI-07~09, REAL-03, REAL-04, REAL-05
**Success Criteria** (what must be TRUE):
  1. User can view Federal Reserve interest rate trend chart with 1-year history
  2. User can see real-time Bitcoin and Ethereum prices updating every minute
  3. User can view US stock indices (Dow Jones, Nasdaq, S&P 500) trend charts
  4. User sees a dark terminal-style dashboard with responsive grid layout and clear data visibility
  5. Each data panel shows "last updated" timestamp and loading/error states correctly
**Plans**: 5 plans in 3 waves

Plans:
- [x] 01-01-PLAN.md — Walking Skeleton: Fed Rate slice (17 reqs)
- [x] 01-02-PLAN.md — Crypto Slice: BTC/ETH real-time prices (6 reqs)
- [x] 01-03-PLAN.md — Employment + Inflation Slice: BLS data with time selector (5 reqs)
- [x] 01-04-PLAN.md — US Indices Slice: Alpha Vantage integration (5 reqs)
- [x] 01-05-PLAN.md — Dashboard Integration: Layout, Theme, Polish (8 reqs)

### Phase 2: Cross-Market Analysis
**Goal**: 用户能进行跨市场对比分析，查看就业和通胀细分数据，导出数据
**Depends on**: Phase 1
**Requirements**: API-05, API-06, DATA-03, DATA-04, IND-04, IND-06, IND-07, IND-10~12, IND-16, CHART-06, CHART-07, UI-06, EXPORT-01~03
**Success Criteria** (what must be TRUE):
  1. User can overlay multiple indicators on one chart with dual Y-axis (e.g., Fed rate + Bitcoin price)
  2. User can view employment sub-metrics (labor participation rate, wage growth) alongside NFP
  3. User can see inflation sub-metrics (core CPI, food/energy/healthcare breakdown) and PCE data
  4. User can see YoY and MoM percentage changes for applicable indicators calculated automatically
  5. User can export current view data to CSV or Excel format with UTF-8 encoding
**Plans**: 4 plans in 4 waves

Plans:
- [x] 02-01-PLAN.md — Cross-Market Foundation: YoY/MoM utilities, dual Y-axis charts, export infrastructure (7 reqs)
- [ ] 02-02-PLAN.md — Chinese Market Integration: A-share indices, PBOC rates (6 reqs)
- [ ] 02-03-PLAN.md — Employment/Inflation Sub-Metrics: BLS/FRED sub-series, YoY/MoM displays (4 reqs)
- [ ] 02-04-PLAN.md — Export UI & Overlay Comparison: Dialog, integration, final verification (2 reqs)

### Phase 3: Professional Experience
**Goal**: 专业级图表交互体验，支持图表缩放、事件标记和加密货币实时WebSocket推送
**Depends on**: Phase 2
**Requirements**: IND-02, CHART-04, CHART-08, CHART-09, REAL-01, REAL-02
**Success Criteria** (what must be TRUE):
  1. User can zoom in/out on charts using dataZoom slider to examine specific time periods
  2. User sees FOMC meeting date markers on interest rate charts for historical context
  3. User sees cryptocurrency prices update in real-time (1-second intervals) without manual page refresh
  4. WebSocket connection auto-reconnects after network interruption with exponential backoff
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Data Infrastructure | 5/5 | Complete | 2026-05-18 |
| 2. Cross-Market Analysis | 0/4 | Planned | - |
| 3. Professional Experience | 0/TBD | Not started | - |

---

*Roadmap created: 2026-05-18*
*Based on: REQUIREMENTS.md v1 (56 requirements)*
*Granularity: coarse (3 phases)*
*Plans created: 2026-05-18*
*Phase 2 plans finalized: 2026-05-18*