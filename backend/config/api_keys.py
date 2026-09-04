"""
API Key配置中心 - 所有外部API密钥在此集中管理
密钥从环境变量读取，不暴露给前端
"""
import os


class APIConfig:
    """外部API配置和密钥管理"""

    # FRED API (美联储数据)
    FRED_API_KEY = os.environ.get('FRED_API_KEY', '')
    FRED_BASE_URL = 'https://api.stlouisfed.org/fred'

    # BLS API (美国劳工统计局)
    BLS_API_KEY = os.environ.get('BLS_API_KEY', '')
    BLS_BASE_URL = 'https://api.bls.gov/publicAPI/v2'

    # Alpha Vantage API (美股/金价)
    ALPHA_VANTAGE_API_KEY = os.environ.get('ALPHA_VANTAGE_API_KEY', '')
    ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query'

    # DeepSeek LLM (经济日历发布日解析)
    DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', '')
    DEEPSEEK_BASE_URL = os.environ.get('DEEPSEEK_BASE_URL', 'https://api.deepseek.com')
    DEEPSEEK_MODEL = os.environ.get('DEEPSEEK_MODEL', 'deepseek-v4-flash')

    # Tushare Pro (中国宏观经济结构化数据)
    TUSHARE_TOKEN = os.environ.get('TUSHARE_TOKEN', '')
    TUSHARE_BASE_URL = 'http://api.tushare.pro'

    # Binance API (加密货币) - 无需密钥，公开API
    BINANCE_BASE_URL = 'https://api.binance.com/api/v3'

    # 缓存配置 (TTL秒数)
    CACHE_TTL = {
        'FRED': 300,        # 5分钟
        'BLS': 1800,        # 30分钟 (配额限制25次/天)
        'AlphaVantage': 3600,  # 1小时 (配额限制25次/天)
        'Binance': 30,      # 30秒 (实时数据)
        'YFinance': 300,    # 5分钟 (无配额，避免Yahoo限流)
        'Coinbase': 60,     # 1分钟 (溢价指数，实时但无需高频)
        'CryptoSignals': 3600,  # 1小时 (恐惧贪婪/均线，低频)
        'MarketDominance': 3600,  # 1小时 (CoinGecko 市占率/山寨季)
        'Onchain': 1800,    # 30分钟 (mempool.space 算力/手续费)
        'EconomicCalendar': 3600,  # 1小时 (纯计算经济日历, NFP/CPI/PPI/PCE)
        'FedWatch': 3600,   # 1小时 (CME FedWatch / FOMC 日历)
        'ReleaseRefresh': 86400,  # 1天 (发布日采集, 每日刷新)
    }

    @classmethod
    def validate_keys(cls) -> dict:
        """验证API密钥是否配置"""
        return {
            'FRED': bool(cls.FRED_API_KEY),
            'BLS': bool(cls.BLS_API_KEY),
            'AlphaVantage': bool(cls.ALPHA_VANTAGE_API_KEY),
            'Binance': True,  # 无需密钥
        }