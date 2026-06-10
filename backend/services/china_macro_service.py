"""
中国宏观经济数据服务 - 使用AkShare获取国家统计局数据
"""
import akshare as ak
from typing import Dict, List, Optional
from datetime import datetime
import pandas as pd
import re


# ============================================================
# 缓存层 - 24小时TTL，月度/季度数据不需要频繁刷新
# ============================================================

class ChinaMacroCache:
    """中国宏观经济数据内存缓存"""
    _cache: Dict[str, dict] = {}
    _timestamps: Dict[str, datetime] = {}
    TTL_SECONDS = 86400  # 24 hours

    @classmethod
    def get(cls, key: str) -> Optional[dict]:
        if key not in cls._cache or key not in cls._timestamps:
            return None
        elapsed = (datetime.now() - cls._timestamps[key]).total_seconds()
        if elapsed >= cls.TTL_SECONDS:
            cls._cache.pop(key, None)
            cls._timestamps.pop(key, None)
            return None
        return cls._cache[key]

    @classmethod
    def set(cls, key: str, data: dict):
        cls._cache[key] = data
        cls._timestamps[key] = datetime.now()


# ============================================================
# 日期解析工具
# ============================================================

def parse_chinese_date(date_str: str, is_quarterly: bool = False) -> datetime:
    """
    解析中文日期格式，如 "2026年04月份" 或 "2026.4" 或季度格式 "2026年一季度"
    也处理纯数字格式 "201501" (YYYYMM)
    """
    try:
        # 格式0: 纯数字 YYYYMM，如 "201501"
        if isinstance(date_str, str) and date_str.isdigit() and len(date_str) == 6:
            year = int(date_str[:4])
            month = int(date_str[4:6])
            return datetime(year, month, 1)

        # 格式1: 季度格式 "2026年一季度" 或 "2026年1季度"
        if '季' in str(date_str) or is_quarterly:
            match = re.match(r'(\d{4})年.*([一二三四1-4])季', str(date_str))
            if match:
                year = int(match.group(1))
                quarter = match.group(2)
                quarter_map = {'一': 3, '二': 6, '三': 9, '四': 12, '1': 3, '2': 6, '3': 9, '4': 12}
                month = quarter_map.get(quarter, 3)
                return datetime(year, month, 1)

        # 格式2: "2026年04月份"
        if '年' in str(date_str) and '月' in str(date_str):
            match = re.match(r'(\d{4})年(\d{1,2})月', str(date_str))
            if match:
                year = int(match.group(1))
                month = int(match.group(2))
                return datetime(year, month, 1)

        # 格式3: "2026.4"
        if '.' in str(date_str):
            parts = str(date_str).split('.')
            year = int(parts[0])
            month = int(parts[1])
            return datetime(year, month, 1)

        # 格式4: pandas Timestamp or datetime.date
        if hasattr(date_str, 'year') and hasattr(date_str, 'month'):
            return datetime(date_str.year, date_str.month, 1)

        return datetime.now()
    except:
        return datetime.now()


# ============================================================
# NBS 直连格式通用解析器
# NBS数据：index 0 = 最新，index -1 = 最旧（多数情况）
# 但部分函数 index 0 = 最旧（如 macro_china_gyzjz）
# ============================================================

def _parse_nbs_desc(df, date_col: int, value_col: int, series_id: str,
                     name: str, unit: str, max_points: int = 36,
                     yoy_col: int = None) -> Optional[Dict]:
    """解析NBS直连数据（index 0 = 最新，从旧到新排列）"""
    try:
        total = min(max_points, len(df))
        historical = []
        for i in range(total):
            row = df.iloc[i]
            value = row.iloc[value_col]
            if pd.isna(value):
                continue
            timestamp = parse_chinese_date(str(row.iloc[date_col]))
            historical.append({
                'timestamp': timestamp.isoformat(),
                'value': float(value)
            })
        # NBS数据index 0=最新，需反转为时间正序
        historical.reverse()
        if not historical:
            return None

        yoy = None
        if yoy_col is not None:
            yoy_val = df.iloc[0].iloc[yoy_col]  # 最新行的同比
            if pd.notna(yoy_val):
                yoy = float(yoy_val)

        current = historical[-1]
        result = {
            'seriesId': series_id,
            'name': name,
            'value': current['value'],
            'unit': unit,
            'timestamp': current['timestamp'],
            'historical': historical,
        }
        if yoy is not None:
            result['yoyChange'] = yoy
        return result
    except Exception as e:
        print(f"解析{series_id}数据失败: {e}")
        return None


