# Phase 3: Professional Experience - Research

**Researched:** 2026-05-18
**Domain:** ECharts dataZoom, WebSocket real-time crypto, FOMC event markers
**Confidence:** MIXED (HIGH for patterns, CRITICAL ISSUE for WebSocket)

## Summary

This phase delivers professional-level chart interaction capabilities: dataZoom sliders for time-series exploration, FOMC meeting markers on Fed rate charts, and real-time cryptocurrency price updates via WebSocket.

**Primary recommendation:** Use Binance WebSocket (free) instead of CoinGecko WebSocket (paid-only). CoinGecko WebSocket requires paid subscription starting at $29/month — contradicts project constraint "no paid APIs."

**CRITICAL ISSUE:** CONTEXT.md decision D-01 specifies CoinGecko WebSocket endpoint `ws://api.coingecko.net/api/v3/ws`, but CoinGecko WebSocket is NOT available in the free Demo tier. WebSocket requires at least Analyst tier ($29/month). This contradicts the project's explicit constraint against paid APIs.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use CoinGecko WebSocket endpoint (`ws://api.coingecko.net/api/v3/ws`) for real-time crypto prices — **CONTRADICTED BY RESEARCH (see Open Questions)**
- **D-02:** WebSocket updates sync to TanStack Query cache via `setQueryData` — single data source for all components
- **D-03:** Display WebSocket connection state indicator (green/red/yellow) — user knows if data is real-time
- **D-04:** Architecture supports dynamic subscription management (future extension), but Phase 3 implements fixed BTC/ETH subscriptions
- **D-05:** Parse WebSocket JSON messages directly (no Zod validation for performance)
- **D-06:** Client-side ping heartbeat every 30 seconds to keep connection alive
- **D-07:** Use ECharts `dataZoom` type: 'slider' positioned at chart bottom
- **D-08:** Initial zoom shows all data (start: 0, end: 100) — user can zoom as needed
- **D-09:** Slider styling uses existing DARK_THEME colors (background, gridLine, text) — visual consistency
- **D-10:** Use point markers (scatter series) on Fed rate chart for FOMC meetings
- **D-11:** Tooltip shows: decision type (加息/降息/维持) + new rate value
- **D-12:** Color coding: 加息 = red (accent[2]), 降息 = green (accent[1]), 维持 = gray
- **D-13:** FOMC data source: FRED automatic detection (DFEDTARU/DFEDTARL rate change points)
- **D-14:** Historical range: show FOMC meetings from past 1 year (matches rate data range)
- **D-15:** Exponential backoff: initial 1s delay, doubles each retry, max 30s
- **D-16:** Max retry count: 5 attempts before stopping
- **D-17:** After max retries: show connection failed state with manual refresh button

### Claude's Discretion
- WebSocket implementation details (hook structure, message handler design)
- dataZoom exact styling values (height, handle size)
- FOMC marker exact positioning logic (align to rate change points)
- Connection state indicator placement (near crypto panel header)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IND-02 | 美联储决议详情展示（议息会议结果、声明摘要） | FOMC markers via scatter series on Fed rate chart; DFEDTARU/DFEDTARL for rate change detection |
| CHART-04 | 图表放大/缩小交互功能 | ECharts dataZoom slider configuration; existing LineChart pattern |
| CHART-08 | 图表数据缩放组件（dataZoom） | ECharts dataZoom type: 'slider', DARK_THEME styling |
| CHART-09 | 事件标记功能（FOMC会议等） | Scatter series overlay with tooltip; FOMC date detection algorithm |
| REAL-01 | 加密货币WebSocket实时推送（秒级更新） | **ISSUE**: CoinGecko WebSocket paid-only; Alternative: Binance WebSocket (free) |
| REAL-02 | WebSocket断线重连机制（指数退避） | Exponential backoff pattern: 1s → 30s, max 5 retries, with jitter |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| WebSocket connection management | Browser / Client | — | WebSocket runs in browser, manages connection lifecycle |
| Crypto real-time updates | Browser / Client | API / Backend (fallback) | WebSocket streams to client; REST API fallback on disconnect |
| dataZoom component | Browser / Client | — | ECharts runs in browser, UI interaction |
| FOMC marker detection | API / Backend | — | FRED API provides DFEDTARU/DFEDTARL series data |
| TanStack Query cache sync | Browser / Client | — | setQueryData updates cache, triggers re-renders |
| Connection state indicator | Browser / Client | — | UI component showing connection health |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| echarts | 5.5.1 (installed) | Chart library with dataZoom | Already installed, native dataZoom support |
| echarts-for-react | 3.0.2 (installed) | React wrapper for ECharts | Already installed, used in LineChart/MultiSeriesChart |
| @tanstack/react-query | 5.62.0 (installed) | Cache management for WebSocket updates | Already installed, setQueryData pattern |

