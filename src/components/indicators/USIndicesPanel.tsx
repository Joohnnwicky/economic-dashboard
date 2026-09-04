import { useQuery } from '@tanstack/react-query';
import { IndicatorCard } from '../ui/IndicatorCard';
import { DARK_THEME } from '../../constants/colors';

/**
 * US Stock Indices Panel - Static Data
 *
 * 美股在中国白天是闭市状态（美股交易时间：21:30-04:00 北京时间）
 * 所以使用静态JSON数据展示最近收盘价，每日更新即可
 * 数据走 react-query 并参与 localStorage 持久化，刷新页面秒出不再转圈
 */

interface StaticUSIndex {
  id: string;
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  timestamp: string;
  note: string;
}

async function fetchStaticIndices(): Promise<StaticUSIndex[]> {
  const res = await fetch('/data/us-indices-latest.json');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function USIndicesPanel() {
  const { data: indices = [], isLoading } = useQuery({
    queryKey: ['us-indices-static'],
    queryFn: fetchStaticIndices,
    staleTime: 12 * 60 * 60 * 1000,   // 静态每日更新数据
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20" style={{ color: DARK_THEME.textMuted }}>
        正在加载美股指数数据...
      </div>
    );
  }

  if (indices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Disclaimer about static data */}
      <p className="text-sm" style={{ color: DARK_THEME.textMuted }}>
        美股闭市时间静态数据 · 每日更新
        <br />
        (美股交易时间: 北京时间 21:30-04:00)
      </p>

      {/* Index cards */}
      <div className="grid grid-cols-3 gap-4">
        {indices.map(index => (
          <IndicatorCard
            key={index.id}
            title={index.name}
            value={index.value}
            unit="index"
            change={{
              value: index.change,
              percentage: index.changePercent,
            }}
            lastUpdated={new Date(index.timestamp)}
          />
        ))}
      </div>
    </div>
  );
}
