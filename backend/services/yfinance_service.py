"""
美股头部股票数据服务 - 腾讯日K数据源

2026-07-16: 由 eastmoney 切换为腾讯（web.ifzq.gtimg.cn）。
原因: NAS 容器经 clash fake-IP 出网时，eastmoney push2his 从容器任何 HTTP 客户端
都不可达（宿主 curl 可达但容器不可达，网络层问题非 TLS）。腾讯该接口 httpx 直连
稳定可用，且项目 A 股线已在用腾讯，保持一致。

代码格式: usSYMBOL.OQ (NASDAQ) / usSYMBOL.N (NYSE)
返回结构: data[code]["day"] = [[日期, 开, 收, 高, 低, 量], ...]
并发获取 18 只，5 分钟缓存，偶发失败用上次成功快照兜底。
"""
import asyncio
from datetime import datetime
from typing import List, Optional, Dict

import httpx

from config.api_keys import APIConfig


TENCENT_KLINE_URL = "https://web.ifzq.gtimg.cn/appstock/app/fqkline/get"
TENCENT_HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://gu.qq.com/"}

# 与前端 TRACKED_STOCKS 对应。tcode: NASDAQ=.OQ, NYSE=.N
TRACKED_SYMBOLS = [
    {"symbol": "AAPL",  "tcode": "usAAPL.OQ",  "name": "苹果（Apple）",        "category": "mag7"},
    {"symbol": "MSFT",  "tcode": "usMSFT.OQ",  "name": "微软（Microsoft）",     "category": "mag7"},
    {"symbol": "GOOGL", "tcode": "usGOOGL.OQ", "name": "谷歌（Alphabet）",      "category": "mag7"},
    {"symbol": "AMZN",  "tcode": "usAMZN.OQ",  "name": "亚马逊（Amazon）",      "category": "mag7"},
    {"symbol": "NVDA",  "tcode": "usNVDA.OQ",  "name": "英伟达（NVIDIA）",      "category": "mag7"},
    {"symbol": "META",  "tcode": "usMETA.OQ",  "name": "Meta（Facebook）",      "category": "mag7"},
    {"symbol": "TSLA",  "tcode": "usTSLA.OQ",  "name": "特斯拉（Tesla）",       "category": "mag7"},
    {"symbol": "AVGO",  "tcode": "usAVGO.OQ",  "name": "博通（Broadcom）",      "category": "semiconductor"},
    {"symbol": "AMD",   "tcode": "usAMD.OQ",   "name": "AMD",                   "category": "semiconductor"},
    {"symbol": "TSM",   "tcode": "usTSM.N",    "name": "台积电（TSMC）",        "category": "semiconductor"},
    {"symbol": "SPCX",  "tcode": "usSPCX.OQ",  "name": "SpaceX",                "category": "spacex"},
    # 加密概念股（交易所/持仓/矿企/平台）
    {"symbol": "COIN",  "tcode": "usCOIN.OQ",  "name": "Coinbase Global",       "category": "crypto-stock"},
    {"symbol": "MSTR",  "tcode": "usMSTR.OQ",  "name": "微策略（Strategy）",     "category": "crypto-stock"},
    {"symbol": "RIOT",  "tcode": "usRIOT.OQ",  "name": "Riot Platforms",        "category": "crypto-stock"},
    {"symbol": "MARA",  "tcode": "usMARA.OQ",  "name": "Marathon Digital",      "category": "crypto-stock"},
    {"symbol": "CLSK",  "tcode": "usCLSK.OQ",  "name": "CleanSpark",            "category": "crypto-stock"},
    {"symbol": "HOOD",  "tcode": "usHOOD.OQ",  "name": "Robinhood",             "category": "crypto-stock"},
    {"symbol": "XYZ",   "tcode": "usXYZ.N",    "name": "Block",                 "category": "crypto-stock"},
]

HISTORICAL_DAYS = 100  # ~5 个月交易日


