from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User
from app.models.customer import Customer
from app.schemas.payment import PaymentCreate, PaymentResponse, ReceiptResponse, SplitPaymentItem
from app.repositories.order import order_repository
from app.repositories.base import BaseRepository
from app.utils.deps import get_current_user, RoleChecker
from app.utils.receipt import receipt_generator
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from bson import ObjectId

router = APIRouter(prefix="/payments", tags=["Payment Processing"])
payment_repo = BaseRepository(Payment)

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
    if not hasattr(customer, "last_visit_at") or getattr(customer, "last_visit_at") is None:
        customer.last_visit_at = None
    if not hasattr(customer, "points_expiry_date") or getattr(customer, "points_expiry_date") is None:
        customer.points_expiry_date = None
    return customer

# Helper to get global loyalty config
async def get_loyalty_config(db):
    config_doc = await db["loyalty_config"].find_one({})
    if not config_doc:
        default_config = {
            "currency_per_point": 100.0,
            "redemption_value_per_point": 1.0,
            "tier_multipliers": {"Bronze": 1.0, "Silver": 1.1, "Gold": 1.25, "Platinum": 1.5},
            "tier_thresholds": {"Bronze": 0.0, "Silver": 5000.0, "Gold": 15000.0, "Platinum": 40000.0},
            "points_expiry_days": 365,
            "created_at": datetime.now(timezone.utc).replace(tzinfo=None),
            "updated_at": datetime.now(timezone.utc).replace(tzinfo=None)
        }
        res = await db["loyalty_config"].insert_one(default_config)
        default_config["_id"] = res.inserted_id
        return default_config
    return config_doc

# Helper to calculate active campaign multiplier
async def get_active_campaign_multiplier(db, customer_birthdate: Optional[str] = None):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    campaign_docs = await db["loyalty_campaigns"].find({"active": True}).to_list(length=100)
    
    multiplier = 1.0
    bonus_points = 0
    reasons = []
    
    for doc in campaign_docs:
        start_date = doc.get("start_date")
        end_date = doc.get("end_date")
        
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date.replace("Z", "+00:00")).replace(tzinfo=None)
        elif start_date and start_date.tzinfo:
            start_date = start_date.replace(tzinfo=None)
            
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date.replace("Z", "+00:00")).replace(tzinfo=None)
        elif end_date and end_date.tzinfo:
            end_date = end_date.replace(tzinfo=None)
            
        now_naive = now.replace(tzinfo=None)
        if start_date and end_date and start_date <= now_naive <= end_date:
            if doc.get("multiplier", 1.0) > multiplier:
                multiplier = doc.get("multiplier", 1.0)
            bonus_points += doc.get("bonus_points", 0)
            reasons.append(doc.get("name", "Campaign"))
            
    # Birthday bonus logic
    if customer_birthdate:
        try:
            b_dt = datetime.strptime(customer_birthdate, "%Y-%m-%d")
            if b_dt.month == now.month and b_dt.day == now.day:
                if 2.0 > multiplier:
                    multiplier = 2.0
                bonus_points += 50
                reasons.append("Birthday Bonus")
        except Exception:
            pass
            
    return multiplier, bonus_points, ", ".join(reasons) if reasons else "Standard Earn"

# Helper to determine VIP tier
def determine_tier(spending: Decimal, points: int, thresholds: dict) -> str:
    p_thresh = thresholds.get("Platinum", 40000.0)
    g_thresh = thresholds.get("Gold", 15000.0)
    s_thresh = thresholds.get("Silver", 5000.0)
    
    val = float(spending)
    if val >= p_thresh:
        return "Platinum"
    elif val >= g_thresh:
        return "Gold"
    elif val >= s_thresh:
        return "Silver"
    else:
        return "Bronze"

