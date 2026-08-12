"""中美重要经济指标配置(采集系统驱动数据)。

每个指标定义: 官网 fetcher、LLM 兜底搜索词、影响等级、节奏估算描述。
fetcher 字段对应 services/release_fetchers/ 下的模块名;
'none' 表示无官网爬取, 走 LLM 兜底或 fallback 估算。

来源: .scratch/economic-calendar-tz-fix/INDICATORS.md
FOMC 已在独立 FedWatch 面板, 此处不含。
"""
from dataclasses import dataclass
from typing import List


@dataclass
class IndicatorSpec:
    key: str            # 唯一标识, 如 'US_CPI'
    name: str           # 显示名
    country: str        # 'US' / 'CN'
    agency: str         # 发布机构
    frequency: str      # monthly / quarterly / weekly
    impact: str         # high / medium
    fetcher: str        # 官网爬取器: 'bls' / 'stats' / 'none'
    official_url: str   # 官方日程页 URL
    search_query: str   # LLM 兜底搜索词
    fallback_desc: str  # 节奏估算描述(供 economic_calendar_service)


INDICATORS: List[IndicatorSpec] = [
    # ===== 美国 BLS =====
    IndicatorSpec('US_CPI', 'CPI 消费者物价指数', 'US', 'BLS', 'monthly', 'high',
                  'bls', 'https://www.bls.gov/schedule/',
                  'BLS CPI consumer price index release date next month 2026',
                  '约每月13日'),
    IndicatorSpec('US_PPI', 'PPI 生产者物价指数', 'US', 'BLS', 'monthly', 'high',
                  'bls', 'https://www.bls.gov/schedule/',
                  'BLS PPI producer price index release date next month 2026',
                  '约每月15日'),
    IndicatorSpec('US_NFP', '非农就业 NFP', 'US', 'BLS', 'monthly', 'high',
                  'bls', 'https://www.bls.gov/schedule/',
                  'BLS nonfarm payrolls employment situation release date next month',
                  '每月第一个周五'),
    IndicatorSpec('US_JOLTS', 'JOLTS 职位空缺', 'US', 'BLS', 'monthly', 'medium',
                  'bls', 'https://www.bls.gov/schedule/',
                  'BLS JOLTS job openings release date next month',
                  '约月初'),
    IndicatorSpec('US_INITIAL_CLAIMS', '初请失业金', 'US', 'BLS', 'weekly', 'medium',
                  'none', 'https://www.dol.gov/ui/data/',
                  'US initial jobless claims release this week Thursday',
                  '每周四'),
    # ===== 美国 BEA =====
    IndicatorSpec('US_PCE', 'PCE 个人消费支出', 'US', 'BEA', 'monthly', 'high',
                  'none', 'https://www.bea.gov/news/schedule',
                  'BEA PCE personal consumption expenditures release date next month',
                  '约月末'),
    IndicatorSpec('US_GDP', 'GDP 国内生产总值', 'US', 'BEA', 'quarterly', 'high',
                  'none', 'https://www.bea.gov/news/schedule',
                  'BEA GDP advance estimate release date next quarter 2026',
                  '季度初值/修正/终值'),
    # ===== 美国 Census / ISM / Fed =====
    IndicatorSpec('US_RETAIL', '零售销售 Retail Sales', 'US', 'Census', 'monthly', 'medium',
                  'none', 'https://www.census.gov/economic-indicators/',
                  'US census retail sales release date next month',
                  '约每月16日'),
    IndicatorSpec('US_DURABLES', '耐用品订单', 'US', 'Census', 'monthly', 'medium',
                  'none', 'https://www.census.gov/economic-indicators/',
                  'US census durable goods orders release date next month',
                  '约月中'),
    IndicatorSpec('US_ISM_MFG', 'ISM 制造业 PMI', 'US', 'ISM', 'monthly', 'high',
                  'none', 'https://www.ismworld.org/supply-management-news-and-reports/',
                  'ISM manufacturing PMI report release date next month first business day',
                  '每月第一个工作日'),
    IndicatorSpec('US_ISM_SVC', 'ISM 服务业 PMI', 'US', 'ISM', 'monthly', 'medium',
                  'none', 'https://www.ismworld.org/supply-management-news-and-reports/',
                  'ISM services PMI report release date next month',
                  '每月第三个工作日'),
    IndicatorSpec('US_INDUSTRIAL', '工业产出', 'US', 'Fed', 'monthly', 'medium',
                  'none', 'https://www.federalreserve.gov/data/releaseschedule.htm',
                  'Fed industrial production release date next month',
                  '约月中'),

    # ===== 中国 国家统计局 =====
    IndicatorSpec('CN_CPI', 'CPI 消费者物价指数', 'CN', '国家统计局', 'monthly', 'high',
                  'stats', 'https://www.stats.gov.cn/xw/tjxw/tzgg/202512/t20251224_1962137.html',
                  '国家统计局 CPI 发布 2026 下个月',
                  '约每月9-10日'),
    IndicatorSpec('CN_PPI', 'PPI 生产者物价指数', 'CN', '国家统计局', 'monthly', 'high',
                  'stats', 'https://www.stats.gov.cn/xw/tjxw/tzgg/202512/t20251224_1962137.html',
                  '国家统计局 PPI 发布 2026 下个月',
                  '随CPI'),
    IndicatorSpec('CN_PMI', '制造业 PMI', 'CN', '国家统计局', 'monthly', 'high',
                  'stats', 'https://www.stats.gov.cn/xw/tjxw/tzgg/202512/t20251224_1962137.html',
                  '国家统计局 PMI 采购经理指数 发布 2026 月末',
                  '月末当日'),
    IndicatorSpec('CN_GDP', 'GDP 国内生产总值', 'CN', '国家统计局', 'quarterly', 'high',
                  'stats', 'https://www.stats.gov.cn/xw/tjxw/tzgg/202512/t20251224_1962137.html',
                  '国家统计局 GDP 季度发布 2026',
                  '1/4/7/10月'),
    IndicatorSpec('CN_INDUSTRY', '规模以上工业增加值', 'CN', '国家统计局', 'monthly', 'medium',
                  'stats', 'https://www.stats.gov.cn/xw/tjxw/tzgg/202512/t20251224_1962137.html',
                  '国家统计局 工业增加值 发布 2026 下个月',
                  '约月中'),
    IndicatorSpec('CN_RETAIL', '社会消费品零售总额', 'CN', '国家统计局', 'monthly', 'medium',
                  'stats', 'https://www.stats.gov.cn/xw/tjxw/tzgg/202512/t20251224_1962137.html',
                  '国家统计局 社会消费品零售总额 发布 2026 下个月',
                  '约月中'),
    IndicatorSpec('CN_FA', '固定资产投资', 'CN', '国家统计局', 'monthly', 'medium',
                  'stats', 'https://www.stats.gov.cn/xw/tjxw/tzgg/202512/t20251224_1962137.html',
                  '国家统计局 固定资产投资 发布 2026 下个月',
                  '约月中'),
    IndicatorSpec('CN_UNEMPLOY', '城镇调查失业率', 'CN', '国家统计局', 'monthly', 'medium',
                  'stats', 'https://www.stats.gov.cn/xw/tjxw/tzgg/202512/t20251224_1962137.html',
                  '国家统计局 城镇调查失业率 发布 2026 下个月',
                  '随工业/消费'),
    IndicatorSpec('CN_PROFIT', '规上工业企业利润', 'CN', '国家统计局', 'monthly', 'medium',
                  'stats', 'https://www.stats.gov.cn/xw/tjxw/tzgg/202512/t20251224_1962137.html',
                  '国家统计局 规模以上工业企业利润 发布 2026',
                  '约月末'),
    # ===== 中国 央行/海关 =====
    IndicatorSpec('CN_SOCIAL_FINANCING', '社融规模增量', 'CN', '央行', 'monthly', 'high',
                  'none', 'http://www.pbc.gov.cn/',
                  '央行 社会融资规模增量 发布 2026 下个月',
                  '约每月10-15日'),
    IndicatorSpec('CN_M2', 'M2 货币供应', 'CN', '央行', 'monthly', 'high',
                  'none', 'http://www.pbc.gov.cn/',
                  '央行 M2 货币供应量 发布 2026 下个月',
                  '随社融'),
    IndicatorSpec('CN_LPR', 'LPR 贷款市场报价利率', 'CN', '央行', 'monthly', 'high',
                  'none', 'http://www.pbc.gov.cn/',
                  'LPR 贷款市场报价利率 公布 2026 下个月 20日',
                  '每月20日'),
    IndicatorSpec('CN_TRADE', '进出口贸易总额', 'CN', '海关总署', 'monthly', 'medium',
                  'none', 'http://www.customs.gov.cn/',
                  '海关总署 进出口贸易 数据发布 2026 下个月',
                  '约每月13日'),
]


def get_indicator(key: str) -> IndicatorSpec | None:
    for ind in INDICATORS:
        if ind.key == key:
            return ind
    return None
