import { useCoinbasePremium } from '../../hooks/useCoinbasePremium';
import { useCryptoSignals } from '../../hooks/useCryptoSignals';
import { DARK_THEME } from '../../constants/colors';
import { MiniChart } from '../charts/MiniChart';
import { LastUpdated } from '../ui/LastUpdated';
import { NormalizedIndicator } from '../../types/indicator';

function formatUSD(v: number): string {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── 综合牛熊评分（加权，经验值，仅供参考）───
// 子分映射到 0-100，越高越看涨
function scoreDeviation(dev: number | null): number | null {
  if (dev === null) return null;
  // 200日均线偏离：<-10% 低估(买入区,高分); -10~10% 中性; 10~30% 偏热; >30% 过热(低分)
  if (dev <= -10) return 85;
  if (dev <= 0) return 60;
  if (dev <= 10) return 55;
  if (dev <= 30) return 35;
  return 10;
}
function scoreFearGreed(v: number | null): number | null {
  // 恐惧贪婪字面值：极度恐惧=低分(但逆向看是机会)。这里按"当前市场状态"打分：
  // 贪婪=市场已在涨(高分但风险积聚)，恐惧=市场在跌(低分)。取字面值本身。
  return v;
}
function scorePremium(pct: number | null): number | null {
  if (pct === null) return null;
  // 持续高正溢价=美国资金强买=看涨。映射：>0.3%->80, 0~0.3%->60, -0.3~0%->40, <-0.3%->20
  if (pct >= 0.3) return 80;
  if (pct >= 0) return 60;
  if (pct >= -0.3) return 40;
  return 20;
}
function scorePiCycle(triggered: boolean): number {
  return triggered ? 10 : 60; // 触发顶部预警=极低分
}

interface Weights { deviation: number; fearGreed: number; premium: number; piCycle: number; }

function computeBullBearScore(
  dev: number | null, fng: number | null, premiumPct: number | null, piCycle: boolean,
): { score: number; label: string; color: string; usedWeights: Weights } | null {
  const items: Array<{ key: keyof Weights; val: number; w: number }> = [];
  const d = scoreDeviation(dev);    if (d !== null) items.push({ key: 'deviation', val: d, w: 0.40 });
  const f = scoreFearGreed(fng);    if (f !== null) items.push({ key: 'fearGreed', val: f, w: 0.30 });
  const p = scorePremium(premiumPct); if (p !== null) items.push({ key: 'premium', val: p, w: 0.20 });
  items.push({ key: 'piCycle', val: scorePiCycle(piCycle), w: 0.10 });

  if (items.length === 0) return null;
  // 按可用项重新归一化权重
  const totalW = items.reduce((s, i) => s + i.w, 0);
  const score = Math.round(items.reduce((s, i) => s + (i.val * i.w) / totalW, 0));

  let label: string, color: string;
  if (score < 25) { label = '极度看跌'; color = DARK_THEME.negative; }
  else if (score < 45) { label = '看跌'; color = DARK_THEME.negative; }
  else if (score < 55) { label = '中性'; color = DARK_THEME.textMuted; }
  else if (score < 75) { label = '看涨'; color = DARK_THEME.positive; }
  else { label = '极度看涨'; color = DARK_THEME.positive; }

  const usedWeights: Weights = { deviation: 0, fearGreed: 0, premium: 0, piCycle: 0 };
  items.forEach(i => { usedWeights[i.key] = i.w / totalW; });
  return { score, label, color, usedWeights };
}

// 恐惧贪婪情绪标签（中文）
function fngLabel(v: number | null): string {
  if (v === null) return '—';
  if (v < 25) return '极度恐惧';
  if (v < 45) return '恐惧';
  if (v < 55) return '中性';
  if (v < 75) return '贪婪';
  return '极度贪婪';
}
function fngColor(v: number | null): string {
  if (v === null) return DARK_THEME.textMuted;
  if (v < 25) return DARK_THEME.negative;
  if (v < 45) return '#b8860b';
  if (v < 55) return DARK_THEME.textMuted;
  if (v < 75) return '#8a6d0b';
  return DARK_THEME.positive;
}

// 200日均线偏离标签
function devLabel(dev: number | null): string {
  if (dev === null) return '—';
  if (dev <= -10) return '低估（机会区）';
  if (dev <= 10) return '合理区间';
  if (dev <= 30) return '偏热';
  return '过热（风险区）';
}

/**
 * 加密牛熊综合判断面板。
 * Coinbase 溢价（带阈值标注）+ 恐惧贪婪 + 200日均线偏离 + Pi Cycle + 综合评分。
 */
export function CoinbasePremiumPanel() {
  const premiumQ = useCoinbasePremium();
  const signalsQ = useCryptoSignals();
  const premium = premiumQ.data;
  const signals = signalsQ.data;

  const loading = (premiumQ.isLoading && !premium) || (signalsQ.isLoading && !signals);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e91d2a]"></div>
      </div>
    );
  }

  // 综合评分
  const bullBear = computeBullBearScore(
    signals?.deviationPct ?? null,
    signals?.fearGreed ?? null,
    premium?.premiumPercent ?? null,
    signals?.piCycleSignal ?? false,
  );

  // 溢价异常阈值标注
  const premiumPct = premium?.premiumPercent;
  const isAbnormalPremium = premiumPct !== null && premiumPct !== undefined && Math.abs(premiumPct) >= 0.5;

  const normalized: NormalizedIndicator | null = premium ? {
    id: 'coinbase-btc-premium',
    name: 'Coinbase 溢价',
    value: premium.premium,
    unit: 'USD',
    timestamp: premium.timestamp,
    historical: premium.historical,
  } : null;

  return (
    <div className="space-y-3">
      {/* 综合牛熊评分条 */}
      {bullBear && (
        <div className="rounded-lg p-4 border" style={{ backgroundColor: DARK_THEME.panel, borderColor: DARK_THEME.border }}>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs" style={{ color: DARK_THEME.textMuted }}>综合牛熊评分</span>
            <span className="text-xs" style={{ color: DARK_THEME.textMuted }}>仅供参考</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold" style={{ color: bullBear.color }}>{bullBear.score}</span>
            <span className="text-lg font-semibold" style={{ color: bullBear.color }}>{bullBear.label}</span>
            <span className="text-xs" style={{ color: DARK_THEME.textMuted }}>/100</span>
          </div>
          {/* 评分进度条 */}
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#e0e0e0' }}>
            <div className="h-full rounded-full" style={{ width: `${bullBear.score}%`, backgroundColor: bullBear.color }} />
          </div>
        </div>
      )}

      {/* Coinbase 溢价（带阈值标注）*/}
      {premium && (
        <div className="rounded-lg p-3" style={{ backgroundColor: DARK_THEME.panel }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: DARK_THEME.textMuted }}>Coinbase 比特币溢价</span>
            {isAbnormalPremium && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: DARK_THEME.warning, color: '#000' }}>
                ⚠️ 异常溢价
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold" style={{ color: premium.premium >= 0 ? DARK_THEME.positive : DARK_THEME.negative }}>
              {premium.premium >= 0 ? '+' : ''}${formatUSD(premium.premium)}
            </span>
            <span className="text-sm" style={{ color: premium.premium >= 0 ? DARK_THEME.positive : DARK_THEME.negative }}>
              ({premium.premium >= 0 ? '+' : ''}{premium.premiumPercent.toFixed(4)}%)
            </span>
          </div>
          <div className="flex gap-4 mt-1 text-xs" style={{ color: DARK_THEME.textMuted }}>
            <span>Coinbase: ${premium.coinbasePrice.toLocaleString('en-US', { maximumFractionDigits: 1 })}</span>
            <span>Binance: ${premium.binancePrice.toLocaleString('en-US', { maximumFractionDigits: 1 })}</span>
          </div>
          {normalized && normalized.historical.length >= 2 && (
            <div className="mt-2">
              <MiniChart data={normalized} height={80} />
            </div>
          )}
        </div>
      )}

      {/* 恐惧贪婪 + 200日均线偏离 双列 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 恐惧贪婪 */}
        <div className="rounded-lg p-3" style={{ backgroundColor: DARK_THEME.panel }}>
          <div className="text-xs mb-1" style={{ color: DARK_THEME.textMuted }}>恐惧贪婪指数</div>
          {signals?.fearGreed !== null && signals?.fearGreed !== undefined ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold" style={{ color: fngColor(signals.fearGreed) }}>{signals.fearGreed}</span>
                <span className="text-xs" style={{ color: fngColor(signals.fearGreed) }}>{fngLabel(signals.fearGreed)}</span>
              </div>
              <div className="text-xs mt-1" style={{ color: DARK_THEME.textMuted }}>
                昨日: {signals.fearGreedYesterday ?? '—'}
                {signals.fearGreedYesterday !== null && signals.fearGreed !== null && (
                  <span style={{ color: signals.fearGreed >= signals.fearGreedYesterday ? DARK_THEME.positive : DARK_THEME.negative }}>
                    {' '}({signals.fearGreed >= signals.fearGreedYesterday ? '+' : ''}{signals.fearGreed - signals.fearGreedYesterday})
                  </span>
                )}
              </div>
              {/* 0-100 刻度条 */}
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#e0e0e0' }}>
                <div className="h-full rounded-full" style={{ width: `${signals.fearGreed}%`, backgroundColor: fngColor(signals.fearGreed) }} />
              </div>
            </>
          ) : (
            <span className="text-xs" style={{ color: DARK_THEME.textMuted }}>数据不可用</span>
          )}
        </div>

        {/* 200日均线偏离 */}
        <div className="rounded-lg p-3" style={{ backgroundColor: DARK_THEME.panel }}>
          <div className="text-xs mb-1" style={{ color: DARK_THEME.textMuted }}>200日均线偏离</div>
          {signals?.deviationPct !== null && signals?.deviationPct !== undefined ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold" style={{ color: signals.deviationPct >= 0 ? DARK_THEME.positive : DARK_THEME.negative }}>
                  {signals.deviationPct >= 0 ? '+' : ''}{signals.deviationPct.toFixed(2)}%
                </span>
              </div>
              <div className="text-xs mt-1" style={{ color: DARK_THEME.textMuted }}>{devLabel(signals.deviationPct)}</div>
              <div className="text-xs mt-1" style={{ color: DARK_THEME.textMuted }}>
                当前价{signals.aboveMa200 ? '高于' : '低于'}200日均线
              </div>
              <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>
                MA200: ${signals.ma200?.toLocaleString('en-US', { maximumFractionDigits: 0 }) ?? '—'}
              </div>
            </>
          ) : (
            <span className="text-xs" style={{ color: DARK_THEME.textMuted }}>数据不可用</span>
          )}
        </div>
      </div>

      {/* Pi Cycle 信号 */}
      {signals && (
        <div className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: DARK_THEME.panel }}>
          <div>
            <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>Pi Cycle 顶部信号</div>
            <div className="text-xs mt-0.5" style={{ color: DARK_THEME.textMuted }}>
              MA111 {signals.ma111 ? '$' + signals.ma111.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
              {' vs '}MA350×2 {signals.ma350 ? '$' + (signals.ma350 * 2).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
            </div>
          </div>
          {signals.piCycleSignal ? (
            <span className="text-sm font-bold px-3 py-1 rounded" style={{ backgroundColor: DARK_THEME.negative, color: '#fff' }}>
              ⚠️ 顶部预警
            </span>
          ) : (
            <span className="text-sm px-3 py-1 rounded" style={{ backgroundColor: DARK_THEME.background, color: DARK_THEME.textMuted }}>
              未触发
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <LastUpdated timestamp={signals?.timestamp ?? premium?.timestamp ?? new Date()} />
        <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
          溢价1min · 信号1h
        </p>
      </div>
    </div>
  );
}
