# Architecture Patterns

**Domain:** 金融数据实时看板
**Researched:** 2026-05-18

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React SPA Application                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │   UI Components   │◄────│   State Manager   │                │
│  │  - Dashboard      │      │  (React Context   │                │
│  │  - Chart Panels   │      │   + useReducer)  │                │
│  │  - Filters        │      └──────────────────┘                │
│  └──────────────────┘               ▲                           │
│          ▲                           │                           │
│          │                           ▼                           │
│          │              ┌──────────────────────┐               │
│          │              │   Data Aggregation    │               │
│          │              │       Layer           │               │
│          │              │  - Data Normalizer    │               │
│          │              │  - Cache Manager      │               │
│          │              │  - Rate Limit Handler │               │
│          │              └──────────────────────┘               │
│          │                           ▲                           │
│          │                           │                           │
│  ┌───────┴──────────────────────────┴───────────────┐          │
│  │              API Client Layer                     │          │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  │          │
│  │  │ FRED API   │  │ BLS API    │  │ CoinGecko  │  │          │
│  │  │ (HTTP)     │  │ (HTTP)     │  │ (WebSocket)│  │          │
│  │  └────────────┘  └────────────┘  └────────────┘  │          │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  │          │
│  │  │ 东方财富    │  │ 新浪财经    │  │ Alpha      │  │          │
│  │  │ (HTTP)     │  │ (HTTP)     │  │ Vantage    │  │          │
│  │  └────────────┘  └────────────┘  └────────────┘  │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Boundaries

### 1. UI Components Layer
**Responsibility:** 展示数据和用户交互

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Dashboard Layout | 整体布局和面板组织 | Chart Panel, Filter Bar |
| Chart Panel | 单个数据图表容器 | ECharts Instance, State Manager |
| Filter Bar | 时间范围、指标筛选 | State Manager |
| Export Dialog | 数据导出功能 | State Manager, Data Aggregation |
| Indicator Card | 指标卡片展示 | State Manager |

**关键原则:**
- UI组件只负责展示和用户事件
- 不包含数据获取逻辑
- 通过props接收数据，通过回调触发action

### 2. State Manager Layer
**Responsibility:** 全局状态管理和数据流控制

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| App Context | 全局状态容器 | All Components |
| Data Reducer | 状态更新逻辑 | Data Aggregation, UI Components |
| Selector Hooks | 派生状态计算 | UI Components |

**推荐实现:**
```typescript
// React Context + useReducer 模式
// 足够应对中小型应用，无需Redux
interface AppState {
  indicators: {
    fedRate: IndicatorData;
    employment: IndicatorData;
    crypto: CryptoData;
    // ...
  };
  filters: {
    timeRange: TimeRange;
    selectedIndicators: string[];
  };
  ui: {
    activePanel: string | null;
    loading: Record<string, boolean>;
    errors: Record<string, Error | null>;
  };
}
```

**Confidence:** HIGH - React官方推荐模式，适合此规模应用

### 3. Data Aggregation Layer
**Responsibility:** 数据规范化、缓存、限流

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Data Normalizer | 统一不同API数据格式 | API Clients, State Manager |
| Cache Manager | 本地缓存和过期管理 | API Clients |
| Rate Limit Handler | API调用频率控制 | API Clients |

**核心功能:**

#### Data Normalizer
不同API返回数据格式差异巨大，需要统一：

```typescript
interface NormalizedIndicator {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  change?: {
    value: number;
    percentage: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  };
  historical: Array<{
    timestamp: Date;
    value: number;
  }>;
}
```

