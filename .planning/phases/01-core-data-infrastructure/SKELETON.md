# Walking Skeleton: Economic Dashboard

**Phase:** 01-core-data-infrastructure
**Created:** 2026-05-18
**Mode:** Walking Skeleton (Phase 1, new project)

---

## Architectural Decisions

This document records architectural decisions established by the Walking Skeleton that subsequent phases will build on without renegotiating.

### 1. Project Structure

```
src/
├── api/                 # API clients (one file per source)
│   ├── fred.ts          # Federal Reserve data
│   ├── bls.ts           # Employment/Inflation data
│   ├── coingecko.ts     # Cryptocurrency prices
│   ├── alphavantage.ts  # US stock indices
│   ├── rate-limiter.ts  # Global rate limiting
│   └── types.ts         # API response types
├── components/
│   ├── charts/          # ECharts components
│   │   ├── LineChart.tsx
│   │   └── TimeSelector.tsx
│   ├── layout/          # Dashboard layout
│   │   ├── Dashboard.tsx
│   │   ├── GridPanel.tsx
│   │   └── Header.tsx
│   └── ui/              # UI primitives
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LastUpdated.tsx
│   │   └── IndicatorCard.tsx
├── hooks/               # Data fetching hooks
│   ├── useFedRate.ts
│   ├── useCrypto.ts
│   ├── useBlsData.ts
│   └── useIndices.ts
├── stores/              # Zustand stores
│   ├── dashboardStore.ts
│   └── settingsStore.ts
├── types/               # TypeScript interfaces
│   ├── indicator.ts     # NormalizedIndicator
│   ├── api.ts           # API configs
│   └── chart.ts         # Chart options
├── utils/               # Utilities
│   ├── normalize.ts     # Data normalization
│   ├── downsampling.ts  # Large data handling
│   ├── formatters.ts    # Number/date formatting
│   └── utc.ts           # UTC time handling
├── constants/           # Constants
│   ├── api.ts           # API endpoints, limits
│   ├── colors.ts        # Dark theme palette
│   └── indicators.ts    # Indicator metadata
├── App.tsx              # Root component
├── main.tsx             # Entry point
└── index.css            # Tailwind imports
```

**Decision:** Flat structure per domain, not nested by feature.
**Rationale:** Personal tool, simple mental model, easy navigation.

---

### 2. Build Tool

**Decision:** Vite 5.x with React + TypeScript template

**Rationale:**
- Fast dev server (ESM-based HMR)
- Official React recommendation (CRA deprecated)
- Built-in TypeScript support
- Native ES modules, no bundling during dev

**Configuration:**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
})
```

---

### 3. Tech Stack

| Layer | Technology | Version | Why |
|-------|------------|---------|-----|
| UI Framework | React | 18.x | Project requirement, concurrent features |
| Language | TypeScript | 5.x | Type safety, prevents runtime errors |
| Build | Vite | 5.x | Fast, modern, React team recommendation |
| Charts | ECharts + echarts-for-react | 5.x + 3.x | Financial charts need dual Y-axis, data zoom |
| State | Zustand | 4.x | Lightweight, no boilerplate |
| Data Fetching | TanStack Query | 5.x | Caching essential for API rate limits |
| HTTP Client | Axios | 1.x | Interceptors, cancellation |
| Styling | Tailwind CSS | 3.x | Dark mode built-in, utility-first |
| Icons | Lucide React | 0.x | Lightweight, consistent |
| Date Handling | date-fns | 3.x | Modular, timezone support |
| Testing | Vitest | 1.x | Vite-native, fast |

---

### 4. Data Architecture

**Core Interface:**
```typescript
// types/indicator.ts
interface NormalizedIndicator {
  id: string;                    // e.g., 'fed-rate', 'btc-price'
  name: string;                  // Display name (Chinese)
  value: number;                 // Current value
  unit: string;                  // e.g., '%', 'USD', 'index'
  timestamp: Date;               // UTC normalized
  change?: {
    value: number;
    percentage: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  };
  historical: HistoricalDataPoint[];
}

interface HistoricalDataPoint {
  timestamp: Date;               // UTC
  value: number;
}
```

**Normalization Pattern:**
All API responses transform to `NormalizedIndicator` before consumption by UI.

---

### 5. Rate Limiting Strategy

**Critical:** BLS (25/day), Alpha Vantage (25/day) quotas are extremely tight.

**Strategy:**
```typescript
// api/rate-limiter.ts
interface RateLimitConfig {
  api: string;
  maxCallsPerDay: number;
  minIntervalMs: number;
  cacheTtlMs: number;
}

