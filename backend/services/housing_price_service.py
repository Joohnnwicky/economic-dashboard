"""
中国房价数据服务 - 爬取creprice.cn房价行情数据
"""
import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
from datetime import datetime
import re
import json
import os
import time
import urllib3

# 禁用 SSL 警告（NAS 网络环境 TLS 握手不稳定时重试 verify=False）
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 缓存文件路径
CACHE_FILE = "housing_price_cache.json"
CACHE_EXPIRE_HOURS = 24  # 每日更新一次

# 重试配置
MAX_RETRIES = 3
RETRY_BACKOFF = 2  # 秒, 指数增长: 2, 4, 8
CITY_DELAY = 1.5  # 城市间请求间隔(秒), 避免被 creprice.cn 限流

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
}


def _robust_get(url: str, timeout: int = 20) -> requests.Response:
    """
    带重试 + SSL 降级的 HTTP GET。
    NAS 网络环境访问 creprice.cn 偶发 SSL: UNEXPECTED_EOF_WHILE_READING，
    首次尝试正常 SSL，失败后降级为 verify=False 再试。
    """
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            # 第 1-2 次尝试正常 SSL，第 3 次降级
            verify_ssl = attempt < MAX_RETRIES
            resp = requests.get(url, headers=HEADERS, timeout=timeout, verify=verify_ssl)
            resp.encoding = 'utf-8'
            return resp
        except requests.exceptions.SSLError as e:
            last_error = e
            print(f"  [{url[-40:]}] SSL 错误 (attempt {attempt}/{MAX_RETRIES}): {e}")
            if attempt == MAX_RETRIES:
                # 最后一次用 verify=False 再试
                try:
                    resp = requests.get(url, headers=HEADERS, timeout=timeout, verify=False)
                    resp.encoding = 'utf-8'
                    print(f"  [{url[-40:]}] verify=False 成功")
                    return resp
                except Exception as e2:
                    last_error = e2
        except (requests.exceptions.ConnectionError, requests.exceptions.ReadTimeout,
                requests.exceptions.ConnectTimeout) as e:
            last_error = e
            print(f"  [{url[-40:]}] 连接错误 (attempt {attempt}/{MAX_RETRIES}): {e}")
        if attempt < MAX_RETRIES:
            sleep_time = RETRY_BACKOFF ** attempt
            print(f"  [{url[-40:]}] {sleep_time}s 后重试...")
            time.sleep(sleep_time)
    raise last_error

# 主要城市代码（拼音首字母缩写）
MAIN_CITIES = {
    'bj': '北京',
    'sh': '上海',
    'gz': '广州',
    'sz': '深圳',
    'sj': '石家庄',
    'tj': '天津',
    'nj': '南京',
    'hz': '杭州',
    'wh': '武汉',
    'cd': '成都',
    'cs': '长沙',
    'zz': '郑州',
    'xa': '西安',
    'dl': '大连',
    'sy': '沈阳',
    'jn': '济南',
    'qd': '青岛',
    'fz': '福州',
    'km': '昆明',
    'gy': '贵阳',
}


class HousingPriceCache:
    """房价数据缓存"""
    data: Optional[Dict] = None
    last_update: Optional[datetime] = None

    @classmethod
    def is_expired(cls) -> bool:
        """检查缓存是否过期（超过24小时）"""
        if cls.last_update is None:
            return True
        elapsed = datetime.now() - cls.last_update
        return elapsed.total_seconds() > CACHE_EXPIRE_HOURS * 3600

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
                    'last_update': cls.last_update.isoformat() if cls.last_update else None
                }, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"保存房价缓存失败: {e}")


def parse_price_text(text: str) -> Optional[float]:
    """解析价格文本，如 '10,238元/㎡' -> 10238.0"""
    if not text or text == '--':
        return None
    # 移除逗号、单位等
    cleaned = re.sub(r'[元/㎡,\s]', '', text)
    try:
        return float(cleaned)
    except:
        return None


def parse_change_text(text: str) -> Optional[float]:
    """解析涨跌幅文本，如 '-9.14%' -> -9.14"""
    if not text or text == '--':
        return None
    cleaned = re.sub(r'[↑↓%\s]', '', text)
    # 处理只有箭头的情况
    if cleaned == '' or cleaned == '-':
        return None
    try:
        return float(cleaned)
    except:
        return None


