from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartCreate, CartResponse, CartItemCreate, CartItemUpdate
from app.utils.deps import get_current_user
from app.config.settings import settings

router = APIRouter(prefix="/carts", tags=["Cashier Carts"])

def compile_cart_response(cart: Cart) -> dict:
    subtotal = 0.0
    for item in cart.items:
        subtotal += float(item.product.price) * item.quantity
    
    tax = subtotal * settings.TAX_RATE
    total = subtotal + tax
    
    return {
        "id": cart.id,
        "cashier_id": cart.cashier_id,
        "customer_name": cart.customer_name,
        "created_at": cart.created_at,
        "updated_at": cart.updated_at,
        "items": cart.items,
        "subtotal": round(subtotal, 2),
        "tax": round(tax, 2),
        "total": round(total, 2)
    }

async def fetch_cart_with_items(db: AsyncSession, cart_id: int, cashier_id: int) -> Cart:
    res = await db.execute(
        select(Cart)
        .filter(Cart.id == cart_id, Cart.cashier_id == cashier_id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    cart = res.scalars().first()
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found")
    return cart

@router.post("", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
async def create_cart(
    cart_in: CartCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new temporary cart for parking transaction items.
    """
    new_cart = Cart(cashier_id=current_user.id, customer_name=cart_in.customer_name)
    db.add(new_cart)
    await db.commit()
    await db.refresh(new_cart)
    
    cart = await fetch_cart_with_items(db, new_cart.id, current_user.id)
    return compile_cart_response(cart)

@router.get("", response_model=List[CartResponse])
async def list_cashier_carts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all active parked carts for the current cashier.
    """
    res = await db.execute(
        select(Cart)
        .filter(Cart.cashier_id == current_user.id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    carts = res.scalars().all()
    return [compile_cart_response(c) for c in carts]

@router.get("/{cart_id}", response_model=CartResponse)
async def get_single_cart(
    cart_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch details of a single cart by ID.
    """
    cart = await fetch_cart_with_items(db, cart_id, current_user.id)
    return compile_cart_response(cart)

@router.post("/{cart_id}/items", response_model=CartResponse)
async def add_item_to_cart(
    cart_id: int,
    item_in: CartItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a product to the cart. If already present, increment the quantity instead.
    """
    cart = await fetch_cart_with_items(db, cart_id, current_user.id)
    
    # Check if product exists
    prod_res = await db.execute(select(Product).filter(Product.id == item_in.product_id))
    product = prod_res.scalars().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
    # Check if item is already in cart
    existing_item = next((item for item in cart.items if item.product_id == item_in.product_id), None)
    
    if existing_item:
        existing_item.quantity += item_in.quantity
    else:
        new_item = CartItem(cart_id=cart_id, product_id=item_in.product_id, quantity=item_in.quantity)
        db.add(new_item)
        
    await db.commit()
    
    # Refresh cart
    updated_cart = await fetch_cart_with_items(db, cart_id, current_user.id)
    return compile_cart_response(updated_cart)

@router.put("/{cart_id}/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    cart_id: int,
    item_id: int,
    item_in: CartItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the quantity of a specific item inside the cart.
    """
    cart = await fetch_cart_with_items(db, cart_id, current_user.id)
    
    item_res = await db.execute(select(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart_id))
    item = item_res.scalars().first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
        
    item.quantity = item_in.quantity
    await db.commit()
    
    updated_cart = await fetch_cart_with_items(db, cart_id, current_user.id)
    return compile_cart_response(updated_cart)

@router.delete("/{cart_id}/items/{item_id}", response_model=CartResponse)
async def remove_cart_item(
    cart_id: int,
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove an item from the cart.
    """
    cart = await fetch_cart_with_items(db, cart_id, current_user.id)
    
    item_res = await db.execute(select(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart_id))
    item = item_res.scalars().first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
        
    await db.delete(item)
    await db.commit()
    
    updated_cart = await fetch_cart_with_items(db, cart_id, current_user.id)
    return compile_cart_response(updated_cart)

@router.delete("/{cart_id}", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    cart_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an entire cart and its parked items.
    """
    cart = await fetch_cart_with_items(db, cart_id, current_user.id)
    await db.delete(cart)
    await db.commit()
    return None
