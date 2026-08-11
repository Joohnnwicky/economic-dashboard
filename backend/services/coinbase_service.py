"""
Coinbase 比特币溢价指数服务

溢价 = Coinbase BTC/USD 现货价 - Binance BTC/USDT 价
溢价率 = (Coinbase - Binance) / Binance * 100%

数据源: Coinbase 公开 API（无 key）+ Binance（复用现有服务，已有 30s 缓存）
注意: api.exchange.coinbase.com 在国内可能需要代理（同 Binance）。
"""
import asyncio
import httpx
from datetime import datetime
from typing import Dict, Optional, List

from config.api_keys import APIConfig
from services.binance_service import fetch_binance_ticker, fetch_binance_klines


COINBASE_BASE_URL = 'https://api.exchange.coinbase.com'


class CoinbasePremiumCache:
    """溢价数据内存缓存，TTL 取 APIConfig.CACHE_TTL['Coinbase']"""
    _data: Optional[Dict] = None
    _timestamp: Optional[datetime] = None

    @classmethod
    def get(cls) -> Optional[Dict]:
        if cls._data is None or cls._timestamp is None:
            return None
        elapsed = (datetime.now() - cls._timestamp).total_seconds()
        if elapsed >= APIConfig.CACHE_TTL['Coinbase']:
            return None
        return cls._data

    @classmethod
    def set(cls, data: Dict):
        cls._data = data
        cls._timestamp = datetime.now()


async def _fetch_coinbase_btc_price() -> Optional[float]:
    """Coinbase BTC/USD 现货最新成交价"""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{COINBASE_BASE_URL}/products/BTC-USD/ticker")
            data = resp.json()
            price = data.get('price')
            return float(price) if price else None
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout, ValueError, TypeError):
        return None


async def _fetch_coinbase_btc_candles() -> List[Dict]:
    """Coinbase BTC/USD 24h hourly candles，返回升序 [{timestamp, value(close)}]"""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # granularity=3600 (1h)；Coinbase 返回最近 ~300 根，取最新 24 根
            resp = await client.get(
                f"{COINBASE_BASE_URL}/products/BTC-USD/candles",
                params={'granularity': '3600'},
            )
            data = resp.json()
            if not isinstance(data, list) or not data:
                return []
            # Coinbase 格式: [[time, low, high, open, close, volume], ...] 倒序（最新在前）
            candles = data[:24]
            candles.reverse()  # 升序
            return [
                {
                    'timestamp': datetime.fromtimestamp(c[0]).isoformat(),
                    'value': float(c[4]),  # close
                }
                for c in candles
            ]
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout, ValueError, TypeError, IndexError):
        return []


async def get_coinbase_premium() -> Dict:
    """
    计算 Coinbase 比特币溢价指数。

    Returns:
        {coinbasePrice, binancePrice, premium, premiumPercent, timestamp, historical}
        historical: 24h hourly 溢价序列（Coinbase close - Binance close 按 index 对齐）
        失败时返回 {'error': ...}
    """
    cached = CoinbasePremiumCache.get()
    if cached:
        return cached

    # 并发取 Coinbase 现货价 + Binance 现货价 + 两边 24h hourly 历史
    coinbase_price, binance_ticker, coinbase_candles, binance_klines = await asyncio.gather(
        _fetch_coinbase_btc_price(),
        fetch_binance_ticker('BTCUSDT'),
        _fetch_coinbase_btc_candles(),
        fetch_binance_klines('BTCUSDT', '1h', 24),
    )

    binance_price = (
        float(binance_ticker['lastPrice'])
        if isinstance(binance_ticker, dict) and 'lastPrice' in binance_ticker
        else None
    )

    if not coinbase_price or not binance_price:
        return {'error': '无法获取 Coinbase 或 Binance BTC 价格（Coinbase 可能需要代理访问）'}

    premium = round(coinbase_price - binance_price, 2)
    premium_pct = round((premium / binance_price) * 100, 4)

    # 对齐 24h hourly 溢价历史（两边都是最近 24 根 1h，按 index 对齐）
    cb_vals = [c['value'] for c in coinbase_candles]
    bn_klines = binance_klines.get('klines', []) if isinstance(binance_klines, dict) else []
    bn_vals = [float(k[4]) for k in bn_klines]  # close
    n = min(len(cb_vals), len(bn_vals))
    historical = [
        {
            'timestamp': coinbase_candles[i]['timestamp'],
            'value': round(cb_vals[i] - bn_vals[i], 2),
        }
        for i in range(n)
    ]

    result = {
        'coinbasePrice': coinbase_price,
        'binancePrice': binance_price,
        'premium': premium,
        'premiumPercent': premium_pct,
        'timestamp': datetime.now().isoformat(),
        'historical': historical,
    }
    CoinbasePremiumCache.set(result)
    return result
