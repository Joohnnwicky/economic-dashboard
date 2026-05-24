"""
中国宏观经济数据服务 - 使用AkShare获取国家统计局数据
"""
import akshare as ak
from typing import Dict, List, Optional
from datetime import datetime
import pandas as pd
import re


def parse_chinese_date(date_str: str, is_quarterly: bool = False) -> datetime:
    """
    解析中文日期格式，如 "2026年04月份" 或 "2026.4" 或季度格式 "2026年一季度"
    """
    try:
        # 格式1: 季度格式 "2026年一季度" 或 "2026年1季度"
        if '季' in date_str or is_quarterly:
            match = re.match(r'(\d{4})年.*([一二三四1-4])季', date_str)
            if match:
                year = int(match.group(1))
                quarter = match.group(2)
                quarter_map = {'一': 3, '二': 6, '三': 9, '四': 12, '1': 3, '2': 6, '3': 9, '4': 12}
                month = quarter_map.get(quarter, 3)
                return datetime(year, month, 1)

        # 格式2: "2026年04月份"
        if '年' in date_str and '月' in date_str:
            match = re.match(r'(\d{4})年(\d{1,2})月', date_str)
            if match:
                year = int(match.group(1))
                month = int(match.group(2))
                return datetime(year, month, 1)

        # 格式3: "2026.4"
        if '.' in date_str:
            parts = date_str.split('.')
            year = int(parts[0])
            month = int(parts[1])
            return datetime(year, month, 1)

        return datetime.now()
    except:
        return datetime.now()


def get_china_gdp() -> Dict:
    """
    获取中国GDP数据（季度）

    Returns:
        GDP数据字典，包含当前值、历史数据和同比变化
    """
    try:
        df = ak.macro_china_gdp()

        # 列名：季度, 国内生产总值-绝对值, 国内生产总值-同比增长
        historical = []

        # 数据是从新到旧排列，取最近12个季度
        for i in range(min(12, len(df))):
            row = df.iloc[i]
            date_str = str(row['季度'])
            value = float(row['国内生产总值-同比增长'])  # GDP同比增速
            timestamp = parse_chinese_date(date_str, is_quarterly=True)

            historical.append({
                'timestamp': timestamp.isoformat(),
                'value': value
            })

        # 按时间正序排列（旧 -> 新）
        historical.reverse()

        current_value = historical[-1]['value'] if historical else 0

        return {
            'seriesId': 'GDP',
            'name': '中国GDP同比增速',
            'value': current_value,
            'unit': '%',
            'timestamp': historical[-1]['timestamp'] if historical else datetime.now().isoformat(),
            'historical': historical,
            'yoyChange': None  # GDP同比本身就是增速
        }
    except Exception as e:
        print(f"获取GDP数据失败: {e}")
        return None


def get_china_cpi() -> Dict:
    """
    获取中国CPI数据（月度同比）

    Returns:
        CPI数据字典
    """
    try:
        df = ak.macro_china_cpi()

        # 列名：月份, 全国-当月, 全国-同比增长, 全国-环比增长, 全国-累计
        historical = []

        # 数据是从新到旧排列，取最近24个月
        for i in range(min(24, len(df))):
            row = df.iloc[i]
            date_str = str(row['月份'])
            value = float(row['全国-同比增长'])
            timestamp = parse_chinese_date(date_str)

            historical.append({
                'timestamp': timestamp.isoformat(),
                'value': value
            })

        historical.reverse()
        current_value = historical[-1]['value'] if historical else 0

        return {
            'seriesId': 'CPI',
            'name': '中国CPI同比',
            'value': current_value,
            'unit': '%',
            'timestamp': historical[-1]['timestamp'] if historical else datetime.now().isoformat(),
            'historical': historical
        }
    except Exception as e:
        print(f"获取CPI数据失败: {e}")
        return None


def get_china_ppi() -> Dict:
    """
    获取中国PPI数据（月度同比）

    Returns:
        PPI数据字典
    """
    try:
        df = ak.macro_china_ppi()

        # 列名：月份, 当月, 当月同比增长, 累计
        historical = []

        for i in range(min(24, len(df))):
            row = df.iloc[i]
            date_str = str(row['月份'])
            value = float(row['当月同比增长'])
            timestamp = parse_chinese_date(date_str)

            historical.append({
                'timestamp': timestamp.isoformat(),
                'value': value
            })

        historical.reverse()
        current_value = historical[-1]['value'] if historical else 0

        return {
            'seriesId': 'PPI',
            'name': '中国PPI同比',
            'value': current_value,
            'unit': '%',
            'timestamp': historical[-1]['timestamp'] if historical else datetime.now().isoformat(),
            'historical': historical
        }
    except Exception as e:
        print(f"获取PPI数据失败: {e}")
        return None


def get_china_m2() -> Dict:
    """
    获取中国M2货币供应量（月度）

    Returns:
        M2数据字典
    """
    try:
        df = ak.macro_china_supply_of_money()

        # 列名：统计时间, 货币和准货币（广义货币M2）, 货币和准货币（广义货币M2）同比增长
        historical = []

        # 最新数据的同比增速（数据是从新到旧排列）
        latest_yoy = float(df.iloc[0]['货币和准货币（广义货币M2）同比增长'])

        for i in range(min(24, len(df))):
            row = df.iloc[i]
            date_str = str(row['统计时间'])
            value = float(row['货币和准货币（广义货币M2）'])  # M2余额（亿元）
            timestamp = parse_chinese_date(date_str)

            historical.append({
                'timestamp': timestamp.isoformat(),
                'value': value
            })

        historical.reverse()
        current_value = historical[-1]['value'] if historical else 0

        return {
            'seriesId': 'M2',
            'name': '中国M2货币供应量',
            'value': current_value,
            'unit': '亿元',
            'timestamp': historical[-1]['timestamp'] if historical else datetime.now().isoformat(),
            'historical': historical,
            'yoyChange': latest_yoy  # 使用官方公布的最新同比增速
        }
    except Exception as e:
        print(f"获取M2数据失败: {e}")
        return None


def get_all_china_macro() -> Dict:
    """
    获取所有中国宏观经济指标

    Returns:
        包含GDP、CPI、PPI、M2的字典
    """
    gdp = get_china_gdp()
    cpi = get_china_cpi()
    ppi = get_china_ppi()
    m2 = get_china_m2()

    return {
        'gdp': gdp,
        'cpi': cpi,
        'ppi': ppi,
        'm2': m2
    }