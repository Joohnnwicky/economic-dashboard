import ReactECharts from 'echarts-for-react';
import { NormalizedIndicator } from '../../types/indicator';
import { DARK_THEME } from '../../constants/colors';
import { formatChartDate, formatPercentage, formatChineseNumber, formatLargeNumber } from '../../utils/formatters';
import { TimeRange } from '../../types/api';

interface LineChartProps {
  data: NormalizedIndicator;
  timeRange?: TimeRange;
  height?: number;
  gridLeft?: string; // 可选：自定义grid left宽度，覆盖默认值
}

// 根据单位选择格式化函数
function formatValue(value: number, unit: string): string {
  switch (unit) {
    case '%':
      return formatPercentage(value);
    case 'K':
      // K单位表示"千"，需要转换为万或亿显示
      return formatChineseNumber(value * 1000);
    case 'index':
      return value.toFixed(2);
    default:
      return formatLargeNumber(value);
  }
}

export function LineChart({ data, timeRange = '1Y', height = 400, gridLeft }: LineChartProps) {
  // 如果传入gridLeft则使用，否则根据unit确定默认值
  // K单位: 千人转万/亿（如1584949 -> 1.58亿）
  // index单位: 指数值（如130.34），需要显示完整的3位数
  // %单位: 百分比（如4.33%），2位数即可
  const finalGridLeft = gridLeft ?? (data.unit === 'K' ? '18%' : data.unit === 'index' ? '16%' : '8%');

  const option = {
    backgroundColor: DARK_THEME.background,
    textStyle: { color: DARK_THEME.text },
    grid: { left: finalGridLeft, right: '5%', top: '10%', bottom: '30%' },
    xAxis: {
      type: 'category',
      data: data.historical.map((d) => formatChartDate(d.timestamp, timeRange)),
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: { color: DARK_THEME.textMuted },
    },
    yAxis: {
      type: 'value',
      name: data.unit === 'K' ? '就业人数' : data.unit,
      nameTextStyle: { color: DARK_THEME.textMuted },
      min: (value: { min: number; max: number }) => {
        const dataMin = value.min;
        const dataMax = value.max;
        const range = dataMax - dataMin;
        if (dataMin > 0 && range < dataMin * 0.5) {
          return Math.floor((dataMin - range * 0.1) * 10) / 10;
        }
        return 0;
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
        formatter: (value: number) => formatValue(value, data.unit),
        margin: 8,
        align: 'left',
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
        return `${point.name}: ${formatValue(point.value, data.unit)}`;
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
        bottom: 5,
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