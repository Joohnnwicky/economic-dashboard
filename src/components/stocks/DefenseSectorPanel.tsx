import ReactECharts from 'echarts-for-react';
import { useDefenseSector } from '../../hooks/useDefenseSector';
import { MacroSeries } from '../../api/tushare-backend';
import { sliceByTimeRange } from '../../utils/formatters';
import { useDashboardStore } from '../../stores/dashboardStore';
import { DARK_THEME } from '../../constants/colors';

/**
 * 相对表现：两条指数各自归一化为期初=100 的净值曲线，直观比较军工相对大盘强弱。
 */
function RelativeChart({ defense, sse }: { defense: MacroSeries; sse: MacroSeries | null }) {
  const sseByDate = new Map((sse?.historical ?? []).map((p) => [p.timestamp.slice(0, 10), p.value]));
  const base = defense.historical[0]?.value ?? null;
  const sseBase = defense.historical
    .map((p) => sseByDate.get(p.timestamp.slice(0, 10)))
    .find((v) => v !== undefined) ?? null;

  if (base === null || base === 0) {
    return <div className="h-40 flex items-center justify-center text-sm" style={{ color: DARK_THEME.textMuted }}>暂无数据</div>;
  }

  const dates = defense.historical.map((p) => p.timestamp.slice(0, 10));
  const defenseNav = defense.historical.map((p) => +((p.value / base) * 100).toFixed(2));
  const sseNav = dates.map((d) => {
    const v = sseByDate.get(d);
    return v !== undefined && sseBase ? +((v / sseBase) * 100).toFixed(2) : null;
  });

  const option = {
    backgroundColor: DARK_THEME.background,
    textStyle: { color: DARK_THEME.text },
    grid: { left: '12%', right: '5%', top: '15%', bottom: '12%' },
    legend: {
      show: true,
      top: '2%',
      textStyle: { color: DARK_THEME.text },
    },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: DARK_THEME.panel,
      borderColor: DARK_THEME.gridLine,
      textStyle: { color: DARK_THEME.text },
      valueFormatter: (v: number | null) => (v === null ? '—' : String(v)),
    },
    xAxis: {
      type: 'category' as const,
      data: dates,
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: { color: DARK_THEME.textMuted },
    },
    yAxis: {
      type: 'value' as const,
      scale: true,
      name: '净值(期初=100)',
      nameTextStyle: { color: DARK_THEME.textMuted },
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: { color: DARK_THEME.textMuted },
      splitLine: { lineStyle: { color: DARK_THEME.gridLine, opacity: 0.3 } },
    },
    series: [
      {
        name: defense.name,
        type: 'line' as const,
        data: defenseNav,
        symbol: 'none',
        lineStyle: { color: DARK_THEME.accent[0], width: 2 },
      },
      ...(sse
        ? [{
            name: sse.name,
            type: 'line' as const,
            data: sseNav,
            symbol: 'none',
            lineStyle: { color: DARK_THEME.textMuted, width: 1.5, type: 'dashed' as const },
          }]
        : []),
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '220px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}

function IndexCard({ s, highlight }: { s: MacroSeries | null; highlight?: boolean }) {
  const up = (s?.pctChange ?? 0) >= 0;
  return (
    <div className="p-2 rounded text-center" style={{ backgroundColor: DARK_THEME.cardBg }}>
      <div className="text-xs mb-1" style={{ color: DARK_THEME.textMuted }}>
        {s?.name ?? '暂无数据'}
      </div>
      <div
        className="text-xl font-semibold"
        style={{ color: highlight && s ? (up ? DARK_THEME.positive : DARK_THEME.negative) : DARK_THEME.text }}
      >
        {s ? s.value.toFixed(2) : '—'}
      </div>
      <div
        className="text-xs"
        style={{ color: s && s.pctChange !== null && s.pctChange !== undefined ? (up ? DARK_THEME.positive : DARK_THEME.negative) : DARK_THEME.textMuted }}
      >
        {s?.pctChange !== null && s?.pctChange !== undefined
          ? `${up ? '+' : ''}${s.pctChange.toFixed(2)}%`
          : '—'}
      </div>
    </div>
  );
}

const RANGE_LABEL: Record<string, string> = {
  '1M': '近1月', '3M': '近3月', '6M': '近6月', '1Y': '近1年', ALL: '全部',
};

export function DefenseSectorPanel() {
  const { series, errors, isLoading, error } = useDefenseSector();
  const globalRange = useDashboardStore((state) => state.timeRange);

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
        指数数据加载失败，请检查后端服务是否启动
      </div>
    );
  }

  const defense = series['CSI_DEFENSE'] ?? null;
  const sse = series['SSE_COMP'] ?? null;
  const noToken = errors['tushare'];

  if (!defense) {
    return (
      <div className="p-2 rounded text-xs leading-5" style={{ color: DARK_THEME.textMuted }}>
        {noToken ?? Object.values(errors)[0] ?? '军工指数数据获取失败'}。
        <br />
        指数日线使用 Tushare index_daily 接口，请确认 TUSHARE_TOKEN 已配置且有相应权限。
      </div>
    );
  }

  const failed = Object.keys(errors).filter((k) => k !== 'tushare');

  // 跟随顶部时间范围选择器切片；窗口内点太少则回退全量
  const cut = (s: MacroSeries | null) =>
    s ? { ...s, historical: sliceByTimeRange(s.historical, globalRange) } : null;
  const defenseWin = cut(defense);
  const sseWin = cut(sse);
  if (defenseWin && defenseWin.historical.length < 5) {
    defenseWin.historical = defense.historical;
    if (sseWin) sseWin.historical = sse?.historical ?? [];
  }
  if (!defenseWin) return null; // defense 上方已判空，此处仅为类型收窄

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <IndexCard s={defense} highlight />
        <IndexCard s={sse} />
      </div>

      <RelativeChart defense={defenseWin} sse={sseWin} />

      <p className="text-xs mt-2" style={{ color: DARK_THEME.textMuted }}>
        数据来源: Tushare index_daily · {RANGE_LABEL[globalRange] ?? '近1年'}净值对比（期初=100，虚线为上证指数）
        {failed.length > 0 && (
          <>
            {' · '}
            <span style={{ color: DARK_THEME.negative }}>部分指数缺失（{failed.join('、')}）</span>
          </>
        )}
      </p>
    </div>
  );
}
