"""
主要宏观数据官方发布日程(覆盖表)。

优先级高于 economic_calendar_service 的节奏估算:
  - 命中本表 -> 用官方发布日, approximate=False(精确)
  - 未命中   -> fallback 节奏估算, approximate=True(约)

数据来源:
  CPI / PPI / 零售销售: https://www.bls.gov/schedule/news_release/
  PCE:                  https://www.bea.gov/news/schedule

更新方式: BLS/BEA 每年公布下一年日程, 收到后在此补充对应月份。
         key 为"发布月"(YYYY-MM), value 为官方发布日(YYYY-MM-DD)。
         例: 7 月 CPI 于 2026-08-12 发布 -> '2026-08': '2026-08-12'
"""
from typing import Dict, Optional

# 事件 key -> { 发布月 'YYYY-MM': 官方发布日 'YYYY-MM-DD' }
RELEASE_SCHEDULE: Dict[str, Dict[str, str]] = {
    'CPI': {
        '2026-08': '2026-08-12',   # 8/12 发布 7 月 CPI(用户确认)
    },
    'PPI': {},
    'PCE': {},
    'RETAIL': {},
}


def get_scheduled_release(event_key: str, release_year: int, release_month: int) -> Optional[str]:
    """返回该发布月的官方发布日(YYYY-MM-DD), 无则 None。"""
    return RELEASE_SCHEDULE.get(event_key, {}).get(f'{release_year:04d}-{release_month:02d}')