def _parse_nbs_asc(df, date_col: int, value_col: int, series_id: str,
                    name: str, unit: str, max_points: int = 36,
                    yoy_col: int = None) -> Optional[Dict]:
    """解析NBS直连数据（index 0 = 最旧，数据已按时间正序）"""
    try:
        total = len(df)
        start = max(0, total - max_points)
        historical = []
        for i in range(start, total):
            row = df.iloc[i]
            value = row.iloc[value_col]
            if pd.isna(value):
                continue
            timestamp = parse_chinese_date(str(row.iloc[date_col]))
            historical.append({
                'timestamp': timestamp.isoformat(),
                'value': float(value)
            })
        if not historical:
            return None

        yoy = None
        if yoy_col is not None:
            yoy_val = df.iloc[-1].iloc[yoy_col]  # 最新行的同比
            if pd.notna(yoy_val):
                yoy = float(yoy_val)

        current = historical[-1]
        result = {
            'seriesId': series_id,
            'name': name,
            'value': current['value'],
            'unit': unit,
            'timestamp': current['timestamp'],
            'historical': historical,
        }
        if yoy is not None:
            result['yoyChange'] = yoy
        return result
    except Exception as e:
        print(f"解析{series_id}数据失败: {e}")
        return None


# ============================================================
# jin10.com 通用格式解析器（仅财新PMI仍在使用）
# 列格式: 商品, 日期, 今值, 预测值, 前值
# ============================================================

def _parse_jin10_series(df, series_id: str, name: str, unit: str, max_points: int = 36) -> Optional[Dict]:
    """解析 jin10.com 统一格式数据（数据从旧到新排列，取最后 max_points 条）"""
    try:
        total = len(df)
        start = max(0, total - max_points)
        historical = []
        for i in range(start, total):
            row = df.iloc[i]
            value = row['今值']
            if pd.isna(value):
                continue
            timestamp = parse_chinese_date(row['日期'])
            historical.append({
                'timestamp': timestamp.isoformat(),
                'value': float(value)
            })
        historical.sort(key=lambda x: x['timestamp'])
        if not historical:
            return None
        current = historical[-1]
        last_row = df.iloc[-1]
        forecast = float(last_row['预测值']) if pd.notna(last_row['预测值']) else None
        previous = float(last_row['前值']) if pd.notna(last_row['前值']) else None
        return {
            'seriesId': series_id,
            'name': name,
            'value': current['value'],
            'unit': unit,
            'timestamp': current['timestamp'],
            'historical': historical,
            'forecast': forecast,
            'previous': previous,
        }
    except Exception as e:
        print(f"解析{series_id}数据失败: {e}")
        return None


# ============================================================
# GDP（季度）
# ============================================================

def get_china_gdp() -> Optional[Dict]:
    cached = ChinaMacroCache.get('gdp')
    if cached:
        return cached
    try:
        df = ak.macro_china_gdp()
        historical = []
        for i in range(min(12, len(df))):
            row = df.iloc[i]
            date_str = str(row['季度'])
            value = float(row['国内生产总值-同比增长'])
            timestamp = parse_chinese_date(date_str, is_quarterly=True)
            historical.append({'timestamp': timestamp.isoformat(), 'value': value})
        historical.reverse()
        if not historical:
            return None
        current_value = historical[-1]['value']
        result = {
            'seriesId': 'GDP',
            'name': '中国GDP同比增速',
            'value': current_value,
            'unit': '%',
            'timestamp': historical[-1]['timestamp'],
            'historical': historical,
            'yoyChange': None
        }
        ChinaMacroCache.set('gdp', result)
        return result
    except Exception as e:
        print(f"获取GDP数据失败: {e}")
        return None


# ============================================================
# CPI（月度）
# ============================================================

def get_china_cpi() -> Optional[Dict]:
    cached = ChinaMacroCache.get('cpi')
    if cached:
        return cached
    try:
        df = ak.macro_china_cpi()
        historical = []
        for i in range(min(24, len(df))):
            row = df.iloc[i]
            date_str = str(row['月份'])
            value = float(row['全国-同比增长'])
            timestamp = parse_chinese_date(date_str)
            historical.append({'timestamp': timestamp.isoformat(), 'value': value})
        historical.reverse()
        if not historical:
            return None
        current_value = historical[-1]['value']
        result = {
            'seriesId': 'CPI',
            'name': '中国CPI同比',
            'value': current_value,
            'unit': '%',
            'timestamp': historical[-1]['timestamp'],
            'historical': historical
        }
        ChinaMacroCache.set('cpi', result)
        return result
    except Exception as e:
        print(f"获取CPI数据失败: {e}")
        return None