#### Cache Manager
**策略:**
- 加密货币数据: 缓存1秒（实时性优先）
- 其他指标: 缓存1-5分钟（减少API调用）
- 使用 `Map<string, CacheEntry>` 简单内存缓存

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}
```

**Confidence:** HIGH - 标准缓存模式，适合本地应用

#### Rate Limit Handler
**关键考虑:**
各API有不同的限流规则：

| API | Rate Limit | Strategy |
|-----|-----------|----------|
| FRED | 无明确限制 | 每分钟最多10次请求 |
| BLS | 每小时50次 | 缓存30分钟 |
| CoinGecko WebSocket | 无限制 | 保持连接 |
| 东方财富/新浪 | 未明确 | 谨慎使用，缓存5分钟 |
| Alpha Vantage | 25次/天 | 缓存1小时 |

**实现模式:**
```typescript
class RateLimitedClient {
  private queue: Array<() => Promise<any>> = [];
  private lastCall: Record<string, number> = {};

  async call(api: string, fn: () => Promise<any>): Promise<any> {
    const now = Date.now();
    const elapsed = now - (this.lastCall[api] || 0);
    const minInterval = this.getMinInterval(api);

    if (elapsed < minInterval) {
      await this.delay(minInterval - elapsed);
    }

    this.lastCall[api] = Date.now();
    return fn();
  }
}
```

**Confidence:** MEDIUM - 限流规则基于公开文档，实际可能需要调整

### 4. API Client Layer
**Responsibility:** 与外部API通信

| Client | Purpose | Update Frequency | Protocol |
|--------|---------|------------------|----------|
| FRED Client | 美联储利率、经济数据 | 1分钟 | HTTP REST |
| BLS Client | 美国就业数据 | 1分钟 | HTTP REST |
| CoinGecko Client | 加密货币实时行情 | 1秒 | WebSocket |
| 东方财富 Client | A股指数 | 1分钟 | HTTP REST |
| 新浪财经 Client | A股/美股实时数据 | 1分钟 | HTTP REST |
| Alpha Vantage Client | 美股指数 | 1分钟 | HTTP REST |

**WebSocket实现模式:**

```typescript
// 推荐模式: 封装WebSocket连接管理
class CryptoWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    this.ws = new WebSocket('wss://api.coingecko.com/...');

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // 触发状态更新
      this.onMessage(data);
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, Math.pow(2, this.reconnectAttempts) * 1000);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.ws?.close();
    };
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
```

**React集成:**
```typescript
function useCryptoWebSocket(symbols: string[]) {
  const [data, setData] = useState<Record<string, CryptoData>>({);

  useEffect(() => {
    const ws = new CryptoWebSocket();

    ws.onMessage = (message) => {
      setData(prev => ({
        ...prev,
        [message.symbol]: normalizeCryptoData(message)
      }));
    };

    ws.connect();

    return () => ws.disconnect(); // 清理函数，防止内存泄漏
  }, [symbols.join(',')]); // symbols变化时重新连接

  return data;
}
```

**Confidence:** HIGH - React官方推荐的cleanup模式，已验证防内存泄漏

## Data Flow

```
User Interaction (Filter Change)
          │
          ▼
┌─────────────────┐
│   UI Component  │
│  (Filter Bar)   │
└────────┬────────┘
         │ dispatch({ type: 'SET_TIME_RANGE', payload: range })
         ▼
┌─────────────────┐
│ State Manager   │
│   (Reducer)     │
└────────┬────────┘
         │ 触发数据获取
         ▼
┌─────────────────┐
│   Data Agg.     │
│   Layer         │
│                 │
│ 1. Check Cache  │───────┐
│ 2. If miss:     │       │
│    fetch API    │       ▼
└────────┬────────┘  ┌──────────┐
         │           │  Cache   │
         │           │  Hit?    │
         │           └──────────┘
         │
         ▼
┌─────────────────┐
│  API Clients    │
│  (Rate Limited) │
└────────┬────────┘
         │ fetch data
         ▼
┌─────────────────┐
│  External APIs  │
│  (FRED, etc.)   │
└─────────────────┘
         │
         │ response
         ▼
┌─────────────────┐
│ Data Normalizer │
│                 │
│ Convert to      │
│ standard format │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ State Manager   │
│   (Reducer)     │
│                 │
│ Update state    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  UI Component   │
│  (Chart Panel)  │
│                 │
│ Re-render with  │
│ new data        │
└─────────────────┘
```

**实时数据流（加密货币）:**

```
CoinGecko WebSocket
         │
         │ push every second
         ▼
┌─────────────────┐
│ WebSocket Client │
│                 │
│ onMessage()     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Data Normalizer │
│                 │
│ Transform to    │
│ NormalizedData  │
└────────┬────────┘
         │
         │ dispatch({ type: 'UPDATE_CRYPTO', payload })
         ▼
┌─────────────────┐
│ State Manager   │
│   (Reducer)     │
│                 │
│ Merge with      │
│ existing data   │
└────────┬────────┘
         │
         │ state change triggers re-render
         ▼
┌─────────────────┐
│  UI Component   │
│  (Chart Panel)  │
│                 │
│ Update chart    │
│ (ECharts)       │
└─────────────────┘
```

## Patterns to Follow

### Pattern 1: Custom Hooks for Data Fetching

**What:** 封装数据获取逻辑到自定义hooks

**When:** 每种数据源一个hook

**Example:**
```typescript
// hooks/useFedRateData.ts
function useFedRateData(timeRange: TimeRange) {
  const [data, setData] = useState<FedRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let ignore = false; // 防止race condition

    async function fetchData() {
      try {
        setLoading(true);
        const result = await fredClient.getFedRate(timeRange);
        if (!ignore) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err as Error);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchData();

    // 每1分钟刷新一次
    const interval = setInterval(fetchData, 60000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [timeRange]);

  return { data, loading, error };
}
```

**Why:** React官方推荐模式，已验证的防内存泄漏模式

**Confidence:** HIGH

### Pattern 2: ECharts Integration

**What:** 在React中安全集成ECharts

**When:** 所有图表组件

**Example:**
```typescript
// components/ChartPanel.tsx
function ChartPanel({ data, title }: ChartPanelProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // 初始化图表
  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');

      // 响应窗口大小变化
      const handleResize = () => {
        chartInstance.current?.resize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chartInstance.current?.dispose(); // 清理图表实例
      };
    }
  }, []);

  // 更新数据
  useEffect(() => {
    if (chartInstance.current && data) {
      const option = buildChartOption(data);
      chartInstance.current.setOption(option);
    }
  }, [data]);

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

