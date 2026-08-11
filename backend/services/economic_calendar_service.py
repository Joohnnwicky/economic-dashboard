"""
经济日历服务 - 纯计算版(无外部 API)

免费数据源均无法提供前瞻发布日(Finnhub 需付费 / FRED 仅历史 / BLS 无日程 API)。
故按主要宏观数据的已知发布节奏(规则)计算未来发布日:
  - NFP(就业形势): 每月第一个周五 08:30 ET  — 精确
  - CPI:           约 13 日                  — 约
  - PPI:           约 15 日                  — 约
  - 零售销售:       约 16 日                  — 约
  - PCE:           约月末(PCE 为上月数据, 月末发布) — 约
FOMC 已在独立 FedWatch 面板, 此处不重复。

标注 approximate=True 的为节奏估算, 实际日期以官方公告为准(通常偏差 1-3 日)。
"""
from datetime import datetime, timedelta
from typing import Dict, List

from config.api_keys import APIConfig


def _first_friday(year: int, month: int) -> datetime:
    """该月第一个周五。"""
    d = datetime(year, month, 1, 8, 30)  # 08:30 ET(近似)
    # 周一=0 ... 周五=4
    offset = (4 - d.weekday()) % 7
    return d + timedelta(days=offset)


def _last_business_day(year: int, month: int) -> datetime:
    """该月最后一个工作日。"""
    if month == 12:
        nxt = datetime(year + 1, 1, 1, 8, 30)
    else:
        nxt = datetime(year, month + 1, 1, 8, 30)
    d = nxt - timedelta(days=1)
    while d.weekday() >= 5:  # 周末回退
        d -= timedelta(days=1)
    return d.replace(hour=8, minute=30)


def _compute() -> Dict:
    now = datetime.now()
    events: List[Dict] = []

    # 遍历当前月 + 未来 3 个月
    for m_offset in range(0, 4):
        y = now.year + ((now.month - 1 + m_offset) // 12)
        mo = (now.month - 1 + m_offset) % 12 + 1

        # NFP - 每月第一个周五(精确)
        nfp = _first_friday(y, mo)
        events.append({'date': nfp.strftime('%Y-%m-%d'), 'time': '20:30',
                       'event': '非农就业(NFP)', 'impact': 'high', 'approximate': False})

        # CPI - 约 13 日(估)
        cpi = datetime(y, mo, 13, 8, 30)
        events.append({'date': cpi.strftime('%Y-%m-%d'), 'time': '20:30',
                       'event': 'CPI(消费者物价指数)', 'impact': 'high', 'approximate': True})

        # PPI - 约 15 日(估)
        ppi = datetime(y, mo, 15, 8, 30)
        events.append({'date': ppi.strftime('%Y-%m-%d'), 'time': '20:30',
                       'event': 'PPI(生产者物价指数)', 'impact': 'medium', 'approximate': True})

        # 零售销售 - 约 16 日(估)
        ret = datetime(y, mo, 16, 8, 30)
        events.append({'date': ret.strftime('%Y-%m-%d'), 'time': '20:30',
                       'event': '零售销售(Retail Sales)', 'impact': 'medium', 'approximate': True})

        # PCE - 月末发布(上月数据), 用当月末近似(估)
        pce = _last_business_day(y, mo)
        events.append({'date': pce.strftime('%Y-%m-%d'), 'time': '20:30',
                       'event': 'PCE(个人消费支出)', 'impact': 'high', 'approximate': True})

    # 只保留今天及之后, 按日期排序
    today_str = now.strftime('%Y-%m-%d')
    upcoming = [e for e in events if e['date'] >= today_str]
    upcoming.sort(key=lambda x: x['date'])

    return {
        'events': upcoming[:15],
        'note': 'NFP 为精确日期; CPI/PPI/PCE/零售为节奏估算(约), 以官方公告为准',
        'timestamp': now.isoformat(),
    }


class EconomicCalendarCache:
    _data: Dict | None = None
    _timestamp: datetime | None = None

    @classmethod
    def get(cls) -> Dict | None:
        if cls._data is None or cls._timestamp is None:
            return None
        if (datetime.now() - cls._timestamp).total_seconds() >= APIConfig.CACHE_TTL['EconomicCalendar']:
            return None
        return cls._data

    @classmethod
    def set(cls, data: Dict):
        cls._data = data
        cls._timestamp = datetime.now()


def get_economic_calendar() -> Dict:
    """计算未来主要宏观数据发布日。1h 缓存。"""
    cached = EconomicCalendarCache.get()
    if cached:
        return cached
    data = _compute()
    EconomicCalendarCache.set(data)
    return data
