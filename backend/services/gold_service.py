"""
金价数据服务 - 使用FRED LBMA Gold Price数据
"""
import os
import json
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
import httpx

# FRED API配置
FRED_API_KEY = os.environ.get('FRED_API_KEY', '')
FRED_GOLD_SERIES = 'GOLDAMGBD228NLBM'  # LBMA Gold Price AM Fix ($/oz)
FRED_URL = 'https://api.stlouisfed.org/fred/series/observations'

# 缓存文件路径
CACHE_DIR = Path('/app/cache')
CACHE_FILE = CACHE_DIR / 'gold_price.json'

# 缓存数据结构
class GoldPriceCache:
    data: dict = None
    last_update: datetime = None

    @classmethod
    def is_expired(cls) -> bool:
        """检查缓存是否过期（超过1小时）"""
        if cls.last_update is None:
            return True
        elapsed = datetime.now() - cls.last_update
        return elapsed.total_seconds() >= 3600

    @classmethod
    def load_from_file(cls):
        """从文件加载缓存"""
        if CACHE_FILE.exists():
            try:
                with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                    cached = json.load(f)
                    cls.data = cached.get('data')
                    cls.last_update = datetime.fromisoformat(cached.get('last_update', ''))
                    print(f"从文件加载金价缓存: ${cls.data.get('value', 0) if cls.data else 0}")
            except Exception as e:
                print(f"加载金价缓存失败: {e}")

    @classmethod
    def save_to_file(cls):
        """保存缓存到文件"""
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        try:
            with open(CACHE_FILE, 'w', encoding='utf-8') as f:
                json.dump({
                    'data': cls.data,
                    'last_update': cls.last_update.isoformat() if cls.last_update else None,
                }, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"保存金价缓存失败: {e}")


async def fetch_gold_price_from_api() -> dict:
    """
    从FRED获取LBMA金价数据
    """
    if not FRED_API_KEY:
        raise ValueError("FRED_API_KEY环境变量未设置")

    # 获取最近30天的金价数据
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    params = {
        'series_id': FRED_GOLD_SERIES,
        'api_key': FRED_API_KEY,
        'file_type': 'json',
        'observation_start': start_date,
        'observation_end': end_date,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(FRED_URL, params=params)
        data = response.json()

        if 'observations' not in data:
            raise ValueError(f"FRED API返回错误: {data.get('error', 'unknown')}")

        observations = data['observations']
        historical = []

        for obs in observations:
            if obs['value'] != '.':
                historical.append({
                    'timestamp': f"{obs['date']}T00:00:00",
                    'value': float(obs['value']),
                })

        if not historical:
            raise ValueError("FRED金价数据为空")

        latest = historical[-1]
        previous = historical[-2] if len(historical) > 1 else None

        change = None
        if previous and previous['value'] > 0:
            change_value = latest['value'] - previous['value']
            change_pct = (change_value / previous['value']) * 100
            change = {
                'value': change_value,
                'percentage': change_pct,
            }

        print(f"从FRED获取金价成功: ${latest['value']:.2f}")

        return {
            'seriesId': 'GOLDAMGBD228NLBM',
            'name': '国际金价（LBMA Gold Price AM Fix）',
            'value': latest['value'],
            'unit': 'USD/oz',
            'timestamp': latest['timestamp'],
            'change': change,
            'historical': historical,
            'source': 'FRED',
        }


async def update_gold_price_cache():
    """
    更新金价缓存（每小时调用一次）
    """
    try:
        data = await fetch_gold_price_from_api()
        GoldPriceCache.data = data
        GoldPriceCache.last_update = datetime.now()
        GoldPriceCache.save_to_file()
        print(f"[{datetime.now().isoformat()}] 金价缓存已更新: ${data['value']:.2f}")
        return data
    except Exception as e:
        print(f"更新金价缓存失败: {e}")
        return None


def get_cached_gold_price() -> dict:
    """
    获取缓存的金价数据
    """
    if GoldPriceCache.data is None:
        GoldPriceCache.load_from_file()

    return GoldPriceCache.data


async def get_gold_price() -> dict:
    """
    获取金价数据（优先返回缓存，缓存过期时触发异步更新）
    如果API失败，返回fallback数据
    """
    data = get_cached_gold_price()

    if data is None or GoldPriceCache.is_expired():
        # 缓存过期，触发后台更新
        asyncio.create_task(update_gold_price_cache())

    if data:
        return data

    # 没有缓存数据，尝试获取
    try:
        data = await fetch_gold_price_from_api()
        if data:
            GoldPriceCache.data = data
            GoldPriceCache.last_update = datetime.now()
            GoldPriceCache.save_to_file()
            return data
    except Exception as e:
        print(f"获取金价失败: {e}")

    # Fallback: 返回最近金价参考值（2024年6月金价约$2300）
    # 用户可手动刷新等待API恢复
    fallback_value = 2300.0
    return {
        'seriesId': 'GOLD_FALLBACK',
        'name': '国际金价（参考值）',
        'value': fallback_value,
        'unit': 'USD/oz',
        'timestamp': datetime.now().isoformat(),
        'change': None,
        'historical': [],
        'source': 'fallback',
        'warning': '金价API暂时不可用（FRED序列已弃用），显示参考值。请稍后刷新或检查API配置。',
    }