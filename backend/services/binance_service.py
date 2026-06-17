"""
Binance API代理服务 - 无需API Key，但需要代理绕过地理限制
"""
import httpx
from datetime import datetime
from typing import Dict, Optional, List
from config.api_keys import APIConfig


class BinanceCache:
    """Binance数据缓存"""
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
        if elapsed.total_seconds() >= APIConfig.CACHE_TTL['Binance']:
            return None  # 缓存过期

        return cls._cache[key]

    @classmethod
    def set(cls, key: str, data: dict):
        """设置缓存"""
        cls._cache[key] = data
        cls._timestamps[key] = datetime.now()


async def fetch_binance_ticker(symbol: str = 'BTCUSDT') -> dict:
    """
    获取Binance 24小时行情数据

    Args:
        symbol: 交易对 (如 'BTCUSDT', 'ETHUSDT')

    Returns:
        行情数据
    """
    # 检查缓存
    cache_key = f"ticker_{symbol}"
    cached = BinanceCache.get(cache_key)
    if cached:
        return cached

    # 发送请求
    url = f"{APIConfig.BINANCE_BASE_URL}/ticker/24hr"
    params = {'symbol': symbol}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, params=params)
            data = response.json()
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout) as e:
        return {'error': f'网络连接失败: {type(e).__name__}', 'symbol': symbol}

    # 缓存结果
    if 'lastPrice' in data:
        BinanceCache.set(cache_key, data)

    return data


async def fetch_binance_klines(
    symbol: str = 'BTCUSDT',
    interval: str = '1h',
    limit: int = 24,
) -> dict:
    """
    获取Binance K线数据

    Args:
        symbol: 交易对
        interval: K线周期 (1m, 5m, 15m, 1h, 4h, 1d, 1w, 1M)
        limit: 数据条数 (最大1000)

    Returns:
        K线数据
    """
    # 检查缓存
    cache_key = f"klines_{symbol}_{interval}_{limit}"
    cached = BinanceCache.get(cache_key)
    if cached:
        return cached

    # 发送请求
    url = f"{APIConfig.BINANCE_BASE_URL}/klines"
    params = {
        'symbol': symbol,
        'interval': interval,
        'limit': limit,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, params=params)
            data = response.json()
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout) as e:
        return {'klines': [], 'symbol': symbol, 'error': f'网络连接失败: {type(e).__name__}'}

    # 缓存结果
    if isinstance(data, list) and len(data) > 0:
        BinanceCache.set(cache_key, {'klines': data, 'symbol': symbol})

    return {'klines': data, 'symbol': symbol}


async def fetch_multiple_binance_tickers(symbols: List[str]) -> dict:
    """
    批量获取多个交易对的行情

    Args:
        symbols: 交易对列表

    Returns:
        {symbol: ticker_data} 字典
    """
    results = {}
    for symbol in symbols:
        ticker = await fetch_binance_ticker(symbol)
        results[symbol] = ticker
    return results


def normalize_binance_ticker(data: dict, symbol: str) -> dict:
    """
    规范化Binance行情数据

    Args:
        data: Binance API响应
        symbol: 交易对

    Returns:
        规范化后的行情数据
    """
    if 'lastPrice' not in data:
        return {'error': 'No ticker data', 'symbol': symbol}

    try:
        price = float(data['lastPrice'])
        change_pct = float(data['priceChangePercent'])

        return {
            'symbol': symbol,
            'price': price,
            'change_24h': change_pct,
            'volume': float(data['volume']),
            'timestamp': datetime.now().isoformat(),
        }
    except (ValueError, TypeError):
        return {'error': 'Invalid data format', 'symbol': symbol}


def normalize_binance_klines(data: dict) -> dict:
    """
    规范化Binance K线数据

    Args:
        data: 包含klines列表的数据

    Returns:
        规范化后的K线数据
    """
    if 'klines' not in data or not isinstance(data['klines'], list):
        return {'error': 'No klines data'}

    symbol = data.get('symbol', 'UNKNOWN')
    klines = data['klines']

    # Binance K线格式: [openTime, open, high, low, close, volume, closeTime, ...]
    historical = []
    for kline in klines:
        try:
            historical.append({
                'timestamp': datetime.fromtimestamp(kline[0] / 1000).isoformat(),
                'value': float(kline[4]),  # close price
                'open': float(kline[1]),
                'high': float(kline[2]),
                'low': float(kline[3]),
                'volume': float(kline[5]),
            })
        except (ValueError, TypeError, IndexError):
            continue

    if not historical:
        return {'error': 'No valid klines data', 'symbol': symbol}

    current = historical[-1]

    return {
        'symbol': symbol,
        'value': current['value'],
        'timestamp': current['timestamp'],
        'historical': historical,
    }


async def fetch_top_volume_symbols(top_n: int = 10) -> list:
    """
    获取币安USDT交易对24h交易量排行
    返回前top_n个交易对的行情数据
    """
    cache_key = f"top_volume_{top_n}"
    cached = BinanceCache.get(cache_key)
    if cached:
        return cached

    url = f"{APIConfig.BINANCE_BASE_URL}/ticker/24hr"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url)
            data = response.json()
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout):
        return []

    if not isinstance(data, list):
        return []

    # 只筛选USDT交易对，排除稳定币对
    stablecoins = {'USDT', 'BUSD', 'FDUSD', 'TUSD', 'DAI', 'USDC', 'USD1', 'USTC', 'PYUSD'}
    usdt_pairs = [
        t for t in data
        if t.get('symbol', '').endswith('USDT')
        and t.get('symbol', '')[:-4] not in stablecoins
    ]

    # 按24h交易量(USDT)排序
    usdt_pairs.sort(key=lambda x: float(x.get('quoteVolume', 0)), reverse=True)

    top = usdt_pairs[:top_n]

    result = []
    for t in top:
        symbol = t['symbol']
        base = symbol[:-4]  # 去掉USDT
        try:
            result.append({
                'symbol': symbol,
                'base': base,
                'price': float(t['lastPrice']),
                'change24h': float(t['priceChangePercent']),
                'volume24h': float(t['quoteVolume']),
                'high24h': float(t['highPrice']),
                'low24h': float(t['lowPrice']),
            })
        except (ValueError, TypeError):
            continue

    BinanceCache.set(cache_key, result)
    return result