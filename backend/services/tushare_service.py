"""
Tushare Pro 数据服务 - 中国宏观经济结构化数据

作为 AkShare 的优先数据源（官方 JSON 接口，稳定、无网页解析），
失败时由调用方回退到 AkShare。

接口: POST http://api.tushare.pro {"api_name", "token", "params", "fields"}
数据默认从新到旧排列（index 0 = 最新）。
"""
import time
from datetime import datetime, timedelta

import httpx
from typing import Dict, List, Optional

from config.api_keys import APIConfig


def _call(api_name: str, params: Optional[Dict] = None, fields: str = '') -> List[Dict]:
    """调用 Tushare 接口，返回 dict 列表。失败抛异常由调用方回退。"""
    if not APIConfig.TUSHARE_TOKEN:
        raise RuntimeError('TUSHARE_TOKEN 未配置')
    payload = {
        'api_name': api_name,
        'token': APIConfig.TUSHARE_TOKEN,
        'params': params or {},
        'fields': fields,
    }
    with httpx.Client(timeout=15) as client:
        resp = client.post(APIConfig.TUSHARE_BASE_URL, json=payload)
        body = resp.json()
    if body.get('code') != 0:
        raise RuntimeError(f"Tushare {api_name} 错误: {body.get('msg')}")
    data = body.get('data') or {}
    cols = data.get('fields') or []
    return [dict(zip(cols, row)) for row in (data.get('items') or [])]


def _month_ts(month: str) -> Optional[str]:
    """'202607' -> '2026-07-01T00:00:00'"""
    if not (isinstance(month, str) and len(month) == 6 and month.isdigit()):
        return None
    return f"{month[:4]}-{month[4:6]}-01T00:00:00"


def _quarter_ts(quarter: str) -> Optional[str]:
    """'2026Q2' -> '2026-06-01T00:00:00'（季度末月）"""
    if not (isinstance(quarter, str) and len(quarter) == 6 and quarter[4] == 'Q'):
        return None
    month = int(quarter[5]) * 3
    if not 1 <= month <= 12:
        return None
    return f"{quarter[:4]}-{month:02d}-01T00:00:00"


def build_series(rows: List[Dict], date_field: str, date_kind: str,
                 value_field: str, series_id: str, name: str, unit: str,
                 max_points: int = 36, yoy_field: Optional[str] = None) -> Optional[Dict]:
    """
    将 Tushare 行数据（从新到旧）转为看板统一序列格式。

    date_kind: 'month' 或 'quarter'
    返回结构与 china_macro_service 的 AkShare 结果一致。
    """
    to_ts = _month_ts if date_kind == 'month' else _quarter_ts
    historical = []
    for row in rows[:max_points]:
        value = row.get(value_field)
        if value is None:
            continue
        ts = to_ts(str(row.get(date_field, '')))
        if ts is None:
            continue
        historical.append({'timestamp': ts, 'value': float(value)})
    if not historical:
        return None
    historical.reverse()  # 转为时间正序

    current = historical[-1]
    result = {
        'seriesId': series_id,
        'name': name,
        'value': current['value'],
        'unit': unit,
        'timestamp': current['timestamp'],
        'historical': historical,
    }
    if yoy_field is not None:
        yoy = rows[0].get(yoy_field)
        result['yoyChange'] = float(yoy) if yoy is not None else None
    return result


# ============================================================
# 中国宏观指标（与 AkShare 同名字段对齐）
# ============================================================

def get_gdp() -> Optional[Dict]:
    """GDP 同比增速（季度）。quarter/gdp_yoy"""
    return build_series(
        _call('cn_gdp'), 'quarter', 'quarter', 'gdp_yoy',
        'GDP', '中国GDP同比增速', '%', max_points=12,
    )


def get_cpi() -> Optional[Dict]:
    """CPI 全国同比（月度）。month/nt_yoy"""
    return build_series(
        _call('cn_cpi'), 'month', 'month', 'nt_yoy',
        'CPI', '中国CPI同比', '%', max_points=24,
    )


def get_ppi() -> Optional[Dict]:
    """PPI 同比（月度）。month/ppi_yoy"""
    return build_series(
        _call('cn_ppi'), 'month', 'month', 'ppi_yoy',
        'PPI', '中国PPI同比', '%', max_points=24,
    )


