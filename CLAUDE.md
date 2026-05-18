# Project Instructions

This file guides Claude Code's behavior for this project.

## Project Overview

**全球经济指标看板** - 一个本地运行的全球经济指标实时监控看板，展示美联储利率、美国就业数据、通胀数据、加密货币行情、A股/美股指数、中国央行利率等核心经济指标。

**Core Value:** 实时、全面、直观地展示全球经济核心指标及其联动关系，帮助快速把握宏观经济态势和市场动向。

**Tech Stack:** React 18 + TypeScript + Vite 5, ECharts 5, Zustand, TanStack Query

## Project Structure

```
src/
├── api/                 # API clients (FRED, BLS, CoinGecko, AlphaVantage, etc.)
├── components/
│   ├── charts/          # ECharts chart components
│   ├── layout/          # Dashboard layout
│   └── ui/              # Buttons, selectors, cards
├── hooks/               # Custom data fetching hooks
├── stores/              # Zustand stores
├── types/               # TypeScript interfaces
├── utils/               # Date, calculation utilities
└── constants/           # API keys, endpoints, colors
```

## Critical Constraints

### API Rate Limits (Most Critical)

| API | Limit | Cache TTL |
|-----|-------|-----------|
| BLS | **25/day** | 30 min |
| Alpha Vantage | **25/day** | 60 min |
| FRED | 1000/day | 5-15 min |
| CoinGecko | 10-50/min | WebSocket |

**Rule:** ALWAYS check cache before API call. Implement rate limiting from Day 1.

### React Performance

- WebSocket updates can freeze UI without batching
- Use `useTransition` / `useDeferredValue` for chart updates
- Memoize expensive components

### Chart Data Handling

- Downsample large datasets (>365 points)
- Never fill missing data with zero (use null/gaps)
- UTC normalize all timestamps

## Development Workflow

This project uses **GSD (Get-Shit-Done)** framework.

### Current Status

- **Phase:** 1 of 3 (Core Data Infrastructure)
- **Roadmap:** `.planning/ROADMAP.md`
- **Requirements:** `.planning/REQUIREMENTS.md`
- **Research:** `.planning/research/`

### Commands

```bash
# Plan current phase
/gsd-plan-phase 1

# Execute plans
/gsd-execute-phase

# Verify work
/gsd-verify-work

# Progress check
/gsd-progress
```

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| ECharts over Recharts | Financial charts need dual Y-axis, dataZoom, candlestick |
| TanStack Query | Multi-API different refresh rates, caching essential |
| Zustand over Redux | Personal tool, no complex state logic needed |
| WebSocket + Polling | Crypto real-time, indices/economic data polled |

## Out of Scope

- Mobile responsive
- Cloud deployment
- User authentication
- Paid APIs
- Complex correlation algorithms
- Push notifications

## File Conventions

- **API clients:** `src/api/[source].ts` - one file per data source
- **Charts:** `src/components/charts/[type].tsx` - reusable chart components
- **Hooks:** `src/hooks/use[DataSource]Data.ts` - data fetching hooks
- **Types:** `src/types/[domain].ts` - domain-specific interfaces

## Testing Priorities

1. API rate limiting works (won't exhaust quotas)
2. Cache prevents redundant calls
3. Charts render without freezing
4. Dark theme is readable (contrast check)
5. UTC timestamps display correctly in local time

---
*Last updated: 2026-05-18*