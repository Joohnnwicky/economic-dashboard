"""
经济日历服务 - 纯计算版(无外部 API)

免费数据源均无法提供前瞻发布日(Finnhub 需付费 / FRED 仅历史 / BLS 无日程 API)。
故按主要宏观数据的已知发布节奏(规则)计算未来发布日:
  - NFP(就业形势): 每月第一个周五 08:30 ET  - 精确
  - CPI:           约 13 日                  - 约
  - PPI:           约 15 日                  - 约
  - 零售销售:       约 16 日                  - 约
  - PCE:           约月末(PCE 为上月数据, 月末发布) - 约
FOMC 已在独立 FedWatch 面板, 此处不重复。

官方发布日程(覆盖表)优先于估算: 见 data/release_schedule.py。
命中覆盖表的事件 approximate=False(精确), 未命中 fallback 估算 approximate=True(约)。

时间换算: 所有发布时刻为美东 08:30, date 字段为发布日(美东 08:30 = 北京同日 20:30/21:30,
故美东发布日与北京发布日同为一天), time 字段按美东夏/冬令时换算为北京 20:30(EDT)/21:30(EST)。
"当前月/今天"基准统一为北京时间(Asia/Shanghai), 不依赖服务器系统时区。
"""
from datetime import datetime, timedelta, date
from typing import Dict, List
from zoneinfo import ZoneInfo

from config.api_keys import APIConfig
from data.release_schedule import get_scheduled_release
from data.indicators_config import get_indicator
from services.release_scheduler import load_release_cache

_ET = ZoneInfo('America/New_York')
_BJ = ZoneInfo('Asia/Shanghai')

# 现有5类估算事件 -> cache key 映射(用于 cache 覆盖)
_CACHE_KEY_MAP = {
    'NFP': 'US_NFP', 'CPI': 'US_CPI', 'PPI': 'US_PPI',
    'PCE': 'US_PCE', 'RETAIL': 'US_RETAIL',
}


def _is_future(date_str: str, today: date) -> bool:
    """解析 'YYYY-MM-DD', 返回是否 >= today。无效/过去返回 False。"""
    if not date_str:
        return False
    try:
        y, m, d = date_str[:10].split('-')
        return date(int(y), int(m), int(d)) >= today
    except Exception:
        return False


def _first_friday(year: int, month: int) -> datetime:
    """该月第一个周五(美东 08:30 近似)。"""
    d = datetime(year, month, 1, 8, 30)
    offset = (4 - d.weekday()) % 7  # 周一=0 ... 周五=4
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


def _et_0830_to_beijing_str(y: int, mo: int, d: int) -> str:
    """美东 08:30 发布 -> 北京时间 HH:MM。zoneinfo 自动处理夏/冬令时(EDT=20:30, EST=21:30)。"""
    et = datetime(y, mo, d, 8, 30, tzinfo=_ET)
    return et.astimezone(_BJ).strftime('%H:%M')


def _resolve(event_key: str, fallback: datetime):
    """查覆盖表, 命中用官方日(精确), 否则用 fallback(估算)。

    返回 (date_str, time_str, approximate)。
    fallback 的年/月作为"发布月"查询(与 _compute 遍历的月份一致)。
    """
    scheduled = get_scheduled_release(event_key, fallback.year, fallback.month)
    if scheduled:
        sy, sm, sd = map(int, scheduled.split('-'))
        return scheduled, _et_0830_to_beijing_str(sy, sm, sd), False
    return (
        fallback.strftime('%Y-%m-%d'),
        _et_0830_to_beijing_str(fallback.year, fallback.month, fallback.day),
        True,
    )


