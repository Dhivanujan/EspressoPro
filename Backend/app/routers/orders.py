from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.order import Order, OrderItem
from app.models.cart import Cart, CartItem
from app.models.product import Product, Ingredient, ProductIngredient
from app.models.customer import Customer
from app.models.inventory import InventoryLog
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.services.order_service import order_service
from app.repositories.order import order_repository
from app.utils.deps import get_current_user
from app.routers.websockets import manager
from app.config.settings import settings

router = APIRouter(prefix="/orders", tags=["Order Management"])

async def broadcast_order_update(event_type: str, order: Order):
    # Simple helper to serialise order and broadcast
    items = []
    for item in order.items:
        items.append({
            "product_id": item.product_id,
            "name": item.product.name,
            "quantity": item.quantity,
            "price": float(item.unit_price)
        })
    
    payload = {
        "event": event_type,
        "order_id": order.id,
        "order_number": order.order_number,
        "order_status": order.order_status,
        "payment_status": order.payment_status,
        "total": float(order.total),
        "customer_name": order.customer_name,
        "items": items
    }
    await manager.broadcast(payload)

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new order from scratch, checking stock, applying discounts, and updating inventories.
    """
    order = await order_service.create_order(db, order_in=order_in, cashier_id=current_user.id)
    await db.commit()
    order = await order_repository.get_with_details(db, order.id)
    
    # Broadcast order creation to WebSocket listeners
    await broadcast_order_update("order_created", order)
    return order

@router.post("/from-cart/{cart_id}", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def checkout_from_cart(
    cart_id: int,
    customer_id: Optional[int] = None,
    coupon_code: Optional[str] = None,
    order_type: str = "takeaway",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Convert a cashier's parked cart directly into a finalized order.
    The cart is deleted automatically upon successful checkout.
    """
    # Fetch cart with eager loading of items and products
    from sqlalchemy.orm import selectinload
    cart_res = await db.execute(
        select(Cart)
        .filter(Cart.id == cart_id, Cart.cashier_id == current_user.id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    cart = cart_res.scalars().first()
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found")
        
    if not cart.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")
        
    # Map cart items to order schemas
    order_items_in = []
    for item in cart.items:
        order_items_in.append({
            "product_id": item.product_id,
            "quantity": item.quantity
        })
        
    order_in = OrderCreate(
        customer_id=customer_id,
        customer_name=cart.customer_name,
        coupon_code=coupon_code,
        order_type=order_type,
        items=order_items_in
    )
    
    # Process order
    order = await order_service.create_order(db, order_in=order_in, cashier_id=current_user.id)
    
    # Remove parked cart
    await db.delete(cart)
    await db.commit()
    order = await order_repository.get_with_details(db, order.id)
    
    await broadcast_order_update("order_created", order)
    return order

@router.get("", response_model=List[OrderResponse])
async def list_orders(
    cashier_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    order_status: Optional[str] = None,
    payment_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get paginated order history with search filters.
    """
    return await order_repository.get_multi_filtered(
        db,
        cashier_id=cashier_id,
        customer_id=customer_id,
        order_status=order_status,
        payment_status=payment_status,
        skip=skip,
        limit=limit
    )

@router.get("/{order_id}", response_model=OrderResponse)
async def get_single_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get order details by ID.
    """
    order = await order_repository.get_with_details(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order

@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the preparation status of an order (e.g. pending -> preparing -> completed).
    Updates are broadcast in real-time.
    """
    order = await order_repository.get_with_details(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    if order.order_status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update status of a cancelled order"
        )
        
    order.order_status = status_in.order_status
    await db.commit()
    order = await order_repository.get_with_details(db, order_id)
    
    await broadcast_order_update("order_status_updated", order)
    return order

@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancel an order. This automatically restores the deducted products and raw ingredients 
    back to the inventory and reverts the customer's awarded loyalty points.
    """
    order = await order_repository.get_with_details(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    if order.order_status == "cancelled":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order is already cancelled")
        
    # 1. Restore product & recipe ingredient stocks
    for item in order.items:
        # Restore product stock
        product_res = await db.execute(select(Product).filter(Product.id == item.product_id))
        product = product_res.scalars().first()
        if product:
            product.stock_quantity += item.quantity
            db.add(product)
            
            # Log product adjustment
            prod_log = InventoryLog(
                item_type="product",
                item_id=product.id,
                change_amount=float(item.quantity),
                reason="adjustment",
                adjusted_by=current_user.id
            )
            db.add(prod_log)
            
        # Restore recipe ingredients
        recipe_res = await db.execute(
            select(ProductIngredient).filter(ProductIngredient.product_id == item.product_id)
        )
        for recipe in recipe_res.scalars().all():
            ing_res = await db.execute(select(Ingredient).filter(Ingredient.id == recipe.ingredient_id))
            ingredient = ing_res.scalars().first()
            if ingredient:
                restored_qty = recipe.quantity_required * item.quantity
                ingredient.stock_quantity += restored_qty
                db.add(ingredient)
                
                # Log ingredient adjustment
                ing_log = InventoryLog(
                    item_type="ingredient",
                    item_id=ingredient.id,
                    change_amount=float(restored_qty),
                    reason="adjustment",
                    adjusted_by=current_user.id
                )
                db.add(ing_log)

    # 2. Revert Loyalty Points
    if order.customer_id:
        cust_res = await db.execute(select(Customer).filter(Customer.id == order.customer_id))
        customer = cust_res.scalars().first()
        if customer:
            points_to_revert = int(float(order.total) * settings.LOYALTY_POINT_REWARD_RATE)
            customer.loyalty_points = max(0, customer.loyalty_points - points_to_revert)
            db.add(customer)
            
    # 3. Mark status as cancelled
    order.order_status = "cancelled"
    await db.commit()
    order = await order_repository.get_with_details(db, order_id)
    
    await broadcast_order_update("order_cancelled", order)
    return order
