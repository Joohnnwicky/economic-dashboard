"""
中国房价数据服务 - 双轨制数据采集

1. 全国排行: www.creprice.cn 排名 API（JSON，可靠快速）
2. 城市详情: m.creprice.cn 城市页 HTML（备用，443 从此网络间歇性连通）
3. 增量合并: 新旧数据合并，失败城市保留旧缓存
"""
import subprocess
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
from datetime import datetime
import re
import json
import os
import time
import random
import urllib.request

# 缓存文件路径
CACHE_FILE = "housing_price_cache.json"
CACHE_EXPIRE_HOURS = 24  # 每日更新一次

# 城市详情爬取配置（m.creprice.cn 备用通道）
CITY_SCRAPE_ENABLED = True  # 设为 False 可跳过所有城市详情爬取
MAX_RETRIES = 2
RETRY_BACKOFF = 5
CITY_DELAY = 20
CITY_DELAY_JITTER = 5

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

# 全国排行 API (www.creprice.cn — 可靠)
RANKING_API = 'https://www.creprice.cn/rank/priceRank1.html?do=getList&parms='

# creprice.cn 真实 IP（通过 DoH 解析，用于 m.creprice.cn 备用通道）
CREPRICE_REAL_IP = None
CREPRICE_IP_TTL = 0


# ──────────────────────────────────────────────
# 全国排行 API（主要通道：www.creprice.cn）
# ──────────────────────────────────────────────

