"""
经济日历路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
from services.economic_calendar_service import get_economic_calendar
from services.release_scheduler import refresh_releases

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


@router.post("/economic-calendar/refresh", response_model=Dict)
async def api_refresh_economic_calendar():
    """
    手动触发发布日采集: 官网 fetcher 优先 -> DDG+LLM 兜底 -> fallback 估算。
    结果写入 release_cache.json, 下次 GET /economic-calendar 读取。
    涉及网络请求, 可能耗时数十秒。
    """
    try:
        return await refresh_releases()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"采集失败: {e}")
