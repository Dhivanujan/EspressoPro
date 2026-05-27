from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.utils.deps import get_current_user, RoleChecker
from app.models.user import User
from app.repositories.base import BaseRepository

router = APIRouter(prefix="/categories", tags=["Categories"])
category_repo = BaseRepository(Category)

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Create a new product category (Admin only).
    """
    # Check if duplicate name
    res = await db.execute(select(Category).filter(Category.name == category_in.name))
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )
    
    new_cat = await category_repo.create(db, obj_in=category_in.model_dump())
    await db.commit()
    await db.refresh(new_cat)
    return new_cat

@router.get("", response_model=List[CategoryResponse])
async def get_all_categories(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all categories.
    """
    return await category_repo.get_multi(db, skip=skip, limit=limit)

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_single_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get category by ID.
    """
    category = await category_repo.get(db, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Update a category (Admin only).
    """
    category = await category_repo.get(db, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    if category_in.name:
        # Check duplicate name
        res = await db.execute(
            select(Category).filter(Category.name == category_in.name, Category.id != category_id)
        )
        if res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists"
            )
            
    updated = await category_repo.update(db, db_obj=category, obj_in=category_in)
    await db.commit()
    await db.refresh(updated)
    return updated

@router.delete("/{category_id}", response_model=CategoryResponse)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Delete a category (Admin only).
    """
    category = await category_repo.get(db, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    await category_repo.remove(db, id=category_id)
    await db.commit()
    return category
