"""
yfinance US stock data routes - 无API Key，5分钟缓存
"""
from fastapi import APIRouter
from typing import Optional
from services.yfinance_service import fetch_us_stocks_batch, fetch_us_stock_single

router = APIRouter()


@router.get("/yfinance/us-stocks")
async def api_get_us_stocks_batch():
    """
    批量获取所有追踪美股（Mag 7 + 半导体 + SpaceX）
    后端 yfinance 逐个获取 + 5分钟缓存，无需 API Key
    """
    return await fetch_us_stocks_batch()


@router.get("/yfinance/us-stocks/{symbol}")
async def api_get_us_stock_single(symbol: str):
    """
    获取单只追踪美股
    """
    result = await fetch_us_stock_single(symbol)
    if result is None:
        return {"symbol": symbol, "warning": f"{symbol} not in tracked list"}
    return result