# ============================================================
# PPI（月度）
# ============================================================

def get_china_ppi() -> Optional[Dict]:
    cached = ChinaMacroCache.get('ppi')
    if cached:
        return cached
    try:
        df = ak.macro_china_ppi()
        historical = []
        for i in range(min(24, len(df))):
            row = df.iloc[i]
            date_str = str(row['月份'])
            value = float(row['当月同比增长'])
            timestamp = parse_chinese_date(date_str)
            historical.append({'timestamp': timestamp.isoformat(), 'value': value})
        historical.reverse()
        if not historical:
            return None
        current_value = historical[-1]['value']
        result = {
            'seriesId': 'PPI',
            'name': '中国PPI同比',
            'value': current_value,
            'unit': '%',
            'timestamp': historical[-1]['timestamp'],
            'historical': historical
        }
        ChinaMacroCache.set('ppi', result)
        return result
    except Exception as e:
        print(f"获取PPI数据失败: {e}")
        return None


# ============================================================
# M2（月度）
# ============================================================

def get_china_m2() -> Optional[Dict]:
    cached = ChinaMacroCache.get('m2')
    if cached:
        return cached
    try:
        df = ak.macro_china_supply_of_money()
        historical = []
        latest_yoy = float(df.iloc[0]['货币和准货币（广义货币M2）同比增长'])
        for i in range(min(24, len(df))):
            row = df.iloc[i]
            date_str = str(row['统计时间'])
            value = float(row['货币和准货币（广义货币M2）'])
            timestamp = parse_chinese_date(date_str)
            historical.append({'timestamp': timestamp.isoformat(), 'value': value})
        historical.reverse()
        if not historical:
            return None
        current_value = historical[-1]['value']
        result = {
            'seriesId': 'M2',
            'name': '中国M2货币供应量',
            'value': current_value,
            'unit': '亿元',
            'timestamp': historical[-1]['timestamp'],
            'historical': historical,
            'yoyChange': latest_yoy
        }
        ChinaMacroCache.set('m2', result)
        return result
    except Exception as e:
        print(f"获取M2数据失败: {e}")
        return None


# ============================================================
# PMI 指标（月度）— NBS直连 + jin10财新
# ============================================================

def get_china_pmi_nbs_mfg() -> Optional[Dict]:
    """NBS制造业PMI — 使用NBS直连数据源（macro_china_pmi）"""
    cached = ChinaMacroCache.get('pmi_nbs_mfg')
    if cached:
        return cached
    try:
        df = ak.macro_china_pmi()
        # 列: [0]月份 [1]制造业-指数 [2]制造业-同比增长 [3]非制造业-指数 [4]非制造业-同比增长
        # index 0 = 最新
        result = _parse_nbs_desc(df, 0, 1, 'PMI_NBS_MFG', '官方制造业PMI', '')
        if result:
            ChinaMacroCache.set('pmi_nbs_mfg', result)
        return result
    except Exception as e:
        print(f"获取NBS制造业PMI失败: {e}")
        return None


def get_china_pmi_nbs_non_mfg() -> Optional[Dict]:
    """NBS非制造业PMI — 使用NBS直连数据源（macro_china_pmi）"""
    cached = ChinaMacroCache.get('pmi_nbs_non_mfg')
    if cached:
        return cached
    try:
        df = ak.macro_china_pmi()
        # 列: [0]月份 [3]非制造业-指数
        result = _parse_nbs_desc(df, 0, 3, 'PMI_NBS_NON_MFG', '官方非制造业PMI', '')
        if result:
            ChinaMacroCache.set('pmi_nbs_non_mfg', result)
        return result
    except Exception as e:
        print(f"获取NBS非制造业PMI失败: {e}")
        return None


def get_china_pmi_caixin_mfg() -> Optional[Dict]:
    """财新制造业PMI — 仍用jin10数据源"""
    cached = ChinaMacroCache.get('pmi_caixin_mfg')
    if cached:
        return cached
    try:
        df = ak.macro_china_cx_pmi_yearly()
        result = _parse_jin10_series(df, 'PMI_CAIXIN_MFG', '财新制造业PMI', '')
        if result:
            ChinaMacroCache.set('pmi_caixin_mfg', result)
        return result
    except Exception as e:
        print(f"获取财新制造业PMI失败: {e}")
        return None