### Supporting (WebSocket)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-use-websocket | 4.13.0 (latest) | WebSocket hook with reconnection | **Recommended** — built-in exponential backoff, connection state tracking |
| Native WebSocket API | — | Raw WebSocket implementation | Alternative: custom hook for simpler requirements |

**Installation (if using react-use-websocket):**
```bash
npm install react-use-websocket
```

**Version verification:**
- echarts: 5.5.1 (installed, latest: 6.0.0) [VERIFIED: package.json]
- echarts-for-react: 3.0.2 (installed, latest: 3.0.6) [VERIFIED: package.json]
- react-use-websocket: 4.13.0 (latest) [VERIFIED: npm view]

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CoinGecko WebSocket | Binance WebSocket | CoinGecko WebSocket requires paid tier ($29/mo), Binance is free |
| react-use-websocket | Custom WebSocket hook | react-use-websocket has built-in reconnection; custom hook more control but more code |
| Zod validation | Direct JSON.parse | Performance over safety for real-time updates (per D-05) |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser / Client                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────────────────┐ │
│  │  useCryptoWS    │───▶│  TanStack Query Cache                   │ │
│  │  (WebSocket     │    │  ['crypto-price']                       │ │
│  │   Hook)         │    │                                         │ │
│  └─────────────────┘    │  setQueryData ←── WebSocket.onmessage   │ │
│         │               └─────────────────────────────────────────┘ │
│         │                          │                                │
│         ▼                          ▼                                │
│  ┌─────────────────┐    ┌─────────────────────────────────────────┐ │
│  │ Connection      │    │  CryptoPricePanel                       │ │
│  │ State Indicator │    │  (uses useQuery)                        │ │
│  │ (green/red/yellow)│   │                                         │ │
│  └─────────────────┘    └─────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  LineChart with dataZoom                                         ││
│  │  - type: 'slider'                                                ││
│  │  - start: 0, end: 100                                            ││
│  │  - DARK_THEME styling                                            ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  FedRateChart with FOMC Markers                                  ││
│  │  - Line series (rate history)                                    ││
│  │  - Scatter series (FOMC markers) ○                               ││
│  │  - Tooltip: decision type + rate                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
         │                            │
         │ WebSocket                  │ REST API
         ▼                            ▼
┌─────────────────┐          ┌─────────────────────┐
│  Binance WS     │          │  CoinGecko REST     │
│  (free/public)  │          │  (fallback/history) │
│  btcusdt@trade  │          │                     │
│  ethusdt@trade  │          │                     │
└─────────────────┘          └─────────────────────┘
         │
         │ REST API (DFEDTARU/DFEDTARL)
         ▼
┌─────────────────┐
│  FRED API       │
│  (rate changes) │
└─────────────────┘
```

### Recommended Project Structure
```
src/
├── hooks/
│   ├── useCryptoWS.ts        # WebSocket hook (NEW)
│   ├── useCrypto.ts          # Existing REST hook (fallback)
│   └── useFedRate.ts         # Fed rate with FOMC detection (NEW or enhance)
├── components/
│   ├── charts/
│   │   ├── LineChart.tsx     # Enhance with dataZoom
│   │   ├── FedRateChart.tsx  # NEW: Fed rate + FOMC markers
│   │   └── CryptoChart.tsx   # Real-time crypto chart
│   ├── indicators/
│   │   ├── ConnectionIndicator.tsx  # NEW: WebSocket state
│   │   └── CryptoPricePanel.tsx      # Existing (add indicator)
│   └── layout/
│       └── Dashboard.tsx     # Integrate new components
├── utils/
│   ├── websocket-reconnect.ts # NEW: Exponential backoff logic
│   └── fomc-detection.ts      # NEW: Rate change detection
├── types/
│   └── websocket.ts           # NEW: WebSocket message types
└── constants/
    └── websocket.ts           # NEW: WS endpoints, retry config
