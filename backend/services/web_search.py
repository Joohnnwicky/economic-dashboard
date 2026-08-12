"""DuckDuckGo 搜索客户端(HTML 接口 + BS4 解析)。

用于 LLM 兜底: 官网爬取失败时, 搜索指标发布日摘要供 LLM 解析。
失败返回空列表, 不抛异常(采集器据此降级)。
"""
from typing import List

import httpx
from bs4 import BeautifulSoup

_DDGG_URL = 'https://html.duckduckgo.com/html/'
_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}


async def search(query: str, max_results: int = 5) -> List[str]:
    """搜索并返回结果摘要文本列表。失败返回空列表。"""
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            r = await client.get(_DDGG_URL, params={'q': query}, headers=_HEADERS)
            r.raise_for_status()
            soup = BeautifulSoup(r.text, 'html.parser')
            results: List[str] = []
            for item in soup.select('.result'):
                title_el = item.select_one('.result__a')
                snippet_el = item.select_one('.result__snippet')
                title = title_el.get_text(strip=True) if title_el else ''
                snippet = snippet_el.get_text(strip=True) if snippet_el else ''
                if title or snippet:
                    results.append(f'{title}: {snippet}')
                if len(results) >= max_results:
                    break
            return results
    except Exception:
        return []
