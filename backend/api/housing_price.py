"""
中国房价数据API路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List
from datetime import datetime
from services.housing_price_service import (
    get_housing_prices,
    get_city_price,
    update_housing_price_cache,
    HousingPriceCache,
)

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


# 防滥用：5分钟内不重复爬取creprice.cn全国20城（最坏需数分钟，且高频请求易被封IP）
REFRESH_MIN_INTERVAL_SECONDS = 300


@router.post("/housing-prices/refresh")
async def api_refresh_housing_prices() -> Dict:
    """
    手动刷新房价缓存。

    距上次爬取不足5分钟则直接返回当前缓存，避免重复爬取20城。
    （前端有刷新按钮，rate limit 比token鉴权更合适：不违反前端零密钥原则。）
    """
    if HousingPriceCache.last_update:
        elapsed = (datetime.now() - HousingPriceCache.last_update).total_seconds()
        if elapsed < REFRESH_MIN_INTERVAL_SECONDS:
            data = HousingPriceCache.data or {}
            return {
                "message": f"缓存较新（{int(elapsed)}秒前更新），跳过刷新",
                "updateTime": data.get('updateTime'),
                "cityCount": len(data.get('national', []))
            }
    data = update_housing_price_cache()
    return {
        "message": "房价缓存已更新",
        "updateTime": data.get('updateTime'),
        "cityCount": len(data.get('national', []))
    }