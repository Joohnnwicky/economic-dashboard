"""
股票数据服务 - 获取K线和实时行情
"""
from datetime import datetime
from typing import List, Optional
import pandas as pd
from models.indicator import (
    NormalizedIndicator,
    HistoricalDataPoint,
    Change,
    StockSearchResult,
)
from services.tdx_client import tdx_client, get_market_code, get_stock_name
import logging

logger = logging.getLogger(__name__)


def get_kline_data(
    code: str,
    period: str = 'daily',
    limit: int = 365
) -> Optional[NormalizedIndicator]:
    """
    获取股票历史K线数据

    Args:
        code: 6位股票代码，如 '600519'
        period: 周期 - 'daily'(日线), 'weekly'(周线), 'monthly'(月线)
        limit: 数据条数，默认365天

    Returns:
        NormalizedIndicator 格式的数据
    """
    try:
        client = tdx_client.get_client()

        # mootdx frequency: 9=日线, 5=周线, 4=月线
        freq_map = {'daily': 9, 'weekly': 5, 'monthly': 4}
        frequency = freq_map.get(period, 9)

        # 获取K线数据 (使用 bars 方法)
        result = client.bars(
            symbol=code,
            frequency=frequency,
            start=0,
            offset=limit
        )

        if result is None or (hasattr(result, 'empty') and result.empty):
            logger.warning(f"获取K线数据失败: {code}, result empty")
            return None

        # result 是 pandas DataFrame
        historical = []
        for idx, row in result.iterrows():
            try:
                # 获取日期
                if isinstance(idx, (pd.Timestamp, datetime)):
                    ts = idx
                elif 'datetime' in row:
                    ts = row['datetime']
                else:
                    continue

                close_price = float(row.get('close', 0))
                if close_price > 0:
                    historical.append(HistoricalDataPoint(
                        timestamp=ts if isinstance(ts, datetime) else ts.to_pydatetime(),
                        value=close_price
                    ))
            except Exception as e:
                logger.warning(f"解析K线数据点失败: {e}")
                continue

        if not historical:
            logger.warning(f"K线数据无有效点: {code}")
            return None

        latest = historical[-1]
        first = historical[0]

        # 计算涨跌幅（相对于第一天的收盘价）
        if first.value > 0:
            change_pct = (latest.value - first.value) / first.value * 100
            change_value = latest.value - first.value
        else:
            change_pct = 0
            change_value = 0

        return NormalizedIndicator(
            id=f"stock-{code}",
            name=get_stock_name(code),
            value=latest.value,
            unit="CNY",
            timestamp=latest.timestamp,
            change=Change(
                value=change_value,
                percentage=change_pct,
                period=period,
            ),
            historical=historical,
        )

    except Exception as e:
        logger.error(f"获取K线数据异常: {code}, {e}")
        return None


def get_quote_data(code: str) -> Optional[NormalizedIndicator]:
    """
    获取股票实时行情（包含当日涨跌）

    Args:
        code: 6位股票代码

    Returns:
        NormalizedIndicator 格式的数据
    """
    try:
        client = tdx_client.get_client()

        # 获取实时行情 (使用 quotes 方法)
        result = client.quotes(symbol=[code])

        if result is None or (hasattr(result, 'empty') and result.empty):
            logger.warning(f"获取实时行情失败: {code}")
            return None

        # result 是 DataFrame，取第一行
        row = result.iloc[0] if len(result) > 0 else None
        if row is None:
            return None

        # DataFrame 列名: code, name, price, open, high, low, volume 等
        current_price = float(row.get('price', 0))
        prev_close = float(row.get('last_close', current_price))  # 前收盘价

        # 计算涨跌幅（相对于前收盘价）
        if prev_close > 0:
            change_pct = (current_price - prev_close) / prev_close * 100
            change_value = current_price - prev_close
        else:
            change_pct = 0
            change_value = 0

        name = str(row.get('name', get_stock_name(code)))

        return NormalizedIndicator(
            id=f"stock-{code}",
            name=name,
            value=current_price,
            unit="CNY",
            timestamp=datetime.now(),
            change=Change(
                value=change_value,
                percentage=change_pct,
                period="daily",
            ),
            historical=[],  # 实时行情没有历史数据
        )

    except Exception as e:
        logger.error(f"获取实时行情异常: {code}, {e}")
        return None


