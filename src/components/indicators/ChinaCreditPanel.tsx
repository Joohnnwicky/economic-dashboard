import { useChinaMacro } from '../../hooks/useChinaMacroBackend';
import { chinaMacroBackendToNormalized } from '../../api/china-macro-backend';
import { MiniChart } from '../charts/MiniChart';
import { DARK_THEME } from '../../constants/colors';

function formatCreditValue(value: number): string {
  if (Math.abs(value) >= 10000) return `${(value / 10000).toFixed(2)}万亿`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}千亿`;
  return value.toFixed(0);
}

export function ChinaCreditPanel() {
  const { m2, credit, isLoading, error } = useChinaMacro();

  if (isLoading && !m2) {
    return (
      <div className="p-4 rounded-lg border" style={{ backgroundColor: DARK_THEME.panel, borderColor: DARK_THEME.gridLine }}>
        <h3 className="text-lg font-medium mb-4" style={{ color: DARK_THEME.text }}>
          中国信贷数据（China Credit Data）
        </h3>
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
        </div>
      </div>
    );
  }

  if (error && !m2) {
    return (
      <div className="p-4 rounded-lg border" style={{ backgroundColor: DARK_THEME.panel, borderColor: DARK_THEME.gridLine }}>
        <h3 className="text-lg font-medium mb-4" style={{ color: DARK_THEME.text }}>
          中国信贷数据（China Credit Data）
        </h3>
        <div className="p-4 bg-red-900/20 rounded text-red-400">
          加载失败: {error.message}
        </div>
      </div>
    );
  }

  const items = [
    { data: m2, label: 'M2余额' },
    { data: credit?.social_financing, label: '社融增量' },
    { data: credit?.new_loans, label: '新增贷款' },
  ].filter(s => s.data !== null && s.data !== undefined);

  return (
    <div className="p-4 rounded-lg border space-y-4" style={{ backgroundColor: DARK_THEME.panel, borderColor: DARK_THEME.gridLine }}>
      {/* Header */}
      <h3 className="text-lg font-medium" style={{ color: DARK_THEME.text }}>
        中国信贷数据（China Credit Data）
      </h3>

      {/* Indicator Cards */}
      <div className="space-y-3">
        {items.map((s) => (
          <div key={s.data!.seriesId} className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: DARK_THEME.background }}>
            <div className="flex-1">
              <span className="font-medium" style={{ color: DARK_THEME.text }}>{s.data!.name}</span>
              <span className="ml-2 text-sm" style={{ color: DARK_THEME.textMuted }}>(月度)</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold" style={{ color: DARK_THEME.text }}>
                {formatCreditValue(s.data!.value)}
              </span>
              {s.data!.yoyChange != null && (
                <span
                  className="ml-2 px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: s.data!.yoyChange >= 0 ? `${DARK_THEME.positive}20` : `${DARK_THEME.negative}20`,
                    color: s.data!.yoyChange >= 0 ? DARK_THEME.positive : DARK_THEME.negative,
                  }}
                >
                  YoY: {s.data!.yoyChange >= 0 ? '+' : ''}{s.data!.yoyChange.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mini Charts */}
      <div className="grid grid-cols-3 gap-4">
        {items.map((s) => (
          s.data!.historical.length > 0 && (
            <MiniChart
              key={s.data!.seriesId}
              data={chinaMacroBackendToNormalized(s.data!)}
              height={80}
              isDaily={true}
            />
          )
        ))}
      </div>

      {/* Footer */}
      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        数据来源: AkShare (央行/商务部) | 月度更新
      </p>
    </div>
  );
}
