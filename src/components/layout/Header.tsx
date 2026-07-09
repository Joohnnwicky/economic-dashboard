import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface HeaderProps {
  onExportClick?: () => void;
}

export function Header({ onExportClick }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="dell-banner px-4 py-3 flex items-center justify-between"
      style={{ borderBottom: '1px solid #000' }}
    >
      {/* Title */}
      <div>
        <h1 className="font-display text-2xl tracking-tight" style={{ color: '#ffffff' }}>
          全球经济指标看板
        </h1>
        <p className="text-sm font-sans" style={{ color: '#cccccc' }}>
          实时监控 · 美联储利率 · 通胀 · 加密货币 · 美股指数
        </p>
      </div>

      {/* Right side: LIVE callout (phone-callout style) + Export sticker */}
      <div className="flex items-center gap-4">
        <div className="dell-phone-callout dell-bevel px-2 py-1 text-right">
          <div className="text-[10px] leading-none">实时 LIVE</div>
          <div className="text-sm leading-tight">
            {format(currentTime, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
          </div>
        </div>
        {onExportClick && (
          <button
            onClick={onExportClick}
            className="dell-sticker dell-bevel px-3 py-1 text-sm"
          >
            导出 DATA
          </button>
        )}
      </div>
    </header>
  );
}
