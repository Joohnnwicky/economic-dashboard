"""官网爬取通用工具: 抓页面 -> BS4 提文本 -> LLM 解析多指标发布日。"""
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from services.llm_client import llm_extract_multiple_dates

_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
}


async def fetch_page_text(url: str, timeout: int = 20) -> Optional[str]:
    """抓取页面返回纯文本(去 script/style/nav 等)。失败返回 None。"""
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            r = await client.get(url, headers=_HEADERS)
            r.raise_for_status()
            soup = BeautifulSoup(r.text, 'html.parser')
            for tag in soup(['script', 'style', 'nav', 'footer', 'header']):
                tag.decompose()
            return soup.get_text(separator='\n', strip=True)
    except Exception:
        return None


async def fetch_and_parse(url: str, indicators: list[dict]) -> dict:
    """抓页面 + LLM 解析多指标发布日。

    indicators: [{"key", "name"}, ...]
    Returns: {指标key: {"date", "confidence", "source"}}; 失败返回空 dict。
    """
    text = await fetch_page_text(url, timeout=30)
    if not text:
        return {}
    results = await llm_extract_multiple_dates(text, indicators)
    out: dict = {}
    for r in results:
        if r.get('date'):
            out[r['key']] = {
                'date': r['date'],
                'confidence': r.get('confidence', 0),
                'source': r.get('source', ''),
            }
    return out
