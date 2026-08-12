import { useEconomicCalendar } from '../../hooks/useEconomicCalendar';
import { DARK_THEME } from '../../constants/colors';
import { parseISO, differenceInCalendarDays, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { beijingTodayStr } from '../../utils/utc';

function impactColor(impact: string | null): string {
  if (impact === 'high') return DARK_THEME.error;
  if (impact === 'medium') return DARK_THEME.warning;
  return DARK_THEME.textMuted;
}

export function EconomicCalendarPanel() {
  const { data, isLoading, error, isFetching } = useEconomicCalendar();

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

  if (!data || !data.events?.length) {
    return <div className="text-sm" style={{ color: DARK_THEME.textMuted }}>暂无数据</div>;
  }

  // 今天基准统一为北京时间(与后端 Asia/Shanghai 对齐), 不依赖浏览器时区
  const today = parseISO(beijingTodayStr());

  const events = data.events.filter((e) => {
    if (!e.date) return false;
    try { return parseISO(e.date).getTime() >= today.getTime(); } catch { return false; }
  });

  const next = events[0];
  const nextDays = next?.date
    ? (() => { try { return differenceInCalendarDays(parseISO(next.date), today); } catch { return null; } })()
    : null;

  const usEvents = events.filter((e) => e.country !== 'CN').slice(0, 6);
  const cnEvents = events.filter((e) => e.country === 'CN').slice(0, 6);
  const sections = [
    { key: 'us', title: '🇺🇸 美国', items: usEvents },
    { key: 'cn', title: '🇨🇳 中国', items: cnEvents },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="space-y-3">
      {isFetching && (
        <span className="text-xs animate-pulse" style={{ color: DARK_THEME.textMuted }}>更新中...</span>
      )}

      {/* 下次发布倒计时 */}
      {next && nextDays !== null && (
        <div className="p-2" style={{ border: `1px solid ${DARK_THEME.border}`, backgroundColor: `${DARK_THEME.accent[0]}10` }}>
          <div className="text-xs" style={{ color: DARK_THEME.textMuted }}>下次数据发布</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-base font-bold" style={{ color: DARK_THEME.text }}>
              {next.event}
              {next.approximate && <span className="text-xs font-normal" style={{ color: DARK_THEME.textMuted }}> (约)</span>}
            </span>
            <span className="text-2xl font-bold" style={{ color: DARK_THEME.accent[0] }}>
              {nextDays === 0 ? '今天' : `${nextDays}天`}
            </span>
          </div>
        </div>
      )}

      {/* 发布列表 - 中美分区 */}
      <div className="space-y-2">
        {sections.map((sec) => (
          <div key={sec.key} className="space-y-1">
            <div className="text-xs font-bold" style={{ color: DARK_THEME.textMuted }}>{sec.title}</div>
            {sec.items.map((e, i) => {
              let dateStr = '-';
              try {
                dateStr = format(parseISO(e.date!), 'MM-dd EEE', { locale: zhCN });
              } catch { /* keep '-' */ }
              return (
                <div key={`${sec.key}-${i}`} className="text-xs grid grid-cols-12 gap-1 items-center">
                  <span className="col-span-4" style={{ color: DARK_THEME.textMuted }}>{dateStr}</span>
                  <span className="col-span-1" style={{ color: impactColor(e.impact) }}>●</span>
                  <span className="col-span-6 truncate" style={{ color: DARK_THEME.text }}>
                    {e.event}
                    {e.approximate && <span style={{ color: DARK_THEME.textMuted }}> 约</span>}
                  </span>
                  <span className="col-span-1 text-right" style={{ color: DARK_THEME.textMuted }}>{e.time}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-xs" style={{ color: DARK_THEME.textMuted }}>
        {data.note || 'NFP 为精确日期, 其余为节奏估算'} | ● 红=高影响 橙=中影响
      </p>
    </div>
  );
}