**Why:** ECharts不是React组件，需要手动管理生命周期

**Confidence:** HIGH - ECharts官方推荐的React集成方式

### Pattern 3: Optimistic UI Updates

**What:** 用户操作立即反映，后台同步

**When:** 筛选、时间范围变更等交互

**Example:**
```typescript
function FilterBar() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const dispatch = useAppDispatch();

  const handleChange = (newRange: TimeRange) => {
    // 立即更新UI
    setTimeRange(newRange);

    // 后台触发数据获取
    dispatch(updateTimeRange(newRange));
  };

  return (
    <Select value={timeRange} onChange={handleChange}>
      <option value="1M">1个月</option>
      <option value="3M">3个月</option>
      <option value="1Y">1年</option>
      <option value="ALL">全部</option>
    </Select>
  );
}
```

**Why:** 提升用户体验，避免等待感

**Confidence:** HIGH

## Anti-Patterns to Avoid

### Anti-Pattern 1: 直接在组件中使用fetch

**What:** 在组件内直接写fetch调用

**Why bad:**
- 无缓存机制，重复请求
- 无race condition保护
- 无错误重试
- 难以测试和维护

**Instead:** 使用自定义hooks或专门的API客户端层

```typescript
// 错误示例
function FedRateChart() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('https://api.stlouisfed.org/...')
      .then(res => res.json())
      .then(setData); // 无race condition保护，无cleanup
  }, []);

  return <div>...</div>;
}

// 正确示例
function FedRateChart() {
  const { data, loading, error } = useFedRateData('1Y');

  if (loading) return <Loading />;
  if (error) return <Error message={error.message} />;
  return <Chart data={data} />;
}
```

