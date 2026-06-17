"""
yfinance US stock data service - 无API Key，无日配额
逐个获取 + 间隔延迟避免 Yahoo 429 限流
替代 Alpha Vantage（25次/天配额不够用）
"""
import asyncio
import time
from datetime import datetime
from typing import List, Optional

import yfinance as yf

from config.api_keys import APIConfig


# 与前端 TRACKED_STOCKS 对应的元数据
TRACKED_SYMBOLS = [
    {"symbol": "AAPL",  "name": "苹果（Apple）",        "category": "mag7"},
    {"symbol": "MSFT",  "name": "微软（Microsoft）",     "category": "mag7"},
    {"symbol": "GOOGL", "name": "谷歌（Alphabet）",      "category": "mag7"},
    {"symbol": "AMZN",  "name": "亚马逊（Amazon）",      "category": "mag7"},
    {"symbol": "NVDA",  "name": "英伟达（NVIDIA）",      "category": "mag7"},
    {"symbol": "META",  "name": "Meta（Facebook）",      "category": "mag7"},
    {"symbol": "TSLA",  "name": "特斯拉（Tesla）",       "category": "mag7"},
    {"symbol": "AVGO",  "name": "博通（Broadcom）",      "category": "semiconductor"},
    {"symbol": "AMD",   "name": "AMD",                   "category": "semiconductor"},
    {"symbol": "TSM",   "name": "台积电（TSMC）",        "category": "semiconductor"},
    {"symbol": "SPCX",  "name": "SpaceX",                "category": "spacex"},
]

HISTORICAL_DAYS = 100  # ~5 个月交易日
_FETCH_INTERVAL = 2.0  # 每只股票间隔 2 秒，避免 429
_INITIAL_DELAY = 3.0  # 首次请求前等待 3 秒，给 Yahoo "热身"
_MAX_RETRIES = 2


class YFinanceCache:
    """内存缓存，TTL 取 APIConfig.CACHE_TTL['YFinance']"""
    _data: Optional[List[dict]] = None
    _timestamp: Optional[datetime] = None

    @classmethod
    def get(cls) -> Optional[List[dict]]:
        if cls._data is None or cls._timestamp is None:
            return None
        elapsed = (datetime.now() - cls._timestamp).total_seconds()
        if elapsed >= APIConfig.CACHE_TTL['YFinance']:
            return None
        return cls._data

    @classmethod
    def set(cls, data: List[dict]):
        cls._data = data
        cls._timestamp = datetime.now()


def _fetch_single(sym: str, info: dict) -> dict:
    """获取单只股票数据，带重试"""
    for attempt in range(_MAX_RETRIES):
        try:
            ticker = yf.Ticker(sym)
            hist = ticker.history(period=f"{HISTORICAL_DAYS}d", auto_adjust=True)

            if hist is None or hist.empty:
                return _empty_stock(info, f"{sym}: Yahoo Finance 暂无数据")

            closes = hist["Close"]
            # 用 .info 的实时价格填补最后一个 NaN（Yahoo 收盘价有时延迟更新）
            if closes.iloc[-1] != closes.iloc[-1]:  # NaN check
                try:
                    live_price = ticker.info.get('regularMarketPrice') or ticker.info.get('currentPrice')
                    if live_price:
                        closes.iloc[-1] = live_price
                except Exception:
                    pass

            closes = closes.dropna()
            if len(closes) < 1:
                return _empty_stock(info, f"{sym}: Yahoo Finance 暂无数据")

            # 历史数据（升序）
            historical = [
                {
                    "timestamp": idx.strftime("%Y-%m-%dT%H:%M:%S"),
                    "value": round(float(val), 2),
                }
                for idx, val in closes.items()
            ]

            current = float(closes.iloc[-1])
            timestamp_str = closes.index[-1].strftime("%Y-%m-%dT%H:%M:%S")

            # 涨跌幅（至少 2 天）
            change = None
            if len(closes) >= 2:
                previous = float(closes.iloc[-2])
                change_value = current - previous
                change_pct = (change_value / previous) * 100 if previous > 0 else 0
                change = {
                    "value": round(change_value, 2),
                    "percentage": round(change_pct, 2),
                }

            return {
                **info,
                "value": round(current, 2),
                "change": change,
                "timestamp": timestamp_str,
                "historical": historical,
                "warning": None,
            }
        except Exception as e:
            if attempt < _MAX_RETRIES - 1:
                time.sleep(3)  # 重试前等待
                continue
            return _empty_stock(info, f"{sym}: 获取失败 - {e}")


def _fetch_all_sync() -> List[dict]:
    """
    同步逐个获取所有股票。每次间隔 _FETCH_INTERVAL 秒。
    必须在 asyncio.to_thread() 中调用。
    """
    results = []
    for i, info in enumerate(TRACKED_SYMBOLS):
        if i == 0:
            time.sleep(_INITIAL_DELAY)
        elif i > 0:
            time.sleep(_FETCH_INTERVAL)
        result = _fetch_single(info["symbol"], info)
        results.append(result)
    return results


def _empty_stock(info: dict, warning: str) -> dict:
    """构造带 warning 的空股票条目"""
    return {
        **info,
        "value": 0,
        "change": None,
        "timestamp": datetime.now().isoformat(),
        "historical": [],
        "warning": warning,
    }


async def fetch_us_stocks_batch() -> List[dict]:
    """异步入口 — 在线程池中运行 yfinance"""
    cached = YFinanceCache.get()
    if cached is not None:
        return cached

    results = await asyncio.to_thread(_fetch_all_sync)
    YFinanceCache.set(results)
    return results


async def fetch_us_stock_single(symbol: str) -> Optional[dict]:
    """获取单只股票（从批量缓存中提取）"""
    batch = await fetch_us_stocks_batch()
    for item in batch:
        if item["symbol"] == symbol:
            return item
    return None
