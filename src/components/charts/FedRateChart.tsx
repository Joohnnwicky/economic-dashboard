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

  // Build xAxis data (dates)
  const xAxisData = data.historical.map((d) => formatChartDate(d.timestamp, timeRange));

  // Map FOMC events to xAxis indices for precise alignment
  // FOMC会议日期映射到最近的xAxis月份
  const scatterData: Array<{ value: [number, number]; itemStyle: { color: string }; event: FOMCEvent }> = [];
  fomcEvents.forEach((event) => {
    // 找到FOMC会议日期对应的xAxis索引
    const eventDateStr = formatChartDate(event.timestamp, timeRange);
    const xIndex = xAxisData.indexOf(eventDateStr);
    if (xIndex !== -1) {
      // 使用索引定位scatter点，确保精确对齐line上的点
      scatterData.push({
        value: [xIndex, event.rate],
        itemStyle: { color: event.color },
        event,
      });
    }
  });

  // Build ECharts option with two series: line + scatter
  const option = {
    backgroundColor: DARK_THEME.background,
    textStyle: { color: DARK_THEME.text },
    grid: { left: '10%', right: '5%', top: '10%', bottom: '20%' },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: { color: DARK_THEME.textMuted },
    },
    yAxis: {
      type: 'value',
      name: data.unit,
      nameTextStyle: { color: DARK_THEME.textMuted },
      min: (value: { min: number; max: number }) => {
        const dataMin = value.min;
        const dataMax = value.max;
        const range = dataMax - dataMin;
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
      // Series 2: Scatter series for FOMC markers (使用xAxis索引精确对齐)
      {
        type: 'scatter',
        data: scatterData.map((item) => ({
          value: item.value,
          itemStyle: item.itemStyle,
        })),
        symbol: 'circle',
        symbolSize: 10,
      },
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: DARK_THEME.panel,
      borderColor: DARK_THEME.gridLine,
      textStyle: { color: DARK_THEME.text },
      formatter: (params: unknown) => {
        const points = params as Array<{ seriesType: string; dataIndex: number; name: string; value: number | [number, number] }>;

        // 简化tooltip: 只显示 "时间: 利率"
        const linePoint = points.find((p) => p.seriesType === 'line');
        if (linePoint) {
          return `${linePoint.name}: ${formatPercentage(linePoint.value as number)}`;
        }

        const scatterPoint = points.find((p) => p.seriesType === 'scatter');
        if (scatterPoint) {
          const item = scatterData[scatterPoint.dataIndex];
          if (item) {
            const dateStr = xAxisData[item.value[0]];
            return `${dateStr}: ${formatPercentage(item.value[1])}`;
          }
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