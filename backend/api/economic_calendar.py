"""
经济日历路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
from services.economic_calendar_service import get_economic_calendar

router = APIRouter()


@router.get("/economic-calendar", response_model=Dict)
async def api_get_economic_calendar():
    """
    未来主要美国宏观数据发布日历(NFP/CPI/PPI/PCE/零售)。
    纯计算(无外部 API): NFP 精确, 其余为节奏估算。1h 缓存。
    """
    data = get_economic_calendar()
    if not data:
        raise HTTPException(status_code=502, detail="获取经济日历失败")
    return data
