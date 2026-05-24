"""
金价数据API路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
from services.gold_service import get_gold_price, update_gold_price_cache, GoldPriceCache

router = APIRouter()


@router.get("/gold-price", response_model=Dict)
async def api_get_gold_price():
    """
    获取国际金价数据（来自缓存，每小时更新）

    Returns:
        金价数据，包含当前价格和历史数据
    """
    data = await get_gold_price()
    if not data:
        raise HTTPException(status_code=500, detail="获取金价数据失败")
    return data


@router.post("/gold-price/refresh")
async def api_refresh_gold_price():
    """
    手动刷新金价缓存（管理员接口）
    """
    data = await update_gold_price_cache()
    if not data:
        raise HTTPException(status_code=500, detail="刷新金价数据失败")
    return {"message": "金价缓存已刷新", "data": data}