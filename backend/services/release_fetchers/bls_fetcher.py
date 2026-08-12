"""BLS 官网爬取: 抓 schedule 页, LLM 解析 BLS 指标发布日。"""
from data.indicators_config import INDICATORS
from .base import fetch_and_parse

URL = 'https://www.bls.gov/schedule/'


async def fetch_bls() -> dict:
    """返回 {指标key: {date, confidence, source}}; 失败返回空 dict。"""
    inds = [{'key': i.key, 'name': i.name} for i in INDICATORS if i.fetcher == 'bls']
    return await fetch_and_parse(URL, inds)
