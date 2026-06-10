"""
中国城镇调查失业率数据服务
主数据源: 静态JSON文件（手动维护）
备选数据源: 东方财富网页爬虫（可能失败）
"""
import json
import os
from typing import Dict, Optional
from datetime import datetime
import requests


STATIC_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'data', 'china-unemployment.json')


def get_china_unemployment() -> Optional[Dict]:
    """
    获取中国城镇调查失业率
    优先尝试东方财富爬虫，失败则降级到静态JSON
    """
    # 先尝试爬虫
    result = _scrape_eastmoney()
    if result:
        return result

    # 降级到静态JSON
    return _load_static_json()


def _scrape_eastmoney() -> Optional[Dict]:
    """尝试从东方财富爬取失业率数据"""
    try:
        url = 'https://data.eastmoney.com/cjsj/yzsjyz.html'
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code != 200:
            return None

        # 东方财富页面数据可能通过JS动态加载，HTML中可能没有数据
        # 如果页面有数据表格，解析之；否则返回None
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, 'html.parser')

        # 尝试找到数据表格
        tables = soup.find_all('table')
        if not tables:
            return None

        # 解析第一个表格的数据
        historical = []
        for table in tables[:1]:
            rows = table.find_all('tr')
            for row in rows[1:]:  # 跳过表头
                cells = row.find_all('td')
                if len(cells) >= 2:
                    try:
                        date_str = cells[0].get_text(strip=True)
                        value_str = cells[1].get_text(strip=True)
                        # 解析日期
                        timestamp = _parse_date(date_str)
                        value = float(value_str)
                        historical.append({
                            'timestamp': timestamp.isoformat(),
                            'value': value
                        })
                    except (ValueError, IndexError):
                        continue

        if not historical:
            return None

        historical.sort(key=lambda x: x['timestamp'])
        current = historical[-1]
        return {
            'seriesId': 'UNEMPLOYMENT',
            'name': '城镇调查失业率',
            'value': current['value'],
            'unit': '%',
            'timestamp': current['timestamp'],
            'historical': historical,
            'source': 'eastmoney',
        }
    except Exception as e:
        print(f"爬取东方财富失业率数据失败: {e}")
        return None


def _load_static_json() -> Optional[Dict]:
    """从静态JSON文件加载失业率数据"""
    try:
        # 尝试多个路径
        paths = [
            STATIC_DATA_PATH,
            os.path.join('public', 'data', 'china-unemployment.json'),
        ]
        data = None
        for path in paths:
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                break

        if not data:
            return None

        historical = []
        for item in data:
            timestamp = _parse_date(item['date'])
            historical.append({
                'timestamp': timestamp.isoformat(),
                'value': float(item['value'])
            })

        historical.sort(key=lambda x: x['timestamp'])
        if not historical:
            return None

        current = historical[-1]
        return {
            'seriesId': 'UNEMPLOYMENT',
            'name': '城镇调查失业率',
            'value': current['value'],
            'unit': '%',
            'timestamp': current['timestamp'],
            'historical': historical,
            'source': 'static_json',
        }
    except Exception as e:
        print(f"加载静态失业率数据失败: {e}")
        return None


def _parse_date(date_str: str) -> datetime:
    """解析日期字符串"""
    try:
        # "2026-04-01" or "2026-4"
        if '-' in date_str:
            parts = date_str.split('-')
            return datetime(int(parts[0]), int(parts[1]), 1)
        if '.' in date_str:
            parts = date_str.split('.')
            return datetime(int(parts[0]), int(parts[1]), 1)
        if '年' in str(date_str) and '月' in str(date_str):
            import re
            match = re.match(r'(\d{4})年(\d{1,2})月', str(date_str))
            if match:
                return datetime(int(match.group(1)), int(match.group(2)), 1)
    except:
        pass
    return datetime.now()
