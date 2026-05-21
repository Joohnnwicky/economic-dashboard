import { useChinaMacro } from '../../hooks/useChinaMacro';
import { MiniChart } from '../charts/MiniChart';
import { DARK_THEME } from '../../constants/colors';
import { chinaMacroToNormalizedIndicator } from '../../api/china-macro';

// Format large GDP values to readable format
function formatMacroValue(value: number, seriesId: string): string {
  if (seriesId === 'CHNGDPNQDSMEI') {
    // GDP in trillions of dollars
    if (value >= 1e12) {
      return `${(value / 1e12).toFixed(2)}万亿`;
    } else if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)}十亿`;
    }
  }
  return value.toFixed(2);
}

export function ChinaMacroPanel() {
  const { gdp, cpi, ip, isLoading, error } = useChinaMacro('1Y');

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

  return (
    <div className="p-4 rounded-lg border space-y-4" style={{ backgroundColor: DARK_THEME.panel, borderColor: DARK_THEME.gridLine }}>
      {/* Header */}
      <h3 className="text-lg font-medium" style={{ color: DARK_THEME.text }}>
        中国宏观经济指标（China Macro Indicators）
      </h3>

      {/* Indicator Cards */}
      <div className="space-y-3">
        {/* GDP */}
        {gdp && (
          <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: DARK_THEME.background }}>
            <div className="flex-1">
              <span className="font-medium" style={{ color: DARK_THEME.text }}>{gdp.name}</span>
              <span className="ml-2 text-sm" style={{ color: DARK_THEME.textMuted }}>
                (季度)
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold" style={{ color: DARK_THEME.text }}>
                {formatMacroValue(gdp.value, gdp.seriesId)}
              </span>
              <span className="ml-1 text-sm" style={{ color: DARK_THEME.textMuted }}>
                美元
              </span>
              {gdp.yoyChange !== undefined && (
                <span
                  className="ml-2 px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: gdp.yoyChange >= 0 ? `${DARK_THEME.positive}20` : `${DARK_THEME.negative}20`,
                    color: gdp.yoyChange >= 0 ? DARK_THEME.positive : DARK_THEME.negative,
                  }}
                >
                  YoY: {gdp.yoyChange >= 0 ? '+' : ''}{gdp.yoyChange.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        )}

        {/* CPI */}
        {cpi && (
          <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: DARK_THEME.background }}>
            <div className="flex-1">
              <span className="font-medium" style={{ color: DARK_THEME.text }}>{cpi.name}</span>
              <span className="ml-2 text-sm" style={{ color: DARK_THEME.textMuted }}>
                (月度同比)
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold" style={{ color: DARK_THEME.text }}>
                {cpi.value.toFixed(1)}
              </span>
              <span className="ml-1 text-sm" style={{ color: DARK_THEME.textMuted }}>
                %
              </span>
            </div>
          </div>
        )}

        {/* Industrial Production */}
        {ip && (
          <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: DARK_THEME.background }}>
            <div className="flex-1">
              <span className="font-medium" style={{ color: DARK_THEME.text }}>{ip.name}</span>
              <span className="ml-2 text-sm" style={{ color: DARK_THEME.textMuted }}>
                (月度指数)
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold" style={{ color: DARK_THEME.text }}>
                {ip.value.toFixed(1)}
              </span>
              <span className="ml-1 text-sm" style={{ color: DARK_THEME.textMuted }}>
                指数
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mini Chart - GDP */}
      {gdp && gdp.historical.length > 0 && (
        <MiniChart data={chinaMacroToNormalizedIndicator(gdp)} height={60} />
      )}

      {/* Update Frequency Notice */}
      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        数据来源: FRED API | GDP季度更新, CPI/工业生产月度更新
      </p>
    </div>
  );
}