```

### Pattern 1: WebSocket with TanStack Query Integration
**What:** WebSocket messages update TanStack Query cache directly via `setQueryData`
**When to use:** Real-time data that needs to coexist with REST API data in same cache
**Example:**
```typescript
// Source: [CITED: TanStack Query docs + community patterns]
import { useQueryClient } from '@tanstack/react-query';

function useCryptoWebSocket() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.p);
      
      // Update TanStack Query cache
      queryClient.setQueryData(['crypto-price'], (old: Record<string, CryptoPriceData>) => ({
        ...old,
        bitcoin: {
          price,
          timestamp: new Date(),
          change24h: old?.bitcoin?.change24h ?? 0,
        },
      }));
    };
    
    return () => ws.close();
  }, [queryClient]);
}
```

### Pattern 2: ECharts dataZoom Slider
**What:** Add dataZoom slider to existing LineChart for time-period exploration
**When to use:** All time-series charts need zoom capability
**Example:**
```typescript
// Source: [CITED: ECharts docs + WebSearch examples]
// Based on existing LineChart.tsx pattern

const option = {
  // ... existing LineChart options
  dataZoom: [
    {
      type: 'slider',
      show: true,
      xAxisIndex: 0,
      start: 0,
      end: 100,
      height: 20,
      bottom: 10,
      backgroundColor: DARK_THEME.panel,
      dataBackground: {
        lineStyle: { color: DARK_THEME.accent[0] },
        areaStyle: { color: DARK_THEME.accent[0], opacity: 0.3 }
      },
      fillerColor: 'rgba(88, 166, 255, 0.2)',
      borderColor: DARK_THEME.gridLine,
      handleStyle: {
        color: DARK_THEME.accent[0],
        borderColor: DARK_THEME.accent[0]
      },
      textStyle: { color: DARK_THEME.textMuted }
    }
  ]
};
```

### Pattern 3: FOMC Event Markers (Scatter Series Overlay)
**What:** Use scatter series to mark FOMC meeting dates with color-coded markers
**When to use:** Event markers on any time-series chart
**Example:**
```typescript
// Source: [CITED: ECharts scatter series docs + FRED DFEDTARU/DFEDTARL]
// Detect rate changes by finding points where DFEDTARU value differs from previous day

function detectFOMCMeetings(historical: HistoricalDataPoint[]): FOMCEvent[] {
  const events: FOMCEvent[] = [];
  
  for (let i = 1; i < historical.length; i++) {
    const prev = historical[i - 1].value;
    const curr = historical[i].value;
    
    if (prev !== null && curr !== null && prev !== curr) {
      const decision = curr > prev ? '加息' : curr < prev ? '降息' : '维持';
      events.push({
        timestamp: historical[i].timestamp,
        rate: curr,
        decision,
        color: decision === '加息' ? DARK_THEME.accent[2] : 
               decision === '降息' ? DARK_THEME.accent[1] : 
               DARK_THEME.textMuted
      });
    }
  }
  
  return events;
}

