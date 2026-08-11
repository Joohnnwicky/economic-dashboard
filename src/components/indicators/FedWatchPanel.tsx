import { useFedWatch } from '../../hooks/useFedWatch';
import { DARK_THEME } from '../../constants/colors';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function FedWatchPanel() {
  const { data, isLoading, error, isFetching } = useFedWatch();

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: DARK_THEME.accent[0] }}></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 bg-red-900/20 rounded text-red-400">
        加载失败: {error.message}
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm" style={{ color: DARK_THEME.textMuted }}>暂无数据</div>;
  }

  const next = data.next_meeting;

  // 倒计时显示: <48h 显示小时, 否则显示天
  const countdownText = next
    ? (next.hours_until <= 48
        ? `${Math.round(next.hours_until)} 小时`
        : `${Math.floor(next.days_until)} 天`)
    : '-';

  return (
    <div className="space-y-3">
      {isFetching && (
        <span className="text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>更新中...</span>
      )}

      {/* 下次会议倒计时 */}
      {next ? (
        <div className="p-2" style={{ border: `1px solid ${DARK_THEME.border}`, backgroundColor: `${DARK_THEME.accent[0]}10` }}>
          <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>下次 FOMC 会议</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold" style={{ color: DARK_THEME.text, fontFamily: 'Arial Black, sans-serif' }}>
              {(() => { try { return format(parseISO(next.date), 'yyyy-MM-dd', { locale: zhCN }); } catch { return next.date; } })()}
            </span>
            <span className="text-2xl font-bold" style={{ color: DARK_THEME.accent[0] }}>
              {countdownText}
            </span>
          </div>
          <div className="text-xs text-right" style={{ color: DARK_THEME.textMuted }}>
            {next.hours_until <= 48 ? '后公布' : '后'}
          </div>
        </div>
      ) : (
        <div className="text-sm" style={{ color: DARK_THEME.textMuted }}>暂无预排会议</div>
      )}

      {/* 未来会议列表 */}
      <div className="space-y-1">
        <div className="text-xs font-bold" style={{ color: DARK_THEME.textMuted }}>未来会议日程</div>
        {data.upcoming.filter((m) => !m.is_past).slice(0, 6).map((m) => {
          let dateStr = m.date;
          try { dateStr = format(parseISO(m.date), 'yyyy-MM-dd EEE', { locale: zhCN }); } catch { /* keep raw */ }
          return (
            <div key={m.date} className="flex justify-between text-xs">
              <span style={{ color: DARK_THEME.text }}>
                {dateStr}
                {m.tentative && <span style={{ color: DARK_THEME.textMuted }}> (预排)</span>}
              </span>
              <span style={{ color: DARK_THEME.textMuted }}>
                {m.is_past ? '已结束' : `${Math.floor(m.days_until)} 天后`}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        FOMC 每年 8 次会议, 公布联邦基金利率目标区间 | 2026 日程为预排, 以美联储公告为准
      </p>
    </div>
  );
}
