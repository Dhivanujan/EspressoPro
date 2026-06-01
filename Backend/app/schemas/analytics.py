from pydantic import BaseModel
from decimal import Decimal
from typing import List

from typing import Optional, Dict

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

class LoyaltySummary(BaseModel):
    total_members: int
    new_registrations_30d: int
    active_members: int
    inactive_members: int
    total_points_earned: int
    total_points_redeemed: int
    tier_distribution: Dict[str, int]
    revenue_loyalty_members: Decimal
    revenue_guest_sales: Decimal

class LoyalCustomerLeaderboardItem(BaseModel):
    customer_id: str
    name: str
    phone: str
    tier: str
    loyalty_points: int
    lifetime_spending: Decimal
    visit_count: int

class DashboardAnalyticsResponse(BaseModel):
    revenue_summary: RevenueSummary
    sales_history: List[SalesDataPoint]
    top_items: List[TopSellingItem]
    order_stats: OrderStats
    loyalty_summary: Optional[LoyaltySummary] = None
    loyal_customers: Optional[List[LoyalCustomerLeaderboardItem]] = None
