from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Any
from bson import ObjectId
from app.schemas.analytics import (
    DashboardAnalyticsResponse,
    RevenueSummary,
    SalesDataPoint,
    TopSellingItem,
    OrderStats
)

class AnalyticsService:
    async def get_dashboard_analytics(self, db: Any) -> DashboardAnalyticsResponse:
        # 1. Calculate Revenue Summary
        pipeline = [
            {"$match": {"order_status": "completed"}},
            {"$group": {
                "_id": None,
                "total_revenue": {"$sum": "$total"},
                "total_orders": {"$sum": 1}
            }}
        ]
        cursor = db["orders"].aggregate(pipeline)
        rev_res = await cursor.to_list(length=1)
        
        if rev_res:
            total_rev = Decimal(str(rev_res[0].get("total_revenue") or 0.00))
            total_orders = rev_res[0].get("total_orders") or 0
        else:
            total_rev = Decimal("0.00")
            total_orders = 0
            
        avg_value = total_rev / Decimal(str(total_orders)) if total_orders > 0 else Decimal("0.00")
        
        rev_summary = RevenueSummary(
            total_revenue=total_rev,
            total_orders=total_orders,
            average_order_value=avg_value
        )

        # 2. Calculate Order Status Statistics
        pipeline_stats = [
            {"$group": {
                "_id": "$order_status",
                "count": {"$sum": 1}
            }}
        ]
        cursor_stats = db["orders"].aggregate(pipeline_stats)
        stats_res = await cursor_stats.to_list(length=100)
        
        stats_dict = {"pending": 0, "preparing": 0, "completed": 0, "cancelled": 0}
        for item in stats_res:
            status = item["_id"]
            if status in stats_dict:
                stats_dict[status] = item["count"]
        
        order_stats = OrderStats(**stats_dict)

        # 3. Calculate Top Selling Items
        completed_orders = await db["orders"].find({"order_status": "completed"}).to_list(length=10000)
        order_ids = [str(o["_id"]) for o in completed_orders]
        
        # Fetch matching order items
        oi_docs = await db["order_items"].find({"order_id": {"$in": order_ids}}).to_list(length=10000)
        
        # Group by product_id
        from collections import defaultdict
        sales = defaultdict(lambda: {"qty": 0, "rev": Decimal("0.00")})
        for oi in oi_docs:
            pid = oi["product_id"]
            sales[pid]["qty"] += int(oi["quantity"])
            sales[pid]["rev"] += Decimal(str(oi["subtotal"]))
            
        # Sort and take top 5
        sorted_sales = sorted(sales.items(), key=lambda x: x[1]["qty"], reverse=True)[:5]
        
        top_items = []
        for pid, data in sorted_sales:
            prod_query = ObjectId(pid) if isinstance(pid, str) and ObjectId.is_valid(pid) else pid
            prod = await db["products"].find_one({"_id": prod_query})
            name = prod["name"] if prod else "Unknown Product"
            top_items.append(
                TopSellingItem(
                    product_id=str(pid),
                    product_name=name,
                    quantity_sold=data["qty"],
                    revenue_generated=data["rev"]
                )
            )

        # 4. Generate Sales History (Last 7 days - daily trend)
        today = datetime.now(timezone.utc).date()
        start_date = datetime.combine(today - timedelta(days=6), datetime.min.time())
        
        cursor_history = db["orders"].find({
            "order_status": "completed",
            "created_at": {"$gte": start_date}
        })
        orders_data = await cursor_history.to_list(length=10000)
        
        # Populate dict with all 7 days
        daily_map = {}
        for i in range(7):
            d = today - timedelta(days=6 - i)
            daily_map[d.strftime("%Y-%m-%d")] = {"revenue": Decimal("0.00"), "count": 0}
            
        for order in orders_data:
            created_at = order["created_at"]
            total = order["total"]
            # Handle datetime if it's string or datetime
            if isinstance(created_at, str):
                try:
                    created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                except ValueError:
                    continue
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
