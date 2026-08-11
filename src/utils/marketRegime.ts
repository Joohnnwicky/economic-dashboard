/**
 * 市场机制识别 (Market Regime) - 纯函数规则引擎
 *
 * 输入 VIX + 10Y-2Y 利差, 输出当前市场状态。
 * 规则(优先级从高到低):
 *   1. VIX>=30 且 利差倒挂(<0) -> "危机模式"
 *   2. 利差倒挂(<0)            -> "衰退预警"
 *   3. VIX>=30                 -> "恐慌"
 *   4. VIX>=25                 -> "高波动"
 *   5. VIX<20                  -> "低波动平静"
 *   6. 其余(20-25)             -> "中性"
 *
 * 非完整 HMM(避免训练数据与 sklearn 依赖), 用可解释规则替代。
 */

export type RegimeKey = 'crisis' | 'recession-warning' | 'panic' | 'high-vol' | 'low-vol' | 'neutral';

export interface RegimeInput {
  vix: number | null;
  spread: number | null;  // 10Y-2Y, %
}

export interface RegimeResult {
  key: RegimeKey;
  label: string;
  desc: string;
  color: string;
  signals: { name: string; value: string; flag: 'warn' | 'ok' | 'neutral' }[];
}

// 颜色用 hex 字面量(避免循环依赖 colors.ts 的类型); 与 DARK_THEME 对齐
const COLORS = {
  crisis: '#e91d2a',       // Dell red
  recession: '#8a6d0b',    // amber
  panic: '#e91d2a',        // red
  highVol: '#e6915d',      // peach
  lowVol: '#2e7d2c',       // green
  neutral: '#8c9ae0',      // periwinkle
};

export function classifyRegime(input: RegimeInput): RegimeResult {
  const { vix, spread } = input;
  const inverted = spread !== null && spread < 0;

  const signals: RegimeResult['signals'] = [
    {
      name: 'VIX 恐慌指数',
      value: vix !== null ? vix.toFixed(2) : '-',
      flag: vix === null ? 'neutral' : vix >= 30 ? 'warn' : vix >= 25 ? 'warn' : 'ok',
    },
    {
      name: '10Y-2Y 利差',
      value: spread !== null ? `${spread.toFixed(2)}%` : '-',
      flag: inverted ? 'warn' : 'ok',
    },
  ];

  // 规则判定(优先级从高到低)
  let key: RegimeKey;
  if (vix !== null && vix >= 30 && inverted) {
    key = 'crisis';
  } else if (inverted) {
    key = 'recession-warning';
  } else if (vix !== null && vix >= 30) {
    key = 'panic';
  } else if (vix !== null && vix >= 25) {
    key = 'high-vol';
  } else if (vix !== null && vix < 20) {
    key = 'low-vol';
  } else {
    key = 'neutral';
  }

  const map: Record<RegimeKey, { label: string; desc: string; color: string }> = {
    'crisis': { label: '危机模式', desc: '恐慌且利差倒挂, 历史衰退前兆叠加', color: COLORS.crisis },
    'recession-warning': { label: '衰退预警', desc: '收益率曲线倒挂, 历史上通常预示 12-18 个月内衰退', color: COLORS.recession },
    'panic': { label: '恐慌', desc: 'VIX 飙升至 30 以上, 市场急剧避险', color: COLORS.panic },
    'high-vol': { label: '高波动', desc: 'VIX 偏高, 不确定性与风险溢价上升', color: COLORS.highVol },
    'low-vol': { label: '低波动平静', desc: 'VIX 低位, 市场情绪乐观', color: COLORS.lowVol },
    'neutral': { label: '中性', desc: '指标处于正常区间', color: COLORS.neutral },
  };

  return { key, label: map[key].label, desc: map[key].desc, color: map[key].color, signals };
}
