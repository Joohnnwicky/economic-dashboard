import ReactECharts from 'echarts-for-react';
import { NormalizedIndicator } from '../../types/indicator';
import { DARK_THEME } from '../../constants/colors';
import { formatChartDate, formatPercentage } from '../../utils/formatters';
import { TimeRange } from '../../types/api';

interface LineChartProps {
  data: NormalizedIndicator;
  timeRange?: TimeRange;
  height?: number;
}

export function LineChart({ data, timeRange = '1Y', height = 400 }: LineChartProps) {
  const option = {
    backgroundColor: DARK_THEME.background,
    textStyle: { color: DARK_THEME.text },
    grid: { left: '10%', right: '5%', top: '10%', bottom: '15%' },
    xAxis: {
      type: 'category',
      data: data.historical.map((d) => formatChartDate(d.timestamp, timeRange)),
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: { color: DARK_THEME.textMuted },
    },
    yAxis: {
      type: 'value',
      name: data.unit,
      nameTextStyle: { color: DARK_THEME.textMuted },
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: {
        color: DARK_THEME.textMuted,
        formatter: (value: number) => formatPercentage(value),
      },
      splitLine: { lineStyle: { color: DARK_THEME.gridLine, opacity: 0.3 } },
    },
    series: [
      {
        type: 'line',
        data: data.historical.map((d) => d.value),
        smooth: false,
        symbol: 'none',
        lineStyle: { color: DARK_THEME.accent[0], width: 2 },
        connectNulls: false,
      },
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: DARK_THEME.panel,
      borderColor: DARK_THEME.gridLine,
      textStyle: { color: DARK_THEME.text },
      formatter: (params: unknown) => {
        const point = (params as Array<{ name: string; value: number }>)[0];
        return `${point.name}<br/>${data.name}: ${formatPercentage(point.value)}`;
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