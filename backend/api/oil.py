"""
油价数据API路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
from services.oil_service import get_oil_price

router = APIRouter()


@router.get("/oil-price", response_model=Dict)
async def api_get_oil_price():
    """获取国内油价数据"""
    data = await get_oil_price()
    if not data:
        raise HTTPException(status_code=500, detail="获取油价数据失败")
    return data
