"""
CoinGecko 免费 API 服务 — 作为 Binance 被墙时的 fallback 数据源
无需 API Key, 速率限制 ~30 calls/min
"""
import httpx
from typing import List, Optional
from datetime import datetime

COINGECKO_BASE = "https://api.coingecko.com/api/v3"


class CoinGeckoCache:
    """CoinGecko 数据缓存"""
    _cache: Optional[List[dict]] = None
    _timestamp: Optional[datetime] = None
    _ttl_seconds = 120  # 2 分钟缓存

    @classmethod
    def get(cls) -> Optional[List[dict]]:
        if cls._cache is None or cls._timestamp is None:
            return None
        if (datetime.now() - cls._timestamp).total_seconds() >= cls._ttl_seconds:
            return None
        return cls._cache

    @classmethod
    def set(cls, data: List[dict]):
        cls._cache = data
        cls._timestamp = datetime.now()


async def fetch_top_volume_from_coingecko(top_n: int = 10) -> list:
    """
    从 CoinGecko 获取交易量排名前 N 的币种。
    返回格式与 binance_service.fetch_top_volume_symbols 一致，
    确保前端不需要修改。
    """
    cached = CoinGeckoCache.get()
    if cached:
        return cached[:top_n]

    url = f"{COINGECKO_BASE}/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "volume_desc",
        "per_page": min(top_n + 5, 50),  # 多取几个以防止稳定币过滤后不够
        "page": 1,
        "sparkline": "false",
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
    except Exception as e:
        print(f"CoinGecko API 请求失败: {e}")
        return []

    if not isinstance(data, list):
        return []

    # 过滤稳定币 (与 binance_service 逻辑一致)
    stablecoins = {'usdt', 'usdc', 'busd', 'fdusd', 'tusd', 'dai', 'usd1', 'ustc', 'pyusd'}

    result = []
    for c in data:
        symbol = (c.get('symbol') or '').upper()
        if symbol.lower() in stablecoins:
            continue
        try:
            result.append({
                'symbol': f"{symbol}USDT",
                'base': symbol,
                'price': float(c.get('current_price', 0)),
                'change24h': float(c.get('price_change_percentage_24h') or 0),
                'volume24h': float(c.get('total_volume', 0)),
                'high24h': float(c.get('high_24h', 0)),
                'low24h': float(c.get('low_24h', 0)),
            })
        except (ValueError, TypeError):
            continue

    # 按 24h 交易量降序
    result.sort(key=lambda x: x['volume24h'], reverse=True)
    result = result[:top_n]

    CoinGeckoCache.set(result)
    return result
