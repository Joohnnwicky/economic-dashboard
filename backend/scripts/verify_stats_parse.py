"""验证 stats_fetcher 的 LLM 解析: 全年日程表文本 -> 取今天之后最近一次。

模拟统计局2026年度发布日程表(含全年12月), 今天 2026-08-12。
期望: LLM 取8月及之后的日期, 不取已过去的1-7月。
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv('.env', override=True)

from data.indicators_config import INDICATORS
from services.llm_client import llm_extract_multiple_dates

# 模拟统计局2026年度日程表(全年, 8月在中间偏后)
SAMPLE_STATS_TEXT = """
2026年国家统计局主要统计信息发布日程表
注：发布日期为初步计划，届时可能有所调整。

1月9日 消费者物价指数(CPI) 1月9日 工业生产者出厂价格指数(PPI)
1月19日 规模以上工业增加值 1月19日 社会消费品零售总额 1月19日 固定资产投资 1月19日 城镇调查失业率
1月19日 国民经济运行情况(GDP) 1月31日 制造业PMI

2月10日 消费者物价指数(CPI) 2月10日 工业生产者出厂价格指数(PPI)
2月17日 规模以上工业增加值 2月17日 社会消费品零售总额 2月28日 制造业PMI

3月10日 消费者物价指数(CPI) 3月10日 工业生产者出厂价格指数(PPI)
3月17日 规模以上工业增加值 3月17日 社会消费品零售总额 3月31日 制造业PMI

4月10日 消费者物价指数(CPI) 4月10日 工业生产者出厂价格指数(PPI)
4月16日 规模以上工业增加值 4月16日 社会消费品零售总额 4月18日 国民经济运行情况(GDP) 4月30日 制造业PMI

5月10日 消费者物价指数(CPI) 5月10日 工业生产者出厂价格指数(PPI) 5月16日 规模以上工业增加值 5月16日 社会消费品零售总额

6月10日 消费者物价指数(CPI) 6月10日 工业生产者出厂价格指数(PPI) 6月16日 规模以上工业增加值 6月16日 社会消费品零售总额 6月30日 制造业PMI

7月10日 消费者物价指数(CPI) 7月10日 工业生产者出厂价格指数(PPI) 7月16日 规模以上工业增加值 7月16日 社会消费品零售总额 7月31日 制造业PMI

8月9日 消费者物价指数(CPI) 8月9日 工业生产者出厂价格指数(PPI)
8月15日 规模以上工业增加值 8月15日 社会消费品零售总额 8月15日 固定资产投资 8月15日 城镇调查失业率 8月31日 制造业PMI

9月10日 消费者物价指数(CPI) 9月10日 工业生产者出厂价格指数(PPI) 9月16日 规模以上工业增加值 9月16日 社会消费品零售总额 9月30日 制造业PMI

10月13日 消者物价指数(CPI) 10月13日 工业生产者出厂价格指数(PPI) 10月19日 规模以上工业增加值 10月19日 社会消费品零售总额 10月19日 国民经济运行情况(GDP) 10月31日 制造业PMI

11月10日 消费者物价指数(CPI) 11月10日 工业生产者出厂价格指数(PPI) 11月16日 规模以上工业增加值 11月16日 社会消费品零售总额 11月30日 制造业PMI

12月10日 消费者物价指数(CPI) 12月10日 工业生产者出厂价格指数(PPI) 12月16日 规模以上工业增加值 12月16日 社会消费品零售总额 12月31日 制造业PMI
"""


async def main():
    stats_inds = [{'key': i.key, 'name': i.name} for i in INDICATORS if i.fetcher == 'stats']
    print(f"指标({len(stats_inds)}): {[i['key'] for i in stats_inds]}")
    print(f"今天: 2026-08-12 (8月9日CPI已过, 应取9月10日)\n")

    res = await llm_extract_multiple_dates(SAMPLE_STATS_TEXT, stats_inds)
    by_key = {r.get('key'): r for r in res}

    # 期望(今天8-12)
    expect = {
        'CN_CPI': '2026-09-10',       # 8月9日已过 -> 9月10日
        'CN_PPI': '2026-09-10',
        'CN_PMI': '2026-08-31',       # 8月31日未到
        'CN_INDUSTRY': '2026-08-15',  # 8月15日
        'CN_RETAIL': '2026-08-15',
        'CN_GDP': '2026-10-19',       # 季度, 下次10月
    }

    print(f"{'指标':<14} {'解析日期':<12} {'期望':<12} {'结果'}")
    print("-" * 50)
    ok_all = True
    for k, exp in expect.items():
        got = by_key.get(k, {}).get('date', '?')
        ok = got == exp
        if not ok:
            ok_all = False
        print(f"{k:<14} {str(got):<12} {exp:<12} {'OK' if ok else 'FAIL'}")

    print("\n所有命中指标:")
    for r in res:
        print(f"  {r.get('key')}: {r.get('date')} conf={r.get('confidence')}")

    print(f"\n结论: {'PASS - LLM 正确取今天之后最近日期' if ok_all else '见上(部分不符)'}")


if __name__ == '__main__':
    asyncio.run(main())
