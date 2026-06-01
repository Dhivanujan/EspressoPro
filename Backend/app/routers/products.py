from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.cloudinary_service import cloudinary_service
from sqlalchemy import select
from app.database.session import get_db
from app.models.product import Product, Ingredient, ProductIngredient
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    IngredientCreate,
    IngredientUpdate,
    IngredientResponse
)
from app.utils.deps import get_current_user, RoleChecker
from app.repositories.product import product_repository
from app.repositories.base import BaseRepository

router = APIRouter(tags=["Products & Ingredients"])
ingredient_repo = BaseRepository(Ingredient)

# --- INGREDIENTS ENDPOINTS ---
@router.post("/ingredients", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED)
async def create_ingredient(
    ing_in: IngredientCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Create a new raw ingredient (Admin only).
    """
    res = await db.execute(select(Ingredient).filter(Ingredient.name == ing_in.name))
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ingredient with this name already exists"
        )
    
    new_ing = await ingredient_repo.create(db, obj_in=ing_in.model_dump())
    await db.commit()
    await db.refresh(new_ing)
    return new_ing

@router.get("/ingredients", response_model=List[IngredientResponse])
async def get_all_ingredients(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all ingredients.
    """
    return await ingredient_repo.get_multi(db, skip=skip, limit=limit)

@router.get("/ingredients/{ingredient_id}", response_model=IngredientResponse)
async def get_single_ingredient(
    ingredient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get ingredient by ID.
    """
    ing = await ingredient_repo.get(db, ingredient_id)
    if not ing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    return ing

@router.put("/ingredients/{ingredient_id}", response_model=IngredientResponse)
async def update_ingredient(
    ingredient_id: str,
    ing_in: IngredientUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Update an ingredient (Admin only).
    """
    ing = await ingredient_repo.get(db, ingredient_id)
    if not ing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    
    if ing_in.name:
        res = await db.execute(
            select(Ingredient).filter(Ingredient.name == ing_in.name, Ingredient.id != ingredient_id)
        )
        if res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ingredient with this name already exists"
            )
            
    updated = await ingredient_repo.update(db, db_obj=ing, obj_in=ing_in)
    await db.commit()
    await db.refresh(updated)
    return updated

@router.delete("/ingredients/{ingredient_id}", response_model=IngredientResponse)
async def delete_ingredient(
    ingredient_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Delete an ingredient (Admin only).
    """
    ing = await ingredient_repo.get(db, ingredient_id)
    if not ing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    
    await ingredient_repo.remove(db, id=ingredient_id)
    await db.commit()
    return ing


# --- PRODUCTS ENDPOINTS ---
@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: ProductCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Create a new product with optional ingredient recipe mapping (Admin only).
    """
    res = await db.execute(select(Product).filter(Product.name == product_in.name))
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product with this name already exists"
        )
    
    # Extract recipe data
    recipe_data = product_in.recipe
    product_data = product_in.model_dump(exclude={"recipe"})
    
    new_product = await product_repository.create(db, obj_in=product_data)
    await db.flush()  # gets new_product.id
    
    # Save recipe items
    if recipe_data:
        for r_item in recipe_data:
            ing = await ingredient_repo.get(db, r_item.ingredient_id)
            if not ing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ingredient with ID {r_item.ingredient_id} not found"
                )
            recipe_obj = ProductIngredient(
                product_id=new_product.id,
                ingredient_id=r_item.ingredient_id,
                quantity_required=r_item.quantity_required
            )
            db.add(recipe_obj)
            
    await db.commit()
    
    # Retrieve complete eagerly loaded product details
    product_details = await product_repository.get_with_recipe(db, new_product.id)
    return product_details

@router.get("/products", response_model=List[ProductResponse])
async def get_all_products(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    availability: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all products with optional filters and keyword search.
    """
    return await product_repository.get_multi_filtered(
        db,
        category_id=category_id,
        search=search,
        availability=availability,
        skip=skip,
        limit=limit
    )

@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_single_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get product details by ID, including its recipe.
    """
    prod = await product_repository.get_with_recipe(db, product_id)
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return prod

@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_in: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Update a product and optionally adjust its recipe (Admin only).
    """
    prod = await product_repository.get(db, product_id)
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    if product_in.name:
        res = await db.execute(
            select(Product).filter(Product.name == product_in.name, Product.id != product_id)
        )
        if res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this name already exists"
            )
            
    # Extract recipe if provided
    recipe_data = product_in.recipe
    product_data = product_in.model_dump(exclude={"recipe"}, exclude_unset=True)
    
    # Update product main attributes
    await product_repository.update(db, db_obj=prod, obj_in=product_data)
    
    # Update recipe if provided
    if recipe_data is not None:
        # Clear existing recipe first
        await db.execute(
            ProductIngredient.__table__.delete().where(ProductIngredient.product_id == product_id)
        )
        for r_item in recipe_data:
            ing = await ingredient_repo.get(db, r_item.ingredient_id)
            if not ing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ingredient with ID {r_item.ingredient_id} not found in database"
                )
            recipe_obj = ProductIngredient(
                product_id=product_id,
                ingredient_id=r_item.ingredient_id,
                quantity_required=r_item.quantity_required
            )
            db.add(recipe_obj)
            
    await db.commit()
    
    product_details = await product_repository.get_with_recipe(db, product_id)
    return product_details

@router.delete("/products/{product_id}", response_model=ProductResponse)
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Delete a product (Admin only).
    """
    prod = await product_repository.get_with_recipe(db, product_id)
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    await product_repository.remove(db, id=product_id)
    await db.commit()
    return prod


@router.post("/products/upload-image", status_code=status.HTTP_201_CREATED)
async def upload_product_image(
    file: UploadFile = File(...),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Upload a product image using Cloudinary or a resilient local fallback directory (Admin only).
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File uploaded must be a valid image"
        )
        
    try:
        content = await file.read()
        url = await cloudinary_service.upload_image(content, folder="products")
        return {"url": url, "provider": "cloudinary" if cloudinary_service.enabled else "local"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process image upload: {e}"
        )
