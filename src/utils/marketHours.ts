/**
 * A股 / 美股交易时段判断（用于降低休市期间的无效轮询）。
 *
 * 精度说明：
 * - 用 Intl.DateTimeFormat 取目标时区的星期与时分，夏令时自动生效（美股 ET 冬夏令时无需关心）。
 * - 只判断"周末 + 交易时段"，不含法定节假日/美股半日市：休市日会按"闭市低频"节奏空转，
 *   换取 95% 以上的无效请求节省，可接受。
 * - A股时段含集合竞价与收盘缓冲（9:15–11:30 / 12:55–15:05），
 *   美股为 9:30–16:05 ET（含收盘缓冲）。
 */

interface ZonedParts {
  /** 0=周日 ... 6=周六 */
  weekday: number;
  /** 当日累计分钟数 0–1439 */
  minutes: number;
}

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function zonedParts(timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  let hour = parseInt(get('hour'), 10);
  if (hour === 24) hour = 0; // en-US hour12:false 午夜可能输出 '24'
  return {
    weekday: WEEKDAY_MAP[get('weekday')] ?? 0,
    minutes: hour * 60 + parseInt(get('minute'), 10),
  };
}

function inSession(parts: ZonedParts, sessions: [number, number][]): boolean {
  if (parts.weekday === 0 || parts.weekday === 6) return false;
  return sessions.some(([start, end]) => parts.minutes >= start && parts.minutes < end);
}

/** A股是否在交易时段（北京时间周一~周五，含集合竞价/收盘缓冲） */
export function isAshareMarketOpen(): boolean {
  return inSession(zonedParts('Asia/Shanghai'), [
    [9 * 60 + 15, 11 * 60 + 30],   // 9:15–11:30（含早盘集合竞价）
    [12 * 60 + 55, 15 * 60 + 5],   // 12:55–15:05（含收盘集合竞价缓冲）
  ]);
}

/** 美股是否在交易时段（ET 周一~周五 9:30–16:05，DST 由 Intl 自动处理） */
export function isUsMarketOpen(): boolean {
  return inSession(zonedParts('America/New_York'), [
    [9 * 60 + 30, 16 * 60 + 5],
  ]);
}

/**
 * 生成 TanStack Query 的 refetchInterval 函数：
 * 交易时段内用 openMs 高频刷新，休市时段退到 closedMs 低频兜底
 * （保留盘后数据修正、跨时段唤醒后自动恢复高频的能力）。
 * refetchInterval 函数在每次拉取完成后重新求值，市场开闭切换后自动适配。
 */
export function intervalByMarket(
  isOpen: () => boolean,
  openMs: number,
  closedMs: number,
): () => number {
  return () => (isOpen() ? openMs : closedMs);
}
