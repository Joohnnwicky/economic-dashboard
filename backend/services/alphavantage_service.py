"""
Alpha Vantage API代理服务 - 服务端注入API Key，前端不暴露
配额限制: 25次/天 + 5次/分钟，需要节流 + 长缓存
"""
import asyncio
import time
import httpx
from datetime import datetime
from typing import Dict, Optional
from config.api_keys import APIConfig


# 全局节流：5次/分钟 = 至少 13 秒一个请求（留 1 秒余量给抖动）
# 单进程内共享，按 symbol 串行排队，避免一次刷新 11 只股票把分钟配额打爆
_AV_THROTTLE_LOCK = asyncio.Lock()
_AV_LAST_CALL_TS: float = 0.0
_AV_MIN_INTERVAL_SEC = 13.0
# 限速/错误响应的负缓存 TTL（秒），避免前端轮询同一个 symbol 反复打 AV
_AV_ERROR_CACHE_TTL_SEC = 60


class AlphaVantageCache:
    """Alpha Vantage数据缓存"""
    _cache: Dict[str, dict] = {}
    _timestamps: Dict[str, datetime] = {}
    # 错误响应单独缓存，TTL 短
    _error_cache: Dict[str, dict] = {}
    _error_timestamps: Dict[str, datetime] = {}

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

    @classmethod
    def get_error(cls, key: str) -> Optional[dict]:
        """获取负缓存（限速/配额错误）"""
        if key not in cls._error_cache or key not in cls._error_timestamps:
            return None
        elapsed = datetime.now() - cls._error_timestamps[key]
        if elapsed.total_seconds() >= _AV_ERROR_CACHE_TTL_SEC:
            return None
        return cls._error_cache[key]

    @classmethod
    def set_error(cls, key: str, data: dict):
        """缓存错误响应（短 TTL）"""
        cls._error_cache[key] = data
        cls._error_timestamps[key] = datetime.now()


async def fetch_alpha_vantage_daily(
    symbol: str,
    outputsize: str = 'compact',
) -> dict:
    """
    从Alpha Vantage获取日线数据（带串行节流）

    Args:
        symbol: 股票/ETF代码 (如 'GLD', 'SPY', 'DIA')
        outputsize: 'compact'(100条) 或 'full'(全部)

    Returns:
        Alpha Vantage API响应数据
    """
    # 检查正缓存（1 小时 TTL）
    cache_key = f"{symbol}_{outputsize}"
    cached = AlphaVantageCache.get(cache_key)
    if cached:
        return cached

    # 检查负缓存（限速/错误，60 秒 TTL）— 避免反复重试触发更严限速
    cached_error = AlphaVantageCache.get_error(cache_key)
    if cached_error:
        return cached_error

    # 串行节流：拿全局锁 + 等距 13 秒
    global _AV_LAST_CALL_TS
    async with _AV_THROTTLE_LOCK:
        now = time.monotonic()
        wait = _AV_MIN_INTERVAL_SEC - (now - _AV_LAST_CALL_TS)
        if wait > 0:
            await asyncio.sleep(wait)
        _AV_LAST_CALL_TS = time.monotonic()

        # 锁释放前发请求，确保下一个请求不会偷跑
        params = {
            'function': 'TIME_SERIES_DAILY',
            'symbol': symbol,
            'outputsize': outputsize,
            'apikey': APIConfig.ALPHA_VANTAGE_API_KEY,
        }
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(APIConfig.ALPHA_VANTAGE_BASE_URL, params=params)
                data = response.json()
        except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout) as e:
            err = {'error': f'网络连接失败: {type(e).__name__}', 'symbol': symbol}
            AlphaVantageCache.set_error(cache_key, err)
            return err

    # 检查错误响应（频率限制 / 配额耗尽）
    if 'Information' in data or 'Note' in data:
        err = {'error': data.get('Information') or data.get('Note'), 'symbol': symbol}
        AlphaVantageCache.set_error(cache_key, err)
        return err

    # 正常数据：长缓存
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