# 加密牛熊综合面板（扩展 CoinbasePremiumPanel）

## 目标
把现有 Coinbase 溢价面板扩展为"加密牛熊综合判断面板"，新增 3 个指标 + 综合牛熊评分 + 溢价阈值标注。所有数据源已验证稳定可达。

## 数据源（全部已实测可达）
| 指标 | 数据源 | 频率 | 备注 |
|---|---|---|---|
| Coinbase 溢价 | Coinbase+Binance（已有）| 1min | 加阈值标注 |
| 恐惧贪婪指数 | alternative.me/fng（免费无key）| 1h | 实测返回 25 |
| 200日均线偏离% | Binance BTC 日线 365d（已有 binance_service）| 1h | 自算，零新源 |
| Pi Cycle 信号 | 同上 365 日线 | 1h | 111日 vs 350日×2 是否上穿 |

**MVRV 降级为 200日均线偏离**（用户已确认）：无稳定免费 REST API，用均线偏离作链上估值代理。偏离>30%过热、<-10%低估。

## 后端改动（backend/）

### 新增 `services/crypto_signals_service.py`
统一聚合 3 个新指标，1h 内存缓存：
- `_fetch_fear_greed()` -> httpx GET alternative.me/fng/?limit=2（当前值+昨日，算日变化）
- `_calc_ma_deviation()` -> 复用 `fetch_binance_klines('BTCUSDT','1d',365)` 取收盘价，算 SMA200、SMA111、SMA350，返回：当前价、MA200、偏离%、Pi Cycle 是否触发（SMA111 > SMA350*2）
- `get_crypto_signals()` -> 并发取上述，返回 dict

### 新增 `api/crypto_signals.py`
`GET /api/crypto_signals` -> 返回 `{fearGreed, fearGreedYesterday, ma200, ma111, ma350, price, deviationPct, piCycleSignal, timestamp}`

### 改 `main.py`：注册 crypto_signals_router
### 改 `config/api_keys.py`：CACHE_TTL 加 `CryptoSignals: 3600`

## 前端改动（src/）

### 新增 `api/crypto-signals.ts`
类型 + `getCryptoSignals()` client（timeout 15s）

### 新增 `hooks/useCryptoSignals.ts`
useQuery，staleTime 1h，refetchInterval 1h（数据本身低频）

### 改 `components/indicators/CoinbasePremiumPanel.tsx`（核心）
重构成综合面板，分 4 块 + 评分条：
1. **综合牛熊评分条**（顶部醒目）：0-100 加权分 + 标签（极度看跌/看跌/中性/看涨/极度看涨）+ 颜色
2. **Coinbase 溢价**（现有，加阈值）：|溢价率|>0.5% 时加"⚠️ 异常溢价"高亮标签
3. **恐惧贪婪指数**：0-100 数值 + 情绪标签（极度恐惧/恐惧/中性/贪婪/极度贪婪）+ 日变化箭头 + 0-100 刻度条
4. **200日均线偏离**：偏离% + 标签（低估/合理/过热）+ 当前价/MA200 对比
5. **Pi Cycle 信号**：是否触发（触发=顶部预警）+ SMA111/SMA350*2 数值

### 综合评分加权（主观，需用户认可）
| 子指标 | 权重 | 评分映射 |
|---|---|---|
| 200日均线偏离 | 40% | <-10%→90(低估买入), -10~10%→50, 10~30%→60, >30%→10(过热) |
| 恐惧贪婪 | 30% | 直接用 0-100（逆向思维：极度恐惧=机会但评分按字面，恐惧=分低）|
| Coinbase 溢价 | 20% | 持续高正溢价=看涨，映射到 0-100 |
| Pi Cycle | 10% | 触发→10(顶部预警), 未触发→60 |

综合分 = Σ(子分×权重)。标签：<25 极度看跌, 25-45 看跌, 45-55 中性, 55-75 看涨, >75 极度看涨

> 说明：评分加权是经验值，非科学公式。会在 UI 标注"仅供参考"。

## 验证
1. 后端：py_compile + import + 实测 `curl /api/crypto_signals` 返回真实数据
2. 前端：tsc（基线32，无新增）+ vitest（150全绿，无回归）+ vite build
3. 浏览器：面板 4 指标 + 评分条正常渲染

## 不做
- MVRV 真实链上数据（降级为均线偏离，已确认）
- ETF 流（无稳定免费源）
- 山寨季指数（源不稳定）
- 新建独立面板（用户选扩展现面板）

## 风险
- 恐惧贪婪 API alternative.me 偶尔不稳定 -> 失败时该子指标显示"数据不可用"，不拉垮其他指标和评分（评分按已得指标重新归一化权重）
- 200日均线需 365 天数据，Binance 单次最多 1000 根，365 没问题
