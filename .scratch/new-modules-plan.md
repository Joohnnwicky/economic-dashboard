# 新增模块实现计划（9 模块 + 2 UX）

> 用户要求:除"新闻聚合 Ticker"外,前述检索到的所有模块都实现。
> 分 4 个阶段交付,每阶段结束可独立 review/停止。所有改动遵循现有 Dell 1996 设计语言与 6 步面板注册链路。

## 架构关键事实（已核实）

- 后端 FRED 代理是**通用的**: `backend/services/fred_service.py::fetch_fred_series(series_id, …)` 接受任意 series_id,按 `series_id_起止日期` 缓存,**无白名单**。→ FRED 类新模块**无需改后端**。
- 面板注册 6 步: `constants/api.ts` → `api/[src].ts` → `hooks/use[X].ts` → `components/indicators/[X]Panel.tsx` → `constants/layoutConfig.ts` → `components/layout/Dashboard.tsx` 的 COMPONENT_MAP。
- 多源聚合后端模板: `crypto_signals_service.py`(asyncio.gather + 单点失败 None + TTL 缓存)。
- 配色: 图表用 `DARK_THEME.accent[]`,涨跌用 `positive/negative`。

---

## Phase A — FRED 系列（零后端改动,最快见效）

复用现有 FRED 通用端点 `/fred/series/observations`,仅加前端(api.ts 常量 + api 函数 + hook + panel + 注册)。

### A1. VIX 恐慌指数
- FRED series: `VIXCLS`(日频,收盘)
- 面板: IndicatorCard(当前值)+ MiniChart(1Y)+ 解读带(<20 平静 / 20-30 警惕 / >30 恐慌)
- 新增: `FRED_VIX_SERIES='VIXCLS'` 常量, `api/vix.ts`, `hooks/useVix.ts`, `components/indicators/VixPanel.tsx`

### A2. 初请失业金(周度)
- FRED series: `ICSA`(周频,千人)
- 面板: IndicatorCard(最新值)+ 4 周移动平均线(行业惯例平滑)+ MiniChart
- 新增: `FRED_INITIAL_CLAIMS_SERIES='ICSA'`, `api/initial-claims.ts`, `hooks/useInitialClaims.ts`, `InitialClaimsPanel.tsx`

### A3. 美股 ISM PMI + 密歇根消费者信心(合并一面板)
- FRED series: `NAPM`(ISM 制造业 PMI,月频) + `UMSCONF`(密歇根消费者信心,月频)
- 面板: 仿 InflationSubMetrics 双子指标卡;PMI 以 50 为荣枯线着色,信心指数显示绝对值+趋势
- 新增: `FRED_US_LEADING_SERIES={NAPM,UMSCONF}`, `api/us-leading.ts`, `hooks/useUSLeadingIndicators.ts`, `USLeadingIndicatorsPanel.tsx`
- 验证: 实现时先确认 `NAPM`/`UMSCONF` 未被 FRED 下架;若下架换备用 series

### A4. 收益率利差历史时序图(深化现有 TreasuryPanel)
- FRED series: `T10Y2Y`(10Y-2Y 利差,日频,FRED 预计算)+ `USREC`(NBER 衰退标志,月频 0/1)
- 改动: 在 `TreasuryPanel` 增加一段历史利差时序图,用 `USREC=1` 区间做衰退期灰色阴影背景(经典衰退预警图)
- 复用 `MultiSeriesChart` 或 `MiniChart`;新增 `hooks/useYieldSpreadHistory.ts`

**Phase A 验证:** `npm run dev` 起 4 个新面板数据加载正常,`npm run test:run` 不破现有测试。

---

## Phase B — 加密扩展(后端新增免费无 key 数据源)

### B1. BTC Dominance + 山寨季指标
- 数据源: CoinGecko `/global`(免费无 key,返回 BTC/ETH 市占率) + 山寨季指数(前 50 山寨 90 日表现 vs BTC,>75=山寨季)
- 后端: 新增 `backend/api/market_dominance.py` + `services/market_dominance_service.py`(CoinGecko,1h 缓存,仿 crypto_signals 模板);`main.py` 注册路由
- 前端: `api/market-dominance.ts`, `hooks/useMarketDominance.ts`, `MarketDominancePanel.tsx`(环形图 BTC/ETH/其他 + 山寨季指数仪表)

### B2. BTC 链上数据
- 数据源: mempool.space(免费无 key)— `/v1/mining/hashrate`(算力+难度)、`/v1/fees/recommended`(手续费 sat/vB)、`/v1/difficulty-adjustment`(下次难度调整倒计时)
- **范围裁剪:** 仅做算力/难度/手续费/难度调整倒计时。**不含巨鲸追踪**(免费源不可靠,需付费 Whale Alert;若后续需要再议)
- 后端: 新增 `backend/api/onchain.py` + `services/onchain_service.py`(1h 缓存);`main.py` 注册路由
- 前端: `api/onchain.ts`, `hooks/useOnchain.ts`, `OnchainPanel.tsx`

