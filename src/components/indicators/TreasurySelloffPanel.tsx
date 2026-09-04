import ReactECharts from 'echarts-for-react';
import { useTreasuryYields } from '../../hooks/useTreasury';
import { DARK_THEME } from '../../constants/colors';
import { LastUpdated } from '../ui/LastUpdated';
import { HistoricalDataPoint } from '../../types/indicator';

/** 从历史序列取 N 个交易日前值，算 bp 变动（1bp = 0.01%） */
function changeBp(historical: HistoricalDataPoint[], backDays: number): number | null {
  if (historical.length < backDays + 1) return null;
  const current = historical[historical.length - 1].value;
  const previous = historical[historical.length - 1 - backDays].value;
  if (current == null || previous == null) return null;
  return (current - previous) * 100;
}

/** 抛售压力状态: 收益率周变动 >10bp = 抛售压力上升 */
function assessSelloff(weekBp: number | null): { label: string; color: string } | null {
  if (weekBp === null) return null;
  if (weekBp >= 10) return { label: '抛售压力上升', color: DARK_THEME.error };
  if (weekBp >= 3) return { label: '抛售压力温和', color: DARK_THEME.warning };
  if (weekBp > -3) return { label: '抛售压力缓和', color: DARK_THEME.textMuted };
  return { label: '买盘回流', color: DARK_THEME.positive };
}

interface YieldRowProps {
  name: string;
  historical: HistoricalDataPoint[];
  value: number;
  timestamp: Date;
}

function YieldRow({ name, historical, value, timestamp }: YieldRowProps) {
  const dayBp = changeBp(historical, 1);
  const weekBp = changeBp(historical, 5);
  const color = (bp: number | null) =>
    bp == null ? DARK_THEME.textMuted : bp >= 0 ? DARK_THEME.error : DARK_THEME.positive;
  return (
    <div className="flex items-center justify-between p-1.5" style={{ border: `1px solid ${DARK_THEME.border}` }}>
      <div>
        <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>{name}</div>
        <div className="text-lg font-bold" style={{ color: DARK_THEME.text, fontFamily: 'Arial Black, sans-serif' }}>
          {value.toFixed(2)}%
        </div>
      </div>
      <div className="text-right text-xs space-y-0.5">
        <div>
          <span style={{ color: DARK_THEME.textMuted }}>日 </span>
          <span style={{ color: color(dayBp) }}>
            {dayBp == null ? '-' : `${dayBp >= 0 ? '+' : ''}${dayBp.toFixed(1)}bp`}
          </span>
        </div>
        <div>
          <span style={{ color: DARK_THEME.textMuted }}>周 </span>
          <span style={{ color: color(weekBp) }}>
            {weekBp == null ? '-' : `${weekBp >= 0 ? '+' : ''}${weekBp.toFixed(1)}bp`}
          </span>
        </div>
      </div>
      <div className="hidden md:block text-xs" style={{ color: DARK_THEME.textMuted }}>
        <LastUpdated timestamp={timestamp} />
      </div>
    </div>
  );
}

export function TreasurySelloffPanel() {
  const { dgs10, dgs2, dgs30, isLoading, error } = useTreasuryYields('1Y');

  if (isLoading && !dgs10) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
      </div>
    );
  }

  if (error && !dgs10) {
    return (
      <div className="p-4 bg-red-900/20 rounded text-red-400">
        加载失败: {error.message}
      </div>
    );
  }

  if (!dgs30) {
    return <div className="text-sm" style={{ color: DARK_THEME.textMuted }}>暂无数据</div>;
  }

  const weekBp = changeBp(dgs30.historical, 5);
  const selloffAssess = assessSelloff(weekBp);

  const chartOption = {
    backgroundColor: 'transparent',
    grid: { left: '10%', right: '3%', top: '10%', bottom: '15%' },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: { color: DARK_THEME.textMuted, fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: {
        color: DARK_THEME.textMuted, fontSize: 10,
        formatter: (v: number) => `${v.toFixed(1)}%`,
      },
      splitLine: { lineStyle: { color: DARK_THEME.gridLine, type: 'dashed' as const } },
    },
    series: [{
      name: '30Y',
      type: 'line',
      data: dgs30.historical.map((p) => [p.timestamp.getTime(), p.value]),
      symbol: 'none',
      lineStyle: { color: DARK_THEME.accent[6], width: 2 },
      areaStyle: { color: DARK_THEME.accent[6], opacity: 0.08 },
      markLine: {
        silent: true,
        symbol: 'none',
        data: [{ yAxis: 5 }],
        lineStyle: { color: DARK_THEME.error, type: 'dashed' as const, width: 1 },
        label: { color: DARK_THEME.error, fontSize: 10, formatter: '5% 警戒线' },
      },
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: DARK_THEME.panel,
      borderColor: DARK_THEME.gridLine,
      textStyle: { color: DARK_THEME.text, fontSize: 12 },
      valueFormatter: (v: number) => `${Number(v).toFixed(3)}%`,
    },
  };

  return (
    <div className="space-y-3">
      {selloffAssess && (
        <div className="flex justify-end">
          <span
            className="px-2 py-1 rounded text-xs"
            style={{ backgroundColor: `${selloffAssess.color}20`, color: selloffAssess.color, border: `1px solid ${selloffAssess.color}40` }}
          >
            {selloffAssess.label}
          </span>
        </div>
      )}

      {/* 收益率 + 日/周 bp 变动（上升=抛售） */}
      <div className="space-y-2">
        {dgs30 && (
          <YieldRow name={dgs30.name} historical={dgs30.historical} value={dgs30.value} timestamp={dgs30.timestamp} />
        )}
        {dgs10 && (
          <YieldRow name={dgs10.name} historical={dgs10.historical} value={dgs10.value} timestamp={dgs10.timestamp} />
        )}
        {dgs2 && (
          <YieldRow name={dgs2.name} historical={dgs2.historical} value={dgs2.value} timestamp={dgs2.timestamp} />
        )}
      </div>

      {/* 30Y 走势 + 5% 警戒线 */}
      <ReactECharts option={chartOption} style={{ height: '160px', width: '100%' }} opts={{ renderer: 'canvas' }} />

      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        数据每日更新 (FRED) | 国债遭抛售时价格下跌、收益率上升；红色 bp 变动 = 抛售压力
      </p>
    </div>
  );
}
