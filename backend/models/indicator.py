"""
Pydantic模型 - 匹配前端NormalizedIndicator接口
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class Change(BaseModel):
    """价格变化数据"""
    value: float
    percentage: float
    period: str  # 'daily' | 'weekly' | 'monthly'


class HistoricalDataPoint(BaseModel):
    """历史数据点"""
    timestamp: datetime
    value: float


class NormalizedIndicator(BaseModel):
    """标准化指标数据 - 匹配前端接口"""
    id: str
    name: str
    value: float
    unit: str
    timestamp: datetime
    change: Optional[Change] = None
    historical: List[HistoricalDataPoint] = []


class StockSearchResult(BaseModel):
    """股票搜索结果"""
    code: str
    name: str
    market: str  # 'sh' | 'sz'