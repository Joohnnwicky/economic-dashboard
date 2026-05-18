# 全球经济指标看板

## What This Is

一个本地运行的全球经济指标实时监控看板，基于美联储利率调整机制与市场联动关系研究，整合展示美联储利率、美国就业数据、通胀数据、加密货币行情、A股/美股指数、中国央行利率等核心经济指标。面向个人使用，提供专业金融终端风格的暗色界面，支持历史走势分析、跨市场对比和数据导出。

## Core Value

**实时、全面、直观地展示全球经济核心指标及其联动关系，帮助快速把握宏观经济态势和市场动向。**

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 美联储利率走势展示（近一年历史数据）
- [ ] 美联储决议详情展示（议息会议结果和声明摘要）
- [ ] 美国劳动部就业数据展示（近一年）及就业分项指标
- [ ] 美国通胀数据展示（CPI/PCE）及通胀分项数据
- [ ] 比特币实时行情走势
- [ ] 以太坊实时行情走势
- [ ] 中国A股大盘指数展示（上证、深证、创业板）
- [ ] 美股大盘指数展示（道琼斯、纳斯达克、标普500）
- [ ] 中国央行利率走势展示
- [ ] 历史走势图表功能
- [ ] 同比环比数据对比功能
- [ ] 跨市场对比功能（多指标叠加图表）
- [ ] 时间范围筛选交互
- [ ] 图表放大查看交互
- [ ] 数据导出功能（CSV/Excel格式）
- [ ] 高频实时数据更新（加密货币秒级，其他分钟级）
- [ ] 暗色金融终端风格界面

### Out of Scope

- 移动端适配 — 仅PC端使用
- 云端部署 — 本地localhost运行即可
- 用户认证系统 — 个人工具无需登录
- 付费数据源 — 仅使用免费公共API
- 复杂联动分析算法 — 只展示数据叠加，不做影响系数计算
- 实时推送通知 — 本地工具无需推送功能
- 多语言支持 — 中文界面即可

## Context

基于《美联储利率调整机制与市场联动关系深度调研报告》的研究框架，该报告系统分析了美联储利率调整的历史规律、决策机制及其对全球金融市场的传导效应。看板设计需体现报告中的核心逻辑：

1. **利率传导机制**：美联储利率 → 美股 → 全球股市 → 加密货币的联动链条
2. **就业与通胀双目标**：美联储决策的核心依据是就业数据和通胀指标
3. **跨市场联动**：利率变动对不同资产类别的影响差异和时间滞后
4. **历史周期对比**：不同加息/降息周期中各类资产的表现特征

技术环境：
- React生态成熟，图表库丰富（Recharts/ECharts）
- 公共API生态完善：FRED（美联储数据）、BLS（就业数据）、CoinGecko（加密货币）、东方财富/新浪财经（A股）、Alpha Vantage（美股）
- 本地开发简单，无需服务器部署

## Constraints

- **技术栈**: React + TypeScript — 用户明确选择
- **数据源**: 仅免费公共API — 无付费预算
- **更新频率**: 加密货币秒级更新，其他指标分钟级 — 平衡实时性和API限制
- **部署环境**: 本地localhost — 无需公网部署
- **界面风格**: 暗色金融终端 — 专业感优先

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + TypeScript | 生态成熟，类型安全，图表组件丰富 | — Pending |
| 公共API聚合 | FRED/BLS/CoinGecko等免费可靠 | — Pending |
| 高频更新策略 | 加密货币WebSocket，其他定时轮询 | — Pending |
| 暗色终端风格 | 专业金融感，数据密度高时视觉舒适 | — Pending |
| ECharts图表库 | 金融图表功能强大，支持多指标叠加 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-18 after initialization*