from pydantic import BaseModel
from decimal import Decimal
from typing import List

class RevenueSummary(BaseModel):
    total_revenue: Decimal
    total_orders: int
    average_order_value: Decimal

class SalesDataPoint(BaseModel):
    label: str  # Date string, e.g., "2026-05-26", "Week 21", or "May 2026"
    revenue: Decimal
    order_count: int

class TopSellingItem(BaseModel):
    product_id: str
    product_name: str
    quantity_sold: int
    revenue_generated: Decimal

class OrderStats(BaseModel):
    pending: int
    preparing: int
    completed: int
    cancelled: int

class DashboardAnalyticsResponse(BaseModel):
    revenue_summary: RevenueSummary
    sales_history: List[SalesDataPoint]
    top_items: List[TopSellingItem]
    order_stats: OrderStats
