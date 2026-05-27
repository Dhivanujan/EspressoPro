from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.models.user import User
from app.schemas.analytics import DashboardAnalyticsResponse
from app.services.analytics_service import analytics_service
from app.utils.deps import RoleChecker

router = APIRouter(prefix="/analytics", tags=["Dashboard Analytics"])

@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Fetch coffee shop sales performance aggregates (total revenues, average ticket size, order volume trends).
    Restricted to Admins.
    """
    return await analytics_service.get_dashboard_analytics(db)