def get_m2() -> Optional[Dict]:
    """M2 货币供应量（月度，亿元）。month/m2 + m2_yoy"""
    return build_series(
        _call('cn_m'), 'month', 'month', 'm2',
        'M2', '中国M2货币供应量', '亿元', max_points=24, yoy_field='m2_yoy',
    )


def get_pmi_manufacturing() -> Optional[Dict]:
    """官方制造业PMI（月度）。MONTH/PMI010000"""
    return build_series(
        _call('cn_pmi'), 'MONTH', 'month', 'PMI010000',
        'PMI_NBS_MFG', '官方制造业PMI', '', max_points=36,
    )


def get_pmi_non_manufacturing() -> Optional[Dict]:
    """官方非制造业PMI（月度）。MONTH/PMI020100"""
    return build_series(
        _call('cn_pmi'), 'MONTH', 'month', 'PMI020100',
        'PMI_NBS_NON_MFG', '官方非制造业PMI', '', max_points=36,
    )


# ============================================================
# A股扩展（自选股雷达 / 中国利率 / 两融 / 行业指数）
# 各接口依赖 Tushare 积分权限；无权限或失败的模块记录在
# result['errors'] 中，前端分区降级展示，不影响其他模块。
# ============================================================

_CACHE: Dict[str, tuple] = {}


def _cached(key: str, ttl_seconds: int, fn):
    """简单 TTL 缓存：命中返回缓存值，否则执行 fn() 并缓存非空结果。"""
    hit = _CACHE.get(key)
    now = time.monotonic()
    if hit is not None and (now - hit[0]) < ttl_seconds:
        return hit[1]
    data = fn()
    if data is not None:
        _CACHE[key] = (now, data)
    return data


def to_ts_code(code: str) -> str:
    """6位代码 -> Tushare ts_code：6/9/5开头.SH，8/4开头.BJ，其余.SZ"""
    code = str(code).strip().upper()
    if '.' in code:
        return code
    if code.startswith(('6', '9', '5')):
        return f"{code}.SH"
    if code.startswith(('8', '4')):
        return f"{code}.BJ"
    return f"{code}.SZ"


def _date_ts(value) -> Optional[str]:
    """'20260902' / '2026-09-02' -> '2026-09-02T00:00:00'"""
    s = str(value or '').strip().replace('-', '').replace('/', '')
    if len(s) != 8 or not s.isdigit():
        return None
    return f"{s[:4]}-{s[4:6]}-{s[6:8]}T00:00:00"


def _rows_to_series(rows: List[Dict], date_field: str, value_field: str,
                    series_id: str, name: str, unit: str,
                    max_points: int = 60) -> Optional[Dict]:
    """任意行数据 -> 看板统一序列格式（时间正序，截取最近 max_points 个点）。"""
    pts = []
    for row in rows:
        value = row.get(value_field)
        ts = _date_ts(row.get(date_field))
        if value is None or ts is None:
            continue
        pts.append({'timestamp': ts, 'value': float(value)})
    if not pts:
        return None
    pts.sort(key=lambda p: p['timestamp'])
    pts = pts[-max_points:]
    return {
        'seriesId': series_id,
        'name': name,
        'value': pts[-1]['value'],
        'unit': unit,
        'timestamp': pts[-1]['timestamp'],
        'historical': pts,
    }


# ------------------------------------------------------------
# 自选股雷达：估值 + 财务 + 风险事件（质押/解禁/大宗/龙虎榜）
# ------------------------------------------------------------

def _fetch_valuation(ts_code: str) -> Optional[Dict]:
    """daily_basic 最新估值：PE(TTM)/PB/换手率/量比/市值"""
    rows = _call('daily_basic', {'ts_code': ts_code},
                 'trade_date,close,turnover_rate,volume_ratio,pe_ttm,pb,total_mv,circ_mv')
    if not rows:
        return None
    r = rows[0]
    return {
        'tradeDate': _date_ts(r.get('trade_date')),
        'close': r.get('close'),
        'peTtm': r.get('pe_ttm'),
        'pb': r.get('pb'),
        'turnoverRate': r.get('turnover_rate'),
        'volumeRatio': r.get('volume_ratio'),
        'totalMv': (float(r['total_mv']) / 1e4) if r.get('total_mv') is not None else None,   # 万元 -> 亿元
        'circMv': (float(r['circ_mv']) / 1e4) if r.get('circ_mv') is not None else None,
    }


