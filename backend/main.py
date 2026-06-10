"""
A股数据后端服务 - 使用通达信(mootdx)获取K线和实时行情，AkShare获取中国宏观经济数据，Alpha Vantage获取金价
"""
from dotenv import load_dotenv
load_dotenv()  # 加载.env文件中的环境变量

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.stocks import router as stocks_router
from api.china_macro import router as china_macro_router
from api.gold import router as gold_router
from api.housing_price import router as housing_price_router
from api.fred import router as fred_router
from api.bls import router as bls_router
from api.alphavantage import router as alphavantage_router
from api.binance import router as binance_router
from services.gold_service import update_gold_price_cache, GoldPriceCache
from services.housing_price_service import HousingPriceCache, update_housing_price_cache

# 定时任务：每小时更新金价缓存
async def scheduled_gold_update():
    """每小时更新金价缓存"""
    while True:
        try:
            await update_gold_price_cache()
        except Exception as e:
            print(f"定时更新金价失败: {e}")
        # 等待1小时
        await asyncio.sleep(3600)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时：加载缓存并启动定时任务
    GoldPriceCache.load_from_file()
    HousingPriceCache.load_from_file()

    # 如果金价缓存为空或过期，立即更新
    if GoldPriceCache.data is None or GoldPriceCache.is_expired():
        await update_gold_price_cache()

    # 如果房价缓存为空或过期，立即更新
    if HousingPriceCache.data is None or HousingPriceCache.is_expired():
        update_housing_price_cache()

    # 启动定时任务（后台运行）
    task = asyncio.create_task(scheduled_gold_update())

    yield

    # 关闭时：取消定时任务
    task.cancel()


app = FastAPI(
    title="A股数据后端",
    description="使用通达信API获取A股历史K线和实时行情数据，AkShare获取中国宏观经济数据，Alpha Vantage获取金价（每小时缓存）",
    version="1.2.0",
    lifespan=lifespan,
)

# CORS配置 - 允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:9000",
        "http://192.168.31.153:9000",
        "http://si200ln57860.vicp.fun:9000",
        "http://si200ln57860.vicp.fun",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(stocks_router, prefix="/api")
app.include_router(china_macro_router, prefix="/api")
app.include_router(gold_router, prefix="/api")
app.include_router(housing_price_router, prefix="/api")
app.include_router(fred_router, prefix="/api")
app.include_router(bls_router, prefix="/api")
app.include_router(alphavantage_router, prefix="/api")
app.include_router(binance_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "A股数据后端服务运行中", "version": "1.2.0"}