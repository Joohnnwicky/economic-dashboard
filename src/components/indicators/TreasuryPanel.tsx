import { useTreasuryYields } from '../../hooks/useTreasury';
import { IndicatorCard } from '../ui/IndicatorCard';
import { MiniChart } from '../charts/MiniChart';
import { DARK_THEME } from '../../constants/colors';
import { treasuryToNormalizedIndicator } from '../../api/treasury';

export function TreasuryPanel() {
  const { dgs10, dgs2, dgs30, dgs3mo, spread, isLoading, error } = useTreasuryYields('1Y');

  if (isLoading && !dgs10) {
    return (
      <div className="p-4 rounded-lg border" style={{ backgroundColor: DARK_THEME.panel, borderColor: DARK_THEME.gridLine }}>
        <h3 className="text-lg font-medium mb-4" style={{ color: DARK_THEME.text }}>
          美国国债收益率（US Treasury Yields）
        </h3>
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
        </div>
      </div>
    );
  }

  if (error && !dgs10) {
    return (
      <div className="p-4 rounded-lg border" style={{ backgroundColor: DARK_THEME.panel, borderColor: DARK_THEME.gridLine }}>
        <h3 className="text-lg font-medium mb-4" style={{ color: DARK_THEME.text }}>
          美国国债收益率（US Treasury Yields）
        </h3>
        <div className="p-4 bg-red-900/20 rounded text-red-400">
          加载失败: {error.message}
        </div>
      </div>
    );
  }

  // Determine curve status
  const curveStatus = spread !== undefined
    ? (spread >= 0 ? '正常' : '倒挂')
    : '未知';
  const curveColor = spread !== undefined
    ? (spread >= 0 ? DARK_THEME.positive : DARK_THEME.negative)
    : DARK_THEME.textMuted;

  return (
    <div className="p-4 rounded-lg border space-y-4" style={{ backgroundColor: DARK_THEME.panel, borderColor: DARK_THEME.gridLine }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium" style={{ color: DARK_THEME.text }}>
          美国国债收益率（US Treasury Yields）
        </h3>
        {/* Yield Curve Status */}
        {spread !== undefined && (
          <span
            className="px-2 py-1 rounded text-sm"
            style={{ backgroundColor: `${curveColor}20`, color: curveColor }}
          >
            收益率曲线: {curveStatus} ({spread.toFixed(2)}%)
          </span>
        )}
      </div>

      {/* Yield Cards - Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* 10Y */}
        {dgs10 && (
          <IndicatorCard
            title={dgs10.name}
            value={dgs10.value}
            unit={dgs10.unit}
            lastUpdated={dgs10.timestamp}
          />
        )}

        {/* 2Y */}
        {dgs2 && (
          <IndicatorCard
            title={dgs2.name}
            value={dgs2.value}
            unit={dgs2.unit}
            lastUpdated={dgs2.timestamp}
          />
        )}

        {/* 30Y */}
        {dgs30 && (
          <IndicatorCard
            title={dgs30.name}
            value={dgs30.value}
            unit={dgs30.unit}
            lastUpdated={dgs30.timestamp}
          />
        )}

        {/* 3MO */}
        {dgs3mo && (
          <IndicatorCard
            title={dgs3mo.name}
            value={dgs3mo.value}
            unit={dgs3mo.unit}
            lastUpdated={dgs3mo.timestamp}
          />
        )}
      </div>

      {/* Mini Charts - 10Y and 2Y */}
      <div className="grid grid-cols-2 gap-4">
        {dgs10 && <MiniChart data={treasuryToNormalizedIndicator(dgs10)} height={80} />}
        {dgs2 && <MiniChart data={treasuryToNormalizedIndicator(dgs2)} height={80} />}
      </div>

      {/* Update Frequency Notice */}
      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        数据每日更新 (FRED API) | 收益率曲线倒挂(10Y-2Y&lt;0)通常预示经济衰退
      </p>
    </div>
  );
}