def get_china_pmi_caixin_services() -> Optional[Dict]:
    """财新服务业PMI — 仍用jin10数据源"""
    cached = ChinaMacroCache.get('pmi_caixin_services')
    if cached:
        return cached
    try:
        df = ak.macro_china_cx_services_pmi_yearly()
        result = _parse_jin10_series(df, 'PMI_CAIXIN_SERVICES', '财新服务业PMI', '')
        if result:
            ChinaMacroCache.set('pmi_caixin_services', result)
        return result
    except Exception as e:
        print(f"获取财新服务业PMI失败: {e}")
        return None


# ============================================================
# 贸易指标（月度）— NBS直连（海关总署数据）
# ============================================================

def get_china_exports_yoy() -> Optional[Dict]:
    """出口同比 — 使用海关总署直连数据（macro_china_hgjck）"""
    cached = ChinaMacroCache.get('exports_yoy')
    if cached:
        return cached
    try:
        df = ak.macro_china_hgjck()
        # 列: [0]月份 [1]出口当月-值 [2]出口当月-同比增长 [3]出口当月-环比增长
        # index 0 = 最新
        result = _parse_nbs_desc(df, 0, 2, 'EXPORTS_YOY', '出口同比', '%')
        if result:
            ChinaMacroCache.set('exports_yoy', result)
        return result
    except Exception as e:
        print(f"获取出口同比数据失败: {e}")
        return None


def get_china_imports_yoy() -> Optional[Dict]:
    """进口同比 — 使用海关总署直连数据（macro_china_hgjck）"""
    cached = ChinaMacroCache.get('imports_yoy')
    if cached:
        return cached
    try:
        df = ak.macro_china_hgjck()
        # 列: [4]进口当月-值 [5]进口当月-同比增长
        result = _parse_nbs_desc(df, 0, 5, 'IMPORTS_YOY', '进口同比', '%')
        if result:
            ChinaMacroCache.set('imports_yoy', result)
        return result
    except Exception as e:
        print(f"获取进口同比数据失败: {e}")
        return None


def get_china_trade_balance() -> Optional[Dict]:
    """贸易差额 — 使用海关总署直连数据（macro_china_hgjck）"""
    cached = ChinaMacroCache.get('trade_balance')
    if cached:
        return cached
    try:
        df = ak.macro_china_hgjck()
        # 列: [9]累计进出口-差（贸易差额，单位：千美元）
        # 取最近36条
        total = min(36, len(df))
        historical = []
        for i in range(total):
            row = df.iloc[i]
            value = row.iloc[9]
            if pd.isna(value):
                continue
            timestamp = parse_chinese_date(str(row.iloc[0]))
            # 转换为亿美元
            historical.append({
                'timestamp': timestamp.isoformat(),
                'value': round(float(value) / 1e8, 2)
            })
        historical.reverse()
        if not historical:
            return None
        current = historical[-1]
        result = {
            'seriesId': 'TRADE_BALANCE',
            'name': '贸易差额',
            'value': current['value'],
            'unit': '亿美元',
            'timestamp': current['timestamp'],
            'historical': historical,
        }
        ChinaMacroCache.set('trade_balance', result)
        return result
    except Exception as e:
        print(f"获取贸易差额数据失败: {e}")
        return None


# ============================================================
# 信贷指标（月度）
# ============================================================

def get_china_social_financing() -> Optional[Dict]:
    """社会融资规模增量（商务部数据源）"""
    cached = ChinaMacroCache.get('social_financing')
    if cached:
        return cached
    try:
        df = ak.macro_china_shrzgm()
        # 数据从旧到新(index 0=最旧)，取最后36条
        total = len(df)
        start = max(0, total - 36)
        historical = []
        for i in range(start, total):
            row = df.iloc[i]
            date_str = str(row.iloc[0])
            value = row.iloc[1]
            if pd.isna(value):
                continue
            timestamp = parse_chinese_date(date_str)
            historical.append({
                'timestamp': timestamp.isoformat(),
                'value': float(value)
            })
        historical.sort(key=lambda x: x['timestamp'])
        if not historical:
            return None
        current = historical[-1]
        result = {
            'seriesId': 'SOCIAL_FINANCING',
            'name': '社会融资规模增量',
            'value': current['value'],
            'unit': '亿元',
            'timestamp': current['timestamp'],
            'historical': historical,
        }
        ChinaMacroCache.set('social_financing', result)
        return result
    except Exception as e:
        print(f"获取社会融资规模失败: {e}")
        return None


