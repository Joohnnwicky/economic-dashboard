"""
金价数据服务 - 多数据源备选，每小时更新一次
"""
import os
import json
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
import httpx

# Alpha Vantage API配置
ALPHA_VANTAGE_API_KEY = os.environ.get('ALPHA_VANTAGE_API_KEY', '2Y0LWU9BXVKNO8G1')
ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query'

# 缓存文件路径 - 使用/app下的cache目录（Docker容器）
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


async def fetch_gold_from_goldapi() -> dict:
    """
    从goldapi.io获取金价（免费层有配额限制，但可作为备选）
    """
    try:
        # goldapi.io免费层
        url = "https://www.goldapi.io/api/XAU/USD"
        headers = {
            "User-Agent": "Mozilla/5.0",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                return {
                    'seriesId': 'GOLD',
                    'name': '国际金价',
                    'value': float(data.get('price', 0)),
                    'unit': 'USD',
                    'timestamp': datetime.now().isoformat(),
                    'historical': [],  # goldapi不提供历史数据
                }
    except Exception as e:
        print(f"goldapi.io获取失败: {e}")
    return None


async def fetch_gold_from_yahoo() -> dict:
    """
    从Yahoo Finance获取金价（无需API key，但数据格式需解析）
    """
    try:
        # Yahoo Finance查询金价XAUUSD=X
        url = "https://query1.finance.yahoo.com/v8/finance/chart/XAUUSD=X"
        params = {
            'interval': '1h',
            'range': '1d',
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code == 200:
                data = response.json()
                result = data.get('chart', {}).get('result', [])
                if result:
                    meta = result[0].get('meta', {})
                    timestamps = result[0].get('timestamp', [])
                    indicators = result[0].get('indicators', {}).get('quote', [])

                    if indicators and timestamps:
                        closes = indicators[0].get('close', [])
                        historical = []
                        for i, ts in enumerate(timestamps):
                            if i < len(closes) and closes[i] is not None:
                                historical.append({
                                    'timestamp': datetime.fromtimestamp(ts).isoformat(),
                                    'value': float(closes[i]),
                                })

                        latest_price = meta.get('regularMarketPrice', closes[-1] if closes else 0)

                        return {
                            'seriesId': 'GOLD',
                            'name': '国际金价',
                            'value': float(latest_price) if latest_price else 0,
                            'unit': 'USD',
                            'timestamp': datetime.now().isoformat(),
                            'historical': historical,
                        }
    except Exception as e:
        print(f"Yahoo Finance获取失败: {e}")
    return None


async def fetch_gold_from_tradingeconomics() -> dict:
    """
    从Trading Economics网页获取金价（无需API，但需解析HTML）
    """
    try:
        url = "https://tradingeconomics.com/commodity/gold"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                # 简单解析价格（从页面中提取）
                import re
                text = response.text
                # 寻找价格模式
                match = re.search(r'Gold\s*[\d,]+\.\d+', text)
                if match:
                    price_str = match.group(0).replace('Gold', '').replace(',', '')
                    price = float(price_str.strip())
                    return {
                        'seriesId': 'GOLD',
                        'name': '国际金价',
                        'value': price,
                        'unit': 'USD',
                        'timestamp': datetime.now().isoformat(),
                        'historical': [],
                    }
    except Exception as e:
        print(f"Trading Economics获取失败: {e}")
    return None


async def fetch_gold_price_from_api() -> dict:
    """
    从多个数据源获取金价，按优先级尝试
    """
    # 优先级1: Yahoo Finance（免费，无需API key）
    data = await fetch_gold_from_yahoo()
    if data and data['value'] > 0:
        print(f"从Yahoo Finance获取金价成功: ${data['value']:.2f}")
        return data

    # 优先级2: Trading Economics
    data = await fetch_gold_from_tradingeconomics()
    if data and data['value'] > 0:
        print(f"从Trading Economics获取金价成功: ${data['value']:.2f}")
        return data

    # 优先级3: Alpha Vantage（有配额限制）
    try:
        params = {
            'function': 'FX_DAILY',
            'from_symbol': 'XAU',
            'to_symbol': 'USD',
            'apikey': ALPHA_VANTAGE_API_KEY,
            'outputsize': 'compact',
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(ALPHA_VANTAGE_URL, params=params)
            data_json = response.json()

            if 'Time Series FX (Daily)' in data_json:
                ts_data = data_json['Time Series FX (Daily)']
                historical = []
                for date, values in sorted(ts_data.items(), reverse=True)[:30]:
                    historical.append({
                        'timestamp': f"{date}T00:00:00",
                        'value': float(values['4. close']),
                    })
                historical.reverse()
                latest = historical[-1] if historical else None

                print(f"从Alpha Vantage获取金价成功: ${latest['value'] if latest else 0:.2f}")
                return {
                    'seriesId': 'GOLD',
                    'name': '国际金价',
                    'value': latest['value'] if latest else 0,
                    'unit': 'USD',
                    'timestamp': latest['timestamp'] if latest else datetime.now().isoformat(),
                    'historical': historical,
                }
    except Exception as e:
        print(f"Alpha Vantage获取失败: {e}")

    # 所有数据源都失败
    raise ValueError("所有金价数据源均获取失败")


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
    """
    data = get_cached_gold_price()

    if data is None or GoldPriceCache.is_expired():
        # 缓存过期，触发后台更新
        asyncio.create_task(update_gold_price_cache())

    if data:
        return data

    # 没有缓存数据，立即尝试获取
    data = await fetch_gold_price_from_api()
    if data:
        GoldPriceCache.data = data
        GoldPriceCache.last_update = datetime.now()
        GoldPriceCache.save_to_file()
        return data

    return {
        'seriesId': 'GOLD',
        'name': '国际金价',
        'value': 0,
        'unit': 'USD',
        'timestamp': datetime.now().isoformat(),
        'historical': [],
        'error': '金价数据暂时不可用，请稍后刷新',
    }