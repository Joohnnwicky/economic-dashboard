"""经济指标发布日采集调度器。

流程: 官网 fetcher 优先(bls/stats) -> DDG+LLM 单指标兜底 -> fallback 估算。
结果持久化到 data/release_cache.json, 供 economic_calendar_service 读取。
每指标独立处理, 单点失败不阻塞其他。
"""
import json
import os
from datetime import datetime, date
from typing import Dict
from zoneinfo import ZoneInfo

from config.api_keys import APIConfig
from data.indicators_config import INDICATORS
from services.llm_client import llm_extract_release_date
from services.web_search import search
from services.release_fetchers import run_fetcher

_BJ = ZoneInfo('Asia/Shanghai')
_CACHE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'release_cache.json')

# LLM 解析 confidence 低于此值不采用, 降级 fallback
_LLM_MIN_CONFIDENCE = 0.6


def _is_future_date(date_str: str, today: date) -> bool:
    """解析 'YYYY-MM-DD', 返回是否 >= today。无效/过去日期返回 False。"""
    if not date_str:
        return False
    try:
        y, m, d = date_str[:10].split('-')
        return date(int(y), int(m), int(d)) >= today
    except Exception:
        return False


def _load_cache() -> dict:
    if not os.path.exists(_CACHE_PATH):
        return {'updated_at': None, 'events': {}}
    try:
        with open(_CACHE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {'updated_at': None, 'events': {}}


def _save_cache(cache: dict):
    os.makedirs(os.path.dirname(_CACHE_PATH), exist_ok=True)
    with open(_CACHE_PATH, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def load_release_cache() -> dict:
    """供 economic_calendar_service 读取: 返回 {指标key: {date, source, confidence, detail}}。"""
    return _load_cache().get('events', {})


async def refresh_releases() -> dict:
    """采集所有指标的发布日, 持久化, 返回采集报告。"""
    now = datetime.now(_BJ)
    result: Dict[str, dict] = {}

    # 1. 官网 fetcher 分组采集(bls, stats)
    official_results: Dict[str, dict] = {}
    sources = sorted({i.fetcher for i in INDICATORS if i.fetcher != 'none'})
    for source in sources:
        try:
            official_results.update(await run_fetcher(source))
        except Exception:
            pass

    # 2. 逐指标: 官网命中 -> LLM 兜底(搜索+解析) -> fallback 估算
    today = now.date()
    for ind in INDICATORS:
        if ind.key in official_results:
            r = official_results[ind.key]
            if _is_future_date(r.get('date'), today):
                result[ind.key] = {
                    'key': ind.key, 'name': ind.name, 'country': ind.country,
                    'date': r['date'], 'source': 'official',
                    'confidence': r.get('confidence', 0), 'detail': r.get('source', ''),
                }
                continue

        # LLM 兜底
        snippets = await search(ind.search_query, 5)
        if snippets:
            llm_res = await llm_extract_release_date(ind.name, snippets)
            if llm_res and _is_future_date(llm_res.get('date'), today) \
                    and llm_res.get('confidence', 0) >= _LLM_MIN_CONFIDENCE:
                result[ind.key] = {
                    'key': ind.key, 'name': ind.name, 'country': ind.country,
                    'date': llm_res['date'], 'source': 'llm',
                    'confidence': llm_res.get('confidence', 0),
                    'detail': llm_res.get('source', ''),
                }
                continue

        # fallback 估算(date=None, 由 economic_calendar_service 规则算)
        result[ind.key] = {
            'key': ind.key, 'name': ind.name, 'country': ind.country,
            'date': None, 'source': 'fallback', 'confidence': 0,
            'detail': ind.fallback_desc,
        }

    # 3. 持久化(只存有日期的)
    events = {k: v for k, v in result.items() if v['date']}
    _save_cache({'updated_at': now.isoformat(), 'events': events})

    return {
        'refreshed_at': now.isoformat(),
        'total': len(INDICATORS),
        'official': sum(1 for v in result.values() if v['source'] == 'official'),
        'llm': sum(1 for v in result.values() if v['source'] == 'llm'),
        'fallback': sum(1 for v in result.values() if v['source'] == 'fallback'),
        'details': list(result.values()),
    }
