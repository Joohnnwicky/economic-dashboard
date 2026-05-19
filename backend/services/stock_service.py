"""
股票数据服务 - 获取K线和实时行情
"""
from datetime import datetime
from typing import List, Optional
from mootdx.consts import MARKET_SH, MARKET_SZ
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
        market, symbol = get_market_code(code)

        # mootdx category: 9=日线, 5=周线, 4=月线
        category_map = {'daily': 9, 'weekly': 5, 'monthly': 4}
        category = category_map.get(period, 9)

        # 获取K线数据
        result = client.get_kline(
            market=market,
            code=symbol,
            category=category,
            start=0,
            count=limit
        )

        if not result or not hasattr(result, 'data'):
            logger.warning(f"获取K线数据失败: {code}")
            return None

        # 转换数据格式
        historical = []
        for row in result.data:
            # mootdx返回格式: [date, open, close, high, low, volume, amount]
            try:
                if isinstance(row[0], str):
                    ts = datetime.strptime(row[0], '%Y-%m-%d')
                else:
                    ts = datetime.fromtimestamp(row[0] / 1000)

                historical.append(HistoricalDataPoint(
                    timestamp=ts,
                    value=float(row[2])  # 收盘价
                ))
            except Exception as e:
                logger.warning(f"解析K线数据点失败: {e}")
                continue

        if not historical:
            return None

        latest = historical[-1]
        first = historical[0]

        # 计算涨跌幅
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
        market, symbol = get_market_code(code)

        # 获取实时行情
        result = client.get_quote(market=market, code=symbol)

        if not result or not hasattr(result, 'data'):
            logger.warning(f"获取实时行情失败: {code}")
            return None

        data = result.data
        if not data or len(data) == 0:
            return None

        # 解析行情数据
        row = data[0]
        # mootdx quote格式: [code, name, price, open, close, high, low, volume, amount, ...]

        current_price = float(row[2]) if row[2] else 0
        prev_close = float(row[4]) if row[4] else current_price  # 前收盘价
        open_price = float(row[3]) if row[3] else current_price

        # 计算涨跌幅（相对于前收盘价）
        if prev_close > 0:
            change_pct = (current_price - prev_close) / prev_close * 100
            change_value = current_price - prev_close
        else:
            change_pct = 0
            change_value = 0

        return NormalizedIndicator(
            id=f"stock-{code}",
            name=row[1] if len(row) > 1 else get_stock_name(code),
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
    # 静态股票列表（常用A股）
    stock_list = [
        ('600519', '贵州茅台', 'sh'),
        ('000001', '平安银行', 'sz'),
        ('000002', '万科A', 'sz'),
        ('600036', '招商银行', 'sh'),
        ('601318', '中国平安', 'sh'),
        ('000858', '五粮液', 'sz'),
        ('002415', '海康威视', 'sz'),
        ('600276', '恒瑞医药', 'sh'),
        ('000333', '美的集团', 'sz'),
        ('601166', '兴业银行', 'sh'),
        ('600000', '浦发银行', 'sh'),
        ('601398', '工商银行', 'sh'),
        ('601288', '农业银行', 'sh'),
        ('600030', '中信证券', 'sh'),
        ('000651', '格力电器', 'sz'),
        ('600887', '伊利股份', 'sh'),
        ('002594', '比亚迪', 'sz'),
        ('600900', '长江电力', 'sh'),
        ('601012', '隆基绿能', 'sh'),
        ('300750', '宁德时代', 'sz'),
        ('600010', '包钢股份', 'sh'),
        ('601899', '紫金矿业', 'sh'),
        ('000725', '京东方A', 'sz'),
        ('002352', '顺丰控股', 'sz'),
        ('600019', '宝钢股份', 'sh'),
        ('601888', '中国中免', 'sh'),
        ('600585', '海螺水泥', 'sh'),
        ('002475', '立讯精密', 'sz'),
        ('603259', '药明康德', 'sh'),
        ('300059', '东方财富', 'sz'),
        # 指数
        ('sh000001', '上证指数', 'sh'),
        ('sh000300', '沪深300', 'sh'),
        ('sh000016', '上证50', 'sh'),
        ('sz399001', '深证成指', 'sz'),
        ('sz399006', '创业板指', 'sz'),
    ]

    results = []
    keyword_lower = keyword.lower()

    for code, name, market in stock_list:
        if keyword_lower in code.lower() or keyword_lower in name.lower():
            results.append(StockSearchResult(
                code=code.replace('sh', '').replace('sz', ''),  # 移除市场前缀
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