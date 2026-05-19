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
    grid: { left: '10%', right: '5%', top: '10%', bottom: '20%' },
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
      min: (value: { min: number; max: number }) => {
        // 动态调整纵轴范围，不从0开始
        const dataMin = value.min;
        const dataMax = value.max;
        const range = dataMax - dataMin;
        // 向下扩展10%，向上扩展10%
        if (dataMin > 0 && range < dataMin * 0.5) {
          // 如果数据范围较小（如利率3%-5%），动态调整
          return Math.floor((dataMin - range * 0.1) * 10) / 10;
        }
        return 0; // 其他情况从0开始
      },
      max: (value: { min: number; max: number }) => {
        const dataMin = value.min;
        const dataMax = value.max;
        const range = dataMax - dataMin;
        if (dataMin > 0 && range < dataMin * 0.5) {
          return Math.ceil((dataMax + range * 0.1) * 10) / 10;
        }
        return 'dataMax';
      },
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
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: 0,
        start: 0,
        end: 100,
        height: 20,
        bottom: 10,
        backgroundColor: DARK_THEME.panel,
        dataBackground: {
          lineStyle: { color: DARK_THEME.accent[0] },
          areaStyle: { color: DARK_THEME.accent[0], opacity: 0.3 },
        },
        fillerColor: 'rgba(88, 166, 255, 0.2)',
        borderColor: DARK_THEME.gridLine,
        handleStyle: {
          color: DARK_THEME.accent[0],
          borderColor: DARK_THEME.accent[0],
        },
        textStyle: { color: DARK_THEME.textMuted },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: `${height}px`, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      data-testid="line-chart"
    />
  );
}