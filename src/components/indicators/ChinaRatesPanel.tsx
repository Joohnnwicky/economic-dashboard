import { useChinaRates } from '../../hooks/useChinaRates';
import { MultiSeriesChart } from '../charts/MultiSeriesChart';
import { toNormalizedIndicator, MacroSeries } from '../../api/tushare-backend';
import { DARK_THEME } from '../../constants/colors';

/** LPR 1Y/5Y 成对发布，按时间戳配对后展示最近几次调整 */
function LprAdjustments({ lpr1y, lpr5y }: { lpr1y: MacroSeries | null; lpr5y: MacroSeries | null }) {
  if (!lpr1y || !lpr5y) return null;
  const fiveYByTs = new Map(lpr5y.historical.map((p) => [p.timestamp, p.value]));
  const rows = [...lpr1y.historical]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
  // 后端序列已是时间正序，反转后即可计算环比变动
  const asc = [...lpr1y.historical];

  return (
    <table className="w-full text-xs mt-3" style={{ color: DARK_THEME.text }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${DARK_THEME.gridLine}` }}>
          {['公布日', 'LPR 1Y', 'LPR 5Y', '1Y 变动'].map((h) => (
            <th key={h} className="px-1 py-1 text-left" style={{ color: DARK_THEME.textMuted }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => {
          const idx = asc.findIndex((x) => x.timestamp === p.timestamp);
          const prev = idx > 0 ? asc[idx - 1].value : null;
          const deltaBp = prev !== null ? (p.value - prev) * 100 : null;
          return (
            <tr key={p.timestamp} style={{ borderBottom: `1px solid ${DARK_THEME.gridLine}22` }}>
              <td className="px-1 py-1">{p.timestamp.slice(0, 10)}</td>
              <td className="px-1 py-1">{p.value.toFixed(2)}%</td>
              <td className="px-1 py-1">
                {fiveYByTs.get(p.timestamp)?.toFixed(2) ?? '—'}%
              </td>
              <td
                className="px-1 py-1"
                style={{ color: deltaBp === null || deltaBp === 0 ? DARK_THEME.textMuted : deltaBp > 0 ? DARK_THEME.positive : DARK_THEME.negative }}
              >
                {deltaBp === null ? '—' : `${deltaBp > 0 ? '+' : ''}${deltaBp.toFixed(0)}bp`}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function ChinaRatesPanel() {
  const { series, errors, isLoading, error } = useChinaRates();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#58a6ff]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 rounded text-sm" style={{ color: DARK_THEME.negative }}>
        利率数据加载失败，请检查后端服务是否启动
      </div>
    );
  }

  const lpr1y = series['LPR_1Y'] ?? null;
  const lpr5y = series['LPR_5Y'] ?? null;
  const shiborOn = series['SHIBOR_ON'] ?? null;
  const noToken = errors['tushare'];
  const hasData = !!(lpr1y || lpr5y || shiborOn);

  if (!hasData) {
    return (
      <div className="p-2 rounded text-xs leading-5" style={{ color: DARK_THEME.textMuted }}>
        {noToken ?? 'SHIBOR/LPR 数据获取失败'}。
        <br />
        该面板使用 Tushare 利率接口，请确认 TUSHARE_TOKEN 已配置且账号有相应权限。
      </div>
    );
  }

  const failed = Object.keys(errors).filter((k) => k !== 'tushare');

  return (
    <div>
      {/* 最新利率卡片 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'LPR 1年期', s: lpr1y },
          { label: 'LPR 5年期', s: lpr5y },
          { label: 'SHIBOR 隔夜', s: shiborOn },
        ].map(({ label, s }) => (
          <div key={label} className="p-2 rounded text-center" style={{ backgroundColor: DARK_THEME.cardBg }}>
            <div className="text-xs mb-1" style={{ color: DARK_THEME.textMuted }}>{label}</div>
            <div className="text-xl font-semibold" style={{ color: DARK_THEME.text }}>
              {s ? s.value.toFixed(2) : '—'}
              <span className="text-sm ml-1" style={{ color: DARK_THEME.textMuted }}>%</span>
            </div>
            {s && (
              <div className="text-[10px]" style={{ color: DARK_THEME.textMuted }}>
                {s.timestamp.slice(0, 10)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 利率走势（月度采样对齐：SHIBOR 日度取月末值，LPR 月度） */}
      <MultiSeriesChart
        series={[
          ...(shiborOn ? [{ data: toNormalizedIndicator(shiborOn)!, axisPosition: 'left' as const }] : []),
          ...(lpr1y ? [{ data: toNormalizedIndicator(lpr1y)!, axisPosition: 'left' as const }] : []),
          ...(lpr5y ? [{ data: toNormalizedIndicator(lpr5y)!, axisPosition: 'left' as const }] : []),
        ]}
        height={220}
        showLegend={true}
        timeRange="1Y"
      />

      <LprAdjustments lpr1y={lpr1y} lpr5y={lpr5y} />

      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        数据来源: Tushare（SHIBOR & LPR）· SHIBOR 每日更新 / LPR 每月20日
        {failed.length > 0 && (
          <>
            {' · '}
            <span style={{ color: DARK_THEME.negative }}>部分序列缺失（{failed.join('、')}）</span>
          </>
        )}
      </p>
    </div>
  );
}