**Confidence:** HIGH

### Anti-Pattern 2: WebSocket连接无重连机制

**What:** 建立WebSocket连接但不处理断线重连

**Why bad:**
- 网络波动会导致连接断开
- 用户无感知，数据停止更新
- 需要刷新页面才能恢复

**Instead:** 实现指数退避重连

```typescript
// 正确示例
class ResilientWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000; // 最多等待30秒

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onclose = () => {
      const delay = Math.min(
        1000 * Math.pow(2, this.reconnectAttempts),
        this.maxReconnectDelay
      );

      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    };

    this.ws.onopen = () => {
      this.reconnectAttempts = 0; // 重置计数器
    };
  }
}
```

**Confidence:** HIGH

### Anti-Pattern 3: 忽略API Rate Limit

**What:** 频繁调用API不检查限流

**Why bad:**
- 可能被API封禁
- 浪费配额
- 用户体验差（请求失败）

**Instead:** 实现客户端限流和缓存

```typescript
// 正确示例
class RateLimitedAPIClient {
  private cache = new Map<string, CacheEntry>();
  private lastCallTime = 0;

  async fetch(url: string, ttl: number = 60000): Promise<any> {
    // 检查缓存
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // 检查rate limit
    const minInterval = 1000; // 至少间隔1秒
    const now = Date.now();
    if (now - this.lastCallTime < minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, minInterval - (now - this.lastCallTime))
      );
    }

    // 发起请求
    const response = await fetch(url);
    const data = await response.json();

    // 更新缓存
    this.cache.set(url, { data, timestamp: Date.now() });
    this.lastCallTime = Date.now();

    return data;
  }
}
```

**Confidence:** HIGH

## Scalability Considerations

| Concern | At 1 User (Local) | At 10 Indicators | At 20+ Indicators |
|---------|-------------------|------------------|-------------------|
| Memory | 轻量，浏览器原生管理 | 考虑数据量大小，可能需要分页历史数据 | 实现虚拟滚动或分页加载 |
| API Calls | 无问题 | Rate limit可能触发，需要缓存 | 优先级队列，关键指标先加载 |
| Update Frequency | 无问题 | 无问题 | 考虑降低非关键指标更新频率 |
| Chart Performance | 无问题 | 无问题 | ECharts实例数量控制，考虑懒加载 |

**本地运行无需考虑:**
- 并发用户
- 服务器负载
- 数据库优化

**需要考虑:**
- 浏览器内存限制
- API配额管理
- 图表渲染性能

## Build Order Recommendation

### Phase 1: Core Infrastructure
**构建顺序理由:** 必须先有基础设施才能构建上层功能

1. **API Client Layer** (最先)
   - 原因：所有数据依赖API
   - 可独立测试
   - 交付物：基础API客户端，Rate Limiter

2. **Data Normalizer** (次之)
   - 原因：需要API客户端工作
   - 定义统一数据格式
   - 交付物：各API的数据转换函数

3. **Cache Manager** (与Normalizer并行)
   - 原因：可与Normalizer并行开发
   - 独立模块
   - 交付物：缓存读写接口

### Phase 2: State Management
**构建顺序理由:** UI需要状态管理，但状态管理不依赖UI

4. **App Context + Reducer** (Phase 2开始)
   - 原因：定义应用状态结构
   - 可独立测试reducer逻辑
   - 交付物：Context Provider，基础reducer

5. **Data Aggregation Layer** (紧随其后)
   - 原因：连接API Client和State Manager
   - 实现数据流控制逻辑
   - 交付物：数据获取hooks

### Phase 3: UI Components
**构建顺序理由:** UI依赖数据和状态

6. **Dashboard Layout** (Phase 3开始)
   - 原因：定义整体布局
   - 简单，可快速验证
   - 交付物：响应式布局组件