def scrape_national_ranking() -> List[Dict]:
    """
    爬取全国城市房价排行

    Returns:
        城市房价列表，包含排名、城市、省份、均价、环比
    """
    url = "https://m.creprice.cn/"

    try:
        response = _robust_get(url, timeout=20)
        soup = BeautifulSoup(response.text, 'html.parser')

        results = []

        # 查找房价列表表格
        table = soup.find('table')
        if not table:
            print("未找到房价表格")
            return results

        rows = table.find_all('tr')
        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 4:
                rank_text = cols[0].get_text(strip=True)
                city = cols[1].get_text(strip=True)
                province = cols[2].get_text(strip=True)
                price_text = cols[3].get_text(strip=True)
                change_text = cols[4].get_text(strip=True) if len(cols) > 4 else ''

                # 解析数据
                rank = int(rank_text) if rank_text.isdigit() else 0
                price = parse_price_text(price_text)
                change = parse_change_text(change_text)

                if city and price:
                    results.append({
                        'rank': rank,
                        'city': city,
                        'province': province,
                        'price': price,
                        'change': change,
                        'unit': '元/㎡'
                    })

        return results

    except Exception as e:
        print(f"爬取全国房价排行失败: {e}")
        return []


def scrape_city_price(city_code: str) -> Dict:
    """
    爬取单个城市房价详情

    Args:
        city_code: 城市代码（如 'sj' = 石家庄）

    Returns:
        城市房价详情，包含均价、环比、各区数据
    """
    url = f"https://m.creprice.cn/city/{city_code}.html"

    try:
        response = _robust_get(url, timeout=20)

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
            'unit': '元/㎡'
        }

        # 直接从文本中提取均价 - 格式: "10,238元" 或 "10,238</span>元"
        price_match = re.search(r'(\d{1,3},?\d{3}).*?元', response.text)
        if price_match:
            price_str = price_match.group(1).replace(',', '')
            result['secondHandPrice'] = float(price_str)

        # 提取环比 - 格式: "▼9.14%" 或 "↑3.55%"
        change_match = re.search(r'[▼↓](\d+\.?\d*)%|\d+\.?\d*%[▼↓]', response.text)
        if change_match:
            result['secondHandChange'] = -float(change_match.group(1) or change_match.group(0).replace('%', '').replace('▼', '').replace('↓', ''))

        # 提取数据月份
        month_match = re.search(r'(\d{4})年(\d{1,2})月', response.text)
        if month_match:
            result['dataMonth'] = f"{month_match.group(1)}年{month_match.group(2)}月"

        # 解析各区房价表格
        soup = BeautifulSoup(response.text, 'html.parser')
        district_table = soup.find('table')
        if district_table:
            rows = district_table.find_all('tr')
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 3:
                    district_name = cols[1].get_text(strip=True)
                    price_text = cols[2].get_text(strip=True)
                    change_text = cols[3].get_text(strip=True) if len(cols) > 3 else ''

                    district_price = parse_price_text(price_text)
                    district_change = parse_change_text(change_text)

                    if district_name and district_price:
                        result['districts'].append({
                            'name': district_name,
                            'price': district_price,
                            'change': district_change
                        })

        return result

    except Exception as e:
        print(f"爬取{city_code}房价失败: {e}")
        return {
            'cityCode': city_code,
            'cityName': MAIN_CITIES.get(city_code, city_code.upper()),
            'error': str(e)
        }


def update_housing_price_cache() -> Dict:
    """
    更新房价缓存

    Returns:
        更新后的房价数据
    """
    print("开始更新房价缓存...")

    # 爬取全国排行
    national = scrape_national_ranking()
    print(f"  全国排行: {len(national)} 个城市")

    # 爬取主要城市详情（加间隔避免被限流）
    cities = {}
    for i, code in enumerate(MAIN_CITIES.keys()):
        if i > 0:
            time.sleep(CITY_DELAY)
        city_data = scrape_city_price(code)
        cities[code] = city_data
        has_data = city_data.get('secondHandPrice') is not None
        print(f"  [{i+1}/{len(MAIN_CITIES)}] {MAIN_CITIES[code]}: {'OK' if has_data else 'FAIL'}")

    result = {
        'national': national,
        'cities': cities,
        'updateTime': datetime.now().isoformat()
    }

    HousingPriceCache.data = result
    HousingPriceCache.last_update = datetime.now()
    HousingPriceCache.save_to_file()

    print(f"房价缓存更新完成，共{len(national)}个城市排行")
    return result


def get_housing_prices() -> Dict:
    """
    获取房价数据（使用缓存）

    Returns:
        房价数据字典
    """
    # 检查缓存
    if HousingPriceCache.data and not HousingPriceCache.is_expired():
        return HousingPriceCache.data

    # 缓存过期或不存在，重新爬取
    return update_housing_price_cache()


def get_city_price(city_code: str) -> Dict:
    """
    获取单个城市房价

    Args:
        city_code: 城市代码

    Returns:
        城市房价数据
    """
    data = get_housing_prices()
    cities = data.get('cities', {})
    return cities.get(city_code, {'error': '城市数据不存在'})