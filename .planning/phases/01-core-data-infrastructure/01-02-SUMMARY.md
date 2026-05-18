---
phase: 01-core-data-infrastructure
plan: 02
subsystem: crypto
tags: [coingecko, btc, eth, real-time, polling, hooks, components]
requires: [01-01]
provides: [crypto-prices, minute-polling]
affects: [App.tsx]
tech_stack:
  added: [CoinGecko API, Minute-level polling]
  patterns: [TanStack Query, Rate limiting, Sparkline charts]
key_files:
  created:
    - src/api/coingecko.ts
    - src/hooks/useCrypto.ts
    - src/components/ui/IndicatorCard.tsx
    - src/components/charts/MiniChart.tsx
    - src/components/indicators/CryptoPanel.tsx
  modified:
    - src/constants/api.ts
    - src/constants/indicators.ts
    - src/api/types.ts
    - src/App.tsx
decisions:
  - CoinGecko API client with free tier (no key required)
  - 60-second staleTime and refetchInterval for crypto prices
  - Rate limiter enforced with 1.2s minInterval
  - Sparkline style for mini charts (no axes/tooltip)
metrics:
  duration: 5 minutes
  tasks: 6/6
  files: 9
  commits: 6
---

# Phase 01 Plan 02: Crypto Slice - BTC/ETH Real-Time Prices Summary

Bitcoin and Ethereum real-time price tracking with minute-level polling using CoinGecko API. Extends Walking Skeleton with high-frequency data source and reusable UI components.

## One-Liner

Implemented CoinGecko API client with 60s polling, IndicatorCard for price display with percentage change, and MiniChart sparklines for 24h trends.

## Implementation

### Task 1: Add CoinGecko API Types and Constants
- Added `COINGECKO_BASE_URL` endpoint constant
- Added BTC/ETH metadata with `coinGeckoId` for API calls
- Added `CoinGeckoPriceResponse` and `CoinGeckoHistoryResponse` types
- Commit: `3e980e3`

### Task 2: Implement CoinGecko API Client
- Created `src/api/coingecko.ts`
- `getCryptoPrice`: Fetch current prices for BTC+ETH
- `getCryptoHistory`: Fetch 24h price history
- Applied rate limiter with 1.2s minInterval and 60s cacheTtlMs
- Response validation for numeric fields and timestamps
- Commit: `41b011d`

### Task 3: Create Crypto Data Hook
- Created `src/hooks/useCrypto.ts`
- `useCryptoPrice`: Hook for BTC+ETH current prices
- `useCryptoHistory`: Hook for 24h history
- `useCryptoHistories`: Parallel fetch for both
- 60s staleTime and refetchInterval (REAL-03)
- TanStack Query auto-refetch enabled
- Commit: `3478d88`

### Task 4: Create IndicatorCard Component
- Created `src/components/ui/IndicatorCard.tsx`
- Displays value with unit formatting
- Percentage change with green/red color indicator
- Last updated timestamp footer
- Dark theme panel background
- Commit: `b49aa17`

### Task 5: Create MiniChart Sparkline
- Created `src/components/charts/MiniChart.tsx`
- Sparkline style (no axes, no tooltip)
- 80px compact height
- Line color based on trend direction
- Light area fill for visual depth
- Commit: `c08544c`

### Task 6: Create CryptoPanel and Integrate
- Created `src/components/indicators/CryptoPanel.tsx`
- Side-by-side IndicatorCards for BTC/ETH
- MiniCharts for 24h sparklines
- Error and loading state handling
- Integrated into App grid layout
- Commit: `60f3704`

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

## Threat Flags

No new threat surfaces beyond plan scope.

## Success Criteria Met

1. Crypto Prices Display: BTC and ETH current prices shown in IndicatorCards
2. Mini Charts Work: 24h sparklines render with trend-based colors
3. Minute-Level Updates: 60s refetchInterval auto-refresh enabled
4. Performance Safe: Rate limiter prevents API exhaustion, TanStack Query batching
5. Error Handling: Error messages display, loading states handled

## Commits

- `3e980e3` - test(01-02): add CoinGecko types and constants
- `41b011d` - feat(01-02): implement CoinGecko API client
- `3478d88` - feat(01-02): create crypto data hooks with minute-level polling
- `b49aa17` - feat(01-02): create IndicatorCard component for price display
- `c08544c` - feat(01-02): create MiniChart sparkline component
- `60f3704` - feat(01-02): integrate crypto panel into dashboard

## Self-Check: PASSED

All files exist, TypeScript compiles, commits verified.