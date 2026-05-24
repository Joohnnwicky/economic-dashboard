"""
BLS API代理路由 - 前端调用此路由，后端注入API Key
"""
from fastapi import APIRouter, HTTPException, Body, Query
from typing import Optional, List
from services.bls_service import fetch_bls_series, normalize_bls_data
from config.api_keys import APIConfig

router = APIRouter()


@router.post("/bls/timeseries/data")
async def api_get_bls_series(
    seriesid: List[str] = Body(..., description="BLS序列ID列表"),
    startyear: Optional[int] = Body(None, description="开始年份"),
    endyear: Optional[int] = Body(None, description="结束年份"),
):
    """
    获取BLS时间序列数据

    前端无需传递API Key，由后端注入
    前端发送JSON body: {"seriesid": ["CES0000000001"], "startyear": 2025, "endyear": 2026}
    """
    if not APIConfig.BLS_API_KEY:
        raise HTTPException(status_code=500, detail="BLS API Key未配置")

    data = await fetch_bls_series(seriesid, startyear, endyear)

    if 'error' in data:
        raise HTTPException(status_code=500, detail=data['error'])

    return data


@router.get("/bls/timeseries/data/normalized")
async def api_get_bls_series_normalized(
    series_ids: str = Query(..., description="BLS序列ID，逗号分隔"),
    startyear: Optional[int] = Query(None, description="开始年份"),
    endyear: Optional[int] = Query(None, description="结束年份"),
):
    """
    获取BLS时间序列数据（规范化格式）
    """
    if not APIConfig.BLS_API_KEY:
        raise HTTPException(status_code=500, detail="BLS API Key未配置")

    series_list = [s.strip() for s in series_ids.split(',') if s.strip()]
    data = await fetch_bls_series(series_list, startyear, endyear)
    normalized = normalize_bls_data(data)

    if 'error' in normalized:
        raise HTTPException(status_code=500, detail=normalized['error'])

    return normalized