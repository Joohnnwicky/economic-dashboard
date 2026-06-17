"""
Polymarket Gamma API代理 - 绕过地理限制，无需API Key
"""
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
import httpx

router = APIRouter()

POLYMARKET_GAMMA_BASE = 'https://gamma-api.polymarket.com'


@router.get("/polymarket/markets")
async def proxy_polymarket_markets(
    limit: int = Query(100, ge=1, le=500),
    closed: str = Query('false'),
    active: str = Query('true'),
):
    """代理Polymarket Gamma API - 获取市场列表"""
    params = {
        'limit': limit,
        'closed': closed,
        'active': active,
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f'{POLYMARKET_GAMMA_BASE}/markets',
                params=params,
            )
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code,
            )
    except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout):
        return JSONResponse(
            content={'error': 'Polymarket数据源连接失败，请稍后重试'},
            status_code=502,
        )
