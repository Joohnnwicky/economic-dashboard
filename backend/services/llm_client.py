"""DeepSeek LLM 客户端 - 解析搜索摘要提取经济指标发布日。

兼容 OpenAI 格式 (/v1/chat/completions)。key 从环境变量读, 不硬编码。
LLM 仅在官网爬取失败时兜底: 输入指标名 + 搜索摘要 -> 输出 JSON 日期。
"""
import json
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx

from config.api_keys import APIConfig

_SYSTEM_PROMPT = """你是一个经济数据发布日程解析助手。用户会给你一个经济指标的名称和若干搜索结果摘要。
你的任务: 从摘要中提取该指标"下一次"的发布日期(未来最近一次)。
只返回 JSON, 不要任何其他文字:
{"date": "YYYY-MM-DD", "confidence": 0.0到1.0, "source": "摘要来源简述"}
若无法确定日期, 返回 {"date": null, "confidence": 0.0, "source": ""}
注意: date 是发布日(数据公布日), 不是数据所属月。优先采信官方来源(如 bls.gov/bea.gov/stats.gov.cn)。"""


async def list_models() -> list[str]:
    """查询 deepseek 可用模型列表(用于确认 'v4 flash' 等模型是否存在)。"""
    if not APIConfig.DEEPSEEK_API_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f'{APIConfig.DEEPSEEK_BASE_URL}/v1/models',
                headers={'Authorization': f'Bearer {APIConfig.DEEPSEEK_API_KEY}'},
            )
            r.raise_for_status()
            return [m.get('id', '') for m in r.json().get('data', [])]
    except Exception:
        return []


async def llm_extract_release_date(indicator_name: str, search_snippets: list[str]) -> Optional[dict]:
    """用 deepseek 从搜索摘要提取指标下一个发布日。

    Returns: {"date": "YYYY-MM-DD"|None, "confidence": float, "source": str} 或 None(调用失败)。
    """
    if not APIConfig.DEEPSEEK_API_KEY or not search_snippets:
        return None
    user_msg = f'指标: {indicator_name}\n搜索结果摘要:\n' + '\n---\n'.join(search_snippets[:5])
    for _ in range(3):  # LLM 偶发超时/错误, 重试
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                r = await client.post(
                    f'{APIConfig.DEEPSEEK_BASE_URL}/v1/chat/completions',
                    headers={
                        'Authorization': f'Bearer {APIConfig.DEEPSEEK_API_KEY}',
                        'Content-Type': 'application/json',
                    },
                    json={
                        'model': APIConfig.DEEPSEEK_MODEL,
                        'messages': [
                            {'role': 'system', 'content': _SYSTEM_PROMPT},
                            {'role': 'user', 'content': user_msg},
                        ],
                        'temperature': 0.1,
                        'response_format': {'type': 'json_object'},
                    },
                )
                r.raise_for_status()
                content = r.json()['choices'][0]['message']['content']
                return json.loads(content)
        except Exception:
            continue
    return None


_MULTI_SYSTEM_PROMPT = """你是经济数据发布日程解析助手。给定一个官方发布日程页面的文本和若干指标, 从文本中提取每个指标"下一次"的发布日期(当前日期之后最近一次, 过去日期忽略)。
只返回 JSON, 不要其他文字:
{"results": [{"key": "指标key", "date": "YYYY-MM-DD"或null, "confidence": 0.0到1.0, "source": "页面中依据简述"}]}
每项必须包含输入的所有 key。date 是发布日(数据公布日), 不是数据所属月。页面通常含全年各月日程, 只取当前日期之后最近的那一次。文本中找不到的指标 date 设 null, confidence 0.0。"""


async def llm_extract_multiple_dates(page_text: str, indicators: list[dict]) -> list[dict]:
    """从官网页面文本一次性提取多个指标的下一个发布日。

    indicators: [{"key": "US_CPI", "name": "CPI 消费者物价指数"}, ...]
    Returns: [{"key", "date", "confidence", "source"}, ...]; 调用失败返回空列表。
    """
    if not APIConfig.DEEPSEEK_API_KEY or not page_text or not indicators:
        return []
    ind_list = '\n'.join(f"- {i['key']}: {i['name']}" for i in indicators)
    text = page_text[:20000]  # 截取(年度日程表含全年, 8000 会丢后半年)
    today = datetime.now(timezone(timedelta(hours=8))).strftime('%Y-%m-%d')
    user_msg = f'当前日期: {today}\n指标列表:\n{ind_list}\n\n页面文本:\n{text}'
    for _ in range(3):  # LLM 偶发超时/错误, 重试
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                r = await client.post(
                    f'{APIConfig.DEEPSEEK_BASE_URL}/v1/chat/completions',
                    headers={
                        'Authorization': f'Bearer {APIConfig.DEEPSEEK_API_KEY}',
                        'Content-Type': 'application/json',
                    },
                    json={
                        'model': APIConfig.DEEPSEEK_MODEL,
                        'messages': [
                            {'role': 'system', 'content': _MULTI_SYSTEM_PROMPT},
                            {'role': 'user', 'content': user_msg},
                        ],
                        'temperature': 0.1,
                        'response_format': {'type': 'json_object'},
                    },
                )
                r.raise_for_status()
                content = r.json()['choices'][0]['message']['content']
                return json.loads(content).get('results', [])
        except Exception:
            continue
    return []
