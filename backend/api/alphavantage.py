"""
Alpha Vantage API代理路由 - 前端调用此路由，后端注入API Key
"""
from fastapi import APIRouter, Query, HTTPException
from services.alphavantage_service import fetch_alpha_vantage_daily, normalize_alpha_vantage_data
from config.api_keys import APIConfig

router = APIRouter()


@router.get("/alphavantage/query")
async def api_get_alpha_vantage_daily(
    function: str = Query('TIME_SERIES_DAILY', description="API功能"),
    symbol: str = Query(..., description="股票/ETF代码"),
    outputsize: str = Query('compact', description="数据量: compact或full"),
):
    """
    获取Alpha Vantage日线数据

    前端无需传递API Key，由后端注入
    """
    if not APIConfig.ALPHA_VANTAGE_API_KEY:
        raise HTTPException(status_code=500, detail="Alpha Vantage API Key未配置")

    data = await fetch_alpha_vantage_daily(symbol, outputsize)

    if 'error' in data:
        # 频率限制或配额限制，返回警告而不是错误
        return {'warning': data['error'], 'symbol': symbol}

    return data


@router.get("/alphavantage/daily/normalized")
async def api_get_alpha_vantage_daily_normalized(
    symbol: str = Query(..., description="股票/ETF代码"),
    outputsize: str = Query('compact', description="数据量"),
):
    """
    获取Alpha Vantage日线数据（规范化格式）
    """
    if not APIConfig.ALPHA_VANTAGE_API_KEY:
        raise HTTPException(status_code=500, detail="Alpha Vantage API Key未配置")

    data = await fetch_alpha_vantage_daily(symbol, outputsize)
    normalized = normalize_alpha_vantage_data(data, symbol)

    if 'error' in normalized:
        raise HTTPException(status_code=500, detail=normalized['error'])

    return normalized