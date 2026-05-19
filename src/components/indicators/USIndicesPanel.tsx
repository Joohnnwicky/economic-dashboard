import { useEffect, useState } from 'react';
import { IndicatorCard } from '../ui/IndicatorCard';
import { DARK_THEME } from '../../constants/colors';

/**
 * US Stock Indices Panel - Static Data
 *
 * 美股在中国白天是闭市状态（美股交易时间：21:30-04:00 北京时间）
 * 所以使用静态JSON数据展示最近收盘价，每日更新即可
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

export function USIndicesPanel() {
  const [indices, setIndices] = useState<StaticUSIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load static US indices data from JSON file
    fetch('/data/us-indices-latest.json')
      .then(res => res.json())
      .then(data => {
        setIndices(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('[US Indices] Failed to load static data:', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 rounded" style={{ backgroundColor: DARK_THEME.panel, color: DARK_THEME.textMuted }}>
        正在加载美股指数数据...
      </div>
    );
  }

  if (indices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium" style={{ color: DARK_THEME.text }}>
        美股大盘指数
      </h3>

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