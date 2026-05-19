import ReactECharts from 'echarts-for-react';
import { NormalizedIndicator } from '../../types/indicator';
import { DARK_THEME } from '../../constants/colors';
import { formatChartDate, formatPercentage } from '../../utils/formatters';
import { TimeRange } from '../../types/api';
import { detectFOMCMeetings, FOMCEvent } from '../../utils/detectFOMCMeetings';

interface FedRateChartProps {
  data: NormalizedIndicator;  // Fed rate history (FEDFUNDS)
  fomcData: NormalizedIndicator;  // DFEDTARU data for FOMC detection
  timeRange?: TimeRange;
  height?: number;
}

export function FedRateChart({ data, fomcData, timeRange = '1Y', height = 400 }: FedRateChartProps) {
  // Detect FOMC events from DFEDTARU data (D-13)
  const fomcEvents: FOMCEvent[] = detectFOMCMeetings(fomcData.historical);

  // Build ECharts option with two series: line + scatter
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
        // 动态调整纵轴范围，不从0开始，更好地显示趋势
        const dataMin = value.min;
        const dataMax = value.max;
        const range = dataMax - dataMin;
        // 向下扩展10%范围，向上扩展10%范围
        return Math.floor((dataMin - range * 0.1) * 10) / 10;
      },
      max: (value: { min: number; max: number }) => {
        const dataMin = value.min;
        const dataMax = value.max;
        const range = dataMax - dataMin;
        return Math.ceil((dataMax + range * 0.1) * 10) / 10;
      },
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: {
        color: DARK_THEME.textMuted,
        formatter: (value: number) => formatPercentage(value),
      },
      splitLine: { lineStyle: { color: DARK_THEME.gridLine, opacity: 0.3 } },
    },
    series: [
      // Series 1: Line series for rate history
      {
        type: 'line',
        data: data.historical.map((d) => d.value),
        smooth: false,
        symbol: 'none',
        lineStyle: { color: DARK_THEME.accent[0], width: 2 },
        connectNulls: false,
      },
      // Series 2: Scatter series for FOMC markers (D-10)
      {
        type: 'scatter',
        data: fomcEvents.map((e) => {
          // FOMC会议日期（如03-20）需要映射到月初（03-01）才能对齐line系列
          const dateStr = formatChartDate(e.timestamp, timeRange);
          // 查找xAxis.data中是否有此日期，如果没有则跳过
          return {
            value: [dateStr, e.rate],
            itemStyle: { color: e.color },
          };
        }),
        symbol: 'circle',
        symbolSize: 10,
        tooltip: {
          formatter: (params: unknown) => {
            const point = params as { dataIndex: number };
            const event = fomcEvents[point.dataIndex];
            // 去掉加息/降息字样，只显示FOMC会议利率
            return `${formatChartDate(event.timestamp, timeRange)}<br/>FOMC利率: ${formatPercentage(event.rate)}`;
          },
        },
      },
    ],
    tooltip: {
      trigger: 'axis', // Default for line series
      backgroundColor: DARK_THEME.panel,
      borderColor: DARK_THEME.gridLine,
      textStyle: { color: DARK_THEME.text },
      formatter: (params: unknown) => {
        const points = params as Array<{ seriesName?: string; name: string; value: number; seriesType: string; dataIndex?: number }>;

        // Check if scatter series point (FOMC marker)
        const scatterPoint = points.find((p) => p.seriesType === 'scatter');
        if (scatterPoint && scatterPoint.dataIndex !== undefined) {
          const event = fomcEvents[scatterPoint.dataIndex];
          return `${formatChartDate(event.timestamp, timeRange)}<br/>${event.decision}: ${formatPercentage(event.rate)}`;
        }

        // Default line tooltip
        const linePoint = points.find((p) => p.seriesType === 'line');
        if (linePoint) {
          return `${linePoint.name}<br/>${data.name}: ${formatPercentage(linePoint.value)}`;
        }

        return '';
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
      data-testid="fed-rate-chart"
    />
  );
}