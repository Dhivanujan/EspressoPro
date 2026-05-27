from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.analytics import (
    DashboardAnalyticsResponse,
    RevenueSummary,
    SalesDataPoint,
    TopSellingItem,
    OrderStats
)

class AnalyticsService:
    async def get_dashboard_analytics(self, db: AsyncSession) -> DashboardAnalyticsResponse:
        # 1. Calculate Revenue Summary
        rev_res = await db.execute(
            select(
                func.sum(Order.total),
                func.count(Order.id)
            ).filter(Order.order_status == "completed")
        )
        row = rev_res.first()
        total_rev = Decimal(str(row[0] or 0.00)) if row else Decimal("0.00")
        total_orders = row[1] if row and row[1] else 0
        avg_value = total_rev / Decimal(str(total_orders)) if total_orders > 0 else Decimal("0.00")
        
        rev_summary = RevenueSummary(
            total_revenue=total_rev,
            total_orders=total_orders,
            average_order_value=avg_value
        )

        # 2. Calculate Order Status Statistics
        stats_res = await db.execute(
            select(Order.order_status, func.count(Order.id)).group_by(Order.order_status)
        )
        stats_dict = {"pending": 0, "preparing": 0, "completed": 0, "cancelled": 0}
        for status, count in stats_res.all():
            if status in stats_dict:
                stats_dict[status] = count
        
        order_stats = OrderStats(**stats_dict)

        # 3. Calculate Top Selling Items
        top_res = await db.execute(
            select(
                Product.id,
                Product.name,
                func.sum(OrderItem.quantity).label("qty"),
                func.sum(OrderItem.subtotal).label("rev")
            )
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(Order.order_status == "completed")
            .group_by(Product.id, Product.name)
            .order_by(func.sum(OrderItem.quantity).desc())
            .limit(5)
        )
        
        top_items = []
        for pid, name, qty, rev in top_res.all():
            top_items.append(
                TopSellingItem(
                    product_id=pid,
                    product_name=name,
                    quantity_sold=int(qty or 0),
                    revenue_generated=Decimal(str(rev or 0.00))
                )
            )

        # 4. Generate Sales History (Last 7 days - daily trend)
        today = datetime.now(timezone.utc).date()
        start_date = datetime.combine(today - timedelta(days=6), datetime.min.time())
        
        history_res = await db.execute(
            select(Order.created_at, Order.total)
            .filter(
                and_(
                    Order.order_status == "completed",
                    Order.created_at >= start_date
                )
            )
        )
        
        orders_data = history_res.all()
        
        # Populate dict with all 7 days
        daily_map = {}
        for i in range(7):
            d = today - timedelta(days=6 - i)
            daily_map[d.strftime("%Y-%m-%d")] = {"revenue": Decimal("0.00"), "count": 0}
            
        for created_at, total in orders_data:
            day_str = created_at.strftime("%Y-%m-%d")
            if day_str in daily_map:
                daily_map[day_str]["revenue"] += Decimal(str(total))
                daily_map[day_str]["count"] += 1
                
        sales_history = []
        for day_label, data in daily_map.items():
            sales_history.append(
                SalesDataPoint(
                    label=day_label,
                    revenue=data["revenue"],
                    order_count=data["count"]
                )
            )

        return DashboardAnalyticsResponse(
            revenue_summary=rev_summary,
            sales_history=sales_history,
            top_items=top_items,
            order_stats=order_stats
        )

analytics_service = AnalyticsService()
