# Research Summary

**Project:** 全球经济指标看板
**Researched:** 2026-05-18
**Confidence:** MEDIUM

---

## Key Findings

### Technology Stack

**推荐技术栈:**
- **前端框架:** React 18 + TypeScript + Vite 5
- **图表库:** ECharts 5（Apache项目，金融图表功能强大，支持双Y轴、数据缩放、蜡烛图）
- **状态管理:** Zustand 4（轻量级，适合个人工具规模）
- **数据获取:** TanStack Query 5（自动缓存、后台刷新、去重）
- **样式:** Tailwind CSS 3（暗色主题内置，快速原型）
- **数据处理:** date-fns 3（时区处理），decimal.js（精确计算）
- **数据导出:** Papa Parse（CSV），xlsx（Excel）

**关键决策:**
- ECharts > Recharts：金融图表需要双Y轴、数据缩放，Recharts不支持
- Zustand > Redux：个人工具无需Redux的复杂性
- TanStack Query：多API源不同刷新频率，缓存至关重要

### API数据源

| 数据类型 | API | 限流 | 缓存策略 |
|---------|-----|------|---------|
| 美联储利率 | FRED | 1000次/天 | 5-15分钟 |
| 美国就业数据 | BLS | 25次/天 | 30分钟 |
| 加密货币 | CoinGecko | 10-50次/分钟 | WebSocket实时 |
| 美股指数 | Alpha Vantage | 25次/天 | 1小时 |
| A股指数 | 东方财富/新浪 | 未明确 | 5分钟 |

**关键风险:** Alpha Vantage和BLS限流极严，必须缓存+去重

### Architecture

**四层架构:**
```
UI Components → State Manager → Data Aggregation → API Clients
```

**构建顺序:**
1. API Client Layer + Rate Limiter（最底层）
2. Data Normalizer + Cache Manager（数据规范化）
3. App Context + Reducer（状态管理）
4. Dashboard Layout + Chart Panel（UI组件）
5. Export + Cross-Market Overlay（高级功能）

**高频更新策略:**
- 加密货币：WebSocket，1秒推送
- 美股/A股：轮询，1分钟
- 经济指标：轮询，1-5分钟

### Features Landscape

**Table Stakes（必须有）:**
- 实时价格显示
- 历史走势图表
- 时间范围选择
- 数据刷新指示
- 暗色终端主题
- 基本提示工具
- 响应式网格布局

**Differentiators（差异化）:**
- **跨市场对比**：核心差异化功能，叠加美联储利率+加密货币+A股美股
- 美联储决议详情：议息会议结果、声明摘要
- 就业分项指标：NFP、劳动参与率、工资增长
- 通胀分项数据：CPI核心、食品/能源/医疗
- 同比/环比计算
- 数据导出

**Anti-Features（不做）:**
- 移动端适配
- 用户认证
- 云端部署
- 付费数据源
- 复杂联动算法
- 推送通知
- 投资组合追踪

### Critical Pitfalls

**Phase 1必须解决:**
1. **API限流耗尽** - 最关键风险，25次/天的API会在几分钟内耗尽
2. **React状态更新风暴** - WebSocket秒级更新导致UI卡顿，需要React 18 batching
3. **图表大数据崩溃** - 5年数据渲染冻结，需要降采样
4. **暗色主题可读性** - 终端美学≠可读性，对比度测试必需

**Phase 2必须解决:**
5. **时间戳错位** - 跨市场对比的核心坑点，美联储EST、A股CST+13h、加密货币24/7

**技术方案:**
- React 18 `useTransition` + `useDeferredValue` 防UI卡顿
- UTC标准化所有时间戳
- IndexedDB替代LocalStorage（5MB限制）
- WebSocket指数退避重连

---

## Roadmap Implications

### Phase 1: 核心数据基础设施

**目标:** 建立可靠的数据获取管道，单个指标可视化验证

**必须包含:**
- API Client Layer（内置限流和缓存）
- TanStack Query配置
- 单指标图表组件（验证ECharts集成）
- 暗色主题测试（对比度验证）

**交付指标:**
- 美联储利率图表工作
- 加密货币价格显示
- 限流保护生效
- 缓存策略验证

### Phase 2: 跨市场分析能力

**目标:** 多指标叠加、分项数据展示、同比环比计算

**关键依赖:**
- Phase 1所有API稳定工作
- UTC时间标准化基础设施
- 多数据源时间对齐

**交付指标:**
- 跨市场叠加图表
- 就业/通胀分项展示
- 同比环比自动计算
- 数据导出功能

### Phase 3: 专业体验增强

**目标:** 图表交互、事件标记、实时WebSocket

**交付指标:**
- 图表放大/缩小
- FOMC事件标记
- 加密货币WebSocket实时
- 离线缓存

---

## Open Questions

1. **API限流实际测试** - 各API文档声称的限制可能与实际不同
2. **WebSocket稳定性** - CoinGecko WebSocket连接稳定性需验证
3. **ECharts性能极限** - 20+图表同时渲染的性能需测试
4. **历史数据深度** - 超过1年的数据内存占用和渲染性能

---

## Files Created

| File | Content |
|------|---------|
| STACK.md | 技术栈推荐、数据源、架构决策 |
| FEATURES.md | 功能分类、MVP范围、Anti-features |
| ARCHITECTURE.md | 四层架构、数据流、构建顺序 |
| PITFALLS.md | 18个坑点、防止策略、Phase映射 |

---

*Research synthesized: 2026-05-18*