# Requirements: 全球经济指标看板

**Defined:** 2026-05-18
**Core Value:** 实时、全面、直观地展示全球经济核心指标及其联动关系，帮助快速把握宏观经济态势和市场动�?
---

## v1 Requirements

### API基础设施

- [ ] **API-01**: FRED API客户端实现（美联储利率数据获取）
- [x] **API-02**: BLS API客户端实现（美国就业数据获取�?- [ ] **API-03**: CoinGecko API客户端实现（加密货币价格获取�?- [ ] **API-04**: Alpha Vantage API客户端实现（美股指数获取�?- [ ] **API-05**: 东方财富/新浪财经数据源集成（A股指数获取）
- [ ] **API-06**: 中国央行利率数据源集�?- [ ] **API-07**: API限流机制实现（防止配额耗尽�?- [ ] **API-08**: 数据缓存层实现（TanStack Query配置�?
### 数据处理

- [ ] **DATA-01**: 统一数据格式规范化层（NormalizedIndicator接口�?- [ ] **DATA-02**: UTC时间标准化处�?- [ ] **DATA-03**: 同比（YoY）自动计算功�?- [ ] **DATA-04**: 环比（MoM）自动计算功�?- [ ] **DATA-05**: 历史数据降采样策略（防止大数据崩溃）
- [ ] **DATA-06**: 数据刷新时间戳显�?
### 核心指标展示

- [ ] **IND-01**: 美联储利率历史走势图表（近一年）
- [ ] **IND-02**: 美联储决议详情展示（议息会议结果、声明摘要）
- [x] **IND-03**: 美国就业数据图表（NFP、失业率�?- [ ] **IND-04**: 就业分项指标展示（劳动参与率、工资增长）
- [x] **IND-05**: CPI通胀数据图表
- [ ] **IND-06**: 通胀分项数据展示（核心CPI、食�?能源/医疗�?- [ ] **IND-07**: PCE通胀数据展示
- [ ] **IND-08**: 比特币实时价格及走势图表
- [ ] **IND-09**: 以太坊实时价格及走势图表
- [ ] **IND-10**: 上证指数展示
- [ ] **IND-11**: 深证成指展示
- [ ] **IND-12**: 创业板指数展�?- [ ] **IND-13**: 道琼斯指数展�?- [ ] **IND-14**: 纳斯达克指数展示
- [ ] **IND-15**: 标普500指数展示
- [ ] **IND-16**: 中国央行利率走势展示

### 图表功能

- [ ] **CHART-01**: ECharts图表组件封装（echarts-for-react集成�?- [ ] **CHART-02**: 历史走势折线图实�?- [x] **CHART-03**: 时间范围选择器（1D�?W�?M�?M�?M�?Y、ALL�?- [ ] **CHART-04**: 图表放大/缩小交互功能
- [ ] **CHART-05**: 图表悬停提示工具（显示精确值）
- [ ] **CHART-06**: 双Y轴图表支持（跨市场对比）
- [ ] **CHART-07**: 多指标叠加图表实�?- [ ] **CHART-08**: 图表数据缩放组件（dataZoom�?- [ ] **CHART-09**: 事件标记功能（FOMC会议等）

### 界面布局

- [ ] **UI-01**: Dashboard整体布局框架
- [ ] **UI-02**: 多面板网格布局（响应式2-3列）
- [ ] **UI-03**: 暗色金融终端主题实现
- [ ] **UI-04**: 指标卡片组件（关键数值展示）
- [x] **UI-05**: 筛选栏组件（时间范围、指标选择�?- [ ] **UI-06**: 数据导出对话�?- [ ] **UI-07**: 加载状态指示器
- [ ] **UI-08**: 错误边界处理（单API失败不影响整体）
- [ ] **UI-09**: 数据刷新状态指示（"上次更新"时间�?
### 实时更新

- [ ] **REAL-01**: 加密货币WebSocket实时推送（秒级更新�?- [ ] **REAL-02**: WebSocket断线重连机制（指数退避）
- [ ] **REAL-03**: 美股/A股分钟级轮询更新
- [ ] **REAL-04**: 经济指标分钟级轮询更�?- [ ] **REAL-05**: React 18状态更新优化（useTransition防卡顿）