// Chart series configuration
const series = [
  // Main line series (rate history)
  {
    type: 'line',
    data: rateData.historical.map(d => d.value),
    // ... existing line config
  },
  // FOMC markers overlay
  {
    type: 'scatter',
    data: fomcEvents.map(e => ({
      value: [formatDate(e.timestamp), e.rate],
      itemStyle: { color: e.color },
      symbol: 'circle',
      symbolSize: 10
    })),
    tooltip: {
      formatter: (params: any) => `${params.name}<br/>${e.decision}: ${e.rate}%`
    }
  }
];
```

### Anti-Patterns to Avoid
- **Don't use CoinGecko WebSocket endpoint directly:** It requires paid subscription; use Binance or polling fallback
- **Don't create separate WebSocket state store:** Use TanStack Query cache as single data source (per D-02)
- **Don't forget jitter in exponential backoff:** Without jitter, many clients reconnect simultaneously causing thundering herd
- **Don't use dataZoom type: 'inside' only:** Users need visible slider for precise control (per D-07)
- **Don't use 0 for missing data:** Use null for gaps in historical data (existing pattern)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket reconnection logic | Custom reconnect loop | react-use-websocket or established pattern | Built-in exponential backoff, connection state, cleanup |
| dataZoom styling | Custom slider component | ECharts native dataZoom | Native feature, battle-tested, handles edge cases |
| FOMC date detection | External FOMC calendar API | FRED DFEDTARU/DFEDTARL rate change detection | Free, automatic, matches rate data timestamps |
| WebSocket message parsing | Zod schema validation | Direct JSON.parse | Performance critical for 1-second updates (per D-05) |

**Key insight:** WebSocket reconnection is deceptively complex — proper exponential backoff with jitter, cleanup on unmount, connection state tracking, and heartbeat handling are all needed. Libraries like `react-use-websocket` handle these correctly.

## Common Pitfalls

### Pitfall 1: WebSocket Connection Without Cleanup
**What goes wrong:** WebSocket continues after component unmounts, memory leak, multiple connections
**Why it happens:** Forgetting cleanup in useEffect
**How to avoid:** Always return cleanup function in useEffect
**Warning signs:** Multiple console.log messages, network tab shows duplicate connections
```typescript
useEffect(() => {
  const ws = new WebSocket(url);
  // ... setup
  
  return () => ws.close(); // CRITICAL
}, [url]);
```

### Pitfall 2: Thundering Herd on Reconnection
**What goes wrong:** All clients reconnect simultaneously after outage, overwhelming server
**Why it happens:** Pure exponential backoff without jitter — all clients have same delay schedule
**How to avoid:** Add random jitter to backoff delay
```typescript
const getDelayWithJitter = (attempt: number) => {
  const baseDelay = 1000;
  const maxDelay = 30000;
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  return delay + Math.random() * 1000; // Add jitter
};
```

### Pitfall 3: TanStack Query Race Conditions
**What goes wrong:** Stale updates overwrite newer data when WebSocket messages arrive in rapid succession
**Why it happens:** Non-functional setQueryData updates
**How to avoid:** Use functional update form that receives previous state
```typescript
queryClient.setQueryData(['crypto-price'], (old) => ({
  ...old,
  bitcoin: { ...old?.bitcoin, price: newPrice }
}));
```

### Pitfall 4: dataZoom Performance on Large Datasets
**What goes wrong:** Chart freezes when zooming on datasets >1000 points
**Why it happens:** ECharts renders all points even when zoomed
**How to avoid:** Use `filterMode: 'filter'` (default) which removes out-of-range points from rendering
```typescript
dataZoom: [{
  type: 'slider',
  filterMode: 'filter', // Only render visible points
  // ...
}]
```

### Pitfall 5: FOMC Markers Misaligned with Rate Data
**What goes wrong:** FOMC markers appear at wrong dates or wrong rate values
**Why it happens:** Timestamp alignment between DFEDTARU series and effective rate (FEDFUNDS) series
**How to avoid:** Use same series (DFEDTARU or DFEDTARL) for both line and markers, or align timestamps via existing `alignTimestamps` utility

## Code Examples

### WebSocket Hook with Exponential Backoff
```typescript
// Source: [CITED: WebSearch - react-use-websocket docs, Ably blog]

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketState {
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
  retryCount: number;
}

export function useCryptoWebSocket() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<WebSocketState>({ status: 'connecting', retryCount: 0 });
  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);

  const connect = () => {
    setState({ status: 'connecting', retryCount: state.retryCount });
    
    // Use Binance WebSocket (free)
    wsRef.current = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
    
    wsRef.current.onopen = () => {
      setState({ status: 'connected', retryCount: 0 });
      // Start heartbeat (per D-06)
      heartbeatRef.current = setInterval(() => {
        wsRef.current?.send('ping');
      }, 30000);
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.p);
      
      queryClient.setQueryData(['crypto-price'], (old: any) => ({
        ...old,
        bitcoin: { price, timestamp: new Date(), change24h: old?.bitcoin?.change24h ?? 0 }
      }));
    };
    
    wsRef.current.onclose = () => {
      clearInterval(heartbeatRef.current!);
      
      // Exponential backoff (per D-15, D-16)
      if (state.retryCount < 5) {
        const delay = Math.min(1000 * Math.pow(2, state.retryCount), 30000);
        const delayWithJitter = delay + Math.random() * 1000;
        
        retryTimeoutRef.current = setTimeout(() => {
          setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
          connect();
        }, delayWithJitter);
      } else {
        setState({ status: 'failed', retryCount: 5 }); // per D-17
      }
    };
  };

  useEffect(() => {
    connect();
    
    return () => {
      wsRef.current?.close();
      clearTimeout(retryTimeoutRef.current!);
      clearInterval(heartbeatRef.current!);
    };
  }, []);

  return state;
}
```

### Connection State Indicator
```typescript
// Source: [ASSUMED] - Based on existing DARK_THEME and UI patterns

