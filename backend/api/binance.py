"""
Binance API代理路由 - 无需API Key，代理绕过地理限制
"""
from fastapi import APIRouter, Query
from services.binance_service import (
    fetch_binance_ticker,
    fetch_binance_klines,
    fetch_multiple_binance_tickers,
    normalize_binance_ticker,
    normalize_binance_klines,
    fetch_top_volume_symbols,
)

router = APIRouter()


@router.get("/binance/ticker/24hr")
async def api_get_binance_ticker(
    symbol: str = Query('BTCUSDT', description="交易对"),
):
    """
    获取Binance 24小时行情
    """
    data = await fetch_binance_ticker(symbol)
    return data


@router.get("/binance/ticker/normalized")
async def api_get_binance_ticker_normalized(
    symbol: str = Query('BTCUSDT', description="交易对"),
):
    """
    获取Binance行情（规范化格式）
    """
    data = await fetch_binance_ticker(symbol)
    normalized = normalize_binance_ticker(data, symbol)
    return normalized


@router.get("/binance/klines")
async def api_get_binance_klines(
    symbol: str = Query('BTCUSDT', description="交易对"),
    interval: str = Query('1h', description="K线周期"),
    limit: int = Query(24, ge=1, le=1000, description="数据条数"),
):
    """
    获取Binance K线数据
    """
    data = await fetch_binance_klines(symbol, interval, limit)
    return data


@router.get("/binance/klines/normalized")
async def api_get_binance_klines_normalized(
    symbol: str = Query('BTCUSDT', description="交易对"),
    interval: str = Query('1h', description="K线周期"),
    limit: int = Query(24, ge=1, le=1000, description="数据条数"),
):
    """
    获取Binance K线数据（规范化格式）
    """
    data = await fetch_binance_klines(symbol, interval, limit)
    normalized = normalize_binance_klines(data)
    return normalized


@router.get("/binance/prices")
async def api_get_binance_prices(
    symbols: str = Query('BTCUSDT,ETHUSDT', description="交易对，逗号分隔"),
):
    """
    批量获取多个交易对行情
    """
    symbol_list = [s.strip() for s in symbols.split(',') if s.strip()]
    data = await fetch_multiple_binance_tickers(symbol_list)

    # 规范化每个交易对
    results = {}
    for sym, ticker in data.items():
        results[sym] = normalize_binance_ticker(ticker, sym)

    return results


@router.get("/binance/top-volume")
async def api_get_top_volume(
    top: int = Query(10, ge=1, le=50, description="返回前N个币种"),
):
    """
    获取币安USDT交易对24h交易量排行
    """
    data = await fetch_top_volume_symbols(top)
    return data