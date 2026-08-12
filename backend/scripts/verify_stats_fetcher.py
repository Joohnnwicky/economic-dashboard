"""验证 stats_fetcher 真实抓取统计局全年日程表 + LLM解析未来日期。

统计局(stats.gov.cn)在开发环境可达(之前 verify_scheduler 跑出 official=9)。
本脚本直接调 fetch_stats(), 验证修复后(截断20000+prompt取最近未来)能否拿到8月+日期。
"""
import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv('.env', override=True)

from services.release_fetchers.stats_fetcher import fetch_stats


async def main():
    today = datetime.now(timezone(timedelta(hours=8))).strftime('%Y-%m-%d')
    print(f"今天: {today}")
    print("抓取统计局全年日程表 + LLM解析(约30-60秒)...\n")

    res = await fetch_stats()
    if not res:
        print("未解析到任何指标(页面抓取失败或LLM未命中)")
        return

    print(f"解析结果({len(res)}个命中):")
    future_count = 0
    for k, v in sorted(res.items()):
        d = v.get('date', '')
        is_future = bool(d) and d >= today
        if is_future:
            future_count += 1
        flag = '未来OK' if is_future else '过去/无效'
        print(f"  {k:<16} {str(d):<12} conf={v.get('confidence', 0)}  {flag}")

    print(f"\n未来日期: {future_count}/{len(res)}")
    print(f"结论: {'PASS - stats_fetcher 修复生效, 拿到未来日期' if future_count > 0 else 'FAIL - 仍为过去日期'}")


if __name__ == '__main__':
    asyncio.run(main())
