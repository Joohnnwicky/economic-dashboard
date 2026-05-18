# Technology Stack

**Project:** 全球经济指标看板
**Researched:** 2026-05-18
**Confidence:** MEDIUM

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 18.x | UI framework | Project requirement; mature ecosystem, component-based architecture suits dashboard layout |
| TypeScript | 5.x | Type safety | Project requirement; prevents runtime errors in data transformations, improves maintainability |
| Vite | 5.x | Build tool | Fast dev server, optimized production builds; better DX than Create React App |

### Data Visualization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ECharts | 5.x | Charting library | Best financial chart support (candlestick, data zoom, dual Y-axis); Apache project, actively maintained; better for cross-market overlays than Recharts |
| echarts-for-react | 3.x | React wrapper | Simplifies ECharts integration; official wrapper, good TypeScript support |

**Alternative Considered:** Recharts - Simpler API, React-native, but lacks advanced financial features (candlestick, brush zoom). Better for simple line charts, insufficient for this project's overlay requirements.

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 4.x | Global state | Lightweight (1KB), no boilerplate; sufficient for dashboard state (selected indicators, time range, theme) |

**Alternative Considered:** Redux Toolkit - Overkill for personal tool; more boilerplate than needed.

### Data Fetching

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TanStack Query (React Query) | 5.x | Server state | Automatic caching, background refetch, deduplication; essential for multiple API sources with different refresh rates |
| Axios | 1.x | HTTP client | Request/response interceptors for error handling; cancellation support for component unmount |

### Data Processing

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|------------|
| date-fns | 3.x | Date manipulation | Time range calculations, timezone handling for global markets |
| decimal.js | 1.x | Precise arithmetic | Financial calculations (YoY, MoM percentages); avoids floating-point errors |

### Data Export

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|------------|
| Papa Parse | 5.x | CSV export | Data export feature (Phase 2) |
| xlsx (SheetJS) | 0.18.x | Excel export | Data export feature (Phase 2) |

### UI Components

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 3.x | Styling | Utility-first; fast prototyping; dark mode built-in; no custom CSS needed for terminal aesthetic |
| Lucide React | 0.x | Icons | Lightweight icon set; consistent styling |
| Radix UI (optional) | 1.x | Primitive components | Accessible dropdowns, dialogs, tooltips if needed |

### Development Tools

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ESLint | 8.x | Linting | Code quality, TypeScript-specific rules |
| Prettier | 3.x | Formatting | Consistent code style |
| Vitest | 1.x | Unit testing | Fast, Vite-native; component and utility testing |

---

## Data Sources (Free Public APIs)

### US Economic Data

| Source | Data | Rate Limit | Endpoint | Notes |
|--------|------|------------|----------|-------|
| FRED (Federal Reserve Economic Data) | Fed funds rate, PCE, economic indicators | Generous (no hard limit for personal use) | REST API with API key | Primary source for US economic data; excellent historical depth |
| BLS (Bureau of Labor Statistics) | Employment data, CPI | 25 requests/day (free tier) | REST API with API key | Rate limited; cache aggressively; primary for employment/inflation |

### Cryptocurrency Data

| Source | Data | Rate Limit | Endpoint | Notes |
|--------|------|------------|----------|-------|
| CoinGecko | BTC, ETH prices, market data | 10-50 calls/minute (free tier) | REST API, no key required | No API key needed; WebSocket available for real-time |

### US Stock Indices

| Source | Data | Rate Limit | Endpoint | Notes |
|--------|------|------------|----------|-------|
| Alpha Vantage | Dow, NASDAQ, S&P 500 | 5 calls/minute, 500/day (free) | REST API with API key | Strict limits; use sparingly; cache for 15+ minutes |

### Chinese Market Data

| Source | Data | Rate Limit | Endpoint | Notes |
|--------|------|------------|----------|-------|
| East Money (东方财富) | A-share indices, China rates | Unofficial, may change | Web scraping or unofficial API | Reliability uncertain; need fallback |
| Sina Finance (新浪财经) | A-share indices | Unofficial | Web scraping or unofficial API | Alternative to East Money |

**Risk:** Chinese data sources are unofficial and may break. Consider multiple fallbacks.

---

## Installation

