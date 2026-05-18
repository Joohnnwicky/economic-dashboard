import ReactECharts from 'echarts-for-react';
import { NormalizedIndicator } from '../../types/indicator';
import { DARK_THEME } from '../../constants/colors';

interface MiniChartProps {
  data: NormalizedIndicator;
  height?: number;
}

export function MiniChart({ data, height = 80 }: MiniChartProps) {
  const isPositive = data.change !== undefined && data.change.percentage >= 0;
  const lineColor = isPositive ? DARK_THEME.accent[1] : DARK_THEME.accent[2]; // Green or Red

  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: 0,
      right: 0,
      top: 5,
      bottom: 5,
    },
    xAxis: {
      type: 'category',
      show: false, // No axis for sparkline
      data: data.historical.map(() => ''), // Empty labels
    },
    yAxis: {
      type: 'value',
      show: false, // No axis for sparkline
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
        opacity: 0.1, // Light fill
      },
    }],
    // No tooltip - sparkline is just visual trend
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: `${height}px`, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}