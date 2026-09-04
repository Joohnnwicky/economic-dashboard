import ReactECharts from 'echarts-for-react';
import { useStockKline } from '../../hooks/useStockKline';
import { DARK_THEME } from '../../constants/colors';
import { format } from 'date-fns';

interface StockSparklineProps {
  code: string;
  /** 线条颜色（跟随涨跌着色） */
  color: string;
}

/** 自选股卡片内嵌迷你走势图（近90日，常显） */
export function StockSparkline({ code, color }: StockSparklineProps) {
  const { data, isLoading } = useStockKline(code, 'daily', 90);

  // 加载中/失败时占位，保持卡片高度稳定
  if (isLoading || !data?.historical?.length) {
    return <div className="h-[36px]" />;
  }

  const chartData = data.historical.map((h) => [new Date(h.timestamp).getTime(), h.value] as [number, number]);

  const option = {
    backgroundColor: 'transparent',
    animation: false,
    grid: { left: 0, right: 0, top: 2, bottom: 2 },
    xAxis: { type: 'time', show: false },
    yAxis: { type: 'value', show: false, min: 'dataMin', max: 'dataMax' },
    series: [{
      type: 'line',
      data: chartData,
      symbol: 'none',
      lineStyle: { color, width: 1.5 },
      areaStyle: { color, opacity: 0.12 },
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: DARK_THEME.panel,
      borderColor: DARK_THEME.gridLine,
      textStyle: { color: DARK_THEME.text, fontSize: 11 },
      formatter: (params: unknown) => {
        const arr = params as Array<{ value: [number, number] }>;
        if (!arr || arr.length === 0) return '';
        const [ts, val] = arr[0].value;
        return `${format(new Date(ts), 'MM-dd')}<br/>${data.name}: ${val.toFixed(2)}`;
      },
    },
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '36px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
