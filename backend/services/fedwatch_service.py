"""
FOMC 会议日历 + 倒计时服务

FOMC 会议日程为公开信息, 此处硬编码 2025-2026 已知/预排会议日(宣布日, 即第二日)。
无需外部 API, 纯日期计算。1h 缓存(日程不变, 倒计时每请求重算)。

注: CME FedWatch 降息概率热力图需抓取 CME 端点, 端点结构未稳定验证, 暂未接入;
待端点确认后可在本服务追加 probability 字段。
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from config.api_keys import APIConfig


# FOMC 会议宣布日(议息第二日, 即公布利率决定当日)
# 2025 已知日程; 2026 为 FOMC 预排日程(标记 tentative)
FOMC_DATES_2025 = [
    '2025-01-29', '2025-03-19', '2025-04-30', '2025-06-18',
    '2025-07-30', '2025-09-17', '2025-10-29', '2025-12-10',
]
FOMC_DATES_2026 = [
    '2026-01-28', '2026-03-18', '2026-04-29', '2026-06-17',
    '2026-07-29', '2026-09-16', '2026-10-28', '2026-12-09',
]

_ALL_DATES = sorted(FOMC_DATES_2025 + FOMC_DATES_2026)


class FedWatchCache:
    _data: Optional[Dict] = None
    _timestamp: Optional[datetime] = None

    @classmethod
    def get(cls) -> Optional[Dict]:
        if cls._data is None or cls._timestamp is None:
            return None
        if (datetime.now() - cls._timestamp).total_seconds() >= APIConfig.CACHE_TTL['FedWatch']:
            return None
        return cls._data

    @classmethod
    def set(cls, data: Dict):
        cls._data = data
        cls._timestamp = datetime.now()


def _compute() -> Dict:
    now = datetime.now()
    upcoming: List[Dict] = []
    next_meeting: Optional[Dict] = None

    for dstr in _ALL_DATES:
        d = datetime.strptime(dstr, '%Y-%m-%d')
        delta = d - now
        days = delta.total_seconds() / 86400
        if days >= -1:  # 包含今天刚结束的, 标记已结束
            entry = {
                'date': dstr,
                'days_until': round(delta.total_seconds() / 86400, 1),
                'hours_until': round(delta.total_seconds() / 3600, 1),
                'is_past': days < 0,
                'tentative': dstr.startswith('2026'),
            }
            upcoming.append(entry)
            if next_meeting is None and days >= 0:
                next_meeting = entry

    return {
        'next_meeting': next_meeting,
        'upcoming': upcoming[:8],  # 未来最多 8 次
        'timestamp': datetime.now().isoformat(),
    }


def get_fedwatch() -> Dict:
    """FOMC 日历 + 下次会议倒计时。1h 缓存。"""
    cached = FedWatchCache.get()
    if cached:
        # 倒计时用当前时间重算(缓存的是日程, 时间推进后重算下次)
        return _recompute_countdown(cached)
    data = _compute()
    FedWatchCache.set(data)
    return data


def _recompute_countdown(cached: Dict) -> Dict:
    """缓存命中时, 用当前时间重算倒计时(避免显示陈旧倒计时)。"""
    now = datetime.now()
    refreshed = []
    next_meeting = None
    for e in cached.get('upcoming', []):
        d = datetime.strptime(e['date'], '%Y-%m-%d')
        delta = d - now
        days = delta.total_seconds() / 86400
        entry = {
            'date': e['date'],
            'days_until': round(days, 1),
            'hours_until': round(delta.total_seconds() / 3600, 1),
            'is_past': days < 0,
            'tentative': e.get('tentative', False),
        }
        refreshed.append(entry)
        if next_meeting is None and days >= 0:
            next_meeting = entry
    return {
        'next_meeting': next_meeting,
        'upcoming': refreshed,
        'timestamp': cached.get('timestamp'),
    }
