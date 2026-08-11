"""
BTC 链上数据路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
from services.onchain_service import get_onchain

router = APIRouter()


@router.get("/onchain", response_model=Dict)
async def api_get_onchain():
    """
    BTC 链上数据: 算力/难度/手续费/难度调整倒计时。
    数据源: mempool.space (免费无 key)。30min 缓存。
    单项失败返回 None, 不影响其他项。
    """
    data = await get_onchain()
    if not data:
        raise HTTPException(status_code=502, detail="获取链上数据失败")
    return data