**Phase B 验证:** 后端新路由 curl 返回 200 + 缓存命中;面板渲染算力趋势/手续费。

---

## Phase C — 概率/日历(需新数据源,有降级方案)

### C1. CME FedWatch 降息概率 + FOMC 倒计时
- 数据源: 尝试抓 CME FedWatch 公开端点(后端 httpx 抓取,1h 缓存,仿 MacroDashboard)
- **降级:** 若 CME 端点被墙/结构变动 → 退化为"FOMC 会议日历 + 倒计时"(会议日程公开,后端硬编码未来 12 个月 FOMC 日期),无概率热力图
- 后端: `backend/api/fedwatch.py` + `services/fedwatch_service.py`;`main.py` 注册
- 前端: `api/fedwatch.ts`, `hooks/useFedWatch.ts`, `FedWatchPanel.tsx`(下次会议倒计时 + 降息概率热力图/或仅日历)

### C2. 经济日历
- 数据源: **可选 Finnhub 免费版** `/calendar/economic`(需 `FINNHUB_API_KEY`,免费注册,返回 CPI/NFP/FOMC 的 actual/estimate/previous)
- **降级:** 若未配置 `FINNHUB_API_KEY` → 退化为"重大数据发布日程"(CPI/NFP/FOMC 的已知发布规律 + FOMC 硬编码日程 + 倒计时),无 actual/forecast 数值
- 后端: `backend/api/economic_calendar.py` + `services/economic_calendar_service.py`(检测 FINNHUB_API_KEY 是否存在,分支返回);`main.py` 注册
- 前端: `api/economic-calendar.ts`, `hooks/useEconomicCalendar.ts`, `EconomicCalendarPanel.tsx`(发布时间表 + 倒计时 + 前值/预期/实际)

> **需用户决定:** 是否注册 Finnhub 免费 key 以启用完整经济日历?不注册则用降级版。可在 Phase C 开始时确认;默认先做降级版保证可用。

**Phase C 验证:** 后端路由在无 key 时返回降级数据(不报错),有 key 时返回完整数据。

---

## Phase D — 复合指标 + UX(纯前端)

### D1. 市场机制识别(Market Regime)
- **纯前端计算,无新 API。** 组合现有/新增数据: VIX(A1)+ 10Y-2Y 利差(A4)+ 美股指数趋势(现有)+ BTC 趋势(现有)
- 规则引擎(非完整 HMM,避免训练复杂度):
  - 低 VIX(<20)+ 利差正常 + 指数上行 → "Risk-On 低波动趋势"
  - 高 VIX(>25)+ 指数下行 → "Risk-Off 避险"
  - 利差倒挂(已检测)→ "衰退预警"叠加
  - VIX>30 + 倒挂 → "危机模式"
- 前端: `utils/marketRegime.ts`(纯函数+单测), `components/indicators/MarketRegimePanel.tsx`(当前状态徽章 + 各贡献信号 + 历史状态时间线)
- 验证: `utils/__tests__/marketRegime.test.ts` 覆盖各 regime 分支

### D2. 卡片内联 Sparkline(UX)
- 扩展 `IndicatorCard`: 可选传入 `historical` 渲染微型趋势线(复用 ECharts mini line,高度 ~24px)
- 让 Phase A 的 FRED 面板(VIX/初请/PMI)卡片自带 sparkline
- 不破坏现有 IndicatorCard 调用(新 prop 可选)

### D3. 键盘热键(UX)
- `hooks/useKeyboardNav.ts`: Alt+1..9 滚动聚焦到对应面板;`/` 聚焦搜索(若 FilterBar 有搜索)
- 在 Header 加一行小字提示快捷键
- 不改变现有交互,仅增强

**Phase D 验证:** 单测通过;sparkline 在 FRED 面板显示;热键功能手动验证。

---

## 实施顺序与交付节奏

1. **Phase A**(4 模块,零后端风险)→ 交付 review
2. **Phase B**(2 模块,免费新数据源)→ 交付 review
3. **Phase C**(2 模块,需确认数据源策略)→ 交付 review
4. **Phase D**(1 模块 + 2 UX)→ 收尾

每个 Phase 结束: 起 dev 验证面板加载 + 跑 `npm run test:run` + 提交。新面板加入 `NEW_PANELS` 集合(Dashboard.tsx)显示黄色 NEW! 贴纸,与现有惯例一致。

## 不做的事
- 新闻聚合 Ticker(用户明确不要)
- 巨鲸追踪(免费源不可靠,Phase B 已说明裁剪)
- 完整 HMM 训练(D1 用规则引擎替代,避免引入 sklearn 依赖与训练数据)
