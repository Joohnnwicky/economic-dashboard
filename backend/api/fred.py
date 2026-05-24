"""
FRED API代理路由 - 前端调用此路由，后端注入API Key
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from services.fred_service import fetch_fred_series, normalize_fred_data
from config.api_keys import APIConfig

router = APIRouter()


@router.get("/fred/series/observations")
async def api_get_fred_series(
    series_id: str = Query(..., description="FRED序列ID"),
    observation_start: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    observation_end: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
):
    """
    获取FRED时间序列数据

    前端无需传递API Key，由后端注入
    """
    if not APIConfig.FRED_API_KEY:
        raise HTTPException(status_code=500, detail="FRED API Key未配置")

    data = await fetch_fred_series(series_id, observation_start, observation_end)

    if 'error' in data:
        raise HTTPException(status_code=500, detail=data['error'])

    return data


@router.get("/fred/series/normalized")
async def api_get_fred_series_normalized(
    series_id: str = Query(..., description="FRED序列ID"),
    observation_start: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    observation_end: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
):
    """
    获取FRED时间序列数据（规范化格式）
    """
    if not APIConfig.FRED_API_KEY:
        raise HTTPException(status_code=500, detail="FRED API Key未配置")

    data = await fetch_fred_series(series_id, observation_start, observation_end)
    normalized = normalize_fred_data(data, series_id)

    if 'error' in normalized:
        raise HTTPException(status_code=500, detail=normalized['error'])

    return normalized