"""
FOMC 会议日历路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
from services.fedwatch_service import get_fedwatch

router = APIRouter()


@router.get("/fedwatch", response_model=Dict)
async def api_get_fedwatch():
    """
    FOMC 会议日历 + 下次会议倒计时。
    基于公开会议日程, 纯日期计算, 无需外部 API。1h 缓存。
    """
    data = get_fedwatch()
    if not data:
        raise HTTPException(status_code=502, detail="获取 FOMC 日历失败")
    return data
