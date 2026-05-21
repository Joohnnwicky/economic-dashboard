"""
中国房价数据API路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List
from services.housing_price_service import get_housing_prices, get_city_price, update_housing_price_cache

router = APIRouter()


@router.get("/housing-prices")
async def api_get_housing_prices() -> Dict:
    """
    获取全国房价行情数据

    Returns:
        包含全国城市排行和主要城市详情的数据
    """
    data = get_housing_prices()
    if not data:
        raise HTTPException(status_code=500, detail="获取房价数据失败")
    return data


@router.get("/housing-prices/city/{city_code}")
async def api_get_city_price(city_code: str) -> Dict:
    """
    获取单个城市房价详情

    Args:
        city_code: 城市代码（如 sj=石家庄, bj=北京）

    Returns:
        城市房价详情
    """
    data = get_city_price(city_code)
    if 'error' in data:
        raise HTTPException(status_code=404, detail=data['error'])
    return data


@router.post("/housing-prices/refresh")
async def api_refresh_housing_prices() -> Dict:
    """
    手动刷新房价缓存

    Returns:
        更新后的房价数据
    """
    data = update_housing_price_cache()
    return {
        "message": "房价缓存已更新",
        "updateTime": data.get('updateTime'),
        "cityCount": len(data.get('national', []))
    }