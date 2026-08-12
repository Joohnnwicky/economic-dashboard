"""国家统计局官网爬取: 抓 2026 全年发布日程表, LLM 解析中国指标发布日。"""
from data.indicators_config import INDICATORS
from .base import fetch_and_parse

URL = 'https://www.stats.gov.cn/xw/tjxw/tzgg/202512/t20251224_1962137.html'


async def fetch_stats() -> dict:
    """返回 {指标key: {date, confidence, source}}; 失败返回空 dict。"""
    inds = [{'key': i.key, 'name': i.name} for i in INDICATORS if i.fetcher == 'stats']
    return await fetch_and_parse(URL, inds)
