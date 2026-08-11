import { useVix } from '../../hooks/useVix';
import { useYieldSpreadHistory } from '../../hooks/useYieldSpreadHistory';
import { classifyRegime } from '../../utils/marketRegime';
import { DARK_THEME } from '../../constants/colors';

export function MarketRegimePanel() {
  const { data: vixData, isLoading: vixLoading } = useVix();
  const { data: spreadData, isLoading: spreadLoading } = useYieldSpreadHistory();

  if (vixLoading && spreadLoading && !vixData && !spreadData) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
      </div>
    );
  }

  const vix = vixData?.value ?? null;
  // 利差取 T10Y2Y 最新值
  const spreadHist = spreadData?.spread?.historical ?? [];
  const spread = spreadHist.length > 0 ? (spreadHist[spreadHist.length - 1].value ?? null) : null;

  const regime = classifyRegime({ vix, spread });

  return (
    <div className="space-y-3">
      {/* 当前机制徽章 */}
      <div className="p-3" style={{ border: `2px solid ${regime.color}`, backgroundColor: `${regime.color}15` }}>
        <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>当前市场机制</div>
        <div className="text-2xl font-bold mt-1" style={{ color: regime.color, fontFamily: 'Arial Black, sans-serif' }}>
          {regime.label}
        </div>
        <div className="text-xs mt-1" style={{ color: DARK_THEME.text }}>{regime.desc}</div>
      </div>

      {/* 贡献信号 */}
      <div className="space-y-1">
        <div className="text-xs font-bold" style={{ color: DARK_THEME.textMuted }}>贡献信号</div>
        {regime.signals.map((s) => (
          <div key={s.name} className="flex justify-between text-xs">
            <span style={{ color: DARK_THEME.textMuted }}>{s.name}</span>
            <span style={{ color: s.flag === 'warn' ? DARK_THEME.error : s.flag === 'ok' ? DARK_THEME.success : DARK_THEME.textMuted }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        基于 VIX + 10Y-2Y 利差规则引擎 | 非投资建议, 仅供宏观态势参考
      </p>
    </div>
  );
}