def _fetch_finance(ts_code: str) -> Optional[Dict]:
    """fina_indicator 最新一期财务指标"""
    rows = _call('fina_indicator', {'ts_code': ts_code},
                 'end_date,eps,roe,grossprofit_margin,debt_to_assets,netprofit_yoy,or_yoy')
    if not rows:
        return None
    rows = sorted(rows, key=lambda r: str(r.get('end_date', '')), reverse=True)
    r = rows[0]
    return {
        'endDate': _date_ts(r.get('end_date')),
        'eps': r.get('eps'),
        'roe': r.get('roe'),
        'grossMargin': r.get('grossprofit_margin'),
        'debtRatio': r.get('debt_to_assets'),
        'netProfitYoy': r.get('netprofit_yoy'),
        'revenueYoy': r.get('or_yoy'),
    }


def _fetch_pledge(ts_code: str) -> Optional[float]:
    """pledge_stat 最新股权质押比例(%)"""
    rows = _call('pledge_stat', {'ts_code': ts_code}, 'end_date,pledge_ratio')
    if not rows:
        return None
    rows = sorted(rows, key=lambda r: str(r.get('end_date', '')), reverse=True)
    ratio = rows[0].get('pledge_ratio')
    return float(ratio) if ratio is not None else None


def _fetch_upcoming_floats(ts_code: str, limit: int = 3) -> List[Dict]:
    """share_float 未来的限售解禁（按日期升序）"""
    rows = _call('share_float', {'ts_code': ts_code}, 'float_date,float_share,float_ratio')
    today = datetime.now().strftime('%Y%m%d')
    upcoming = []
    for r in rows:
        raw = str(r.get('float_date') or '').replace('-', '')
        if raw and raw >= today:
            shares = r.get('float_share')
            ratio = r.get('float_ratio')
            upcoming.append({
                'date': _date_ts(raw),
                'shares': float(shares) if shares is not None else None,   # 万股
                'ratio': float(ratio) if ratio is not None else None,      # 占总股本 %
            })
    # 同日多条解禁记录（不同股份类型）按日期去重，保留占比最大的一条
    by_date: Dict[str, Dict] = {}
    for item in upcoming:
        key = str(item['date'])
        if key not in by_date or (item['ratio'] or 0) > (by_date[key]['ratio'] or 0):
            by_date[key] = item
    upcoming = sorted(by_date.values(), key=lambda x: str(x['date']))
    return upcoming[:limit]


def _fetch_block_trades(ts_code: str, limit: int = 5) -> List[Dict]:
    """block_trade 近期大宗交易（按日期倒序）"""
    rows = _call('block_trade', {'ts_code': ts_code}, 'trade_date,price,vol,amount')
    items = []
    for r in rows:
        ts = _date_ts(r.get('trade_date'))
        if ts is None:
            continue
        amount = r.get('amount')
        items.append({
            'date': ts,
            'price': r.get('price'),
            'amount': (float(amount) / 1e4) if amount is not None else None,  # 万元 -> 亿元
        })
    items.sort(key=lambda x: str(x['date']), reverse=True)
    return items[:limit]


def build_a_share_radar(codes: List[str]) -> Dict:
    """
    自选股雷达汇总。返回:
    {stocks: [{code, tsCode, valuation, finance, risks}], errors: {模块: 错误信息}}
    """
    if not APIConfig.TUSHARE_TOKEN:
        return {'stocks': [], 'errors': {'tushare': 'TUSHARE_TOKEN 未配置'}}

    key = 'radar:' + ','.join(sorted(codes))
    return _cached(key, 1800, lambda: _build_a_share_radar_uncached(codes))


def _recent_open_dates(days: int) -> List[str]:
    """近 N 个交易日（YYYYMMDD，升序）。交易日历优先，失败按自然日近似。"""
    try:
        end = datetime.now().strftime('%Y%m%d')
        start = (datetime.now() - timedelta(days=days * 2 + 10)).strftime('%Y%m%d')
        rows = _call('trade_cal', {'start_date': start, 'end_date': end, 'is_open': '1'}, 'cal_date')
        dates = sorted(str(r['cal_date']).replace('-', '') for r in rows if r.get('cal_date'))
        if dates:
            return dates[-days:]
    except Exception:
        pass
    dates = []
    d = datetime.now()
    while len(dates) < days:
        if d.weekday() < 5:
            dates.append(d.strftime('%Y%m%d'))
        d -= timedelta(days=1)
    return sorted(dates)