class YFinanceCache:
    """内存缓存，TTL 取 APIConfig.CACHE_TTL['YFinance']"""
    _data: Optional[List[dict]] = None
    _timestamp: Optional[datetime] = None
    # 最近一次"全部成功（无 warning）"的快照，用于偶发失败时兜底
    _last_good: Optional[List[dict]] = None

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
        # 仅当本次全部成功才更新快照，保证兜底数据干净
        if all(not item.get('warning') for item in data):
            cls._last_good = data


def _base(info: dict) -> dict:
    """响应只暴露 symbol/name/category，不泄露 tcode"""
    return {"symbol": info["symbol"], "name": info["name"], "category": info["category"]}


def _empty_stock(info: dict, warning: str) -> dict:
    """构造带 warning 的空股票条目"""
    return {
        **_base(info),
        "value": 0,
        "change": None,
        "timestamp": datetime.now().isoformat(),
        "historical": [],
        "warning": warning,
    }


async def _fetch_single_tencent(info: dict, client: httpx.AsyncClient) -> dict:
    """
    腾讯日K获取单只美股。
    data[code]["day"] 每行: [日期, 开盘, 收盘, 最高, 最低, 成交量]，价格已是正常美元价。
    当前价取最后一条收盘；涨跌幅取最后两条收盘计算。
    """
    params = {"param": f"{info['tcode']},day,,,{HISTORICAL_DAYS + 20},qfq"}
    try:
        resp = await client.get(TENCENT_KLINE_URL, params=params, headers=TENCENT_HEADERS, timeout=10)
        data = resp.json().get("data") or {}
        klines = (data.get(info["tcode"]) or {}).get("day") or []
        if not klines:
            return _empty_stock(info, f"{info['symbol']}: 腾讯暂无数据")

        # 每行 [日期, 开, 收, 高, 低, 量]，取(日期, 收盘)
        closes: List = []  # (日期, 收盘价)
        for row in klines:
            if len(row) < 3:
                continue
            try:
                closes.append((row[0], float(row[2])))
            except ValueError:
                continue

        if not closes:
            return _empty_stock(info, f"{info['symbol']}: 腾讯暂无数据")

        closes = closes[-HISTORICAL_DAYS:]
        historical = [
            {"timestamp": f"{d}T00:00:00", "value": round(c, 2)}
            for d, c in closes
        ]
        current = closes[-1][1]
        change = None
        if len(closes) >= 2:
            prev = closes[-2][1]
            if prev > 0:
                chg = current - prev
                change = {"value": round(chg, 2), "percentage": round(chg / prev * 100, 2)}

        return {
            **_base(info),
            "value": round(current, 2),
            "change": change,
            "timestamp": f"{closes[-1][0]}T00:00:00",
            "historical": historical,
            "warning": None,
        }
    except Exception as e:
        return _empty_stock(info, f"{info['symbol']}: 获取失败 - {e}")


async def fetch_us_stocks_batch() -> List[dict]:
    """异步入口 - 并发获取所有美股，5 分钟缓存，偶发失败用上次快照兜底"""
    cached = YFinanceCache.get()
    if cached is not None:
        return cached

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(
            *[_fetch_single_tencent(info, client) for info in TRACKED_SYMBOLS]
        )

    # stale 兜底：本次失败的股票用上次成功快照填充，避免偶发抖动显示"暂不可用"
    if YFinanceCache._last_good:
        last_by_sym: Dict[str, dict] = {item["symbol"]: item for item in YFinanceCache._last_good}
        for i, r in enumerate(results):
            if r.get("warning"):
                prev = last_by_sym.get(r["symbol"])
                if prev and not prev.get("warning"):
                    results[i] = prev

    YFinanceCache.set(results)
    return results


async def fetch_us_stock_single(symbol: str) -> Optional[dict]:
    """获取单只股票（从批量缓存中提取）"""
    batch = await fetch_us_stocks_batch()
    for item in batch:
        if item["symbol"] == symbol:
            return item
    return None