const RATE_LIMITS: RateLimitConfig[] = [
  { api: 'FRED', maxCallsPerDay: 1000, minIntervalMs: 100, cacheTtlMs: 300000 },     // 5 min
  { api: 'BLS', maxCallsPerDay: 25, minIntervalMs: 3600000, cacheTtlMs: 1800000 },   // 30 min (!)
  { api: 'AlphaVantage', maxCallsPerDay: 25, minIntervalMs: 3600000, cacheTtlMs: 3600000 }, // 60 min (!)
  { api: 'CoinGecko', maxCallsPerDay: 500, minIntervalMs: 1200, cacheTtlMs: 60000 }, // 1 min
];
```

**Implementation:**
- TanStack Query staleTime === cacheTtlMs
- Prevents redundant API calls
- Log remaining quota on each call

---

### 6. Cache Strategy

**Decision:** TanStack Query in-memory cache (no IndexedDB for Phase 1)

**Configuration:**
```typescript
// App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min default
      gcTime: 30 * 60 * 1000,     // 30 min garbage collection
      retry: 2,
      refetchOnWindowFocus: false, // Don't refetch on tab switch
    },
  },
});
```

**Per-API overrides:**
- BLS: staleTime 30 min
- Alpha Vantage: staleTime 60 min
- CoinGecko: staleTime 60 sec
- FRED: staleTime 5 min

---

### 7. Chart Architecture

**Decision:** ECharts with custom dark theme, single reusable LineChart component

**Theme Colors:**
```typescript
// constants/colors.ts
export const DARK_THEME = {
  background: '#0d1117',         // Near-black, not pure black
  panel: '#161b22',              // Slightly lighter for cards
  gridLine: '#30363d',           // Subtle gray
  text: '#c9d1d9',               // Off-white
  textMuted: '#8b949e',          // Gray for secondary
  accent: ['#58a6ff', '#3fb950', '#f85149', '#d29922', '#a371f7'],
};
```

**WCAG AA Compliance:**
- All text/background combinations: 4.5:1 minimum contrast
- Chart data colors: High contrast, color-blind safe

---

### 8. React 18 Optimization

**Decision:** Use concurrent features for real-time data

**Pattern:**
```typescript
// hooks/useCrypto.ts
import { useTransition } from 'react';

const [isPending, startTransition] = useTransition();

// When crypto price updates arrive:
startTransition(() => {
  setPrices(newPrices); // Non-blocking update
});
```

**Prevents:** State update storms from WebSocket/polling freezing UI.

---

### 9. Error Handling

**Decision:** Error boundaries per data panel, not global

**Pattern:**
```typescript
// components/ui/ErrorBoundary.tsx
// Wraps each GridPanel
// Shows "Data unavailable" for that panel only
// Other panels continue functioning
```

**Graceful degradation:**
- Single API failure does NOT crash entire dashboard
- Show cached data with "stale" indicator when API fails
- Retry with exponential backoff (TanStack Query built-in)

---

### 10. File Naming Conventions

| File Type | Pattern | Example |
|-----------|---------|---------|
| API client | `[source].ts` | `fred.ts`, `bls.ts` |
| Hook | `use[Domain].ts` | `useFedRate.ts` |
| Component | `PascalCase.tsx` | `LineChart.tsx` |
| Store | `[domain]Store.ts` | `dashboardStore.ts` |
| Type | `[domain].ts` | `indicator.ts` |
| Utility | `verbNoun.ts` | `normalize.ts` |
| Constant | `noun.ts` | `colors.ts` |

---

### 11. Dependency Injection

**Decision:** No DI framework. API clients imported directly.

**Pattern:**
```typescript
// hooks/useFedRate.ts
import { fredClient } from '../api/fred';

// API clients are singleton-like modules
// Rate limiter is imported by each client
```

**Rationale:** Personal tool, simplicity over abstraction.

---

### 12. Testing Strategy

**Priority:**
1. API rate limiting works (won't exhaust quotas)
2. Cache prevents redundant calls
3. Charts render without freezing
4. Dark theme contrast validation
5. UTC timestamps display correctly

**Framework:** Vitest + @testing-library/react

**Test Location:** `__tests__/` adjacent to source files (Vite convention)

---

## Build Order (Phase 1)

1. **Walking Skeleton (Plan 01):** Fed Rate slice - establishes all architectural patterns
2. **Crypto Slice (Plan 02):** BTC/ETH real-time prices
3. **Economic Data Slice (Plan 03):** Employment + Inflation
4. **US Indices Slice (Plan 04):** Dow, Nasdaq, S&P 500
5. **Dashboard Integration (Plan 05):** Layout, grid, polish

Each slice: API client → Normalizer → Hook → Chart → Panel

---

## Phase 2 Dependencies on Skeleton

Phase 2 (Cross-Market Analysis) will extend:
- Dual Y-axis charts (extend LineChart)
- YoY/MoM calculations (extend normalize.ts)
- Data export (new utils/export.ts)
- Overlay comparison (extend Dashboard layout)

Phase 2 MUST NOT renegotiate:
- Tech stack
- Data architecture (NormalizedIndicator)
- Theme colors
- Cache/rate limiting strategy

---

*Skeleton established: 2026-05-18*
*Next: Create PLAN.md files for Phase 1*