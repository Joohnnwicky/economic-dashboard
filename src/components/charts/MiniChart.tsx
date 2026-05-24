import ReactECharts from 'echarts-for-react';
import { NormalizedIndicator } from '../../types/indicator';
import { DARK_THEME } from '../../constants/colors';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface MiniChartProps {
  data: NormalizedIndicator;
  height?: number;
  isDaily?: boolean;  // 强制指定为日线数据
}

// Determine appropriate date format based on data frequency
function formatMiniChartDate(date: Date, dataId: string, forTooltip: boolean = false, isDaily?: boolean): string {
  // 如果明确指定为daily数据，显示日期
  if (isDaily) {
    return forTooltip ? format(date, 'yyyy-MM-dd', { locale: zhCN }) : format(date, 'MM/dd', { locale: zhCN });
  }

  // 加密货币（非daily）显示时间
  const cryptoIds = ['bitcoin', 'ethereum', 'btc', 'eth'];
  if (cryptoIds.some(k => dataId.includes(k))) {
    return format(date, 'HH:mm');
  }

  // 其他daily数据关键词（treasury, gold, oil等）
  const dailyKeywords = ['treasury', 'gold', 'oil', 'dollar', 'china', 'gdp', 'cpi', 'ip'];
  if (dailyKeywords.some(k => dataId.includes(k))) {
    return forTooltip ? format(date, 'yyyy-MM-dd', { locale: zhCN }) : format(date, 'MM/dd', { locale: zhCN });
  }

  // 默认显示时间
  return format(date, 'HH:mm');
}

export function MiniChart({ data, height = 120, isDaily = false }: MiniChartProps) {
  // 判断趋势颜色：涨=红，跌=绿
  // 1. 如果有change字段，根据change.percentage判断
  // 2. 如果没有change，根据历史数据首尾对比判断趋势
  let isPositive: boolean;
  if (data.change !== undefined) {
    isPositive = data.change.percentage >= 0;
  } else if (data.historical.length >= 2) {
    const firstValue = data.historical[0].value;
    const lastValue = data.historical[data.historical.length - 1].value;
    isPositive = lastValue >= firstValue;
  } else {
    isPositive = true;  // 默认红色
  }
  const lineColor = isPositive ? DARK_THEME.positive : DARK_THEME.negative;

  const dataLength = data.historical.length;
  const labelInterval = dataLength > 200 ? 60 : dataLength > 100 ? 30 : dataLength > 50 ? 15 : Math.floor(dataLength / 6);

  // 计算数据范围 - 纵轴缩放到数据实际范围，不从0开始
  const values = data.historical.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const yAxisMin = minValue - range * 0.05;
  const yAxisMax = maxValue + range * 0.05;

  // 判断单位类型
  const isPercent = data.unit === '%';  // 美债收益率、CPI等
  const isPrice = data.unit === 'USD' || data.unit === '美元' || !data.unit;  // 加密货币、价格等

  // 根据数值范围智能格式化纵轴
  const formatYAxisValue = (value: number): string => {
    if (isPercent) {
      // 百分比：直接显示数值
      return value.toFixed(1);
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    if (value >= 100) {
      return value.toFixed(0);
    }
    if (value >= 10) {
      return value.toFixed(1);
    }
    return value.toFixed(2);
  };

  // tooltip单位
  const tooltipUnit = isPercent ? '%' : '$';

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
      data: data.historical.map(d => formatMiniChartDate(d.timestamp, data.id, false, isDaily)),
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
      min: yAxisMin,
      max: yAxisMax,
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: {
        color: DARK_THEME.textMuted,
        fontSize: 10,
        formatter: formatYAxisValue,
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
        const fullDate = formatMiniChartDate(data.historical[dateIndex].timestamp, data.id, true, isDaily);
        const formattedValue = isPercent ? `${point.value.toFixed(2)}%` : `${tooltipUnit}${point.value.toLocaleString()}`;
        return `${fullDate}<br/>${data.name}: ${formattedValue}`;
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