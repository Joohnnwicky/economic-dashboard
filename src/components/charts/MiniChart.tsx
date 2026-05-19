import ReactECharts from 'echarts-for-react';
import { NormalizedIndicator } from '../../types/indicator';
import { DARK_THEME } from '../../constants/colors';
import { formatChartDate } from '../../utils/formatters';

interface MiniChartProps {
  data: NormalizedIndicator;
  height?: number;
}

export function MiniChart({ data, height = 120 }: MiniChartProps) {
  const isPositive = data.change !== undefined && data.change.percentage >= 0;
  const lineColor = isPositive ? DARK_THEME.accent[1] : DARK_THEME.accent[2]; // Green or Red

  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: '8%',
      right: '5%',
      top: '10%',
      bottom: '25%',
    },
    xAxis: {
      type: 'category',
      show: true,
      data: data.historical.map(d => formatChartDate(d.timestamp, '1D')),
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: {
        color: DARK_THEME.textMuted,
        fontSize: 10,
        interval: 5, // 每5个点显示一个标签
      },
    },
    yAxis: {
      type: 'value',
      show: true,
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: {
        color: DARK_THEME.textMuted,
        fontSize: 10,
        formatter: (value: number) => {
          // 简化显示：大数字用K/M
          if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}K`;
          }
          return value.toFixed(0);
        },
      },
      splitLine: { show: false },
    },
    series: [{
      type: 'line',
      data: data.historical.map(d => d.value),
      smooth: false,
      symbol: 'none',
      lineStyle: {
        color: lineColor,
        width: 2,
      },
      areaStyle: {
        color: lineColor,
        opacity: 0.1,
      },
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: DARK_THEME.panel,
      borderColor: DARK_THEME.gridLine,
      textStyle: { color: DARK_THEME.text, fontSize: 12 },
      formatter: (params: unknown) => {
        const point = (params as Array<{ name: string; value: number }>)[0];
        return `${point.name}<br/>${data.name}: $${point.value.toLocaleString()}`;
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