"""
FRED API代理服务 - 服务端注入API Key，前端不暴露
"""
import httpx
from datetime import datetime, timedelta
from typing import Dict, Optional
from config.api_keys import APIConfig


class FredCache:
    """FRED数据缓存"""
    _cache: Dict[str, dict] = {}
    _timestamps: Dict[str, datetime] = {}

    @classmethod
    def get(cls, key: str) -> Optional[dict]:
        """获取缓存数据"""
        if key not in cls._cache:
            return None
        if key not in cls._timestamps:
            return None

        elapsed = datetime.now() - cls._timestamps[key]
        if elapsed.total_seconds() >= APIConfig.CACHE_TTL['FRED']:
            return None  # 缓存过期

        return cls._cache[key]

    @classmethod
    def set(cls, key: str, data: dict):
        """设置缓存"""
        cls._cache[key] = data
        cls._timestamps[key] = datetime.now()

    @classmethod
    def clear_expired(cls):
        """清除过期缓存"""
        ttl = APIConfig.CACHE_TTL['FRED']
        expired_keys = [
            k for k, t in cls._timestamps.items()
            if (datetime.now() - t).total_seconds() >= ttl
        ]
        for k in expired_keys:
            cls._cache.pop(k, None)
            cls._timestamps.pop(k, None)


async def fetch_fred_series(
    series_id: str,
    observation_start: Optional[str] = None,
    observation_end: Optional[str] = None,
) -> dict:
    """
    从FRED API获取时间序列数据

    Args:
        series_id: FRED序列ID (如 'FEDFUNDS', 'CPIAUCSL')
        observation_start: 开始日期 (YYYY-MM-DD)
        observation_end: 结束日期 (YYYY-MM-DD)

    Returns:
        FRED API响应数据
    """
    # 检查缓存
    cache_key = f"{series_id}_{observation_start}_{observation_end}"
    cached = FredCache.get(cache_key)
    if cached:
        return cached

    # 构建请求参数
    params = {
        'series_id': series_id,
        'api_key': APIConfig.FRED_API_KEY,
        'file_type': 'json',
    }

    if observation_start:
        params['observation_start'] = observation_start
    if observation_end:
        params['observation_end'] = observation_end

    # 发送请求
    url = f"{APIConfig.FRED_BASE_URL}/series/observations"

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url, params=params)
        data = response.json()

    # 缓存结果
    if 'observations' in data:
        FredCache.set(cache_key, data)

    return data


async def fetch_multiple_fred_series(
    series_ids: list[str],
    observation_start: Optional[str] = None,
    observation_end: Optional[str] = None,
) -> dict:
    """
    批量获取多个FRED序列数据

    Args:
        series_ids: 序列ID列表
        observation_start: 开始日期
        observation_end: 结束日期

    Returns:
        {series_id: data} 字典
    """
    results = {}
    for series_id in series_ids:
        results[series_id] = await fetch_fred_series(
            series_id, observation_start, observation_end
        )
    return results


def normalize_fred_data(data: dict, series_id: str) -> dict:
    """
    规范化FRED数据为统一格式

    Args:
        data: FRED API响应
        series_id: 序列ID

    Returns:
        规范化后的指标数据
    """
    if 'observations' not in data:
        return {'error': 'No observations data', 'series_id': series_id}

    observations = data['observations']

    # 过滤有效数据
    historical = [
        {'timestamp': obs['date'], 'value': float(obs['value'])}
        for obs in observations
        if obs['value'] != '.'
    ]

    if not historical:
        return {'error': 'No valid data', 'series_id': series_id}

    current = historical[-1]

    return {
        'series_id': series_id,
        'value': current['value'],
        'timestamp': current['timestamp'],
        'historical': historical,
    }