7. **Chart Panel** (核心组件)
   - 原因：核心展示功能
   - 集成ECharts
   - 交付物：可复用图表组件

8. **Filter Bar** (交互组件)
   - 原因：用户交互入口
   - 触发数据更新
   - 交付物：筛选、时间范围组件

9. **Indicator Cards** (展示组件)
   - 原因：依赖数据流完整
   - 较简单
   - 交付物：指标卡片组件

### Phase 4: Advanced Features
**构建顺序理由:** 锦上添花功能

10. **Export Dialog**
    - 原因：需要完整数据流
    - CSV/Excel导出
    - 交付物：导出功能

11. **Cross-Market Comparison**
    - 原因：需要多个数据源正常工作
    - 多图表叠加
    - 交付物：对比视图组件

**依赖关系图:**
```
API Client Layer
    │
    ├─► Data Normalizer
    │       │
    │       └─► (并行) Cache Manager
    │               │
    └─► Data Aggregation Layer
            │
            └─► State Manager
                    │
                    └─► UI Components
                            │
                            └─► Advanced Features
```

## High-Frequency Update Strategy

### 分类处理策略

| Data Type | Update Frequency | Strategy | Reasoning |
|-----------|------------------|----------|-----------|
| 加密货币 | 1秒 | WebSocket | 实时性要求高，推送模式更高效 |
| 美股/美股 | 1分钟 | Polling + Cache | 分钟级更新足够，WebSocket成本高 |
| 经济指标 | 1-5分钟 | Polling + Cache | 数据更新慢，缓存减少API调用 |
| 历史数据 | On Demand | Cache优先 | 不常变化，缓存时间长 |

### 加密货币实时更新实现

```typescript
// 1秒更新一次，使用WebSocket推送
function useRealtimeCrypto(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 建立WebSocket连接
    wsRef.current = new WebSocket('wss://stream.coingecko.com/...');

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrices(prev => ({
        ...prev,
        [data.symbol]: data.price
      }));
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      // 重连逻辑
    };

    return () => {
      wsRef.current?.close();
    };
  }, [symbols.join(',')]);

  return prices;
}
```

### 其他指标轮询实现

```typescript
// 1分钟轮询一次
function usePollingIndicator<T>(
  fetchFn: () => Promise<T>,
  interval: number = 60000
) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let ignore = false;

    const poll = async () => {
      try {
        const result = await fetchFn();
        if (!ignore) {
          setData(result);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // 立即执行一次
    poll();

    // 定时执行
    const intervalId = setInterval(poll, interval);

    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, [fetchFn, interval]);

  return data;
}
```

### 性能优化技巧

1. **批量更新**
   - 多个指标同时更新时，使用React的unstable_batchedUpdates或自动批处理
   - 避免频繁的单独状态更新

2. **节流/防抖**
   - WebSocket数据节流，避免过于频繁的UI更新
   - 用户筛选操作防抖，避免频繁API调用

```typescript
// 节流：最多每100ms更新一次UI
function useThrottledCryptoData(symbols: string[]) {
  const [throttledData, setThrottledData] = useState({});
  const lastUpdate = useRef(0);

  useRealtimeCrypto(symbols, (data) => {
    const now = Date.now();
    if (now - lastUpdate.current > 100) {
      setThrottledData(data);
      lastUpdate.current = now;
    }
  });

  return throttledData;
}
```

3. **虚拟化长列表**
   - 历史数据展示时，使用虚拟滚动
   - 只渲染可见区域的图表/数据

**Confidence:** HIGH - 基于React最佳实践和官方文档

## Sources

- React官方文档 - Synchronizing with Effects: https://react.dev/learn/synchronizing-with-effects (HIGH confidence)
- MDN WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket (HIGH confidence)
- ECharts官方文档 (基于训练知识，MEDIUM confidence)
- API Rate Limiting最佳实践 (基于训练知识，MEDIUM confidence)