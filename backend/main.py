"""
A股数据后端服务 - 使用通达信(mootdx)获取K线和实时行情
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.stocks import router as stocks_router

app = FastAPI(
    title="A股数据后端",
    description="使用通达信API获取A股历史K线和实时行情数据",
    version="1.0.0",
)

# CORS配置 - 允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(stocks_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "A股数据后端服务运行中", "version": "1.0.0"}