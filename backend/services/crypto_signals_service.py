"""
加密牛熊信号聚合服务

聚合三个数据稳定的指标用于综合判断 BTC 牛熊：
1. 恐惧贪婪指数 - alternative.me 免费 API（情绪面）
2. BTC 200日均线偏离% - Binance 日线自算（估值面，MVRV 的降级代理）
3. Pi Cycle 顶部信号 - 111日均线 vs 350日均线×2（周期面）

数据源全部免费无 key，1h 内存缓存。
"""
import asyncio
import httpx
from datetime import datetime
from typing import Dict, Optional, List

from config.api_keys import APIConfig
from services.binance_service import fetch_binance_klines


FNG_URL = 'https://api.alternative.me/fng/'


class CryptoSignalsCache:
    """牛熊信号内存缓存，TTL 取 APIConfig.CACHE_TTL['CryptoSignals']"""
    _data: Optional[Dict] = None
    _timestamp: Optional[datetime] = None

    @classmethod
    def get(cls) -> Optional[Dict]:
        if cls._data is None or cls._timestamp is None:
            return None
        elapsed = (datetime.now() - cls._timestamp).total_seconds()
        if elapsed >= APIConfig.CACHE_TTL['CryptoSignals']:
            return None
        return cls._data

    @classmethod
    def set(cls, data: Dict):
        cls._data = data
        cls._timestamp = datetime.now()


async def _fetch_fear_greed() -> Dict:
    """恐惧贪婪指数（alternative.me，免费无 key）。返回当前值+昨日值。"""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(FNG_URL, params={'limit': 2})
            data = resp.json()
            arr = data.get('data', [])
            now = arr[0] if len(arr) >= 1 else None
            yesterday = arr[1] if len(arr) >= 2 else None
            return {
                'value': int(now['value']) if now else None,
                'classification': now.get('value_classification') if now else None,
                'yesterday': int(yesterday['value']) if yesterday else None,
            }
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout, ValueError, TypeError, KeyError):
        return {'value': None, 'classification': None, 'yesterday': None}


def _calc_ma_trend(closes: List[float]) -> Dict:
    """
    从 BTC 日线收盘价序列计算均线趋势指标。
    closes 需升序，至少 350 根才能算 SMA350。
    """
    n = len(closes)
    result = {
        'price': closes[-1] if n > 0 else None,
        'ma200': None,
        'ma111': None,
        'ma350': None,
        'deviationPct': None,     # (price - MA200) / MA200 * 100
        'piCycleSignal': False,   # SMA111 > SMA350*2 -> 顶部预警
        'aboveMa200': None,       # 价格是否在 200 日线上方（经典牛熊分界）
    }
    if n < 200:
        return result

    ma200 = sum(closes[-200:]) / 200
    result['ma200'] = round(ma200, 2)
    result['deviationPct'] = round((closes[-1] - ma200) / ma200 * 100, 2)
    result['aboveMa200'] = closes[-1] > ma200

    if n >= 350:
        ma111 = sum(closes[-111:]) / 111
        ma350 = sum(closes[-350:]) / 350
        result['ma111'] = round(ma111, 2)
        result['ma350'] = round(ma350, 2)
        # Pi Cycle Top: 111日均线 上穿 350日均线×2 -> 周期顶部预警
        result['piCycleSignal'] = ma111 > ma350 * 2

    return result


async def get_crypto_signals() -> Dict:
    """
    聚合牛熊信号。1h 缓存。

    Returns:
        {fearGreed, ma200, ma111, ma350, price, deviationPct, piCycleSignal, aboveMa200, timestamp}
        单项失败时该项为 None，不影响其他项。
    """
    cached = CryptoSignalsCache.get()
    if cached:
        return cached

    # 并发：恐惧贪婪 + Binance 365 日线
    fng, klines = await asyncio.gather(
        _fetch_fear_greed(),
        fetch_binance_klines('BTCUSDT', '1d', 365),
    )

    # 从 klines 提取收盘价（升序）
    closes: List[float] = []
    if isinstance(klines, dict) and isinstance(klines.get('klines'), list):
        try:
            closes = [float(k[4]) for k in klines['klines']]
        except (ValueError, TypeError, IndexError):
            closes = []

    ma_trend = _calc_ma_trend(closes)

    result = {
        'fearGreed': fng['value'],
        'fearGreedClassification': fng['classification'],
        'fearGreedYesterday': fng['yesterday'],
        'price': ma_trend['price'],
        'ma200': ma_trend['ma200'],
        'ma111': ma_trend['ma111'],
        'ma350': ma_trend['ma350'],
        'deviationPct': ma_trend['deviationPct'],
        'piCycleSignal': ma_trend['piCycleSignal'],
        'aboveMa200': ma_trend['aboveMa200'],
        'timestamp': datetime.now().isoformat(),
    }
    # 仅在恐惧贪婪成功时长缓存；alternative.me 抖动返回 None 时不缓存，
    # 下次请求立即重试，避免单点失败被锁存 1 小时
    if result['fearGreed'] is not None:
        CryptoSignalsCache.set(result)
    return result