### 数据导出

- [ ] **EXPORT-01**: CSV格式数据导出功能
- [ ] **EXPORT-02**: Excel格式数据导出功能
- [ ] **EXPORT-03**: UTF-8编码导出（Excel兼容�?
---

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### 高级分析

- **ANAL-01**: 离线数据缓存（IndexedDB�?- **ANAL-02**: 市场休市状态指�?- **ANAL-03**: 跨市场相关性系数计�?- **ANAL-04**: 自定义指标收藏组�?
### 性能优化

- **PERF-01**: 图表懒加载（虚拟滚动�?- **PERF-02**: WebGL渲染加速（echarts-gl�?- **PERF-03**: 历史数据按需加载

---

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| 移动端适配 | 仅PC端使用，移动端复杂度5x |
| 用户认证系统 | 个人工具，无登录需�?|
| 云端部署 | localhost本地运行即可 |
| 付费数据�?| 无预算，仅使用免费公共API |
| 复杂联动分析算法 | 只展示数据叠加，不做系数计算 |
| 实时推送通知 | 本地工具无后台服�?|
| 多语言支持 | 中文界面即可 |
| 价格预警系统 | 需后台服务+持久状�?|
| 投资组合追踪 | 需单独数据模型+安全考虑 |
| 回测引擎 | 需复杂数据管道+计算引擎 |
| 预测分析 | 需ML模型训练+特征工程 |
| 新闻聚合 | 需RSS爬取+NLP相关性分�?|

---

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 1 | Pending |
| API-02 | Phase 1 | Complete |
| API-03 | Phase 1 | Pending |
| API-04 | Phase 1 | Pending |
| API-05 | Phase 2 | Pending |
| API-06 | Phase 2 | Pending |
| API-07 | Phase 1 | Pending |
| API-08 | Phase 1 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 2 | Pending |
| DATA-04 | Phase 2 | Pending |
| DATA-05 | Phase 1 | Pending |
| DATA-06 | Phase 1 | Pending |
| IND-01 | Phase 1 | Pending |
| IND-02 | Phase 2 | Pending |
| IND-03 | Phase 1 | Complete |
| IND-04 | Phase 2 | Pending |
| IND-05 | Phase 1 | Complete |
| IND-06 | Phase 2 | Pending |
| IND-07 | Phase 2 | Pending |
| IND-08 | Phase 1 | Pending |
| IND-09 | Phase 1 | Pending |
| IND-10 | Phase 2 | Pending |
| IND-11 | Phase 2 | Pending |
| IND-12 | Phase 2 | Pending |
| IND-13 | Phase 1 | Pending |
| IND-14 | Phase 1 | Pending |
| IND-15 | Phase 1 | Pending |
| IND-16 | Phase 2 | Pending |
| CHART-01 | Phase 1 | Pending |
| CHART-02 | Phase 1 | Pending |
| CHART-03 | Phase 1 | Complete |
| CHART-04 | Phase 3 | Pending |
| CHART-05 | Phase 1 | Pending |
| CHART-06 | Phase 2 | Pending |
| CHART-07 | Phase 2 | Pending |
| CHART-08 | Phase 3 | Pending |
| CHART-09 | Phase 3 | Pending |
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1 | Pending |
| UI-03 | Phase 1 | Pending |
| UI-04 | Phase 1 | Pending |
| UI-05 | Phase 1 | Complete |
| UI-06 | Phase 2 | Pending |
| UI-07 | Phase 1 | Pending |
| UI-08 | Phase 1 | Pending |
| UI-09 | Phase 1 | Pending |
| REAL-01 | Phase 3 | Pending |
| REAL-02 | Phase 3 | Pending |
| REAL-03 | Phase 1 | Pending |
| REAL-04 | Phase 1 | Pending |
| REAL-05 | Phase 1 | Pending |
| EXPORT-01 | Phase 2 | Pending |
| EXPORT-02 | Phase 2 | Pending |
| EXPORT-03 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 56 total
- Mapped to phases: 56
- Unmapped: 0 �?
---
*Requirements defined: 2026-05-18*
*Last updated: 2026-05-18 after roadmap creation*