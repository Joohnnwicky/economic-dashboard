"""
BLS API代理服务 - 服务端注入API Key，前端不暴露
配额限制: 25次/天，需要长时间缓存
"""
import httpx
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from config.api_keys import APIConfig


class BlsCache:
    """BLS数据缓存"""
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
        if elapsed.total_seconds() >= APIConfig.CACHE_TTL['BLS']:
            return None  # 缓存过期

        return cls._cache[key]

    @classmethod
    def set(cls, key: str, data: dict):
        """设置缓存"""
        cls._cache[key] = data
        cls._timestamps[key] = datetime.now()


async def fetch_bls_series(
    series_ids: List[str],
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
) -> dict:
    """
    从BLS API获取时间序列数据

    Args:
        series_ids: BLS序列ID列表 (如 ['LNS14000000', 'CES0000000001'])
        start_year: 开始年份
        end_year: 结束年份

    Returns:
        BLS API响应数据
    """
    # 检查缓存
    cache_key = f"{','.join(series_ids)}_{start_year}_{end_year}"
    cached = BlsCache.get(cache_key)
    if cached:
        return cached

    # 构建请求体
    current_year = datetime.now().year
    body = {
        'seriesid': series_ids,
        'registrationKey': APIConfig.BLS_API_KEY,
    }

    if start_year:
        body['startyear'] = str(start_year)
    if end_year:
        body['endyear'] = str(end_year)

    # 发送POST请求
    url = f"{APIConfig.BLS_BASE_URL}/timeseries/data/"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, json=body)
            data = response.json()
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout) as e:
        return {'error': f'网络连接失败: {type(e).__name__}'}

    # 缓存结果
    if 'Results' in data and 'series' in data['Results']:
        BlsCache.set(cache_key, data)

    return data


def normalize_bls_data(data: dict) -> dict:
    """
    规范化BLS数据为统一格式

    Args:
        data: BLS API响应

    Returns:
        规范化后的数据字典 {series_id: normalized_data}
    """
    if 'Results' not in data or 'series' not in data['Results']:
        return {'error': 'No series data'}

    results = {}
    for series in data['Results']['series']:
        series_id = series['seriesID']
        observations = series['data']

        # 按日期排序
        historical = []
        for obs in observations:
            # BLS返回格式: year + periodName (如 "2024 M01")
            year = obs['year']
            period = obs['period']
            period_name = obs.get('periodName', '')

            # 构建日期字符串
            if period.startswith('M'):
                month = period[1:]
                date_str = f"{year}-{month}-01"
            else:
                date_str = f"{year}-01-01"

            try:
                value = float(obs['value'])
                historical.append({
                    'timestamp': date_str,
                    'value': value,
                    'period_name': period_name,
                })
            except (ValueError, TypeError):
                continue

        if historical:
            # 按日期排序 (最新在前)
            historical.sort(key=lambda x: x['timestamp'], reverse=True)
            current = historical[0]

            results[series_id] = {
                'series_id': series_id,
                'value': current['value'],
                'timestamp': current['timestamp'],
                'historical': historical,
            }

    return results