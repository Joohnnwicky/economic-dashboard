"""
Alpha Vantage API代理服务 - 服务端注入API Key，前端不暴露
配额限制: 25次/天，需要长时间缓存
"""
import httpx
from datetime import datetime
from typing import Dict, Optional
from config.api_keys import APIConfig


class AlphaVantageCache:
    """Alpha Vantage数据缓存"""
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
        if elapsed.total_seconds() >= APIConfig.CACHE_TTL['AlphaVantage']:
            return None  # 缓存过期

        return cls._cache[key]

    @classmethod
    def set(cls, key: str, data: dict):
        """设置缓存"""
        cls._cache[key] = data
        cls._timestamps[key] = datetime.now()


async def fetch_alpha_vantage_daily(
    symbol: str,
    outputsize: str = 'compact',
) -> dict:
    """
    从Alpha Vantage获取日线数据

    Args:
        symbol: 股票/ETF代码 (如 'GLD', 'SPY', 'DIA')
        outputsize: 'compact'(100条) 或 'full'(全部)

    Returns:
        Alpha Vantage API响应数据
    """
    # 检查缓存
    cache_key = f"{symbol}_{outputsize}"
    cached = AlphaVantageCache.get(cache_key)
    if cached:
        return cached

    # 构建请求参数
    params = {
        'function': 'TIME_SERIES_DAILY',
        'symbol': symbol,
        'outputsize': outputsize,
        'apikey': APIConfig.ALPHA_VANTAGE_API_KEY,
    }

    # 发送请求
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(APIConfig.ALPHA_VANTAGE_BASE_URL, params=params)
        data = response.json()

    # 检查错误响应
    if 'Information' in data or 'Note' in data:
        # 频率限制或配额限制，不缓存错误
        return {'error': data.get('Information') or data.get('Note'), 'symbol': symbol}

    # 缓存结果
    if 'Time Series (Daily)' in data:
        AlphaVantageCache.set(cache_key, data)

    return data


def normalize_alpha_vantage_data(data: dict, symbol: str) -> dict:
    """
    规范化Alpha Vantage数据为统一格式

    Args:
        data: Alpha Vantage API响应
        symbol: 股票代码

    Returns:
        规范化后的指标数据
    """
    if 'error' in data:
        return data

    if 'Time Series (Daily)' not in data:
        return {'error': 'No time series data', 'symbol': symbol}

    time_series = data['Time Series (Daily)']

    # 按日期排序
    historical = []
    for date_str, values in sorted(time_series.items()):
        try:
            close_price = float(values['4. close'])
            historical.append({
                'timestamp': date_str,
                'value': close_price,
                'open': float(values['1. open']),
                'high': float(values['2. high']),
                'low': float(values['3. low']),
                'volume': int(values['5. volume']),
            })
        except (ValueError, TypeError):
            continue

    if not historical:
        return {'error': 'No valid data', 'symbol': symbol}

    # 最新数据在最后
    current = historical[-1]
    previous = historical[-2] if len(historical) > 1 else None

    change = None
    if previous and previous['value'] > 0:
        change_value = current['value'] - previous['value']
        change_pct = (change_value / previous['value']) * 100
        change = {
            'value': change_value,
            'percentage': change_pct,
        }

    return {
        'symbol': symbol,
        'value': current['value'],
        'timestamp': current['timestamp'],
        'change': change,
        'historical': historical[-365:] if len(historical) > 365 else historical,
    }