import { DARK_THEME } from '../constants/colors';

interface ConnectionIndicatorProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
}

export function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  const colorMap = {
    connecting: DARK_THEME.warning,    // Yellow
    connected: DARK_THEME.success,     // Green
    disconnected: DARK_THEME.warning,  // Yellow
    failed: DARK_THEME.error,          // Red
  };

  const labelMap = {
    connecting: '连接中...',
    connected: '实时',
    disconnected: '断开',
    failed: '连接失败',
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div 
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: colorMap[status] }}
      />
      <span style={{ color: DARK_THEME.textMuted }}>{labelMap[status]}</span>
    </div>
  );
}
```

### FOMC Detection Utility
```typescript
// Source: [CITED: FRED DFEDTARU/DFEDTARL series, WebSearch]

import { HistoricalDataPoint } from '../types/indicator';
import { DARK_THEME } from '../constants/colors';

interface FOMCEvent {
  timestamp: Date;
  rate: number;
  decision: '加息' | '降息' | '维持';
  color: string;
}

export function detectFOMCMeetings(historical: HistoricalDataPoint[]): FOMCEvent[] {
  const events: FOMCEvent[] = [];
  
  for (let i = 1; i < historical.length; i++) {
    const prev = historical[i - 1].value;
    const curr = historical[i].value;
    
    // Only mark actual rate changes
    if (prev !== null && curr !== null && prev !== curr) {
      const decision: '加息' | '降息' | '维持' = 
        curr > prev ? '加息' : curr < prev ? '降息' : '维持';
      
      events.push({
        timestamp: historical[i].timestamp,
        rate: curr,
        decision,
        color: decision === '加息' ? DARK_THEME.accent[2] : 
               decision === '降息' ? DARK_THEME.accent[1] : 
               DARK_THEME.textMuted
      });
    }
  }
  
  // Filter to past 1 year (per D-14)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  return events.filter(e => e.timestamp >= oneYearAgo);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| REST polling for crypto | WebSocket streaming | Standard in crypto dashboards | Sub-second latency vs 60s polling |
| Pure exponential backoff | Exponential backoff + jitter | Modern best practice (2020+) | Prevents thundering herd on reconnect |
| External event calendar APIs | FRED rate series detection | This project | Free, automatic alignment with rate data |

**Deprecated/outdated:**
- CoinGecko WebSocket in Demo tier: Not available, requires paid subscription
- `reconnecting-websocket` library: Use `react-use-websocket` instead (React-specific, better hooks)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CoinGecko WebSocket endpoint is accessible in free tier | CONTEXT.md D-01 | **CRITICAL — contradicted by research: WebSocket requires paid tier** |
| A2 | Binance WebSocket `btcusdt@trade` stream provides price field `p` | WebSocket examples | MEDIUM — need to verify exact message structure in implementation |
| A3 | DFEDTARU/DFEDTARL changes occur exactly on FOMC meeting dates | FOMC Detection | LOW — FRED data is authoritative |
| A4 | react-use-websocket supports custom reconnection logic | Standard Stack | LOW — npm docs show configurable retry algorithms |

## Open Questions

### CRITICAL: WebSocket Provider Decision
**D-01 specifies CoinGecko WebSocket, but research shows it's NOT available in free tier.**

- **What we know:** CoinGecko WebSocket requires paid subscription ($29/month minimum)
- **What's unclear:** Should we use Binance WebSocket (free) instead, or keep polling at 60s interval?
- **Recommendation:** 
  - Option A: Use Binance WebSocket `wss://stream.binance.com:9443/ws/btcusdt@trade` and `ethusdt@trade` (FREE)
  - Option B: Keep existing 60s REST polling (no WebSocket complexity)
  - Option C: User upgrades to CoinGecko paid tier (violates "no paid APIs" constraint)
  
**Planner MUST resolve this before implementation. User confirmation required.**

1. **Binance WebSocket Message Format**
   - What we know: `@trade` stream exists, price field exists
   - What's unclear: Exact JSON structure for `btcusdt@trade` and `ethusdt@trade`
   - Recommendation: Fetch real message via test connection in Wave 0

2. **dataZoom Height and Handle Size**
   - What we know: DARK_THEME colors exist
   - What's unclear: Exact pixel values for slider height, handle size
   - Recommendation: Start with height: 20, handleSize: 10 (common defaults), adjust in testing

3. **FOMC Detection with DFEDTARU vs FEDFUNDS**
   - What we know: DFEDTARU shows target rate upper bound changes
   - What's unclear: Should markers align to DFEDTARU or FEDFUNDS (effective rate) series?
   - Recommendation: Use DFEDTARU for markers (rate decisions are target changes)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| WebSocket API | Binance real-time | ✓ (browser) | — | REST polling |
| react-use-websocket | WebSocket hook | ✗ (not installed) | — | Custom hook |
| FRED API | FOMC detection | ✓ | configured | — |
| ECharts | dataZoom | ✓ | 5.5.1 | — |

**Missing dependencies with no fallback:**
- None blocking

**Missing dependencies with fallback:**
- `react-use-websocket`: Can implement custom WebSocket hook with exponential backoff (more code but functional)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Direct JSON.parse (per D-05 — performance over validation for real-time) |
| V6 Cryptography | no | No secrets in WebSocket (Binance public streams) |

### Known Threat Patterns for WebSocket

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| WebSocket message injection | Tampering | Validate message structure before setQueryData |
| Connection exhaustion | Denial of Service | Exponential backoff, max retry limit (per D-16) |
| Memory leak (no cleanup) | — | useEffect cleanup function |

## Sources

### Primary (HIGH confidence)
- FRED DFEDTARU/DFEDTARL documentation — [CITED: fred.stlouisfed.org]
- ECharts documentation structure — [CITED: echarts.apache.org]
- TanStack Query setQueryData pattern — [CITED: tanstack.com/query]

### Secondary (MEDIUM confidence)
- CoinGecko WebSocket pricing tier — [VERIFIED: docs.coingecko.com, WebFetch]
- Binance WebSocket public streams — [VERIFIED: WebSearch multiple sources]
- react-use-websocket npm — [VERIFIED: npm view]

### Tertiary (LOW confidence)
- Exact Binance message JSON format — [WebSearch only, needs verification]
- dataZoom slider pixel defaults — [WebSearch examples, not official docs]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — echarts/echarts-for-react already installed, react-use-websocket verified
- Architecture: HIGH — TanStack Query + WebSocket pattern well documented
- WebSocket provider: LOW — **CRITICAL ISSUE** CoinGecko WebSocket contradicts free tier constraint
- Pitfalls: HIGH — WebSocket reconnection patterns well documented in community

**Research date:** 2026-05-18
**Valid until:** 7 days (WebSocket APIs may change)

---

## RESEARCH COMPLETE

**Phase:** 3 - Professional Experience
**Confidence:** MIXED

### Key Findings
1. **CRITICAL ISSUE**: CoinGecko WebSocket NOT available in free tier — contradicts CONTEXT.md D-01
2. Binance WebSocket is FREE alternative for BTC/ETH real-time prices
3. ECharts dataZoom slider configuration straightforward with DARK_THEME
4. FOMC markers can be detected via FRED DFEDTARU/DFEDTARL rate change points
5. WebSocket reconnection needs exponential backoff + jitter to avoid thundering herd

### File Created
`.planning/phases/03-professional-experience/03-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | echarts already installed, react-use-websocket well documented |
| Architecture | HIGH | TanStack Query + WebSocket pattern established |
| WebSocket Provider | LOW | **CRITICAL** — CoinGecko WebSocket requires paid tier, D-01 contradicts |
| Pitfalls | HIGH | WebSocket reconnection patterns documented in Ably, Pusher blogs |

### Open Questions
- **CRITICAL**: WebSocket provider decision — Binance (free) vs CoinGecko (paid) vs polling fallback
- Binance exact message format needs Wave 0 verification
- FOMC marker alignment with DFEDTARU vs FEDFUNDS

### Ready for Planning
Research complete but **CRITICAL ISSUE** requires user confirmation before planning can proceed. Planner must resolve WebSocket provider choice.

**Sources:**
- [CoinGecko API Pricing](https://www.coingecko.com/en/api/pricing)
- [CoinGecko Plan Details](https://docs.coingecko.com/reference/plan-details)
- [Binance WebSocket Streams](https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams)
- [FRED DFEDTARU](https://fred.stlouisfed.org/series/DFEDTARU)
- [ECharts Documentation](https://echarts.apache.org/en/option.html)
- [react-use-websocket](https://www.npmjs.com/package/react-use-websocket)
- [TanStack Query](https://tanstack.com/query)