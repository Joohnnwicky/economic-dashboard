import { useChinaMacro } from '../../hooks/useChinaMacroBackend';
import { MiniChart } from '../charts/MiniChart';
import { DARK_THEME } from '../../constants/colors';
import { chinaMacroBackendToNormalized } from '../../api/china-macro-backend';

// Format large M2 values to readable format
function formatM2Value(value: number): string {
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}万亿`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}千亿`;
  }
  return value.toFixed(0);
}

// Format value with +/- sign and color
function formatChangeValue(value: number): { text: string; color: string } {
  const isPositive = value >= 0;
  const sign = isPositive ? '+' : '';
  const color = isPositive ? DARK_THEME.positive : DARK_THEME.negative;
  return {
    text: `${sign}${value.toFixed(1)}`,
    color,
  };
}

export function ChinaMacroPanel() {
  const { gdp, cpi, ppi, m2, isLoading, error } = useChinaMacro();

  if (isLoading && !gdp) {
    return (
      <div className="p-4 rounded-lg border" style={{ backgroundColor: DARK_THEME.panel, borderColor: DARK_THEME.gridLine }}>
        <h3 className="text-lg font-medium mb-4" style={{ color: DARK_THEME.text }}>
          中国宏观经济指标（China Macro Indicators）
        </h3>
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
        </div>
      </div>
    );
  }

  if (error && !gdp) {
    return (
      <div className="p-4 rounded-lg border" style={{ backgroundColor: DARK_THEME.panel, borderColor: DARK_THEME.gridLine }}>
        <h3 className="text-lg font-medium mb-4" style={{ color: DARK_THEME.text }}>
          中国宏观经济指标（China Macro Indicators）
        </h3>
        <div className="p-4 bg-red-900/20 rounded text-red-400">
          加载失败: {error.message}
        </div>
      </div>
    );
  }

  const gdpFormatted = gdp ? formatChangeValue(gdp.value) : null;
  const cpiFormatted = cpi ? formatChangeValue(cpi.value) : null;
  const ppiFormatted = ppi ? formatChangeValue(ppi.value) : null;

  return (
    <div className="p-4 rounded-lg border space-y-4" style={{ backgroundColor: DARK_THEME.panel, borderColor: DARK_THEME.gridLine }}>
      {/* Header */}
      <h3 className="text-lg font-medium" style={{ color: DARK_THEME.text }}>
        中国宏观经济指标（China Macro Indicators）
      </h3>

      {/* Indicator Cards */}
      <div className="space-y-3">
        {/* GDP */}
        {gdp && gdpFormatted && (
          <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: DARK_THEME.background }}>
            <div className="flex-1">
              <span className="font-medium" style={{ color: DARK_THEME.text }}>{gdp.name}</span>
              <span className="ml-2 text-sm" style={{ color: DARK_THEME.textMuted }}>
                (季度)
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold" style={{ color: gdpFormatted.color }}>
                {gdpFormatted.text}
              </span>
              <span className="ml-1 text-sm" style={{ color: DARK_THEME.textMuted }}>
                {gdp.unit}
              </span>
            </div>
          </div>
        )}

        {/* CPI */}
        {cpi && cpiFormatted && (
          <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: DARK_THEME.background }}>
            <div className="flex-1">
              <span className="font-medium" style={{ color: DARK_THEME.text }}>{cpi.name}</span>
              <span className="ml-2 text-sm" style={{ color: DARK_THEME.textMuted }}>
                (月度)
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold" style={{ color: cpiFormatted.color }}>
                {cpiFormatted.text}
              </span>
              <span className="ml-1 text-sm" style={{ color: DARK_THEME.textMuted }}>
                {cpi.unit}
              </span>
            </div>
          </div>
        )}

        {/* PPI */}
        {ppi && ppiFormatted && (
          <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: DARK_THEME.background }}>
            <div className="flex-1">
              <span className="font-medium" style={{ color: DARK_THEME.text }}>{ppi.name}</span>
              <span className="ml-2 text-sm" style={{ color: DARK_THEME.textMuted }}>
                (月度)
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold" style={{ color: ppiFormatted.color }}>
                {ppiFormatted.text}
              </span>
              <span className="ml-1 text-sm" style={{ color: DARK_THEME.textMuted }}>
                {ppi.unit}
              </span>
            </div>
          </div>
        )}

        {/* M2 */}
        {m2 && (
          <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: DARK_THEME.background }}>
            <div className="flex-1">
              <span className="font-medium" style={{ color: DARK_THEME.text }}>{m2.name}</span>
              <span className="ml-2 text-sm" style={{ color: DARK_THEME.textMuted }}>
                (月度)
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold" style={{ color: DARK_THEME.text }}>
                {formatM2Value(m2.value)}
              </span>
              <span className="ml-1 text-sm" style={{ color: DARK_THEME.textMuted }}>
                元
              </span>
              {m2.yoyChange !== undefined && (
                <span
                  className="ml-2 px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: m2.yoyChange >= 0 ? `${DARK_THEME.positive}20` : `${DARK_THEME.negative}20`,
                    color: m2.yoyChange >= 0 ? DARK_THEME.positive : DARK_THEME.negative,
                  }}
                >
                  YoY: {m2.yoyChange >= 0 ? '+' : ''}{m2.yoyChange.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mini Charts */}
      <div className="grid grid-cols-2 gap-4">
        {gdp && gdp.historical.length > 0 && (
          <MiniChart data={chinaMacroBackendToNormalized(gdp)} height={80} isDaily={true} />
        )}
        {cpi && cpi.historical.length > 0 && (
          <MiniChart data={chinaMacroBackendToNormalized(cpi)} height={80} isDaily={true} />
        )}
        {ppi && ppi.historical.length > 0 && (
          <MiniChart data={chinaMacroBackendToNormalized(ppi)} height={80} isDaily={true} />
        )}
        {m2 && m2.historical.length > 0 && (
          <MiniChart data={chinaMacroBackendToNormalized(m2)} height={80} isDaily={true} />
        )}
      </div>

      {/* Update Frequency Notice */}
      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        数据来源: AkShare (国家统计局) | GDP季度更新, CPI/PPI/M2月度更新
      </p>
    </div>
  );
}