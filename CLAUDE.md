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

- **Phase:** 3 of 3 完成 (Gap Closure 已完成)
- **UAT:** 测试暂停于 Test 3 (WebSocket Reconnection)
- **新功能:** 中国房价面板已添加
- **架构重构:** API Key 安全重构进行中 (WIP commit 9a179ea)
- **Roadmap:** `.planning/ROADMAP.md`
- **Requirements:** `.planning/REQUIREMENTS.md`

### 两个活跃任务

| 任务 | 位置 | 状态 |
|------|------|------|
| Phase 03 UAT验证 | `.planning/phases/03-professional-experience/.continue-here.md` | 暂停 (Test 3 blocked) |
| API Key安全重构 | `.continue-here.md` (项目根目录) | WIP (Phase 1-3完成) |

### Commands

```bash
# 启动开发环境
npm run dev                  # 前端 (localhost:5173)
python -m uvicorn main:app   # 后端 (localhost:8000)

# GSD commands
/gsd-plan-phase
/gsd-execute-phase
/gsd-verify-work
/gsd-progress
```

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| ECharts over Recharts | Financial charts need dual Y-axis, dataZoom, candlestick |
| TanStack Query | Multi-API different refresh rates, caching essential |
| Zustand over Redux | Personal tool, no complex state logic needed |
| WebSocket + Polling | Crypto real-time, indices/economic data polled |
| **后端代理架构** | 公网部署不暴露API key，所有外部API通过Python后端代理 |
| Python FastAPI后端 | 缓存层 + API key隔离，支持内网穿透公网访问 |

## Architecture (2026-05-24更新)

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   前端      │────▶│   Python后端     │────▶│  外部API    │
│  (React)    │     │  (FastAPI)       │     │ (FRED/BLS)  │
│  无API Key  │     │  缓存+代理       │     │             │
└─────────────┘     └──────────────────┘     └─────────────┘
      │                    │
      │    /api/backend/*  │
      └────────────────────┘
```

**API Key存储位置:** 仅在后端环境变量，前端JavaScript零API Key

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
*Last updated: 2026-05-24*