import ReactECharts from 'echarts-for-react';
import { HistoricalDataPoint } from '../../types/indicator';
import { DARK_THEME } from '../../constants/colors';

interface YieldSpreadChartProps {
  spread: HistoricalDataPoint[];
  recession: HistoricalDataPoint[];
  height?: number;
}

// 从月度 USREC(0/1) 提取连续衰退期 [startMs, endMs]
function extractRecessionRanges(recession: HistoricalDataPoint[]): [number, number][] {
  const ranges: [number, number][] = [];
  let start: number | null = null;
  for (const p of recession) {
    const t = p.timestamp.getTime();
    if (p.value === 1 && start === null) {
      start = t;
    } else if (p.value !== 1 && start !== null) {
      ranges.push([start, t]);
      start = null;
    }
  }
  if (start !== null && recession.length > 0) {
    ranges.push([start, recession[recession.length - 1].timestamp.getTime()]);
  }
  return ranges;
}

export function YieldSpreadChart({ spread, recession, height = 160 }: YieldSpreadChartProps) {
  const points = spread.filter(p => p.value !== null) as { timestamp: Date; value: number }[];
  if (points.length === 0) return null;

  const values = points.map(p => p.value);
  let yMin = Math.min(...values, 0);
  let yMax = Math.max(...values, 0);
  const pad = (yMax - yMin) * 0.1 || 0.5;
  yMin -= pad;
  yMax += pad;

  const ranges = extractRecessionRanges(recession);

  const option = {
    backgroundColor: 'transparent',
    grid: { left: '8%', right: '5%', top: '8%', bottom: '20%' },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: { color: DARK_THEME.textMuted, fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: {
        color: DARK_THEME.textMuted,
        fontSize: 10,
        formatter: (v: number) => `${v.toFixed(1)}%`,
      },
      splitLine: { show: false },
    },
    series: [{
      type: 'line',
      data: points.map(p => [p.timestamp.getTime(), p.value]),
      smooth: false,
      symbol: 'none',
      lineStyle: { color: DARK_THEME.accent[0], width: 2 },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: DARK_THEME.negative, type: 'dashed', width: 1 },
        label: { formatter: '倒挂(0)', color: DARK_THEME.negative, fontSize: 10 },
        data: [{ yAxis: 0 }],
      },
      markArea: {
        silent: true,
        itemStyle: { color: DARK_THEME.textMuted, opacity: 0.12 },
        label: { show: false },
        data: ranges.map(([s, e]) => [
          { coord: [s, yMax] },
          { coord: [e, yMin] },
        ]),
      },
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: DARK_THEME.panel,
      borderColor: DARK_THEME.gridLine,
      textStyle: { color: DARK_THEME.text, fontSize: 12 },
      formatter: (params: unknown) => {
        const arr = params as Array<{ value: [number, number] }>;
        if (!arr || arr.length === 0) return '';
        const [ts, val] = arr[0].value;
        const d = new Date(ts);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return `${dateStr}<br/>10Y-2Y 利差: ${val.toFixed(2)}%`;
      },
    },
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: `${height}px`, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
