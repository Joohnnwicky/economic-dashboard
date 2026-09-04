"""
Tushare 扩展数据 API 路由：A股自选股雷达 / 中国利率 / 两融余额 / 军工行业指数

Tushare 为同步 HTTP 接口，统一经 asyncio.to_thread 调用，避免阻塞事件循环。
"""
from fastapi import APIRouter, Query
from typing import Dict, List

from services import tushare_service

router = APIRouter()

# 军工核心自选股默认列表（与前端 customStocksStore 默认一致）
DEFAULT_WATCHLIST = ['000519', '600877', '000065', '002246', '600967', '600698']


@router.get("/a-share-radar", response_model=Dict)
async def api_a_share_radar(
    codes: str = Query('', description="逗号分隔的6位股票代码，空则用军工默认自选")
):
    """
    自选股雷达：Tushare 估值(daily_basic) + 财务指标(fina_indicator)
    + 风险事件（质押/解禁/大宗交易/龙虎榜），逐模块降级。
    """
    code_list: List[str] = [c.strip() for c in codes.split(',') if c.strip()] or DEFAULT_WATCHLIST
    return await _run(tushare_service.build_a_share_radar, code_list)


@router.get("/china-rates", response_model=Dict)
async def api_china_rates():
    """中国利率：SHIBOR 隔夜/3月/1年 + LPR 1年/5年历史序列"""
    return await _run(tushare_service.build_china_rates)


@router.get("/a-share-margin", response_model=Dict)
async def api_a_share_margin():
    """沪深两市融资融券余额（亿元，按日加总）"""
    return await _run(tushare_service.build_a_share_margin)


@router.get("/defense-sector", response_model=Dict)
async def api_defense_sector():
    """军工行业指数：中证军工(399967.SZ) × 上证指数(000001.SH) 日线收盘"""
    return await _run(tushare_service.build_defense_sector)


async def _run(fn, *args):
    """在线程池中执行同步 Tushare 调用（多次 HTTP 请求，单次可达数十秒）。"""
    import asyncio
    return await asyncio.to_thread(fn, *args)
