"""
通达信客户端服务 - 使用mootdx获取A股数据
"""
from mootdx.quotes import StdQuotes
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# 通达信服务器列表（已验证可连接）
TDX_SERVERS = [
    ('218.75.126.9', 7709),
    ('115.238.90.165', 7709),
    ('124.160.88.21', 7709),
]


class TDXClient:
    """通达信行情客户端"""

    _instance: Optional['TDXClient'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._client = None
        return cls._instance

    def get_client(self) -> StdQuotes:
        """获取通达信客户端连接"""
        if self._client is None:
            try:
                # 尝试连接服务器
                for host, port in TDX_SERVERS:
                    try:
                        self._client = StdQuotes(
                            market='std',
                            server=(host, port),
                            timeout=10
                        )
                        logger.info(f"通达信客户端连接成功: {host}:{port}")
                        break
                    except Exception as e:
                        logger.warning(f"连接失败 {host}:{port}: {e}")
                        continue

                if self._client is None:
                    raise Exception("无法连接任何通达信服务器")

            except Exception as e:
                logger.error(f"通达信连接失败: {e}")
                raise
        return self._client

    def close(self):
        """关闭连接"""
        if self._client:
            self._client.close()
            self._client = None
            logger.info("通达信客户端连接关闭")


# 全局客户端实例
tdx_client = TDXClient()


def get_market_code(stock_code: str) -> tuple:
    """
    根据股票代码判断市场

    Args:
        stock_code: 6位股票代码，如 '600519'

    Returns:
        (market, code): market=1表示上海，0表示深圳
    """
    if stock_code.startswith('6'):
        return (1, stock_code)  # 上海
    else:
        return (0, stock_code)  # 深圳


def get_stock_name(stock_code: str) -> str:
    """获取股票名称（从静态映射表）"""
    stock_names = {
        '600519': '贵州茅台',
        '000001': '平安银行',
        '000002': '万科A',
        '600036': '招商银行',
        '601318': '中国平安',
        '000858': '五粮液',
        '002415': '海康威视',
        '600276': '恒瑞医药',
        '000333': '美的集团',
        '601166': '兴业银行',
        '600000': '浦发银行',
        '601398': '工商银行',
        '601288': '农业银行',
        '600030': '中信证券',
        '000651': '格力电器',
        '600887': '伊利股份',
        '002594': '比亚迪',
        '600900': '长江电力',
        '601012': '隆基绿能',
        '300750': '宁德时代',
        '600010': '包钢股份',
        '601899': '紫金矿业',
        '000725': '京东方A',
        '002352': '顺丰控股',
        '600019': '宝钢股份',
        '601888': '中国中免',
        '600585': '海螺水泥',
        '002475': '立讯精密',
        '603259': '药明康德',
        '300059': '东方财富',
    }
    return stock_names.get(stock_code, f"股票{stock_code}")