import ReactECharts from 'echarts-for-react';
import { NormalizedIndicator } from '../../types/indicator';
import { DARK_THEME } from '../../constants/colors';
import { alignTimestamps } from '../../utils/data-alignment';
import { formatChartDate } from '../../utils/formatters';

interface SeriesConfig {
  data: NormalizedIndicator;
  axisPosition: 'left' | 'right';
  yAxisConfig?: {
    name?: string;
    min?: number;
    max?: number;
  };
}

interface MultiSeriesChartProps {
  series: SeriesConfig[];
  height?: number;
  showLegend?: boolean;
  timeRange?: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
}

export function MultiSeriesChart({
  series,
  height = 400,
  showLegend = true,
  timeRange = '1Y',
}: MultiSeriesChartProps) {
  // Handle empty data
  const hasData = series.some((s) => s.data.historical.length > 0);
  if (!hasData) {
    return (
      <div
        data-testid="multi-series-chart"
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: DARK_THEME.background,
          color: DARK_THEME.textMuted,
          borderRadius: '8px',
        }}
      >
        No data to display
      </div>
    );
  }

  // Check if right axis is needed
  const hasRightAxis = series.some((s) => s.axisPosition === 'right');

  // Get aligned timestamps for x-axis
  const alignedTimestamps = alignTimestamps(series.map((s) => s.data));

  // Build yAxis array
  const yAxis = [
    // Left axis (always present)
    {
      type: 'value' as const,
      name: series.find((s) => s.axisPosition === 'left')?.data.unit || '',
      nameTextStyle: { color: DARK_THEME.textMuted },
      position: 'left' as const,
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: { color: DARK_THEME.textMuted },
      splitLine: { lineStyle: { color: DARK_THEME.gridLine, opacity: 0.3 } },
      ...series.find((s) => s.axisPosition === 'left')?.yAxisConfig,
    },
    // Right axis (optional)
    ...(hasRightAxis
      ? [
          {
            type: 'value' as const,
            name: series.find((s) => s.axisPosition === 'right')?.data.unit || '',
            nameTextStyle: { color: DARK_THEME.textMuted },
            position: 'right' as const,
            axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
            axisLabel: { color: DARK_THEME.textMuted },
            splitLine: { show: false },
            ...series.find((s) => s.axisPosition === 'right')?.yAxisConfig,
          },
        ]
      : []),
  ];

  // Build series data aligned to monthly timestamps
  // For each month, use the latest available data point in that month
  const buildAlignedData = (indicator: NormalizedIndicator): (number | null)[] => {
    return alignedTimestamps.map((ts) => {
      // Find all data points in the same month
      const monthStart = new Date(ts.getFullYear(), ts.getMonth(), 1);
      const monthEnd = new Date(ts.getFullYear(), ts.getMonth() + 1, 0, 23, 59, 59);

      const monthPoints = indicator.historical.filter((h) => {
        const hTime = h.timestamp.getTime();
        return hTime >= monthStart.getTime() && hTime <= monthEnd.getTime();
      });

      if (monthPoints.length === 0) return null;

      // Use the latest data point in that month (closest to month end)
      const latest = monthPoints.reduce((latest, current) =>
        current.timestamp.getTime() > latest.timestamp.getTime() ? current : latest
      );

      return latest.value;
    });
  };

  // Build chart series
  const chartSeries = series.map((s, index) => ({
    type: 'line' as const,
    name: s.data.name,
    data: buildAlignedData(s.data),
    yAxisIndex: s.axisPosition === 'right' ? 1 : 0,
    smooth: false,
    symbol: 'none',
    lineStyle: { color: DARK_THEME.accent[index % DARK_THEME.accent.length], width: 2 },
    connectNulls: false,
  }));

  const option = {
    backgroundColor: DARK_THEME.background,
    textStyle: { color: DARK_THEME.text },
    grid: {
      left: '10%',
      right: hasRightAxis ? '15%' : '5%',
      top: showLegend ? '15%' : '10%',
      bottom: '20%',
    },
    legend: showLegend
      ? {
          show: true,
          top: '5%',
          textStyle: { color: DARK_THEME.text },
        }
      : { show: false },
    xAxis: {
      type: 'category' as const,
      data: alignedTimestamps.map((d) => formatChartDate(d, timeRange)),
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: { color: DARK_THEME.textMuted },
    },
    yAxis,
    series: chartSeries,
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: DARK_THEME.panel,
      borderColor: DARK_THEME.gridLine,
      textStyle: { color: DARK_THEME.text },
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
      data-testid="multi-series-chart"
    />
  );
}