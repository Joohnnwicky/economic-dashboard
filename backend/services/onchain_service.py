"""
BTC 链上数据服务

主源: mempool.space 免费 API (无需 key)
回退源 (国内网络可访问):
  - blockstream.info /api/fee-estimates          -> 推荐手续费(按确认目标块数)
  - api.blockchair.com /bitcoin/stats            -> 算力/难度/难度调整估计

接口:
1. 算力/难度: mempool /v1/mining/hashrate/3d, 回退 blockchair stats
2. 手续费:    mempool /v1/fees/recommended, 回退 blockstream fee-estimates
3. 难度调整:  mempool /v1/difficulty-adjustment, 回退 blockchair stats 推算

30 分钟内存缓存。单项失败返 None 不影响其他项。
"""
import asyncio
import httpx
from datetime import datetime
from typing import Dict, Optional, List

from config.api_keys import APIConfig


MEMPOOL_BASE = 'https://mempool.space/api'
BLOCKSTREAM_BASE = 'https://blockstream.info/api'
BLOCKCHAIR_STATS = 'https://api.blockchair.com/bitcoin/stats'

_HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}


def _to_millis(ts) -> Optional[int]:
    """mempool/blockchair 返回秒级时间戳，前端统一用毫秒。已为毫秒的原样返回。"""
    if ts is None:
        return None
    try:
        v = float(ts)
    except (ValueError, TypeError):
        return None
    return int(v * 1000) if v < 1e11 else int(v)


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


async def _fetch_blockchair_stats() -> Dict:
    """blockchair 统计: 算力/难度/难度调整估计/最新块高。"""
    try:
        async with httpx.AsyncClient(timeout=15, headers=_HEADERS) as client:
            resp = await client.get(BLOCKCHAIR_STATS)
            data = resp.json().get('data') or {}
        return data
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout, ValueError, TypeError):
        return {}


async def _fetch_hashrate() -> Dict:
    """算力 + 难度 + 3 日趋势。mempool.space 返回 currentHashrate(H/s)。"""
    try:
        async with httpx.AsyncClient(timeout=15, headers=_HEADERS) as client:
            resp = await client.get(f"{MEMPOOL_BASE}/v1/mining/hashrate/3d")
            data = resp.json()
        hashrates = data.get('hashrates') or []
        trend: List[Dict] = []
        for h in hashrates:
            try:
                ts = h.get('timestamp')
                avg = h.get('avgHashrate')
                ts_ms = _to_millis(ts)
                if ts_ms is not None and avg is not None:
                    trend.append({'timestamp': ts_ms, 'hashrate_eh': round(float(avg) / 1e18, 2)})
            except (ValueError, TypeError):
                continue
        return {
            'hashrate_hs': data.get('currentHashrate'),
            'difficulty': data.get('currentDifficulty'),
            'trend': trend,
        }
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout, ValueError, TypeError):
        pass

    # 回退: blockchair stats (无趋势数据)
    stats = await _fetch_blockchair_stats()
    if not stats:
        return {}
    try:
        hashrate_hs = stats.get('hashrate_24h')
        difficulty = stats.get('difficulty')
        if hashrate_hs is not None:
            hashrate_hs = float(hashrate_hs)
        if difficulty is not None:
            difficulty = float(difficulty)
        return {'hashrate_hs': hashrate_hs, 'difficulty': difficulty, 'trend': []}
    except (ValueError, TypeError):
        return {}


async def _fetch_fees() -> Dict:
    """推荐手续费 (sat/vB)。回退 blockstream fee-estimates (键=确认目标块数)。"""
    try:
        async with httpx.AsyncClient(timeout=15, headers=_HEADERS) as client:
            resp = await client.get(f"{MEMPOOL_BASE}/v1/fees/recommended")
            data = resp.json()
        return {
            'fastest': data.get('fastestFee'),
            'half_hour': data.get('halfHourFee'),
            'hour': data.get('hourFee'),
            'minimum': data.get('minimumFee'),
        }
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout, ValueError, TypeError):
        pass

    # 回退: blockstream {目标块数: sat/vB}
    try:
        async with httpx.AsyncClient(timeout=15, headers=_HEADERS) as client:
            resp = await client.get(f"{BLOCKSTREAM_BASE}/fee-estimates")
            data = resp.json()
        return {
            'fastest': data.get('1'),
            'half_hour': data.get('3'),
            'hour': data.get('6'),
            'minimum': data.get('25'),
        }
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout, ValueError, TypeError):
        return {}


async def _fetch_difficulty_adjustment() -> Dict:
    """下次难度调整: 进度% + 预计变化% + 倒计时。回退 blockchair stats 推算。"""
    try:
        async with httpx.AsyncClient(timeout=15, headers=_HEADERS) as client:
            resp = await client.get(f"{MEMPOOL_BASE}/v1/difficulty-adjustment")
            data = resp.json()
        return {
            'progress_percent': data.get('progressPercent'),
            'difficulty_change_percent': data.get('difficultyChange'),
            'remaining_blocks': data.get('remainingBlocks'),
            'expected_retarget_date': _to_millis(data.get('expectedRetargetDate')),
        }
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout, ValueError, TypeError):
        pass

    # 回退: blockchair 按最新块高推算 2016 块周期
    stats = await _fetch_blockchair_stats()
    if not stats:
        return {}
    try:
        height = stats.get('best_block_height')
        difficulty = stats.get('difficulty')
        next_diff = stats.get('next_difficulty_estimate')
        retarget_time = stats.get('next_retarget_time_estimate')
        if height is None:
            return {}
        height = int(height)
        progress = (height % 2016) / 2016 * 100
        change = None
        if next_diff is not None and difficulty:
            change = (float(next_diff) - float(difficulty)) / float(difficulty) * 100
        return {
            'progress_percent': round(progress, 2),
            'difficulty_change_percent': round(change, 2) if change is not None else None,
            'remaining_blocks': 2016 - (height % 2016),
            'expected_retarget_date': _to_millis(retarget_time),
        }
    except (ValueError, TypeError):
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
