"""
A股股票API路由
"""
from fastapi import APIRouter, Query, HTTPException
from typing import List
from models.indicator import NormalizedIndicator, StockSearchResult
from services.stock_service import (
    get_kline_data,
    get_quote_data,
    search_stocks,
    get_batch_quotes,
)

router = APIRouter()


@router.get("/stocks/search", response_model=List[StockSearchResult])
async def api_search_stocks(q: str = Query(..., min_length=1, description="搜索关键词")):
    """
    搜索股票

    Args:
        q: 搜索关键词（股票代码或名称）

    Returns:
        匹配的股票列表
    """
    results = search_stocks(q)
    return results


@router.get("/stocks/{code}/quote", response_model=NormalizedIndicator)
async def api_get_quote(code: str):
    """
    获取单只股票实时行情

    Args:
        code: 6位股票代码，如 '600519'

    Returns:
        实时行情数据
    """
    quote = get_quote_data(code)
    if not quote:
        raise HTTPException(status_code=404, detail=f"股票 {code} 数据获取失败")
    return quote


@router.get("/stocks/{code}/kline", response_model=NormalizedIndicator)
async def api_get_kline(
    code: str,
    period: str = Query('daily', pattern='^(daily|weekly|monthly)$', description="K线周期"),
    limit: int = Query(365, ge=1, le=1000, description="数据条数"),
):
    """
    获取股票历史K线数据

    Args:
        code: 6位股票代码，如 '600519'
        period: 周期 - daily(日线), weekly(周线), monthly(月线)
        limit: 数据条数，默认365天，最大1000条

    Returns:
        K线历史数据
    """
    kline = get_kline_data(code, period, limit)
    if not kline:
        raise HTTPException(status_code=404, detail=f"股票 {code} K线数据获取失败")
    return kline


@router.get("/stocks/batch", response_model=List[NormalizedIndicator])
async def api_get_batch_quotes(
    codes: str = Query(..., description="股票代码列表，逗号分隔")
):
    """
    批量获取多只股票实时行情

    Args:
        codes: 股票代码列表，逗号分隔，如 '600519,000001,000002'

    Returns:
        行情数据列表
    """
    code_list = [c.strip() for c in codes.split(',') if c.strip()]
    if not code_list:
        raise HTTPException(status_code=400, detail="请提供股票代码")

    results = get_batch_quotes(code_list)
    return results