def _fetch_dragon_tiger(ts_set: set, days: int = 10) -> Dict:
    """
    近 N 个交易日龙虎榜命中。top_list 必须按 trade_date 逐日查询；
    仅首个交易日失败时报错（多为权限问题），其余日跳过。缓存6小时。
    返回 {hits: {ts_code: [事件]}, error: Optional[str]}
    """
    def uncached():
        hits: Dict[str, List[Dict]] = {}
        first_err: Optional[str] = None
        for td in _recent_open_dates(days):
            try:
                rows = _call('top_list', {'trade_date': td},
                             'ts_code,trade_date,reason,net_amount,pct_change')
            except Exception as e:
                if first_err is None:
                    first_err = str(e)
                    break  # 第一天就失败多为无权限，无需继续
                continue
            for r in rows:
                ts = r.get('ts_code')
                if ts in ts_set:
                    netbuy = r.get('net_amount')
                    pct = r.get('pct_change')
                    hits.setdefault(ts, []).append({
                        'date': _date_ts(r.get('trade_date')),
                        'reason': r.get('reason'),
                        'netbuy': (float(netbuy) / 1e8) if netbuy is not None else None,  # 元 -> 亿元
                        'pctChange': float(pct) if pct is not None else None,  # 上榜当日涨跌幅 %
                    })
        return {'hits': hits, 'error': first_err}

    key = f"dragon_tiger:{','.join(sorted(ts_set))}:{datetime.now().strftime('%Y%m%d')}"
    return _cached(key, 21600, uncached)


def _build_a_share_radar_uncached(codes: List[str]) -> Dict:
    errors: Dict[str, str] = {}
    stocks = []
    for code in codes:
        ts_code = to_ts_code(code)
        item: Dict = {
            'code': code,
            'tsCode': ts_code,
            'valuation': None,
            'finance': None,
            'risks': {
                'pledgeRatio': None,
                'upcomingFloats': [],
                'recentBlocks': [],
                'dragonTiger': [],
            },
        }
        try:
            item['valuation'] = _fetch_valuation(ts_code)
        except Exception as e:
            errors.setdefault('daily_basic', str(e))
        try:
            item['finance'] = _fetch_finance(ts_code)
        except Exception as e:
            errors.setdefault('fina_indicator', str(e))
        try:
            item['risks']['pledgeRatio'] = _fetch_pledge(ts_code)
        except Exception as e:
            errors.setdefault('pledge_stat', str(e))
        try:
            item['risks']['upcomingFloats'] = _fetch_upcoming_floats(ts_code)
        except Exception as e:
            errors.setdefault('share_float', str(e))
        try:
            item['risks']['recentBlocks'] = _fetch_block_trades(ts_code)
        except Exception as e:
            errors.setdefault('block_trade', str(e))
        stocks.append(item)

    # 龙虎榜：按交易日逐日拉取（top_list 必填 trade_date），筛出自选股命中
    dragon = _fetch_dragon_tiger({s['tsCode'] for s in stocks})
    if dragon['error']:
        errors.setdefault('top_list', dragon['error'])
    for s in stocks:
        s['risks']['dragonTiger'] = sorted(
            dragon['hits'].get(s['tsCode'], []),
            key=lambda x: str(x['date']), reverse=True,
        )[:5]

    return {'stocks': stocks, 'errors': errors}


# ------------------------------------------------------------
# 中国利率：SHIBOR 各期限 + LPR
# ------------------------------------------------------------

