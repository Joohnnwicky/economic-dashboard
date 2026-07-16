"""
加密牛熊信号路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
from services.crypto_signals_service import get_crypto_signals

router = APIRouter()


@router.get("/crypto-signals", response_model=Dict)
async def api_get_crypto_signals():
    """
    加密牛熊综合信号：恐惧贪婪 + 200日均线偏离 + Pi Cycle。
    1h 缓存。数据源: alternative.me + Binance（均免费无 key）。
    单项失败返回 None，不影响其他项。
    """
    data = await get_crypto_signals()
    if not data:
        raise HTTPException(status_code=502, detail="获取牛熊信号失败")
    return data
