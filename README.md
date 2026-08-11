# 全球经济指标看板

[![GitHub](https://img.shields.io/badge/GitHub-Joohnnwicky/economic--dashboard-blue?logo=github)](https://github.com/Joohnnwicky/economic-dashboard)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![ECharts](https://img.shields.io/badge/ECharts-5.5-AA344D?logo=apache)](https://echarts.apache.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi)](https://fastapi.tiangolo.com/)

一个本地/内网运行的全球经济指标实时监控看板，整合展示美联储利率、美国通胀、加密货币行情、A股/美股指数、中国央行利率、中国房价等 20 类核心经济指标。采用 **Dell 1996 目录式设计语言**——纯黑页面边框、扁平色块丝带卡片、Arial Black 粗体标题、Times Roman 衬线正文。

> **架构核心：** 前端零 API Key，所有外部 API 经 Python FastAPI 后端代理，兼顾密钥隔离与缓存控量。公网部署不暴露任何凭据。

## 功能特性

### 20 类指标监控

| 类别 | 指标 | 数据源 | 更新频率 |
|------|------|--------|----------|
| **美联储** | 联邦基金利率 (FFR)、FOMC 议息目标利率 | FRED | 每日 / 会议后 |
| **美债** | 2/10/30 年期国债收益率 | FRED | 每日 |
| **美国通胀** | CPI、核心 CPI、PCE、核心 PCE | BLS / FRED | 月度 |
| **美元指数** | 美元贸易加权指数 | FRED | 每日 |
| **大宗商品** | 布伦特/WTI 原油、国内金价（上海黄金期货） | FRED / AkShare | 每日 |
| **加密货币** | Top10 币种 24h 行情 | Binance REST | 每分钟轮询 |
| **汇率** | USD/CNY、EUR/USD、GBP/USD 等 | Frankfurter API | 每日 |
| **美股指数** | 道琼斯、纳斯达克、标普 500 | yfinance | 每日 |
| **美股头部** | Magnificent 7、半导体、SpaceX | yfinance | 每日 |
| **A股指数** | 上证、深证、创业板 | 东方财富 / 腾讯财经 | 分钟级 |
| **中国宏观** | GDP、CPI、PPI、M2、PMI | AkShare（国家统计局） | 月度 / 季度 |
| **中国贸易/信贷** | 进出口同比、社融信贷 | AkShare | 月度 |
| **中国房价** | 全国 TOP10 排行 + 城市详情 | creprice.cn（爬虫） | 每日 |
| **中国央行** | PBOC MLF/LPR/OMO 利率 | 静态数据 | 手动更新 |
| **预测市场** | Polymarket 热门 | Polymarket Gamma API | 分钟级 |

### A股自选股

- 默认军工板块 20 支龙头股，支持搜索沪深 A 股自定义添加
- 通过后端通达信（mootdx）接口获取分钟级行情，点击查看 K 线走势
- 自选股列表本地持久化（localStorage）

### 界面功能

- **Dell 1996 目录风格** — 黑色页面框、8 色色块丝带卡片、Arial Black 标题、Times 正文、直角、Dell 红仅用于 CTA/实时角标、黄色 NEW! 贴纸
- **瀑布流自适应布局** — 模块按内容高度自动紧凑排布，无固定行概念，最大化利用空间，支持自由拖拽重排
- **涨红跌绿** — 遵循中国股市配色习惯（涨=Dell 红，跌=绿）
- **历史走势图表** — 支持 1M/3M/6M/1Y/ALL 多时间范围，dataZoom 拖拽缩放
- **FOMC 会议标记** — 美联储议息会议在利率图表上标注红点
- **跨市场对比** — 多指标叠加双 Y 轴对比
- **数据导出** — CSV / Excel 格式

## 技术栈

| 技术 | 用途 |
|------|------|
| React 18 + TypeScript | 前端框架 |
| Vite 6 | 构建工具 |
| ECharts 5 | 金融图表库 |
| TanStack Query 5 | 数据获取与缓存 |
| Zustand 4 | 状态管理 |
| Tailwind CSS 3 | 样式框架（全局直角 + Dell 字体栈） |
| dnd-kit | 可拖拽瀑布流布局 |
| Python FastAPI | 后端代理 + 缓存层 |
| nginx | 生产环境反向代理 |

## 架构

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   前端      │────▶│   Python后端     │────▶│  外部API    │
│  (React)    │     │  (FastAPI)       │     │ (FRED/BLS/  │
│  无API Key  │     │  缓存+代理       │     │  AkShare…)  │
└─────────────┘     └──────────────────┘     └─────────────┘
      │                    │
      │    /api/backend/*  │
      └────────────────────┘
```

**API Key 存储位置：** 仅在后端环境变量，前端 JavaScript 零 API Key。

## 快速开始

### 1. 获取 API Keys

| API | 用途 | 配额 |
|-----|------|------|
| **FRED** | 美联储、美债、美元指数、油价 | 1000 次/天 |
| **BLS** | 美国 CPI / 就业 | 25 次/天 ⚠️ |
| **Alpha Vantage** | 美股 / 金价（备用） | 25 次/天 ⚠️ |

### 2. 本地开发

```bash
git clone https://github.com/Joohnnwicky/economic-dashboard.git
cd economic-dashboard
npm install

# 前端配置（仅 .env.local，开发机直连备用）
cp .env.example .env.local   # 填入 VITE_ 前缀的 key

# 后端配置
cp .env.example backend/.env # 填入 FRED_API_KEY / BLS_API_KEY / ALPHA_VANTAGE_API_KEY

# 启动前端（localhost:5173）
npm run dev

# 启动后端（localhost:8000）
cd backend && pip install -r requirements.txt && python main.py
```

> 前端通过 Vite 代理把 `/api/backend/*` 转发到后端 `:8000`（见 `vite.config.ts`）。后端启动时会预热金价/房价缓存，约需 30 秒。

### 3. 生产构建

```bash
npm run build   # 注意：build 含 tsc 类型检查；Docker 构建用 npx vite build 跳过 tsc
```

## Docker 部署

### 本地直接运行

```bash
cp .env.example .env   # 填入 API Keys
docker compose -p economic-dashboard up -d
# 前端 http://localhost:9000  后端 http://localhost:8000
```

### 部署到 NAS / 远程服务器

本地构建镜像 → 导出 tar → 上传 → 加载 → 启动（目标机无需访问 Docker Hub）：

```bash
# 本地构建
docker compose -p economic-dashboard build
docker save economic-dashboard-frontend:latest -o frontend.tar
docker save economic-dashboard-backend:latest  -o backend.tar

# 上传 tar + docker-compose.yml + .env，然后在目标机：
docker load -i /tmp/frontend.tar
docker load -i /tmp/backend.tar
cd /tmp && docker compose -p economic-dashboard --env-file /tmp/.env up -d
```

> **代理配置注意：** 仅在目标机需要代理访问受限 API 时设置 `HTTP_PROXY/HTTPS_PROXY`。若目标机可直连（如 NAS），**务必留空**，否则代理认证失败（407）会阻断后端所有出站请求。

## 项目结构

```
economic-dashboard/
├── src/
│   ├── api/                 # 前端 API 客户端（调用 /api/backend/*）
│   ├── components/
│   │   ├── charts/          # ECharts 图表（颜色统一取自 colors.ts）
│   │   ├── indicators/      # 20 个指标面板
│   │   ├── stocks/          # A股自选股
│   │   ├── layout/          # Dashboard 瀑布流 / Header / FilterBar
│   │   └── ui/              # ExportDialog 等
│   ├── hooks/               # TanStack Query hooks
│   ├── constants/
│   │   ├── colors.ts        # Dell 1996 调色板（DARK_THEME + RIBBON_TINTS）
│   │   ├── api.ts           # API URL 与配额
│   │   └── layoutConfig.ts  # 20 面板顺序与标题
│   └── ...
├── backend/
│   ├── main.py              # FastAPI（12 路由，/api 前缀，启动预热缓存）
│   ├── api/                 # 各数据源代理（fred/bls/akshare/yfinance/binance…）
│   ├── services/            # 业务逻辑 + 缓存
│   └── Dockerfile.backend
├── DESIGN.md                # Dell 1996 设计系统规范
├── nginx.conf               # 生产反向代理
├── docker-compose.yml
└── Dockerfile               # 前端多阶段构建（node→nginx）
```

## 设计系统

UI 采用 **Dell 1996** 目录式设计语言（规范见 [`DESIGN.md`](./DESIGN.md)）。改样式的三个高杠杆点：

1. `src/constants/colors.ts` — `DARK_THEME` 调色板，所有 ECharts 颜色集中取自此处，改值即全局换色
2. `tailwind.config.js` — `borderRadius` 全局置零、字体栈、色阶重映射
3. `src/index.css` — Dell 组件工具类（`.dell-frame` / `.dell-banner` / `.dell-new-burst` / `.dell-ribbon-title`）+ 旧深色 hex 全局覆盖

> `DARK_THEME` 这个名字保留（39 文件引用），但它现在装的是 Dell **浅色**调色板。

## API 配额管理

后端内置缓存层，避免耗尽 BLS / Alpha Vantage 的每日 25 次配额：

- BLS 缓存 30 分钟，Alpha Vantage 缓存 60 分钟，FRED 缓存 5–15 分钟
- 配额每天 UTC 00:00（北京时间 08:00）重置

## 常见问题

**Q: 金价显示 fallback 值 0？**
后端启动时正在预热 AkShare 金价缓存，约 30 秒后恢复真实值。若持续为 0，检查后端能否直连 `stock2.finance.sina.com.cn`（确认 `HTTP_PROXY` 是否误设）。

**Q: 后端所有数据加载失败？**
多半是代理认证问题。若部署机可直连外网，把 `.env` 里的 `HTTP_PROXY`/`HTTPS_PROXY` 留空后重建容器。

**Q: 美股头部股票（yfinance）超时？**
yfinance 依赖 Yahoo Finance，部分网络对 Yahoo 不稳定。属数据源限制，其他面板不受影响。

**Q: 本地 `npm run build` 报类型错误？**
`build` 脚本含 `tsc` 类型检查。Docker 构建用 `npx vite build` 跳过 tsc，可正常产出。本地若要绕过，直接 `npx vite build`。

## 开发指南

### 添加新指标

1. `backend/api/` 新增数据源代理 + `backend/main.py` 注册路由
2. `src/api/` 新增前端客户端（调 `/api/backend/*`）
3. `src/hooks/` 新增 TanStack Query hook
4. `src/components/indicators/` 新增面板组件
5. `src/constants/layoutConfig.ts` 注册到 `PANEL_TITLES` / `DEFAULT_ORDER`

### 运行测试

```bash
npm run test:run
```

## 数据来源

- [FRED](https://fred.stlouisfed.org/) · [BLS](https://www.bls.gov/) · [Alpha Vantage](https://www.alphavantage.co/)
- [Binance](https://www.binance.com/) · [yfinance](https://github.com/ranaroussi/yfinance)
- [AkShare](https://akshare.akfamily.xyz/) · [东方财富](https://www.eastmoney.com/) · [腾讯财经](https://qt.gtimg.cn/)
- [Frankfurter API](https://api.frankfurter.dev/) · [Polymarket](https://polymarket.com/) · [creprice.cn](https://www.creprice.cn/)

## 许可证

MIT License
