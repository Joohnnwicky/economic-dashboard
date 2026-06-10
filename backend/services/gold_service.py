"""
金价数据服务 - 使用AkShare获取上海黄金期货主力合约数据（元/克）
"""
import akshare as ak
from typing import Dict, Optional
from datetime import datetime
import pandas as pd


class GoldPriceCache:
    """金价内存缓存，1小时TTL"""
    _data: Optional[Dict] = None
    _timestamp: Optional[datetime] = None
    TTL_SECONDS = 3600

    @classmethod
    def get(cls) -> Optional[Dict]:
        if cls._data is None or cls._timestamp is None:
            return None
        elapsed = (datetime.now() - cls._timestamp).total_seconds()
        if elapsed >= cls.TTL_SECONDS:
            cls._data = None
            cls._timestamp = None
            return None
        return cls._data

    @classmethod
    def set(cls, data: Dict):
        cls._data = data
        cls._timestamp = datetime.now()


def fetch_gold_price() -> Dict:
    """
    从AkShare获取上海黄金期货主力合约数据
    futures_main_sina列: [0]日期 [1]开盘 [2]最高 [3]最低 [4]收盘 [5]成交量 [6]持仓量 [7]结算价
    """
    cached = GoldPriceCache.get()
    if cached:
        return cached

    try:
        # 取最近30个交易日数据
        end_date = datetime.now().strftime('%Y%m%d')
        start_date = '20260101'  # 宽范围，取尾部30条即可
        df = ak.futures_main_sina(symbol='AU0', start_date=start_date, end_date=end_date)

        recent = df.tail(30)

        historical = []
        for _, row in recent.iterrows():
            close_val = row.iloc[4]  # 收盘价
            if pd.isna(close_val) or close_val == 0:
                continue
            date_val = row.iloc[0]  # 日期
            if hasattr(date_val, 'strftime'):
                ts = f"{date_val.strftime('%Y-%m-%d')}T00:00:00"
            else:
                ts = f"{date_val}T00:00:00"
            historical.append({
                'timestamp': ts,
                'value': float(close_val),
            })

        if not historical:
            raise ValueError("黄金期货数据为空")

        latest = historical[-1]
        previous = historical[-2] if len(historical) > 1 else None

        change = None
        if previous and previous['value'] > 0:
            change_value = latest['value'] - previous['value']
            change_pct = (change_value / previous['value']) * 100
            change = {
                'value': round(change_value, 2),
                'percentage': round(change_pct, 2),
            }

        result = {
            'seriesId': 'GOLD_SHFE_AU',
            'name': '国内金价（上海黄金期货主力）',
            'value': latest['value'],
            'unit': '元/克',
            'timestamp': latest['timestamp'],
            'change': change,
            'historical': historical,
            'source': 'AkShare',
        }

        GoldPriceCache.set(result)
        print(f"获取国内金价成功: {latest['value']:.2f} 元/克")
        return result

    except Exception as e:
        print(f"获取国内金价失败: {e}")
        return {
            'seriesId': 'GOLD_FALLBACK',
            'name': '国内金价（参考值）',
            'value': 0,
            'unit': '元/克',
            'timestamp': datetime.now().isoformat(),
            'change': None,
            'historical': [],
            'source': 'fallback',
            'warning': '金价数据暂时不可用，请稍后刷新',
        }


async def get_gold_price() -> Dict:
    """API路由调用入口"""
    return fetch_gold_price()


async def update_gold_price_cache():
    """手动刷新缓存"""
    GoldPriceCache._data = None
    GoldPriceCache._timestamp = None
    return fetch_gold_price()
