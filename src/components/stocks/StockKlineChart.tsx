import ReactECharts from 'echarts-for-react';
import { useStockKline } from '../../hooks/useStockKline';
import { DARK_THEME } from '../../constants/colors';
import { formatChartDate } from '../../utils/formatters';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface StockKlineChartProps {
  code: string;
  name?: string;
  onClose?: () => void;
}

export function StockKlineChart({ code, name, onClose }: StockKlineChartProps) {
  const { data, isLoading, error } = useStockKline(code, 'daily', 365);

  if (isLoading) {
    return (
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: DARK_THEME.panel }}
      >
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !data || !data.historical || data.historical.length === 0) {
    return (
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: DARK_THEME.panel }}
      >
        <div className="flex items-center justify-center h-[300px]" style={{ color: DARK_THEME.textMuted }}>
          无法加载历史数据
        </div>
      </div>
    );
  }

  const chartData = data.historical.map((h) => [h.timestamp, h.value]);

  const option = {
    backgroundColor: DARK_THEME.panel,
    textStyle: { color: DARK_THEME.text },
    grid: {
      left: '10%',
      right: '5%',
      top: '15%',
      bottom: '20%',
    },
    xAxis: {
      type: 'category',
      data: chartData.map((d) => formatChartDate(d[0], '1Y')),
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: { color: DARK_THEME.textMuted },
    },
    yAxis: {
      type: 'value',
      name: '价格',
      nameTextStyle: { color: DARK_THEME.textMuted },
      axisLine: { lineStyle: { color: DARK_THEME.gridLine } },
      axisLabel: { color: DARK_THEME.textMuted },
      splitLine: { lineStyle: { color: DARK_THEME.gridLine, opacity: 0.3 } },
    },
    series: [
      {
        type: 'line',
        name: data.name,
        data: chartData.map((d) => d[1]),
        smooth: false,
        symbol: 'none',
        lineStyle: { color: DARK_THEME.accent[0], width: 2 },
        connectNulls: false,
      },
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: DARK_THEME.background,
      borderColor: DARK_THEME.gridLine,
      textStyle: { color: DARK_THEME.text },
      formatter: (params: any) => {
        const point = params[0];
        const dataIndex = point.dataIndex;
        const timestamp = chartData[dataIndex]?.[0];
        let dateStr = point.name;
        if (timestamp) {
          // Show full date yyyy-MM-dd
          const d = new Date(timestamp);
          dateStr = format(d, 'yyyy-MM-dd', { locale: zhCN });
        }
        return `${dateStr}<br/>${data.name}: ${point.value?.toFixed(2)}`;
      },
    },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: 0,
        start: 70,  // Show last 30% (~110 days)
        end: 100,
        height: 20,
        bottom: 10,
        backgroundColor: DARK_THEME.background,
        fillerColor: 'rgba(88, 166, 255, 0.2)',
        borderColor: DARK_THEME.gridLine,
        handleStyle: { color: DARK_THEME.accent[0] },
        textStyle: { color: DARK_THEME.textMuted },
      },
    ],
  };

  return (
    <div
      className="p-4 rounded-lg"
      style={{ backgroundColor: DARK_THEME.panel }}
    >
      {onClose && (
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm" style={{ color: DARK_THEME.text }}>
            {data.name} - 近一年走势
          </h4>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#21262d]"
            style={{ color: DARK_THEME.textMuted }}
          >
            收起
          </button>
        </div>
      )}
      <ReactECharts
        option={option}
        style={{ height: '300px', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}