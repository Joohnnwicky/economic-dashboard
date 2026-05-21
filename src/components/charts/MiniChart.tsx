import ReactECharts from 'echarts-for-react';
import { NormalizedIndicator } from '../../types/indicator';
import { DARK_THEME } from '../../constants/colors';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface MiniChartProps {
  data: NormalizedIndicator;
  height?: number;
}

// Determine appropriate date format based on data frequency
function formatMiniChartDate(date: Date, dataId: string, forTooltip: boolean = false): string {
  // Daily data (commodities, indices, forex, treasury, china macro, etc.) - show dates not times
  const dailyDataIds = ['gold-gld', 'oil-brent', 'oil-wti', 'dia', 'qqq', 'spy', 'dollar-index', 'usdcny'];
  const dailyKeywords = ['gold', 'oil', 'dollar', 'usd', 'index', 'rate', 'cny', 'eur', 'gbp', 'jpy', 'treasury', 'china', 'gdp', 'cpi', 'ip'];

  if (dailyDataIds.includes(dataId) || dailyKeywords.some(k => dataId.includes(k))) {
    // For tooltip, show full date; for axis, show compact date
    return forTooltip ? format(date, 'yyyy-MM-dd', { locale: zhCN }) : format(date, 'MM/dd', { locale: zhCN });
  }
  // Intraday data (crypto) - show time
  return format(date, 'HH:mm');
}

export function MiniChart({ data, height = 120 }: MiniChartProps) {
  const isPositive = data.change !== undefined && data.change.percentage >= 0;
  const lineColor = isPositive ? DARK_THEME.accent[1] : DARK_THEME.accent[2]; // Red(涨) or Green(跌)

  // Mini charts are small - limit labels to avoid overlap
  // Show at most 6-8 labels depending on data length
  const dataLength = data.historical.length;
  const labelInterval = dataLength > 200 ? 60 : dataLength > 100 ? 30 : dataLength > 50 ? 15 : 10;

  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: '12%',
      right: '5%',
      top: '10%',
      bottom: '25%',
    },
    xAxis: {
      type: 'category',
      show: true,
      data: data.historical.map(d => formatMiniChartDate(d.timestamp, data.id)),
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: {
        color: DARK_THEME.textMuted,
        fontSize: 10,
        interval: labelInterval,
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
        const points = params as Array<{ dataIndex: number; value: number }>;
        if (!points || points.length === 0) return '';
        const point = points[0];
        const dateIndex = point.dataIndex;
        const fullDate = formatMiniChartDate(data.historical[dateIndex].timestamp, data.id, true);
        return `${fullDate}<br/>${data.name}: $${point.value.toLocaleString()}`;
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