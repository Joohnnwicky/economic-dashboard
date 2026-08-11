"""
加密市场市占率 + 山寨季路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
from services.market_dominance_service import get_market_dominance

router = APIRouter()


@router.get("/market-dominance", response_model=Dict)
async def api_get_market_dominance():
    """
    BTC/ETH 市占率 + 总市值 + 山寨季指数。
    数据源: CoinGecko (免费无 key)。1h 缓存。
    单项失败返回 None, 不影响其他项。
    """
    data = await get_market_dominance()
    if not data:
        raise HTTPException(status_code=502, detail="获取市场市占率失败")
    return data
