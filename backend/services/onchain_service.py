"""
BTC 链上数据服务

数据源: mempool.space 免费 API (无需 key)
1. /v1/mining/hashrate/3d  -> 当前算力(H/s) + 难度 + 3日趋势
2. /v1/fees/recommended     -> 推荐手续费(sat/vB)
3. /v1/difficulty-adjustment -> 下次难度调整进度/倒计时

30 分钟内存缓存。单项失败返 None 不影响其他项。
"""
import asyncio
import httpx
from datetime import datetime
from typing import Dict, Optional, List

from config.api_keys import APIConfig


MEMPOOL_BASE = 'https://mempool.space/api'


class OnchainCache:
    _data: Optional[Dict] = None
    _timestamp: Optional[datetime] = None

    @classmethod
    def get(cls) -> Optional[Dict]:
        if cls._data is None or cls._timestamp is None:
            return None
        elapsed = (datetime.now() - cls._timestamp).total_seconds()
        if elapsed >= APIConfig.CACHE_TTL['Onchain']:
            return None
        return cls._data

    @classmethod
    def set(cls, data: Dict):
        cls._data = data
        cls._timestamp = datetime.now()


async def _fetch_hashrate() -> Dict:
    """算力 + 难度 + 3 日趋势。mempool.space 返回 currentHashrate(H/s)。"""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{MEMPOOL_BASE}/v1/mining/hashrate/3d")
            data = resp.json()
        hashrates = data.get('hashrates') or []
        trend: List[Dict] = []
        for h in hashrates:
            try:
                ts = h.get('timestamp')
                avg = h.get('avgHashrate')
                if ts is not None and avg is not None:
                    trend.append({'timestamp': ts, 'hashrate_eh': round(float(avg) / 1e18, 2)})
            except (ValueError, TypeError):
                continue
        return {
            'hashrate_hs': data.get('currentHashrate'),
            'difficulty': data.get('currentDifficulty'),
            'trend': trend,
        }
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout, ValueError, TypeError):
        return {}


async def _fetch_fees() -> Dict:
    """推荐手续费 (sat/vB)。"""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{MEMPOOL_BASE}/v1/fees/recommended")
            data = resp.json()
        return {
            'fastest': data.get('fastestFee'),
            'half_hour': data.get('halfHourFee'),
            'hour': data.get('hourFee'),
            'minimum': data.get('minimumFee'),
        }
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout, ValueError, TypeError):
        return {}


async def _fetch_difficulty_adjustment() -> Dict:
    """下次难度调整: 进度% + 预计变化% + 倒计时。"""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{MEMPOOL_BASE}/v1/difficulty-adjustment")
            data = resp.json()
        return {
            'progress_percent': data.get('progressPercent'),
            'difficulty_change_percent': data.get('difficultyChange'),
            'remaining_blocks': data.get('remainingBlocks'),
            'expected_retarget_date': data.get('expectedRetargetDate'),
        }
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout, ValueError, TypeError):
        return {}


async def get_onchain() -> Dict:
    """聚合链上数据。30min 缓存。"""
    cached = OnchainCache.get()
    if cached:
        return cached

    hashrate, fees, diff = await asyncio.gather(
        _fetch_hashrate(), _fetch_fees(), _fetch_difficulty_adjustment()
    )

    result = {
        **hashrate,
        **fees,
        **diff,
        'timestamp': datetime.now().isoformat(),
    }

    # 仅在至少拿到算力或手续费时缓存
    if result.get('hashrate_hs') is not None or result.get('fastest') is not None:
        OnchainCache.set(result)
    return result