def search_stocks(keyword: str) -> List[StockSearchResult]:
    """
    搜索股票

    Args:
        keyword: 搜索关键词（股票代码或名称）

    Returns:
        匹配的股票列表
    """
    # 扩展股票列表（沪深主板、中小板、创业板常用股票）
    stock_list = [
        # 上证主板 (600xxx)
        ('600519', '贵州茅台', 'sh'),
        ('600036', '招商银行', 'sh'),
        ('601318', '中国平安', 'sh'),
        ('600276', '恒瑞医药', 'sh'),
        ('601166', '兴业银行', 'sh'),
        ('600000', '浦发银行', 'sh'),
        ('601398', '工商银行', 'sh'),
        ('601288', '农业银行', 'sh'),
        ('600030', '中信证券', 'sh'),
        ('600887', '伊利股份', 'sh'),
        ('600900', '长江电力', 'sh'),
        ('601012', '隆基绿能', 'sh'),
        ('600010', '包钢股份', 'sh'),
        ('601899', '紫金矿业', 'sh'),
        ('600019', '宝钢股份', 'sh'),
        ('601888', '中国中免', 'sh'),
        ('600585', '海螺水泥', 'sh'),
        ('603259', '药明康德', 'sh'),
        ('600015', '华夏银行', 'sh'),
        ('600016', '民生银行', 'sh'),
        ('600028', '中国石化', 'sh'),
        ('600029', '南方航空', 'sh'),
        ('600031', '三一重工', 'sh'),
        ('600048', '保利发展', 'sh'),
        ('600050', '中国联通', 'sh'),
        ('600061', '国投资本', 'sh'),
        ('600066', '宇通客车', 'sh'),
        ('600068', '葛洲坝', 'sh'),
        ('600085', '同仁堂', 'sh'),
        ('600096', '云天化', 'sh'),
        ('600100', '同方股份', 'sh'),
        ('600104', '上汽集团', 'sh'),
        ('600111', '北方稀土', 'sh'),
        ('600118', '中国卫星', 'sh'),
        ('600150', '中国船舶', 'sh'),
        ('600176', '中国巨石', 'sh'),
        ('600183', '生益科技', 'sh'),
        ('600196', '复星医药', 'sh'),
        ('600208', '新湖中宝', 'sh'),
        ('600219', '南山铝业', 'sh'),
        ('600236', '桂冠电力', 'sh'),
        ('600256', '广汇能源', 'sh'),
        ('600309', '万华化学', 'sh'),
        ('600332', '白云山', 'sh'),
        ('600346', '恒力石化', 'sh'),
        ('600352', '浙江龙盛', 'sh'),
        ('600436', '片仔癀', 'sh'),
        ('600438', '通威股份', 'sh'),
        ('600486', '扬农化工', 'sh'),
        ('600489', '中金黄金', 'sh'),
        ('600498', '烽火通信', 'sh'),
        ('600521', '华海药业', 'sh'),
        ('600547', '山东黄金', 'sh'),
        ('600570', '恒生电子', 'sh'),
        ('600588', '用友网络', 'sh'),
        ('600606', '绿地控股', 'sh'),
        ('600690', '海尔智家', 'sh'),
        ('600703', '三安光电', 'sh'),
        ('600741', '华域汽车', 'sh'),
        ('600809', '山西汾酒', 'sh'),
        ('600837', '海通证券', 'sh'),
        ('600845', '宝信软件', 'sh'),
        ('600872', '中炬高新', 'sh'),
        ('600893', '航发动力', 'sh'),
        ('600905', '三峡能源', 'sh'),
        ('600918', '中泰证券', 'sh'),
        ('600926', '杭州银行', 'sh'),
        ('600941', '中国移动', 'sh'),
        ('601016', '节能风电', 'sh'),
        ('601066', '中信建投', 'sh'),
        ('601088', '中国神华', 'sh'),
        ('601111', '中国国航', 'sh'),
        ('601138', '工业富联', 'sh'),
        ('601225', '陕西煤业', 'sh'),
        ('601229', '上海银行', 'sh'),
        ('601231', '环旭电子', 'sh'),
        ('601236', '红塔证券', 'sh'),
        ('601285', '中国核电', 'sh'),
        ('601336', '新华保险', 'sh'),
        ('601377', '兴业证券', 'sh'),
        ('601390', '中国中铁', 'sh'),
        ('601392', '中国铁建', 'sh'),
        ('601618', '中国建筑', 'sh'),
        ('601628', '中国人寿', 'sh'),
        ('601633', '长城汽车', 'sh'),
        ('601668', '中国建筑', 'sh'),
        ('601669', '中国电建', 'sh'),
        ('601688', '华泰证券', 'sh'),
        ('601728', '中国电信', 'sh'),
        ('601788', '光大证券', 'sh'),
        ('601808', '中海油服', 'sh'),
        ('601816', '京沪高铁', 'sh'),
        ('601857', '中国石油', 'sh'),
        ('601872', '招商轮船', 'sh'),
        ('601877', '正泰电器', 'sh'),
        ('601901', '方正证券', 'sh'),
        ('601918', '新集能源', 'sh'),
        ('601919', '中远海控', 'sh'),
        ('601933', '永辉超市', 'sh'),
        ('601939', '建设银行', 'sh'),
        ('601949', '中国出版', 'sh'),
        ('601988', '中国银行', 'sh'),
        ('601992', '金隅集团', 'sh'),
        ('601998', '中信银行', 'sh'),

        # 深证主板 (000xxx)
        ('000001', '平安银行', 'sz'),
        ('000002', '万科A', 'sz'),
        ('000063', '中兴通讯', 'sz'),
        ('000333', '美的集团', 'sz'),
        ('000425', '徐工机械', 'sz'),
        ('000519', '中兵红箭', 'sz'),
        ('000568', '泸州老窖', 'sz'),
        ('000651', '格力电器', 'sz'),
        ('000725', '京东方A', 'sz'),
        ('000768', '中航飞机', 'sz'),
        ('000858', '五粮液', 'sz'),
        ('000876', '新希望', 'sz'),
        ('000938', '紫光股份', 'sz'),

        # 中小板 (002xxx)
        ('002415', '海康威视', 'sz'),
        ('002594', '比亚迪', 'sz'),
        ('002352', '顺丰控股', 'sz'),
        ('002475', '立讯精密', 'sz'),
        ('002230', '科大讯飞', 'sz'),
        ('002304', '洋河股份', 'sz'),
        ('002142', '宁波银行', 'sz'),
        ('002007', '华兰生物', 'sz'),
        ('002008', '大族激光', 'sz'),
        ('002027', '分众传媒', 'sz'),
        ('002032', '苏泊尔', 'sz'),
        ('002049', '紫光国微', 'sz'),
        ('002050', '三花智控', 'sz'),
        ('002129', '中环股份', 'sz'),
        ('002153', '石基信息', 'sz'),
        ('002157', '江铃汽车', 'sz'),
        ('002179', '中航光电', 'sz'),
        ('002202', '金风科技', 'sz'),
        ('002236', '大华股份', 'sz'),
        ('002241', '歌尔股份', 'sz'),
        ('002271', '东方雨虹', 'sz'),
        ('002285', '世联行', 'sz'),
        ('002311', '海大集团', 'sz'),
        ('002312', '三泰控股', 'sz'),
        ('002353', '杰瑞股份', 'sz'),
        ('002371', '北方华创', 'sz'),
        ('002384', '东山精密', 'sz'),
        ('002410', '广联达', 'sz'),
        ('002422', '科伦药业', 'sz'),
        ('002459', '晶澳科技', 'sz'),
        ('002460', '赣锋锂业', 'sz'),
        ('002466', '天齐锂业', 'sz'),
        ('002493', '荣盛石化', 'sz'),
        ('002500', '山西证券', 'sz'),
        ('002555', '三七互娱', 'sz'),
        ('002595', '豪迈科技', 'sz'),
        ('002601', '龙蟒佰利', 'sz'),
        ('002602', '世纪华通', 'sz'),
        ('002607', '中公教育', 'sz'),
        ('002624', '完美世界', 'sz'),
        ('002648', '卫星石化', 'sz'),
        ('002714', '牧原股份', 'sz'),
        ('002739', '万达电影', 'sz'),

        # 创业板 (300xxx)
        ('300750', '宁德时代', 'sz'),
        ('300059', '东方财富', 'sz'),
        ('300015', '爱尔眼科', 'sz'),
        ('300033', '同花顺', 'sz'),
        ('300124', '汇川技术', 'sz'),
        ('300142', '沃森生物', 'sz'),
        ('300144', '宋城演艺', 'sz'),
        ('300146', '汤臣倍健', 'sz'),
        ('300223', '北京君正', 'sz'),
        ('300257', '开山股份', 'sz'),
        ('300274', '阳光电源', 'sz'),
        ('300308', '中际旭创', 'sz'),
        ('300327', '中颖电子', 'sz'),
        ('300347', '泰格医药', 'sz'),
        ('300357', '我武生物', 'sz'),
        ('300408', '三环集团', 'sz'),
        ('300450', '先导智能', 'sz'),
        ('300457', '赢合科技', 'sz'),
        ('300498', '温氏股份', 'sz'),
        ('300595', '欧普康视', 'sz'),
        ('300628', '亿联网络', 'sz'),
        ('300661', '圣邦股份', 'sz'),
        ('300676', '华大基因', 'sz'),
        ('300724', '捷佳伟创', 'sz'),
        ('300760', '迈瑞医疗', 'sz'),
        ('300782', '卓胜微', 'sz'),

        # 科创板 (688xxx)
        ('688001', '华兴源创', 'sh'),
        ('688012', '中微公司', 'sh'),
        ('688111', '金山办公', 'sh'),
        ('688169', '石头科技', 'sh'),
        ('688599', '天合光能', 'sh'),
    ]

    results = []

    for code, name, market in stock_list:
        # 使用字符串包含判断
        if keyword in code or keyword in name:
            results.append(StockSearchResult(
                code=code,
                name=name,
                market=market,
            ))

    return results[:20]  # 最多返回20条


def get_batch_quotes(codes: List[str]) -> List[NormalizedIndicator]:
    """
    批量获取多只股票的实时行情

    Args:
        codes: 股票代码列表

    Returns:
        行情数据列表
    """
    results = []
    for code in codes:
        quote = get_quote_data(code)
        if quote:
            results.append(quote)

    return results