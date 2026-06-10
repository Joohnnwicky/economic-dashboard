"""
中国宏观经济数据API路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
from services.china_macro_service import get_all_china_macro
from services.unemployment_service import get_china_unemployment

router = APIRouter()


@router.get("/china-macro", response_model=Dict)
async def api_get_china_macro():
    """
    获取中国宏观经济指标

    Returns:
        包含GDP、CPI、PPI、M2、PMI、贸易、信贷、其他指标的数据
    """
    data = get_all_china_macro()

    # 添加失业率（爬虫+静态双保险）
    data['unemployment'] = get_china_unemployment()

    if not data:
        raise HTTPException(status_code=500, detail="获取中国宏观经济数据失败")
    return data