```bash
# Core
npm create vite@latest economic-dashboard -- --template react-ts
cd economic-dashboard
npm install

# Data visualization
npm install echarts echarts-for-react

# State management
npm install zustand

# Data fetching
npm install @tanstack/react-query axios

# Data processing
npm install date-fns decimal.js

# Data export (Phase 2)
npm install papaparse xlsx

# UI
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react

# Dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

---

## Project Structure

```
economic-dashboard/
├── src/
│   ├── api/                 # API clients for each data source
│   │   ├── fred.ts          # Fed rates, PCE
│   │   ├── bls.ts           # Employment, CPI
│   │   ├── coingecko.ts     # Crypto prices
│   │   ├── alphavantage.ts  # US stock indices
│   │   └── chinese.ts       # A-shares, China rates
│   ├── components/
│   │   ├── charts/          # Chart components
│   │   ├── layout/          # Dashboard layout
│   │   └── ui/              # Buttons, selectors, etc.
│   ├── hooks/               # Custom hooks for data fetching
│   ├── stores/              # Zustand stores
│   ├── types/               # TypeScript interfaces
│   ├── utils/               # Date, calculation utilities
│   └── constants/           # API keys, endpoints, colors
├── .env                     # API keys (not committed)
└── package.json
```

---

## Architecture Decisions

### Decision 1: ECharts over Recharts

**Context:** Need financial chart features (candlestick, dual Y-axis, data zoom, brush selection)

**Options:**
- **ECharts:** Comprehensive financial chart support, data zoom, dual axis, actively maintained by Apache
- **Recharts:** Simpler API, React-native, but lacks candlestick, limited zoom/pan

**Decision:** ECharts via echarts-for-react

**Rationale:**
- Cross-market overlay requires dual Y-axis (Fed rate 0-5% vs BTC $20K-$70K)
- Time range selection needs data zoom feature
- Financial terminal aesthetic requires candlestick option (crypto)
- Larger feature set justifies steeper learning curve

**Trade-off:** Larger bundle size (~300KB gzipped vs ~50KB for Recharts), but acceptable for desktop-only app.

### Decision 2: TanStack Query over useEffect + fetch

**Context:** Managing multiple API sources with different refresh rates and caching needs

**Decision:** TanStack Query

**Rationale:**
- Automatic caching prevents redundant API calls (rate limit protection)
- Background refetch keeps data fresh without manual polling
- Stale-while-revalidate pattern matches dashboard UX
- Built-in loading/error states simplify UI

### Decision 3: Zustand over Redux

**Context:** Global state for selected indicators, time range, theme

**Decision:** Zustand

**Rationale:**
- Personal tool with simple state needs
- No complex state logic requiring Redux middleware
- Minimal boilerplate, TypeScript-friendly
- ~1KB vs ~40KB for Redux Toolkit

### Decision 4: Vite over Create React App

**Context:** Build tool selection

**Decision:** Vite

**Rationale:**
- Faster dev server (ESM-based HMR)
- Smaller production builds
- Officially recommended by React team
- Create React App is deprecated

---

## Performance Considerations

| Concern | Mitigation |
|---------|------------|
| API rate limits | TanStack Query caching; 15-minute stale time for economic data; 1-minute for indices; 10-second for crypto |
| Large bundle (ECharts) | Code-split chart components; lazy load less-used indicators |
| Multiple API calls | Parallel fetching with Promise.all; sequential only for dependencies |
| Chart rendering | Limit data points per chart (e.g., 1 year of daily data = 365 points); aggregate longer ranges |
| Memory usage | Dispose chart instances on component unmount; clear old data from cache |

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| API keys | Store in .env file; never commit to git; use Vite env prefix (VITE_API_KEY) |
| XSS from data | Sanitize any user-provided input (not applicable for read-only dashboard) |
| CORS errors | Use proxy in Vite config for APIs without CORS support |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Chart Library | ECharts | Recharts | Lacks financial features (candlestick, dual Y-axis) |
| State Management | Zustand | Redux Toolkit | Overkill for personal tool |
| CSS Framework | Tailwind | Styled Components | Utility-first faster for dashboard; dark mode built-in |
| Data Fetching | TanStack Query | SWR | TanStack Query has better TypeScript support, more features |
| Date Library | date-fns | moment.js | moment.js is deprecated; date-fns is modular, smaller |
| Crypto API | CoinGecko | Binance API | CoinGecko requires no API key; sufficient for price data |
| US Indices | Alpha Vantage | Yahoo Finance API | Yahoo Finance unofficial, may break; Alpha Vantage has official API |

---

## Sources

**Confidence Level:** MEDIUM

- Project requirements from PROJECT.md (HIGH confidence - project-defined)
- ECharts documentation (not verified via Context7 due to tool access restrictions)
- React ecosystem knowledge (MEDIUM confidence - training data, may be outdated)
- API documentation (not verified; rate limits and endpoints from training data)

**Recommended Verification:**
- ECharts React integration: https://github.com/hustcc/echarts-for-react
- ECharts financial charts: https://echarts.apache.org/examples/en/index.html#chart-type-candlestick
- TanStack Query: https://tanstack.com/query/latest
- FRED API: https://fred.stlouisfed.org/docs/api/fred/
- BLS API: https://www.bls.gov/developers/
- CoinGecko API: https://www.coingecko.com/api/documentation