"""
Frankfurter汇率API代理 - 转发到api.frankfurter.dev
"""
from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse
import httpx

router = APIRouter()

FRANKFURTER_BASE = 'https://api.frankfurter.dev'


@router.get("/frankfurter/v2/rates")
async def proxy_frankfurter_rates(
    request: Request,
    base: str = Query('USD'),
    quotes: str = Query('EUR,GBP,JPY,CNY'),
    from_date: str = Query(None, alias='from'),
    to_date: str = Query(None, alias='to'),
):
    """代理Frankfurter v2汇率API请求"""
    params = {'base': base, 'quotes': quotes}
    if from_date:
        params['from'] = from_date
    if to_date:
        params['to'] = to_date

    url = f'{FRANKFURTER_BASE}/v2/rates'
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url, params=params)
        return JSONResponse(
            content=response.json(),
            status_code=response.status_code,
        )