def _compute() -> Dict:
    now = datetime.now(_BJ)
    today = now.date()
    cache = load_release_cache()
    events: List[Dict] = []

    def _cached(cache_key: str):
        """cache 命中且未来 -> (date_str, '', False); 否则 None。"""
        c = cache.get(cache_key)
        if c and _is_future(c.get('date', ''), today):
            return c['date'], '', False
        return None

    # 遍历当前月(北京) + 未来 3 个月
    for m_offset in range(0, 4):
        y = now.year + ((now.month - 1 + m_offset) // 12)
        mo = (now.month - 1 + m_offset) % 12 + 1

        # NFP - 每月第一个周五(精确, cache 优先)
        nfp = _first_friday(y, mo)
        nc = _cached('US_NFP')
        if nc:
            nfp_date, nfp_time, nfp_approx = nc
        else:
            nfp_date = nfp.strftime('%Y-%m-%d')
            nfp_time = _et_0830_to_beijing_str(nfp.year, nfp.month, nfp.day)
            nfp_approx = False
        events.append({'date': nfp_date, 'time': nfp_time,
                       'event': '非农就业(NFP)', 'impact': 'high',
                       'approximate': nfp_approx, 'country': 'US'})

        # CPI / PPI / 零售 / PCE - cache 优先, 次 override 表, 末 fallback 估算
        for est_key, ev_name, impact, fb_day in [
            ('CPI', 'CPI(消费者物价指数)', 'high', 13),
            ('PPI', 'PPI(生产者物价指数)', 'medium', 15),
            ('RETAIL', '零售销售(Retail Sales)', 'medium', 16),
        ]:
            cc = _cached(_CACHE_KEY_MAP[est_key])
            if cc:
                d, t, approx = cc
            else:
                d, t, approx = _resolve(est_key, datetime(y, mo, fb_day, 8, 30))
            events.append({'date': d, 'time': t, 'event': ev_name,
                           'impact': impact, 'approximate': approx, 'country': 'US'})

        pce_fb = _last_business_day(y, mo)
        pc = _cached('US_PCE')
        if pc:
            pce_date, pce_time, pce_approx = pc
        else:
            pce_date, pce_time, pce_approx = _resolve('PCE', pce_fb)
        events.append({'date': pce_date, 'time': pce_time,
                       'event': 'PCE(个人消费支出)', 'impact': 'high',
                       'approximate': pce_approx, 'country': 'US'})

    # cache 中其他指标(非5类): 美国JOLTS/GDP/ISM等 + 中国CPI/PMI等, 命中即展示
    covered = set(_CACHE_KEY_MAP.values())
    for k, v in cache.items():
        if k in covered or not _is_future(v.get('date', ''), today):
            continue
        ind = get_indicator(k)
        if not ind:
            continue
        events.append({
            'date': v['date'], 'time': '', 'event': ind.name,
            'impact': ind.impact, 'approximate': False, 'country': ind.country,
        })

    # 只保留今天及之后(北京), 按日期排序
    today_str = now.strftime('%Y-%m-%d')
    upcoming = [e for e in events if e['date'] >= today_str]
    upcoming.sort(key=lambda x: (x['date'], x['country']))

    return {
        'events': upcoming[:20],
        'note': '优先用自动采集的官方发布日(精确), 未覆盖为节奏估算(约); 中国指标仅在采集命中时展示',
        'timestamp': now.isoformat(),
    }


class EconomicCalendarCache:
    _data: Dict | None = None
    _timestamp: datetime | None = None

    @classmethod
    def get(cls) -> Dict | None:
        if cls._data is None or cls._timestamp is None:
            return None
        if (datetime.now(_BJ) - cls._timestamp).total_seconds() >= APIConfig.CACHE_TTL['EconomicCalendar']:
            return None
        return cls._data

    @classmethod
    def set(cls, data: Dict):
        cls._data = data
        cls._timestamp = datetime.now(_BJ)


def get_economic_calendar() -> Dict:
    """计算未来主要宏观数据发布日。1h 缓存。"""
    cached = EconomicCalendarCache.get()
    if cached:
        return cached
    data = _compute()
    EconomicCalendarCache.set(data)
    return data
