"""阶段1验证: deepseek 连通 + DDG 搜索 + LLM 解析链路。

在 backend 目录运行: python scripts/verify_llm.py
开发环境若 DNS 劙持外部域名, 会连接失败 - 需在后端 NAS(正常网络)运行。
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv(override=True)

from services.llm_client import list_models, llm_extract_release_date
from services.web_search import search


async def main():
    print('=== 1. deepseek 可用模型 ===')
    models = await list_models()
    print(f'模型列表: {models}')
    if not models:
        print('  -> 无法获取(检查 DEEPSEEK_API_KEY / 网络 / base url)')

    print('\n=== 2. DDG 搜索 ===')
    snippets = await search('BLS CPI consumer price index release date August 2026', 5)
    print(f'结果数: {len(snippets)}')
    for s in snippets:
        print(f'  - {s[:140]}')
    # DDG 被开发环境 DNS 劫持时, 用人工 snippets 验证 LLM 解析链路
    if not snippets:
        print('  -> DDG 无结果(可能 DNS 劫持), 用人工 snippets 验证 LLM')
        snippets = [
            'BLS Schedule of Selected Releases: Consumer Price Index (CPI) - August 12, 2026, 8:30 AM ET',
            'The Bureau of Labor Statistics will release the July 2026 CPI report on August 12, 2026.',
        ]

    print('\n=== 3. LLM 解析发布日 ===')
    result = await llm_extract_release_date('CPI 消费者物价指数', snippets)
    print(f'结果: {result}')


if __name__ == '__main__':
    asyncio.run(main())
