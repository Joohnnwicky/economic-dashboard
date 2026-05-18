import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DARK_THEME } from '../../constants/colors';

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
      className="px-4 py-3 border-b flex items-center justify-between"
      style={{
        backgroundColor: DARK_THEME.panel,
        borderColor: DARK_THEME.gridLine,
      }}
    >
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: DARK_THEME.text }}>
          全球经济指标看板
        </h1>
        <p className="text-sm" style={{ color: DARK_THEME.textMuted }}>
          实时监控 · 美联储利率 · 就业数据 · 通胀指标 · 加密货币 · 美股指数
        </p>
      </div>

      {/* Right side: Export button and Current Time */}
      <div className="flex items-center gap-4">
        {/* Export Button */}
        {onExportClick && (
          <button
            onClick={onExportClick}
            className="px-3 py-1 bg-[#3fb950] text-[#0d1117] rounded hover:bg-[#3fb950]/80 text-sm font-medium"
          >
            导出数据
          </button>
        )}

        {/* Current Time */}
        <div className="text-right">
          <p className="text-sm font-medium" style={{ color: DARK_THEME.text }}>
            {format(currentTime, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
          </p>
          <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
            {format(currentTime, 'EEEE', { locale: zhCN })}
          </p>
        </div>
      </div>
    </header>
  );
}