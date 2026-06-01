from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Any
from bson import ObjectId
from app.schemas.analytics import (
    DashboardAnalyticsResponse,
    RevenueSummary,
    SalesDataPoint,
    TopSellingItem,
    OrderStats,
    LoyaltySummary,
    LoyalCustomerLeaderboardItem
)
from app.models.customer import Customer

# Helper to ensure defaults for customer profiles
def populate_customer_defaults(customer):
    if not hasattr(customer, "loyalty_points") or getattr(customer, "loyalty_points") is None:
        customer.loyalty_points = 0
    if not hasattr(customer, "lifetime_spending") or getattr(customer, "lifetime_spending") is None:
        customer.lifetime_spending = Decimal("0.00")
    if not hasattr(customer, "lifetime_points") or getattr(customer, "lifetime_points") is None:
        customer.lifetime_points = 0
    if not hasattr(customer, "tier") or getattr(customer, "tier") is None:
        customer.tier = "Bronze"
    if not hasattr(customer, "visit_count") or getattr(customer, "visit_count") is None:
        customer.visit_count = 0
    return customer

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

        # 5. CRM & Loyalty Program Summaries
        cust_docs = await db["customers"].find().to_list(length=10000)
        customers = [populate_customer_defaults(Customer(**c)) for c in cust_docs]
        
        total_members = len(customers)
        
        # Calculations for registrations & active ratio
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)
        
        new_registrations_30d = 0
        active_members = 0
        inactive_members = 0
        tier_distribution = {"Bronze": 0, "Silver": 0, "Gold": 0, "Platinum": 0}
        
        for c in customers:
            # Check 30d registration
            c_created = c.created_at
            if isinstance(c_created, str):
                c_created = datetime.fromisoformat(c_created.replace("Z", "+00:00"))
            if c_created and c_created.replace(tzinfo=timezone.utc) >= thirty_days_ago:
                new_registrations_30d += 1
                
            # Check active status
            c_visit = c.last_visit_at
            if isinstance(c_visit, str):
                c_visit = datetime.fromisoformat(c_visit.replace("Z", "+00:00"))
            if c_visit and c_visit.replace(tzinfo=timezone.utc) >= thirty_days_ago:
                active_members += 1
            else:
                inactive_members += 1
                
            # Tier counts
            t = c.tier or "Bronze"
            if t in tier_distribution:
                tier_distribution[t] += 1
            else:
                tier_distribution[t] = 1

        # Sum points from transactions
        total_points_earned = 0
        total_points_redeemed = 0
        
        tx_cursor = db["loyalty_transactions"].find()
        tx_docs = await tx_cursor.to_list(length=10000)
        for tx in tx_docs:
            points = int(tx.get("points") or 0)
            tx_type = tx.get("type")
            if tx_type == "earned":
                total_points_earned += points
            elif tx_type == "redeemed":
                total_points_redeemed += points

        # Revenue shares (Loyalty Members vs Guest client sales)
        revenue_loyalty_members = Decimal("0.00")
        revenue_guest_sales = Decimal("0.00")
        
        all_completed_orders = await db["orders"].find({"order_status": "completed"}).to_list(length=10000)
        for order in all_completed_orders:
            o_total = Decimal(str(order.get("total") or 0.00))
            if order.get("customer_id"):
                revenue_loyalty_members += o_total
            else:
                revenue_guest_sales += o_total

        loyalty_summary = LoyaltySummary(
            total_members=total_members,
            new_registrations_30d=new_registrations_30d,
            active_members=active_members,
            inactive_members=inactive_members,
            total_points_earned=total_points_earned,
            total_points_redeemed=total_points_redeemed,
            tier_distribution=tier_distribution,
            revenue_loyalty_members=revenue_loyalty_members,
            revenue_guest_sales=revenue_guest_sales
        )

        # 6. Customer Leaderboard
        customers.sort(key=lambda x: (x.lifetime_spending, x.visit_count), reverse=True)
        loyal_customers = []
        for c in customers[:5]:
            loyal_customers.append(
                LoyalCustomerLeaderboardItem(
                    customer_id=str(c.id),
                    name=c.name,
                    phone=c.phone,
                    tier=c.tier,
                    loyalty_points=c.loyalty_points,
                    lifetime_spending=Decimal(str(c.lifetime_spending)),
                    visit_count=c.visit_count
                )
            )

        return DashboardAnalyticsResponse(
            revenue_summary=rev_summary,
            sales_history=sales_history,
            top_items=top_items,
            order_stats=order_stats,
            loyalty_summary=loyalty_summary,
            loyal_customers=loyal_customers
        )


analytics_service = AnalyticsService()
