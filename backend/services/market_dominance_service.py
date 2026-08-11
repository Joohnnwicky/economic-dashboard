"""
加密市场市占率与山寨季服务

数据源: CoinGecko 免费 API (无需 key)
1. /global -> BTC/ETH 市占率 + 总市值
2. /coins/markets (per_page=50, price_change_percentage=30d) -> 计算山寨季指数

山寨季定义 (Blockchain Center): 前 50 山寨(剔除 BTC 与稳定币)中,
30 日涨幅跑赢 BTC 的占比 >= 75% 即为山寨季。

1h 内存缓存。单项失败返 None 不影响其他项。
"""
import asyncio
import httpx
from datetime import datetime
from typing import Dict, Optional, List

from config.api_keys import APIConfig


COINGECKO_BASE = 'https://api.coingecko.com/api/v3'
STABLECOINS = {'usdt', 'usdc', 'busd', 'dai', 'tusd', 'fdusd', 'usde', 'susde', 'ustc', 'pyusd', 'usdd'}


class MarketDominanceCache:
    _data: Optional[Dict] = None
    _timestamp: Optional[datetime] = None

    @classmethod
    def get(cls) -> Optional[Dict]:
        if cls._data is None or cls._timestamp is None:
            return None
        elapsed = (datetime.now() - cls._timestamp).total_seconds()
        if elapsed >= APIConfig.CACHE_TTL['MarketDominance']:
            return None
        return cls._data

    @classmethod
    def set(cls, data: Dict):
        cls._data = data
        cls._timestamp = datetime.now()


async def _fetch_global() -> Dict:
    """CoinGecko /global: 总市值 + BTC/ETH 市占率。"""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{COINGECKO_BASE}/global")
            data = resp.json()
        d = data.get('data', {})
        mcp = d.get('market_cap_percentage', {})
        total_mcap = d.get('total_market_cap', {}).get('usd')
        total_vol = d.get('total_volume', {}).get('usd')
        mcap_change_24h = d.get('market_cap_change_percentage_24h_usd')
        return {
            'btc_dominance': mcp.get('btc'),
            'eth_dominance': mcp.get('eth'),
            'total_market_cap': total_mcap,
            'total_volume': total_vol,
            'market_cap_change_24h': mcap_change_24h,
        }
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout, ValueError, TypeError, KeyError):
        return {}


async def _fetch_top_coins() -> List[Dict]:
    """CoinGecko /coins/markets: 前 50 币种(含 market_cap 与 30 日涨幅)。"""
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(
                f"{COINGECKO_BASE}/coins/markets",
                params={
                    'vs_currency': 'usd',
                    'order': 'market_cap_desc',
                    'per_page': 50,
                    'page': 1,
                    'price_change_percentage': '30d',
                },
            )
            data = resp.json()
        if not isinstance(data, list):
            return []
        out = []
        for c in data:
            try:
                out.append({
                    'id': c.get('id'),
                    'symbol': (c.get('symbol') or '').upper(),
                    'name': c.get('name'),
                    'market_cap': c.get('market_cap'),
                    'price': c.get('current_price'),
                    'change_30d': c.get('price_change_percentage_30d_in_currency'),
                })
            except (ValueError, TypeError):
                continue
        return out
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout, ValueError, TypeError):
        return []


def _calc_altcoin_season(coins: List[Dict]) -> Dict:
    """
    山寨季指数 = 前 50 中(剔除 BTC 与稳定币) 30 日涨幅跑赢 BTC 的占比。
    >= 75% -> 山寨季; < 50% -> BTC 季; 中间为过渡。
    """
    if not coins:
        return {'index': None, 'is_altcoin_season': None, 'btc_season': None}

    btc = next((c for c in coins if c['symbol'] == 'BTC'), None)
    btc_change = btc['change_30d'] if btc and btc['change_30d'] is not None else None
    if btc_change is None:
        return {'index': None, 'is_altcoin_season': None, 'btc_season': None}

    alts = [c for c in coins if c['symbol'] != 'BTC' and c['symbol'] not in STABLECOINS and c['change_30d'] is not None]
    if not alts:
        return {'index': None, 'is_altcoin_season': None, 'btc_season': None}

    outperform = sum(1 for c in alts if c['change_30d'] > btc_change)
    index = round(outperform / len(alts) * 100)
    return {
        'index': index,
        'is_altcoin_season': index >= 75,
        'btc_season': index < 50,
        'btc_change_30d': round(btc_change, 2),
    }


async def get_market_dominance() -> Dict:
    """聚合市占率 + 山寨季。1h 缓存。"""
    cached = MarketDominanceCache.get()
    if cached:
        return cached

    global_data, coins = await asyncio.gather(_fetch_global(), _fetch_top_coins())
    altseason = _calc_altcoin_season(coins)

    # 前 5 名非稳定币币种(展示用)
    top5 = [
        {'symbol': c['symbol'], 'name': c['name'], 'market_cap': c['market_cap'], 'change_30d': c['change_30d']}
        for c in coins[:6] if c['symbol'] not in STABLECOINS
    ][:5]

    result = {
        **global_data,
        **altseason,
        'top_coins': top5,
        'timestamp': datetime.now().isoformat(),
    }

    # 仅在拿到市占率或山寨季时缓存, 避免空结果被锁存
    if result.get('btc_dominance') is not None or result.get('index') is not None:
        MarketDominanceCache.set(result)
    return result