def fetch_national_ranking() -> List[Dict]:
    """
    从 www.creprice.cn 排名 API 获取全国房价排行（JSON）。
    免费返回 TOP 10，可靠且快速。
    """
    try:
        req = urllib.request.Request(RANKING_API, headers={
            'User-Agent': USER_AGENT,
            'Referer': 'https://www.creprice.cn/rankprice/sale/11.html',
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())

        rows = data.get('rows', [])
        results = []
        for i, row in enumerate(rows):
            results.append({
                'rank': i + 1,
                'city': row.get('cityName', ''),
                'province': row.get('provinceName', ''),
                'price': row.get('unitPrice'),
                'change': row.get('priceLink'),  # 环比
                'unit': '元/㎡',
            })
        print(f"  [API] 全国排行: {len(results)} 城 (共 {data.get('itemCount', '?')} 城)")
        return results
    except Exception as e:
        print(f"  [API] 全国排行获取失败: {e}")
        return []


# ──────────────────────────────────────────────
# 城市详情（备用通道：m.creprice.cn HTML 抓取）
# ──────────────────────────────────────────────

def _resolve_creprice_ip() -> str:
    """通过 DoH 解析 m.creprice.cn 真实 IP（绕过 OpenClash fake-IP）。"""
    global CREPRICE_REAL_IP, CREPRICE_IP_TTL
    now = time.time()
    if CREPRICE_REAL_IP and now < CREPRICE_IP_TTL:
        return CREPRICE_REAL_IP

    doh_urls = [
        'https://cloudflare-dns.com/dns-query?name=m.creprice.cn&type=A',
        'https://dns.google/resolve?name=m.creprice.cn&type=A',
    ]
    for doh_url in doh_urls:
        try:
            req = urllib.request.Request(doh_url, headers={'Accept': 'application/dns-json'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
            for a in data.get('Answer', []):
                ip = a.get('data', '')
                if ip and re.match(r'^\d+\.\d+\.\d+\.\d+$', ip) and not ip.startswith('198.18.'):
                    CREPRICE_REAL_IP = ip
                    CREPRICE_IP_TTL = now + min(a.get('TTL', 300), 3600)
                    return ip
        except Exception as e:
            print(f"  [DoH] {doh_url[:40]} 失败: {e}")
            continue

    fallback = '119.167.218.198'
    print(f"  [DoH] 全部失败，兜底 IP: {fallback}")
    return fallback


def _curl_get(url: str, timeout: int = 15) -> str:
    """curl 子进程获取 URL（绕过 DNS 劫持 + TLS 指纹检测）。"""
    from urllib.parse import urlparse
    parsed = urlparse(url)
    hostname = parsed.hostname
    real_ip = _resolve_creprice_ip()
    resolve_arg = f'{hostname}:443:{real_ip}'

    cmd = [
        'curl', '-sS', '--resolve', resolve_arg, '-m', str(timeout),
        '-H', f'User-Agent: {USER_AGENT}',
        '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        '-H', 'Accept-Language: zh-CN,zh;q=0.9',
        url,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
    if result.returncode != 0:
        raise Exception(f'curl exit {result.returncode}: {result.stderr[:200]}')
    return result.stdout


def _robust_get(url: str, timeout: int = 15) -> str:
    """带重试的 HTTP GET。"""
    last_error = None
    short = url.split('/')[-1] if '/' in url else url[-40:]
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            html = _curl_get(url, timeout)
            if html and len(html) > 200:
                return html
            raise Exception(f'响应太短 ({len(html)} chars)')
        except Exception as e:
            last_error = e
            print(f"  [{short}] 失败 (attempt {attempt}/{MAX_RETRIES}): {e}")
        if attempt < MAX_RETRIES:
            sleep_time = RETRY_BACKOFF ** attempt + random.uniform(0, 5)
            print(f"  [{short}] {sleep_time:.0f}s 后重试...")
            time.sleep(sleep_time)
    raise last_error


def parse_price_text(text: str) -> Optional[float]:
    """解析价格文本 '10,238元/㎡' -> 10238.0"""
    if not text or text == '--':
        return None
    cleaned = re.sub(r'[元/㎡,\s]', '', text)
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_change_text(text: str) -> Optional[float]:
    """解析涨跌幅文本 '-9.14%' -> -9.14"""
    if not text or text == '--':
        return None
    cleaned = re.sub(r'[↑↓%\s]', '', text)
    if cleaned in ('', '-'):
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


# 城市代码 → 名称
MAIN_CITIES = {
    'bj': '北京', 'sh': '上海', 'gz': '广州', 'sz': '深圳',
    'sj': '石家庄', 'tj': '天津', 'nj': '南京', 'hz': '杭州',
    'wh': '武汉', 'cd': '成都', 'cs': '长沙', 'zz': '郑州',
    'xa': '西安', 'dl': '大连', 'sy': '沈阳', 'jn': '济南',
    'qd': '青岛', 'fz': '福州', 'km': '昆明', 'gy': '贵阳',
}

# 城市代码 → creprice.cn 拼音（m.creprice.cn 使用两字母代码）
CITY_CODE_MAP = {
    'bj': 'bj', 'sh': 'sh', 'gz': 'gz', 'sz': 'sz',
    'sj': 'sj', 'tj': 'tj', 'nj': 'nj', 'hz': 'hz',
    'wh': 'wh', 'cd': 'cd', 'cs': 'cs', 'zz': 'zz',
    'xa': 'xa', 'dl': 'dl', 'sy': 'sy', 'jn': 'jn',
    'qd': 'qd', 'fz': 'fz', 'km': 'km', 'gy': 'gy',
}


def scrape_city_price(city_code: str) -> Dict:
    """爬取单个城市房价详情（m.creprice.cn 备用通道）。"""
    url = f"https://m.creprice.cn/city/{city_code}.html"

    try:
        html = _robust_get(url, timeout=15)
        city_name = MAIN_CITIES.get(city_code, city_code.upper())

        result = {
            'cityCode': city_code,
            'cityName': city_name,
            'secondHandPrice': None,
            'secondHandChange': None,
            'newPrice': None,
            'newChange': None,
            'districts': [],
            'dataMonth': None,
            'unit': '元/㎡',
        }

        # 提取均价
        price_match = re.search(r'(\d{1,3},?\d{3}).*?元', html)
        if price_match:
            result['secondHandPrice'] = float(price_match.group(1).replace(',', ''))

        # 提取环比
        change_match = re.search(r'[▼↓](\d+\.?\d*)%', html)
        if change_match:
            result['secondHandChange'] = -float(change_match.group(1))

        # 提取数据月份
        month_match = re.search(r'(\d{4})年(\d{1,2})月', html)
        if month_match:
            result['dataMonth'] = f"{month_match.group(1)}年{month_match.group(2)}月"

        # 解析各区房价表格
        soup = BeautifulSoup(html, 'html.parser')
        district_table = soup.find('table')
        if district_table:
            for row in district_table.find_all('tr'):
                cols = row.find_all('td')
                if len(cols) >= 3:
                    name = cols[1].get_text(strip=True)
                    price = parse_price_text(cols[2].get_text(strip=True))
                    change = parse_change_text(cols[3].get_text(strip=True)) if len(cols) > 3 else None
                    if name and price:
                        result['districts'].append({'name': name, 'price': price, 'change': change})

        return result

    except Exception as e:
        print(f"爬取{city_code}房价失败: {e}")
        return {
            'cityCode': city_code,
            'cityName': MAIN_CITIES.get(city_code, city_code.upper()),
            'error': str(e),
        }


# ──────────────────────────────────────────────
# 缓存层
# ──────────────────────────────────────────────

class HousingPriceCache:
    """房价数据缓存"""
    data: Optional[Dict] = None
    last_update: Optional[datetime] = None

    @classmethod
    def is_expired(cls) -> bool:
        if cls.last_update is None:
            return True
        return (datetime.now() - cls.last_update).total_seconds() > CACHE_EXPIRE_HOURS * 3600

    @classmethod
    def load_from_file(cls):
        """从文件加载缓存"""
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                    cached = json.load(f)
                    cls.data = cached.get('data')
                    cls.last_update = datetime.fromisoformat(cached.get('last_update', ''))
            except Exception as e:
                print(f"加载房价缓存失败: {e}")

    @classmethod
    def save_to_file(cls):
        """保存缓存到文件"""
        try:
            with open(CACHE_FILE, 'w', encoding='utf-8') as f:
                json.dump({
                    'data': cls.data,
                    'last_update': cls.last_update.isoformat() if cls.last_update else None,
                }, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"保存房价缓存失败: {e}")


# ──────────────────────────────────────────────
# 主更新流程
# ──────────────────────────────────────────────

def update_national_ranking_only() -> Dict:
    """
    仅更新全国排行（www.creprice.cn API，快速可靠，2秒内完成）。
    可在启动时立即调用，不阻塞。
    """
    print("更新全国房价排行...")
    old_data = HousingPriceCache.data
    old_cities = old_data.get('cities', {}) if old_data else {}

    national = fetch_national_ranking()
    if not national and old_data:
        national = old_data.get('national', [])

    result = {
        'national': national,
        'cities': old_cities,
        'updateTime': datetime.now().isoformat(),
    }
    HousingPriceCache.data = result
    HousingPriceCache.last_update = datetime.now()
    HousingPriceCache.save_to_file()
    print(f"  排行已更新: {len(national)} 城")
    return result


def update_city_details() -> Dict:
    """
    仅更新城市详情（m.creprice.cn 备用通道，间歇性连通，耗时较长）。
    增量合并：成功则替换，失败则保留旧数据。
    """
    print("开始更新城市详情...")
    old_data = HousingPriceCache.data
    old_cities = old_data.get('cities', {}) if old_data else {}
    national = old_data.get('national', []) if old_data else []

    cities = {}
    ok_count = 0
    total = len(MAIN_CITIES)

    for i, code in enumerate(MAIN_CITIES.keys()):
        if i > 0:
            delay = max(5, CITY_DELAY + random.uniform(-CITY_DELAY_JITTER, CITY_DELAY_JITTER))
            print(f"  等待 {delay:.0f}s...")
            time.sleep(delay)

        city_data = scrape_city_price(code)
        has_data = city_data.get('secondHandPrice') is not None

        if has_data:
            cities[code] = city_data
            ok_count += 1
            print(f"  [{i+1}/{total}] {MAIN_CITIES[code]}: OK ({city_data['secondHandPrice']} 元/㎡)")
        elif code in old_cities and old_cities[code].get('secondHandPrice'):
            cities[code] = dict(old_cities[code])
            cities[code]['_stale'] = True
            print(f"  [{i+1}/{total}] {MAIN_CITIES[code]}: FAIL (保留旧缓存)")
        else:
            cities[code] = city_data
            print(f"  [{i+1}/{total}] {MAIN_CITIES[code]}: FAIL (无缓存)")

    result = {
        'national': national,
        'cities': cities,
        'updateTime': datetime.now().isoformat(),
    }
    HousingPriceCache.data = result
    HousingPriceCache.last_update = datetime.now()
    HousingPriceCache.save_to_file()

    ok_pct = ok_count / total * 100 if total > 0 else 0
    print(f"  城市详情更新完成: {ok_count}/{total} 成功 ({ok_pct:.0f}%)")
    return result


def update_housing_price_cache() -> Dict:
    """
    完整更新：先快速获取排行，再慢速爬取城市详情。
    """
    # 第一阶段：快速排行更新
    update_national_ranking_only()

    # 第二阶段：慢速城市详情（如启用）
    if CITY_SCRAPE_ENABLED:
        return update_city_details()

    return HousingPriceCache.data


def get_housing_prices() -> Dict:
    """
    获取房价数据（优先使用内存缓存，过期或无排行数据时尝试从文件重新加载）。
    不阻塞等待更新（城市爬取需 7+ 分钟）。后台任务负责刷新缓存。
    """
    if HousingPriceCache.data and not HousingPriceCache.is_expired() and HousingPriceCache.data.get('national'):
        return HousingPriceCache.data

    # 内存缓存为空、过期、或排行缺失：尝试从文件重新加载（后台任务可能已更新文件）
    if HousingPriceCache.data:
        HousingPriceCache.load_from_file()
        if HousingPriceCache.data and HousingPriceCache.data.get('national'):
            return HousingPriceCache.data

    # 完全无有效缓存：返回空结构
    print("房价缓存为空或无效，返回空数据（后台任务将填充）")
    return {
        'national': [],
        'cities': {},
        'updateTime': datetime.now().isoformat(),
    }


def get_city_price(city_code: str) -> Dict:
    """获取单个城市房价。"""
    data = get_housing_prices()
    return data.get('cities', {}).get(city_code, {'error': '城市数据不存在'})
