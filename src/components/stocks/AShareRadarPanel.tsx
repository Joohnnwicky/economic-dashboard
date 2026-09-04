import { useCustomStocksStore } from '../../stores/customStocksStore';
import { useAShareRadar } from '../../hooks/useAShareRadar';
import { AShareRadarStock } from '../../api/tushare-backend';
import { DARK_THEME } from '../../constants/colors';

const fmt = (v: number | null | undefined, digits = 2, suffix = ''): string =>
  v === null || v === undefined ? '—' : `${v.toFixed(digits)}${suffix}`;

/** 涨红跌绿（A股惯例） */
const yoyColor = (v: number | null | undefined): string => {
  if (v === null || v === undefined) return DARK_THEME.textMuted;
  return v >= 0 ? DARK_THEME.positive : DARK_THEME.negative;
};

function RiskTags({ stock }: { stock: AShareRadarStock }) {
  const { risks } = stock;
  const tags: { text: string; tone: 'warn' | 'info' }[] = [];
  if (risks.pledgeRatio !== null && risks.pledgeRatio > 0) {
    tags.push({ text: `质押 ${risks.pledgeRatio.toFixed(1)}%`, tone: risks.pledgeRatio > 20 ? 'warn' : 'info' });
  }
  for (const f of risks.upcomingFloats.slice(0, 2)) {
    tags.push({ text: `解禁 ${f.date?.slice(0, 10) ?? '—'} (${fmt(f.ratio, 1, '%')})`, tone: 'warn' });
  }
  if (risks.recentBlocks.length > 0) {
    tags.push({ text: `大宗 ${risks.recentBlocks.length}笔`, tone: 'info' });
  }
  if (risks.dragonTiger.length > 0) {
    const latest = risks.dragonTiger[0];
    const pct = latest.pctChange;
    tags.push({
      text: `龙虎榜 ${latest.date?.slice(5, 10) ?? ''}${pct !== null && pct !== undefined ? (pct >= 0 ? ` +${pct.toFixed(1)}%` : ` ${pct.toFixed(1)}%`) : ''}`,
      tone: 'warn',
    });
  }
  if (tags.length === 0) {
    return <span style={{ color: DARK_THEME.textMuted }}>—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t, i) => (
        <span
          key={i}
          className="px-1.5 py-0.5 text-[10px] rounded"
          style={{
            border: `1px solid ${t.tone === 'warn' ? DARK_THEME.positive : DARK_THEME.textMuted}`,
            color: t.tone === 'warn' ? DARK_THEME.positive : DARK_THEME.textMuted,
          }}
        >
          {t.text}
        </span>
      ))}
    </div>
  );
}

export function AShareRadarPanel() {
  const stocks = useCustomStocksStore((state) => state.stocks);
  const codes = stocks.map((s) => s.code);
  const nameByCode = new Map(stocks.map((s) => [s.code, s.name]));
  const { stocks: radarStocks, errors, isLoading, error } = useAShareRadar(codes);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e91d2a]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 rounded text-sm" style={{ color: DARK_THEME.negative }}>
        雷达数据加载失败，请检查后端服务是否启动
      </div>
    );
  }

  const noToken = errors['tushare'];
  if (radarStocks.length === 0 && noToken) {
    return (
      <div className="p-2 rounded text-xs leading-5" style={{ color: DARK_THEME.textMuted }}>
        未配置 TUSHARE_TOKEN，雷达功能不可用。
        <br />
        在 backend/.env 中配置 TUSHARE_TOKEN 后重启后端即可启用
        （估值/财务/质押/解禁/龙虎榜等模块按 Tushare 积分权限逐项降级）。
      </div>
    );
  }

  const failedModules = Object.keys(errors);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ color: DARK_THEME.text }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${DARK_THEME.gridLine}` }}>
              {['股票', '收盘', 'PE(TTM)', 'PB', '换手', 'ROE', '净利同比', '风险事件'].map((h) => (
                <th
                  key={h}
                  className="px-1 py-1 text-left font-semibold whitespace-nowrap"
                  style={{ color: DARK_THEME.textMuted }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {radarStocks.map((s) => (
              <tr key={s.code} style={{ borderBottom: `1px solid ${DARK_THEME.gridLine}22` }}>
                <td className="px-1 py-1.5 whitespace-nowrap">
                  <span className="font-semibold">{nameByCode.get(s.code) ?? s.tsCode}</span>
                  <span className="ml-1 text-[10px]" style={{ color: DARK_THEME.textMuted }}>
                    {s.code}
                  </span>
                </td>
                <td className="px-1 py-1.5 whitespace-nowrap">{fmt(s.valuation?.close)}</td>
                <td className="px-1 py-1.5">{fmt(s.valuation?.peTtm, 1)}</td>
                <td className="px-1 py-1.5">{fmt(s.valuation?.pb, 2)}</td>
                <td className="px-1 py-1.5">{fmt(s.valuation?.turnoverRate, 2, '%')}</td>
                <td className="px-1 py-1.5">{fmt(s.finance?.roe, 2)}</td>
                <td className="px-1 py-1.5 font-semibold" style={{ color: yoyColor(s.finance?.netProfitYoy) }}>
                  {fmt(s.finance?.netProfitYoy, 1, '%')}
                </td>
                <td className="px-1 py-1.5 min-w-40">
                  <RiskTags stock={s} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        数据来源: Tushare · 估值每日更新 · 财务随财报 · 缓存30分钟
        {failedModules.length > 0 && (
          <>
            {' · '}
            <span style={{ color: DARK_THEME.negative }}>
              部分模块无数据（{failedModules.join('、')}，多为积分权限限制）
            </span>
          </>
        )}
      </p>
    </div>
  );
}
