# Phase 3: Professional Experience - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 03-professional-experience
**Areas discussed:** WebSocket架构, dataZoom交互体验, FOMC标记格式, WebSocket重连策略

---

## WebSocket架构

| Option | Description | Selected |
|--------|-------------|----------|
| CoinGecko WebSocket | CoinGecko官方WebSocket，通过ws://api.coingecko.net/api/v3/ws。实时推送，无需轮询。 | ✓ |
| 继续REST轮询 | 继续使用REST轮询，但将interval从60s降到1s。简单但可能触发限流。 | |
| Binance WebSocket | 切换到Binance WebSocket (wss://stream.binance.com/ws)，BTC/ETH交易对实时推送。稳定但需额外转换。 | |

**User's choice:** CoinGecko WebSocket (Recommended)
**Notes:** CoinGecko is the current data source for crypto, WebSocket is natural extension

| Option | Description | Selected |
|--------|-------------|----------|
| 独立Zustand store | WebSocket直接更新Zustand store，与TanStack Query并行。两者独立，不同步。 | |
| TanStack Query同步 | WebSocket更新触发TanStack Query的setQueryData，保持单一数据源。所有组件使用同一hook。 | ✓ |
| 实时+历史分离 | WebSocket用于实时显示，REST用于历史数据。两者分离，历史和实时不同source。 | |

**User's choice:** TanStack Query同步 (Recommended)
**Notes:** Maintains single data source pattern, all components use same hook

| Option | Description | Selected |
|--------|-------------|----------|
| 静默重连 | 仅显示加载状态，WebSocket断开时静默重连。用户不感知断连。 | |
| 连接状态指示器 | 显示WebSocket连接状态指示器（绿/红/黄），断开时显示警告。用户知道数据是否实时。 | ✓ |
| 自动降级到REST | 断开时降级到REST轮询，WebSocket恢复后切换回。保证数据始终可用。 | |

**User's choice:** 连接状态指示器 (Recommended)
**Notes:** User should know if data is real-time or stale

| Option | Description | Selected |
|--------|-------------|----------|
| 固定订阅BTC/ETH | 仅订阅BTC/ETH价格，固定订阅列表。简单，Phase 3 scope。 | |
| 动态订阅管理 | 支持动态订阅更多币种（未来扩展），通过参数配置。灵活但超出Phase scope。 | ✓ |

**User's choice:** 动态订阅管理
**Notes:** Architecture supports future extension, Phase 3 implements BTC/ETH only

| Option | Description | Selected |
|--------|-------------|----------|
| JSON直接解析 | CoinGecko WebSocket使用JSON格式推送，解析price数据直接使用。无需特殊处理。 | ✓ |
| Zod类型验证 | 添加类型验证（Zod schema）确保数据格式正确，防止异常数据。更安全但增加处理开销。 | |

**User's choice:** JSON直接解析 (Recommended)
**Notes:** Performance-focused for 1-second updates

| Option | Description | Selected |
|--------|-------------|----------|
| 无心跳/服务端驱动 | CoinGecko WebSocket不需要心跳，仅依赖服务器推送。如果支持的话使用ping/pong。 | |
| 客户端Ping | 客户端发送ping消息保持连接活跃，每30秒一次。防止连接因空闲被切断。 | ✓ |

**User's choice:** 客户端Ping (Recommended)
**Notes:** 30-second ping interval to keep connection alive

---

## dataZoom交互体验

| Option | Description | Selected |
|--------|-------------|----------|
| Slider | 滑动条在图表底部，用户拖动选择范围。直观，适合时间序列图表。 | ✓ |
| Inside | 用户在图表内拖动矩形框选区域放大。适合精确选择，但操作更复杂。 | |
| Slider + Inside | 同时提供Slider和Inside两种方式，用户可选。灵活但UI更复杂。 | |

**User's choice:** Slider (底部滑动条) (Recommended)
**Notes:** Standard for financial time-series charts

| Option | Description | Selected |
|--------|-------------|----------|
| 显示全部数据 | 默认显示全部数据（start: 0, end: 100），用户可自行缩放。简单直观。 | ✓ |
| 默认最近30天 | 默认显示最近30天（start: 70, end: 100），适合看近期趋势。金融终端常见模式。 | |
| 默认最近90天 | 默认显示最近90天（start: 50, end: 100），平衡历史和近期。 | |

**User's choice:** 显示全部数据 (Recommended)
**Notes:** User can zoom as needed, starts with full context

| Option | Description | Selected |
|--------|-------------|----------|
| 复用DARK_THEME | 使用DARK_THEME现有颜色（background, gridLine, text）。保持一致性。 | ✓ |
| 自定义dataZoom样式 | 专门设计dataZoom样式（半透明背景、高亮边框）。更突出但增加样式代码。 | |

**User's choice:** 复用DARK_THEME (Recommended)
**Notes:** Visual consistency with existing dark theme

---

## FOMC标记格式

| Option | Description | Selected |
|--------|-------------|----------|
| Point标记 | 在利率转折点显示小圆点标记。简单，不明显干扰图表。 | ✓ |
| Flag旗帜标记 | 显示旗帜/旗帜图标标记FOMC日期。更醒目，金融终端常见。 | |
| Vertical Line | 垂直线标记FOMC会议日期，贯穿图表。清晰但不适合密集数据。 | |

**User's choice:** Point标记 (Recommended)
**Notes:** Minimal visual impact, clearly indicates meeting dates

| Option | Description | Selected |
|--------|-------------|----------|
| 仅会议日期 | tooltip仅显示"FOMC会议" + 日期。无决策结果信息。最简单实现。 | |
| 决策类型 + 利率 | tooltip显示决策类型（加息/降息/维持）+ 新利率。Phase 3实现，数据需手动准备。 | ✓ |
| 决策 + 利率 + 声明链接 | tooltip显示决策类型 + 利率 + 声明摘要链接。超出Phase scope，可后续扩展。 | |

**User's choice:** 决策类型 + 利率 (Recommended)
**Notes:** Provides actionable context for rate changes

| Option | Description | Selected |
|--------|-------------|----------|
| 加息红/降息绿/维持灰 | 加息: 红色 (DARK_THEME.accent[2]), 降息: 绿色 (accent[1]), 维持: 灰色。直观，金融惯例。 | ✓ |
| 统一蓝色 | 所有FOMC标记使用同一颜色（蓝色 accent[0]）。简单但不区分决策类型。 | |
| 形状区分 | 使用形状区分（加息: ▲, 降息: ▼, 维持: ○）而非颜色。适合色盲用户。 | |

**User's choice:** 加息红/降息绿/维持灰 (Recommended)
**Notes:** Standard financial convention, intuitive color coding

| Option | Description | Selected |
|--------|-------------|----------|
| FRED自动获取 | FRED提供FOMC会议日期数据（DFEDTARU/DFEDTARL series变化点）。自动获取历史。 | ✓ |
| 静态JSON文件 | 手动准备JSON文件包含FOMC日期和决策类型。需定期更新，但更准确。 | |
| 爬取美联储官网 | 从美联储官网爬取历史会议信息。最完整但可能违反使用条款。 | |

**User's choice:** FRED自动获取 (Recommended)
**Notes:** Automatic detection from rate series, no manual data entry

| Option | Description | Selected |
|--------|-------------|----------|
| 近一年 | 仅显示近一年的FOMC会议。与利率数据范围一致。Phase 3 scope。 | ✓ |
| 近五年 | 显示近5年FOMC会议，提供更多历史参考。需更多数据准备。 | |
| 全部历史 | 显示全部历史（2008年量化宽松以来）。最完整但需大量数据准备。 | |

**User's choice:** 近一年 (Recommended)
**Notes:** Matches existing rate data range

---

## WebSocket重连策略

| Option | Description | Selected |
|--------|-------------|----------|
| 1s → 30s | 初始1秒，每次翻倍，最大30秒。标准指数退避策略。 | ✓ |
| 2s → 60s | 初始2秒，每次翻倍，最大60秒。更保守，减少服务器压力。 | |
| 0.5s → 10s | 初始0.5秒，每次翻倍，最大10秒。快速恢复，适合高频数据场景。 | |

**User's choice:** 1s → 30s (Recommended)
**Notes:** Standard exponential backoff

| Option | Description | Selected |
|--------|-------------|----------|
| 5次 | 重连失败5次后停止尝试，显示连接失败状态。用户可手动刷新。 | ✓ |
| 无限重连 | 无限重连，只要页面打开就持续尝试。保证最终恢复连接。 | |
| 3次 | 重连失败3次后停止。更快放弃，减少资源消耗。 | |

**User's choice:** 5次 (Recommended)
**Notes:** Reasonable retry limit before user intervention

| Option | Description | Selected |
|--------|-------------|----------|
| 显示失败 + 手动刷新 | 显示连接失败状态，用户可点击刷新按钮重试。用户可控。 | ✓ |
| 自动降级到REST | 5次失败后自动降级到REST轮询（60s interval）。保证数据继续更新。 | |
| 警告 + 后台重连 | 仅显示"数据非实时"警告，WebSocket在后台继续尝试重连（较长间隔）。 | |

**User's choice:** 显示失败 + 手动刷新 (Recommended)
**Notes:** User has control, clear failure indication

---

## Claude's Discretion

- WebSocket implementation details (hook structure, message handler design)
- dataZoom exact styling values (height, handle size)
- FOMC marker exact positioning logic (align to rate change points)
- Connection state indicator placement (near crypto panel header)

---

## Deferred Ideas

None — discussion stayed within phase scope.