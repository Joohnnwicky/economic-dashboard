"""官网爬取层入口: 按 source 名分发到对应 fetcher。"""
from .bls_fetcher import fetch_bls
from .stats_fetcher import fetch_stats

_FETCHERS = {
    'bls': fetch_bls,
    'stats': fetch_stats,
}


async def run_fetcher(source: str) -> dict:
    """运行指定源的 fetcher, 返回 {指标key: {date, confidence, source}}。未知源返回空 dict。"""
    fn = _FETCHERS.get(source)
    return await fn() if fn else {}
