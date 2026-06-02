from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.repositories.user import user_repository
from app.schemas.user import UserCreate, UserResponse, Token, UserUpdate
from app.services.auth import auth_service
from app.utils.deps import get_current_user, RoleChecker
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(RoleChecker(["admin"]))
):
    """
    Register a new user (Cashier or Admin).
    Only existing Admins can create new users.
    """
    existing_user = await user_repository.get_by_username(db, user_in.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists"
        )
    
    hashed_password = auth_service.get_password_hash(user_in.password)
    user_data = user_in.model_dump(exclude={"password"})
    user_data["password_hash"] = hashed_password
    
    new_user = await user_repository.create(db, obj_in=user_data)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Standard OAuth2 Login endpoint. Returns access token upon successful authentication.
    """
    user = await user_repository.get_by_username(db, form_data.username)
    if not user or not auth_service.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if auth_service.needs_password_update(user.password_hash):
        new_hash = auth_service.get_password_hash(form_data.password)
        user = await user_repository.update(db, db_obj=user, obj_in={"password_hash": new_hash})
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )
    
    access_token = auth_service.create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Fetch current logged-in user profile.
    """
    return current_user


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(RoleChecker(["admin"]))
):
    """
    List all users. Only admins can perform this.
    """
    users = await user_repository.get_multi(db, skip=skip, limit=limit)
    return users


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(RoleChecker(["admin"]))
):
    """
    Update user details. Only admins can perform this.
    """
    user = await user_repository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        hashed_password = auth_service.get_password_hash(update_data["password"])
        update_data["password_hash"] = hashed_password
        del update_data["password"]
    elif "password" in update_data:
        del update_data["password"]
        
    updated_user = await user_repository.update(db, db_obj=user, obj_in=update_data)
    await db.commit()
    return updated_user


@router.delete("/users/{user_id}", response_model=UserResponse)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(RoleChecker(["admin"]))
):
    """
    Delete a user. Only admins can perform this.
    """
    user = await user_repository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if str(user.id) == str(current_admin.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot delete themselves"
        )
        
    deleted_user = await user_repository.remove(db, id=user_id)
    await db.commit()
    return deleted_user
