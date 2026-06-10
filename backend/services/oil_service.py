"""
油价数据服务 - 国内油价(上海原油期货SC,元/桶) + 国际油价(WTI原油,美元/桶)
"""
import akshare as ak
from typing import Dict, Optional
from datetime import datetime
import pandas as pd


class OilPriceCache:
    """油价内存缓存，1小时TTL"""
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


def _calc_change(historical: list):
    """计算日涨跌"""
    if len(historical) < 2:
        return None
    latest = historical[-1]
    previous = historical[-2]
    if previous['value'] <= 0:
        return None
    change_value = latest['value'] - previous['value']
    change_pct = (change_value / previous['value']) * 100
    return {'value': round(change_value, 2), 'percentage': round(change_pct, 2)}


def fetch_oil_price() -> Dict:
    """获取国内+国际油价"""
    cached = OilPriceCache.get()
    if cached:
        return cached

    end_date = datetime.now().strftime('%Y%m%d')
    start_date = '20260101'

    # 国内油价 - 上海原油期货SC（futures_main_sina）
    domestic = None
    try:
        df = ak.futures_main_sina(symbol='SC0', start_date=start_date, end_date=end_date)
        recent = df.tail(30)
        historical = []
        for _, row in recent.iterrows():
            close_val = row.iloc[4]
            if pd.isna(close_val) or close_val == 0:
                continue
            date_val = row.iloc[0]
            if hasattr(date_val, 'strftime'):
                ts = f"{date_val.strftime('%Y-%m-%d')}T00:00:00"
            else:
                ts = f"{date_val}T00:00:00"
            historical.append({'timestamp': ts, 'value': float(close_val)})
        if historical:
            domestic = {
                'seriesId': 'OIL_SHFE_SC',
                'name': '国内油价（上海原油期货主力）',
                'value': historical[-1]['value'],
                'unit': '元/桶',
                'timestamp': historical[-1]['timestamp'],
                'change': _calc_change(historical),
                'historical': historical,
                'source': 'AkShare',
            }
            print(f"获取国内油价成功: {historical[-1]['value']:.2f} 元/桶")
    except Exception as e:
        print(f"获取国内油价失败: {e}")

    # 国际油价 - WTI原油（futures_foreign_hist）
    international = None
    try:
        df = ak.futures_foreign_hist(symbol='CL')
        recent = df.tail(30)
        historical = []
        for _, row in recent.iterrows():
            close_val = row['close']
            if pd.isna(close_val) or close_val == 0:
                continue
            date_val = row['date']
            if hasattr(date_val, 'strftime'):
                ts = f"{date_val.strftime('%Y-%m-%d')}T00:00:00"
            else:
                ts = f"{date_val}T00:00:00"
            historical.append({'timestamp': ts, 'value': float(close_val)})
        if historical:
            international = {
                'seriesId': 'OIL_WTI_CL',
                'name': '国际油价（WTI原油）',
                'value': historical[-1]['value'],
                'unit': '美元/桶',
                'timestamp': historical[-1]['timestamp'],
                'change': _calc_change(historical),
                'historical': historical,
                'source': 'AkShare',
            }
            print(f"获取国际油价成功: {historical[-1]['value']:.2f} 美元/桶")
    except Exception as e:
        print(f"获取国际油价失败: {e}")

    if not domestic and not international:
        return {
            'seriesId': 'OIL_FALLBACK',
            'name': '油价（参考值）',
            'value': 0,
            'unit': '',
            'timestamp': datetime.now().isoformat(),
            'change': None,
            'historical': [],
            'source': 'fallback',
        }

    result = {
        'domestic': domestic,
        'international': international,
    }
    OilPriceCache.set(result)
    return result


async def get_oil_price() -> Dict:
    """API路由调用入口"""
    return fetch_oil_price()