def get_china_new_loans() -> Optional[Dict]:
    """新增人民币贷款（东方财富数据源，index 0=最新）"""
    cached = ChinaMacroCache.get('new_loans')
    if cached:
        return cached
    try:
        df = ak.macro_china_new_financial_credit()
        total = min(36, len(df))
        historical = []
        for i in range(total):
            row = df.iloc[i]
            date_str = str(row.iloc[0])
            value = row.iloc[1]
            if pd.isna(value):
                continue
            timestamp = parse_chinese_date(date_str)
            historical.append({
                'timestamp': timestamp.isoformat(),
                'value': float(value)
            })
        historical.sort(key=lambda x: x['timestamp'])
        if not historical:
            return None
        current = historical[-1]
        yoy_val = df.iloc[0].iloc[2]
        yoy = float(yoy_val) if pd.notna(yoy_val) else None
        result = {
            'seriesId': 'NEW_LOANS',
            'name': '新增人民币贷款',
            'value': current['value'],
            'unit': '亿元',
            'timestamp': current['timestamp'],
            'historical': historical,
            'yoyChange': yoy,
        }
        ChinaMacroCache.set('new_loans', result)
        return result
    except Exception as e:
        print(f"获取新增贷款失败: {e}")
        return None


# ============================================================
# 其他指标 — NBS直连
# ============================================================

def get_china_fx_reserves() -> Optional[Dict]:
    """外汇储备 — 使用NBS直连（macro_china_fx_gold）"""
    cached = ChinaMacroCache.get('fx_reserves')
    if cached:
        return cached
    try:
        df = ak.macro_china_fx_gold()
        # 列: [0]月份 [4]外汇储备-绝对值 [5]外汇储备-同比 [6]外汇储备-环比
        # 数据 index 0 = 最旧，index -1 = 最新
        result = _parse_nbs_asc(df, 0, 4, 'FX_RESERVES', '外汇储备', '亿美元', yoy_col=5)
        if result:
            ChinaMacroCache.set('fx_reserves', result)
        return result
    except Exception as e:
        print(f"获取外汇储备数据失败: {e}")
        return None


def get_china_industrial_production() -> Optional[Dict]:
    """规模以上工业增加值同比 — 使用NBS直连（macro_china_gyzjz）"""
    cached = ChinaMacroCache.get('industrial_production')
    if cached:
        return cached
    try:
        df = ak.macro_china_gyzjz()
        # 列: [0]月份 [1]同比增长 [2]累计增长
        # 数据 index 0 = 最旧，index -1 = 最新
        result = _parse_nbs_asc(df, 0, 1, 'INDUSTRIAL_PRODUCTION', '工业增加值同比', '%')
        if result:
            ChinaMacroCache.set('industrial_production', result)
        return result
    except Exception as e:
        print(f"获取工业增加值数据失败: {e}")
        return None


# ============================================================
# 汇总接口
# ============================================================

def get_all_china_macro() -> Dict:
    """获取所有中国宏观经济指标"""
    gdp = get_china_gdp()
    cpi = get_china_cpi()
    ppi = get_china_ppi()
    m2 = get_china_m2()

    # PMI
    pmi_nbs_mfg = get_china_pmi_nbs_mfg()
    pmi_nbs_non_mfg = get_china_pmi_nbs_non_mfg()
    pmi_caixin_mfg = get_china_pmi_caixin_mfg()
    pmi_caixin_services = get_china_pmi_caixin_services()

    # 贸易
    exports_yoy = get_china_exports_yoy()
    imports_yoy = get_china_imports_yoy()
    trade_balance = get_china_trade_balance()

    # 信贷
    social_financing = get_china_social_financing()
    new_loans = get_china_new_loans()

    # 其他
    fx_reserves = get_china_fx_reserves()
    industrial_production = get_china_industrial_production()

    return {
        'gdp': gdp,
        'cpi': cpi,
        'ppi': ppi,
        'm2': m2,
        'pmi': {
            'nbs_mfg': pmi_nbs_mfg,
            'nbs_non_mfg': pmi_nbs_non_mfg,
            'caixin_mfg': pmi_caixin_mfg,
            'caixin_services': pmi_caixin_services,
        },
        'trade': {
            'exports_yoy': exports_yoy,
            'imports_yoy': imports_yoy,
            'trade_balance': trade_balance,
        },
        'credit': {
            'social_financing': social_financing,
            'new_loans': new_loans,
        },
        'other': {
            'fx_reserves': fx_reserves,
            'industrial_production': industrial_production,
        },
    }
