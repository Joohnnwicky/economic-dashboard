"""
Coinbase 比特币溢价指数路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
from services.coinbase_service import get_coinbase_premium

router = APIRouter()


@router.get("/coinbase/btc-premium", response_model=Dict)
async def api_get_coinbase_premium():
    """
    Coinbase 比特币溢价指数 = Coinbase BTC/USD 现货价 - Binance BTC/USDT 价

    60秒缓存。数据源: Coinbase 公开 API（无 key）+ Binance（复用）。
    Coinbase 在国内可能需要代理访问。
    """
    data = await get_coinbase_premium()
    if 'error' in data:
        raise HTTPException(status_code=502, detail=data['error'])
    return data