def build_china_rates() -> Dict:
    """返回 {series: {SHIBOR_ON/SHIBOR_3M/SHIBOR_1Y/LPR_1Y/LPR_5Y: 序列}, errors}"""
    if not APIConfig.TUSHARE_TOKEN:
        return {'series': {}, 'errors': {'tushare': 'TUSHARE_TOKEN 未配置'}}

    def uncached():
        series: Dict[str, Dict] = {}
        errors: Dict[str, str] = {}
        end = datetime.now().strftime('%Y%m%d')
        start_1y = (datetime.now() - timedelta(days=400)).strftime('%Y%m%d')
        try:
            rows = _call('shibor', {'start_date': start_1y, 'end_date': end},
                         'date,on,1w,1m,3m,6m,1y')
            for field, sid, name in (
                ('on', 'SHIBOR_ON', 'SHIBOR隔夜'),
                ('3m', 'SHIBOR_3M', 'SHIBOR 3月'),
                ('1y', 'SHIBOR_1Y', 'SHIBOR 1年'),
            ):
                s = _rows_to_series(rows, 'date', field, sid, name, '%', max_points=260)
                if s:
                    series[sid] = s
        except Exception as e:
            errors['shibor'] = str(e)
        try:
            # Tushare Pro 无 LPR 接口，改用 AkShare（中国货币网数据）
            import akshare as ak
            df = ak.macro_china_lpr()
            rows = df.to_dict('records')
            for field, sid, name in (
                ('LPR1Y', 'LPR_1Y', 'LPR 1年期'),
                ('LPR5Y', 'LPR_5Y', 'LPR 5年期'),
            ):
                s = _rows_to_series(rows, 'TRADE_DATE', field, sid, name, '%', max_points=120)
                if s:
                    series[sid] = s
        except Exception as e:
            errors['lpr'] = str(e)
        return {'series': series, 'errors': errors}

    return _cached('china_rates', 21600, uncached)


# ------------------------------------------------------------
# 两融余额（沪深合计）
# ------------------------------------------------------------

def build_a_share_margin(days: int = 120) -> Dict:
    """融资融券余额（亿元），SSE+SZSE 按日加总。返回 {series, errors}"""
    if not APIConfig.TUSHARE_TOKEN:
        return {'series': None, 'errors': {'tushare': 'TUSHARE_TOKEN 未配置'}}

    def uncached():
        merged: Dict[str, float] = {}
        errors: Dict[str, str] = {}
        end = datetime.now().strftime('%Y%m%d')
        start = (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')
        for ex in ('SSE', 'SZSE'):
            try:
                rows = _call('margin', {'exchange': ex, 'start_date': start, 'end_date': end},
                             'trade_date,rzrqye')
                for r in rows:
                    ts = _date_ts(r.get('trade_date'))
                    v = r.get('rzrqye')
                    if ts is None or v is None:
                        continue
                    merged[ts] = merged.get(ts, 0.0) + float(v) / 1e8  # 元 -> 亿元
            except Exception as e:
                errors[ex] = str(e)
        pts = [{'timestamp': ts, 'value': v} for ts, v in merged.items()]
        pts.sort(key=lambda p: p['timestamp'])
        series = None
        if pts:
            series = {
                'seriesId': 'A_SHARE_MARGIN',
                'name': '沪深两融余额',
                'value': pts[-1]['value'],
                'unit': '亿元',
                'timestamp': pts[-1]['timestamp'],
                'historical': pts,
            }
        return {'series': series, 'errors': errors}

    return _cached('a_share_margin', 21600, uncached)


# ------------------------------------------------------------
# 军工行业指数：中证军工(399967) × 上证指数(000001.SH)
# ------------------------------------------------------------

def build_defense_sector(days: int = 400) -> Dict:
    """返回 {series: {CSI_DEFENSE, SSE_COMP: 序列(含 pctChange)}, errors}"""
    if not APIConfig.TUSHARE_TOKEN:
        return {'series': {}, 'errors': {'tushare': 'TUSHARE_TOKEN 未配置'}}

    def uncached():
        series: Dict[str, Dict] = {}
        errors: Dict[str, str] = {}
        start = (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')
        for ts_code, sid, name in (
            ('399967.SZ', 'CSI_DEFENSE', '中证军工指数'),
            ('000001.SH', 'SSE_COMP', '上证指数'),
        ):
            try:
                rows = _call('index_daily', {'ts_code': ts_code, 'start_date': start},
                             'trade_date,close,pct_chg')
                s = _rows_to_series(rows, 'trade_date', 'close', sid, name, '点', max_points=260)
                if s:
                    latest_pct = next(
                        (r.get('pct_chg') for r in rows
                         if _date_ts(r.get('trade_date')) == s['timestamp']),
                        None,
                    )
                    s['pctChange'] = float(latest_pct) if latest_pct is not None else None
                    series[sid] = s
            except Exception as e:
                errors[ts_code] = str(e)
        return {'series': series, 'errors': errors}

    return _cached('defense_sector', 3600, uncached)
