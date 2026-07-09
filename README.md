# 全球经济指标看板

[![GitHub](https://img.shields.io/badge/GitHub-Joohnnwicky/economic--dashboard-blue?logo=github)](https://github.com/Joohnnwicky/economic-dashboard)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![ECharts](https://img.shields.io/badge/ECharts-5.5-AA344D?logo=apache)](https://echarts.apache.org/)

一个本地运行的全球经济指标实时监控看板，整合展示美联储利率、美国就业数据、通胀数据、加密货币行情、A股/美股指数、中国央行利率等核心经济指标。专业金融终端风格暗色界面，支持历史走势分析、跨市场对比和数据导出。
<img width="1440" height="8614" alt="FireShot Capture 034 - 全球经济指标看板 -  192 168 31 153" src="https://github.com/user-attachments/assets/e9035abb-1aaa-41b0-86f5-71b4207029a1" />




## 功能特性

### 核心指标监控

| 类别 | 指标 | 数据源 | 更新频率 |
|------|------|--------|----------|
| **美联储** | 联邦基金利率 (FFR) | FRED | 每日 |
| **美联储** | FOMC议息会议目标利率 | FRED | 会议后 |
| **美国就业** | 非农就业人数、失业率 | BLS | 月度 |
| **美国通胀** | CPI、核心CPI | BLS | 月度 |
| **美国通胀** | PCE、核心PCE | FRED | 月度 |
| **美股指数** | 道琼斯、纳斯达克、标普500 | Alpha Vantage (ETF) | 每日 |
| **加密货币** | 比特币、以太坊实时价格 | Binance WebSocket | 秒级 |
| **A股指数** | 上证、深证、创业板 | 东方财富/腾讯财经 | 分钟级 |
| **中国央行** | PBOC利率 (MLF/LPR/存款利率) | 静态数据 | 手动更新 |
| **美元指数** | 美元贸易加权指数 | FRED | 每日 |
| **汇率** | USD/CNY, EUR/USD, GBP/USD 等 | Frankfurter API | 每日 |
| **大宗商品** | 布伦特原油、WTI原油 | FRED | 每日 |
| **大宗商品** | 伦敦金价 (LBMA) | Alpha Vantage (GLD ETF) | 每日 |
| **预测市场** | Polymarket热门赌注 | Polymarket Gamma API | 分钟级 |
| **中国房价** | 70城市房价排行、石家庄详情 | creprice.cn (爬虫) | 每日 |
| **中国宏观** | GDP、CPI、PPI、M2 | AkShare (国家统计局) | 月度/季度 |

### A股自选股功能

| 特性 | 说明 |
|------|------|
| **默认列表** | 军工板块20支龙头股（中兵红箭、高德红外、中船科技等） |
| **自定义添加** | 支持搜索沪深A股，手动添加自选股 |
| **实时行情** | 通过Python后端（通达信数据接口）获取分钟级行情 |
| **K线图表** | 点击股票查看日K/周K走势图 |
| **本地持久化** | 自选股列表保存在浏览器localStorage，刷新不丢失 |

### 界面功能

- **专业金融终端风格** - 暗色主题，高信息密度布局
- **实时WebSocket更新** - 加密货币价格秒级刷新，无需轮询
- **历史走势图表** - 支持多时间范围 (1D/1W/1M/3M/6M/1Y/ALL)
- **跨市场对比** - 多指标叠加对比图表
- **dataZoom交互** - 图表拖拽缩放查看历史细节
- **FOMC会议标记** - 美联储议息会议在利率图表上标注
- **数据导出** - CSV/Excel格式导出历史数据
- **连接状态指示** - WebSocket连接状态实时显示

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3 | 前端框架 |
| TypeScript | 5.6 | 类型安全 |
| Vite | 6.0 | 构建工具 |
| ECharts | 5.5 | 金融图表库 |
| TanStack Query | 5.62 | 数据获取与缓存 |
| Zustand | 4.5 | 状态管理 |
| Tailwind CSS | 3.4 | 样式框架 |
| Axios | 1.7 | HTTP请求 |
| date-fns | 3.6 | 日期处理 |

## 快速开始

### 1. 获取API Keys

本项目使用免费公共API，需要自行注册获取API Key：

| API | 用途 | 注册地址 | 配额限制 |
|-----|------|----------|----------|
| **FRED** | 美联储数据、美元指数、油价 | https://fred.stlouisfed.org/docs/api/fred/ | 1000次/天 |
| **BLS** | 美国就业、CPI数据 | https://www.bls.gov/developers/home.htm | **25次/天** |
| **Alpha Vantage** | 美股指数、金价ETF | https://www.alphavantage.co/support/#api-key | **25次/天** |

> ⚠️ **重要**: BLS和Alpha Vantage免费版每日仅25次调用，请合理设置缓存时间避免超限！

### 2. 本地开发

```bash
# 克隆仓库
git clone https://github.com/Joohnnwicky/economic-dashboard.git
cd economic-dashboard

# 安装依赖
npm install

# 配置API Keys
cp .env.example .env.local
# 编辑 .env.local，填入你的API Keys

# 启动开发服务器
npm run dev

# （可选）启动Python后端获取A股实时行情
cd backend
pip install -r requirements.txt
python main.py
# 后端运行在 http://localhost:8000

# 访问前端 http://localhost:5173
```

> **注意**: A股自选股功能需要Python后端支持。如果不启动后端，自选股面板将显示"暂无数据"。

### 3. 生产构建

```bash
npm run build
npm run preview  # 预览构建结果
```

## Docker部署

### 方式一：直接运行（需要本地Docker）

```bash
# 创建环境文件
cp .env.example .env

# 构建并运行
docker compose up -d

# 访问 http://localhost:9000
```

### 方式二：远程部署（NAS/服务器）

如果目标设备无法访问Docker Hub（网络限制），可在本地构建后上传：

```bash
# 本地构建镜像
docker compose --env-file .env build frontend

# 导出镜像
docker save economic-dashboard-frontend:latest -o frontend-image.tar

# 上传到目标设备
scp frontend-image.tar user@remote:/tmp/

# 在目标设备导入并运行
ssh user@remote
docker load -i /tmp/frontend-image.tar
cd /path/to/project
docker compose up -d --no-build
```

### 代理配置（中国大陆用户）

如果API被网络限制，nginx代理可通过环境变量配置上游代理：

```bash
# .env 文件添加
HTTP_PROXY=http://192.168.100.1:7893
HTTPS_PROXY=http://192.168.100.1:7893
```

## 项目结构

```
economic-dashboard/
├── src/
│   ├── api/                    # API客户端
│   │   ├── fred.ts             # FRED美联储数据
│   │   ├── bls.ts              # BLS就业/通胀数据
│   │   ├── alphavantage.ts     # Alpha Vantage美股/金价
│   │   ├── binance.ts          # Binance WebSocket加密货币
│   │   ├── eastmoney.ts        # 东方财富A股数据
│   │   ├── exchange-rates.ts   # Frankfurter汇率
│   │   ├── polymarket.ts       # Polymarket预测市场
│   │   └── rate-limiter.ts     # API配额管理
│   ├── components/
│   │   ├── charts/             # ECharts图表组件
│   │   │   ├── FedRateChart.tsx
│   │   │   ├── LineChart.tsx
│   │   │   ├── MiniChart.tsx
│   │   │   ├── MultiSeriesChart.tsx
│   │   │   └── OverlayComparisonChart.tsx
│   │   ├── indicators/         # 指标面板组件
│   │   │   ├── FedRatePanel.tsx
│   │   │   ├── EmploymentPanel.tsx
│   │   │   ├── InflationPanel.tsx
│   │   │   ├── CryptoPanel.tsx
│   │   │   ├── ChineseIndicesPanel.tsx
│   │   │   └── ...
│   │   ├── stocks/             # A股自选股组件
│   │   │   ├── CustomStocksPanel.tsx  # 自选股面板
│   │   │   ├── StockCard.tsx          # 股票卡片
│   │   │   ├── StockKlineChart.tsx    # K线图
│   │   │   └── StockSearchDialog.tsx  # 搜索对话框
│   │   ├── layout/             # 布局组件
│   │   │   ├── Dashboard.tsx
│   │   │   ├── OverlayPanel.tsx
│   │   │   └── ...
│   │   └── ui/                 # UI组件
│   │       ├── IndicatorCard.tsx
│   │       ├── ConnectionIndicator.tsx
│   │       └── ExportDialog.tsx
│   ├── hooks/                  # React Query hooks
│   │   ├── useFedRate.ts
│   │   ├── useBlsData.ts
│   │   ├── useCrypto.ts
│   │   ├── useCryptoWebSocket.ts
│   │   └── ...
│   ├── stores/                 # Zustand状态
│   ├── constants/              # 常量配置
│   │   ├── api.ts              # API URLs和配额
│   │   ├── colors.ts           # 暗色主题配色
│   │   └── indicators.ts       # 指标定义
│   ├── utils/                  # 工具函数
│   │   ├── formatters.ts       # 数字格式化
│   │   ├── utc.ts              # UTC时间处理
│   │   ├── downsampling.ts     # 数据降采样
│   │   └── export-csv.ts       # CSV导出
│   └── types/                  # TypeScript类型定义
├── backend/                    # Python后端（A股实时行情）
│   ├── main.py                 # FastAPI服务
│   ├── services/tdx_client.py  # 通达信数据接口
│   └── Dockerfile.backend
├── public/data/                # 静态数据文件
│   ├── pboc-rates.json         # PBOC利率数据
│   └── us-indices-latest.json  # 美股最新数据
├── nginx.conf                  # nginx代理配置
├── docker-compose.yml          # Docker编排
├── Dockerfile                  # 前端镜像构建
└── .env.example                # 环境变量示例
```

## API配额管理

本项目内置Rate Limeter，严格控制API调用频率：

```typescript
// src/constants/api.ts
export const RATE_LIMITS = {
  FRED: { maxCallsPerDay: 1000, minIntervalMs: 100, cacheTtlMs: 300000 },    // 5分钟缓存
  BLS: { maxCallsPerDay: 25, minIntervalMs: 3600000, cacheTtlMs: 1800000 },  // 30分钟缓存 ⚠️
  AlphaVantage: { maxCallsPerDay: 25, minIntervalMs: 3600000, cacheTtlMs: 3600000 }, // 1小时缓存 ⚠️
  CoinGecko: { maxCallsPerDay: 500, minIntervalMs: 1200, cacheTtlMs: 60000 }, // 1分钟缓存
};
```

> ⚠️ **BLS/Alpha Vantage配额极易耗尽！**
> - 配额重置：每天UTC 00:00（北京时间08:00）
> - 建议：本地测试后等待配额恢复再部署
> - 缓存机制：TanStack Query持久化缓存，避免重复请求

## WebSocket实时数据

加密货币价格通过Binance WebSocket实现秒级更新：

```typescript
// src/hooks/useCryptoWebSocket.ts
const WS_URL = 'wss://stream.binance.com:9443/ws/btcusdt@trade@ethusdt@trade';

// 特性
- 自动连接/断线重连
- 心跳检测 (ping/pong)
- 连接状态可视化指示器
- 数据合并到React Query缓存
```

## nginx代理配置

生产环境所有API请求通过nginx代理转发：

```nginx
# Python后端代理（所有需要API Key的请求）
location /api/backend/ {
    proxy_pass http://backend:8000/api/;
}

# 腾讯财经API（A股指数）
location /api/tencent/ {
    proxy_pass https://qt.gtimg.cn/;
    proxy_set_header Host qt.gtimg.cn;
    proxy_ssl_server_name on;
}

# Polymarket Gamma API（预测市场）
location /api/polymarket/ {
    proxy_pass https://gamma-api.polymarket.com/;
    proxy_set_header Host gamma-api.polymarket.com;
    proxy_ssl_server_name on;
}
```

**架构优势：**
- ✅ API Key零暴露 - 前端JavaScript无任何API Key
- ✅ 统一入口 - 所有外部API通过后端代理
- ✅ 缓存层 - Python后端内置Redis缓存，防止配额耗尽
- ✅ 中国大陆可用 - nginx可配置上游代理访问受限API

## 常见问题

### Q: 金价/美股显示"加载失败"

**原因**: Alpha Vantage每日25次配额已用完

**解决**: 等待第二天北京时间08:00配额重置，或使用付费API

### Q: 美联储数据Network Error

**原因**: FRED API可能被网络限制

**解决**: 配置nginx上游代理：
```bash
HTTP_PROXY=http://your-proxy:port
```

### Q: WebSocket连接失败

**原因**: Binance WebSocket可能被限制

**解决**: 
1. 检查网络是否可访问 `wss://stream.binance.com`
2. 或使用CoinGecko REST API作为备用

### Q: A股数据不更新

**原因**: 东方财富API不稳定，或Python后端未启动

**解决**: 
- 项目内置腾讯财经作为备用数据源
- A股自选股需要启动Python后端 (`cd backend && python main.py`)
- 检查后端是否运行在 http://localhost:8000

## 开发指南

### 添加新指标

1. 在 `src/api/` 创建新API客户端
2. 在 `src/hooks/` 创建React Query hook
3. 在 `src/components/indicators/` 创建面板组件
4. 在 `src/constants/api.ts` 添加配额配置
5. 在 `src/components/layout/Dashboard.tsx` 添加到布局

### 运行测试

```bash
npm run test        # 监听模式
npm run test:run    # 单次运行
```

## 数据导出

点击任意面板的"导出"按钮，支持：
- **CSV格式** - 适合数据分析
- **Excel格式** - 适合报告制作

导出内容包含：
- 指标名称、单位
- 时间范围
- 历史数据（日期、值）

## 许可证

MIT License - 自由使用、修改、分发

## 致谢

数据来源：
- [Federal Reserve Economic Data (FRED)](https://fred.stlouisfed.org/)
- [U.S. Bureau of Labor Statistics (BLS)](https://www.bls.gov/)
- [Alpha Vantage](https://www.alphavantage.co/)
- [Binance](https://www.binance.com/)
- [CoinGecko](https://www.coingecko.com/)
- [东方财富](https://www.eastmoney.com/)
- [Frankfurter API](https://api.frankfurter.app/)
- [Polymarket](https://polymarket.com/)

---