@router.post("/{order_id}", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def process_payment(
    order_id: str,
    payment_in: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process a payment for an active order (Cash, Card, QR, Points, or Split).
    """
    order = await order_repository.get_with_details(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    if order.payment_status == "paid":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order is already paid")
        
    if order.order_status == "cancelled":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot pay for a cancelled order")

    # Expand splits if single method payment
    splits = []
    if payment_in.payment_method == "split":
        if not payment_in.splits:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Split payment splits list is empty")
        splits = payment_in.splits
    else:
        splits = [SplitPaymentItem(payment_method=payment_in.payment_method, amount_paid=payment_in.amount_paid)]

    # 1. Loyalty points redemptions processing
    points_paid = Decimal("0.00")
    points_to_deduct = 0
    loyalty_config = await get_loyalty_config(db)
    
    # Calculate non-points payment totals and check points split
    for split in splits:
        if split.payment_method == "points":
            points_paid += split.amount_paid

    customer = None
    if points_paid > Decimal("0.00"):
        if not order.customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer is required to redeem loyalty points"
            )
        cust_query = ObjectId(order.customer_id) if ObjectId.is_valid(order.customer_id) else order.customer_id
        cust_doc = await db["customers"].find_one({"_id": cust_query})
        if not cust_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        customer = Customer(**cust_doc)
        populate_customer_defaults(customer)
        
        redemption_val = Decimal(str(loyalty_config["redemption_value_per_point"]))
        points_to_deduct = int(points_paid / redemption_val)
        
        if customer.loyalty_points < points_to_deduct:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Customer has insufficient points. Required: {points_to_deduct}, available: {customer.loyalty_points}"
            )

    # 2. Verify payment total splits
    non_cash_paid = sum(split.amount_paid for split in splits if split.payment_method != "cash")
    remaining_to_pay = max(Decimal("0.00"), Decimal(str(order.total)) - non_cash_paid)
    
    cash_paid = sum(split.amount_paid for split in splits if split.payment_method == "cash")
    
    # Check if total splits paid cover order.total
    total_paid = non_cash_paid + cash_paid
    if total_paid < Decimal(str(order.total)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient amount paid. Total is {order.total}, paid {total_paid}"
        )

    # Calculate change
    change_amount = Decimal("0.00")
    if cash_paid > Decimal("0.00"):
        if cash_paid < remaining_to_pay:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cash payment of {cash_paid} is insufficient to cover remaining balance of {remaining_to_pay}"
            )
        change_amount = cash_paid - remaining_to_pay

    # Deduct points if redeemed
    if points_to_deduct > 0 and customer:
        customer.loyalty_points -= points_to_deduct
        # Send SMS for redeeming points
        from app.utils.sms import send_sms_notification
        send_sms_notification(
            customer.phone,
            f"Dear {customer.name}, you successfully redeemed {points_to_deduct} points for a discount of "
            f"Rs. {points_paid:.2f}! New Balance: {customer.loyalty_points} points."
        )
        # Insert audit trail for redemption
        redemption_tx = {
            "customer_id": str(customer.id),
            "order_id": order_id,
            "type": "redeemed",
            "points": points_to_deduct,
            "reason": f"Redeemed at checkout for order {order.order_number}",
            "adjusted_by": current_user.username,
            "created_at": datetime.now(timezone.utc).replace(tzinfo=None)
        }
        await db["loyalty_transactions"].insert_one(redemption_tx)

    # 3. Dynamic Loyalty Points Accrual (Exclude portion covered by points discount)
    gross_paid = max(Decimal("0.00"), Decimal(str(order.total)) - points_paid)
    points_earned = 0
    tier_upgraded = False
    old_tier = "Bronze"
    new_tier = "Bronze"

    if order.customer_id and not getattr(order, "loyalty_points_awarded", False):
        if not customer:
            cust_query = ObjectId(order.customer_id) if ObjectId.is_valid(order.customer_id) else order.customer_id
            cust_doc = await db["customers"].find_one({"_id": cust_query})
            if cust_doc:
                customer = Customer(**cust_doc)
                populate_customer_defaults(customer)

        if customer:
            old_tier = customer.tier
            campaign_mult, bonus_points, campaign_reason = await get_active_campaign_multiplier(db, customer.birthdate)
            tier_multiplier = loyalty_config["tier_multipliers"].get(customer.tier, 1.0)
            
            # Points earning calculation
            currency_per_pt = Decimal(str(loyalty_config["currency_per_point"]))
            pts_calculated = (gross_paid / currency_per_pt) * Decimal(str(campaign_mult)) * Decimal(str(tier_multiplier))
            points_earned = int(pts_calculated) + bonus_points

            if points_earned > 0:
                customer.loyalty_points += points_earned
                customer.lifetime_points += points_earned
                customer.lifetime_spending = Decimal(str(customer.lifetime_spending)) + gross_paid
                customer.visit_count += 1
                customer.last_visit_at = datetime.now(timezone.utc).replace(tzinfo=None)
                customer.points_expiry_date = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=loyalty_config["points_expiry_days"])
                
                # Check for tier auto-promotion
                new_tier = determine_tier(customer.lifetime_spending, customer.lifetime_points, loyalty_config["tier_thresholds"])
                if new_tier != old_tier:
                    customer.tier = new_tier
                    tier_upgraded = True
                
                # Send SMS for earning points
                from app.utils.sms import send_sms_notification
                sms_message = (
                    f"Dear {customer.name}, you earned {points_earned} points on your purchase of "
                    f"Rs. {gross_paid:.2f} at Daily Grind! New Balance: {customer.loyalty_points} points. Tier: {customer.tier}."
                )
                if tier_upgraded:
                    sms_message += f" Congratulations on upgrading to {customer.tier} tier!"
                send_sms_notification(customer.phone, sms_message)
                
                # Insert audit trail for earn
                earn_tx = {
                    "customer_id": str(customer.id),
                    "order_id": order_id,
                    "type": "earned",
                    "points": points_earned,
                    "reason": f"Purchase points. Campaign: {campaign_reason}. Tier multiplier: {tier_multiplier}x.",
                    "adjusted_by": current_user.username,
                    "created_at": datetime.now(timezone.utc).replace(tzinfo=None)
                }
                await db["loyalty_transactions"].insert_one(earn_tx)
                
                # Prevent duplicate award allocations
                order.loyalty_points_awarded = True
                order.points_earned = points_earned

    # Save customer changes to db
    if customer:
        db.add(customer)

    # 4. Create Payment transaction
    payment_data = {
        "order_id": order_id,
        "payment_method": payment_in.payment_method,
        "amount_paid": payment_in.amount_paid,
        "change_amount": change_amount,
        "transaction_reference": payment_in.transaction_reference,
        "payment_status": "completed",
        "splits": [s.model_dump() for s in splits]
    }
    
    new_payment = await payment_repo.create(db, obj_in=payment_data)
    
    # Update Order statuses
    order.payment_status = "paid"
    order.order_status = "preparing"
    db.add(order)
    
    await db.commit()
    await db.refresh(new_payment)
    
    # Inject celebratory metadata if tier upgraded or points earned for the receipt/checkout response
    response_data = new_payment.to_dict()
    if "_id" in response_data:
        response_data["id"] = str(response_data["_id"])
    response_data["points_earned"] = points_earned
    response_data["points_redeemed"] = points_to_deduct
    response_data["tier_upgraded"] = tier_upgraded
    response_data["old_tier"] = old_tier
    response_data["new_tier"] = new_tier
    
    return PaymentResponse(**response_data)

@router.get("/receipt/{order_id}", response_model=ReceiptResponse)
async def get_order_receipt(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate standard receipt JSON data for a completed/paid order.
    """
    order = await order_repository.get_with_details(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    if order.payment_status != "paid" or not order.payments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receipt can only be generated for paid orders"
        )
        
    last_payment = order.payments[-1]
    
    receipt_data = receipt_generator.generate_receipt_data(
        order,
        payment_method=last_payment.payment_method,
        amount_paid=float(last_payment.amount_paid),
        change_amount=float(last_payment.change_amount)
    )
    return receipt_data

@router.get("", response_model=List[PaymentResponse])
async def get_payment_history(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Retrieve auditing transaction history logs (Admin only).
    """
    return await payment_repo.get_multi(db, skip=skip, limit=limit)

