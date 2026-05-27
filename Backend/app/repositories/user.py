from typing import Optional, Any
from app.repositories.base import BaseRepository
from app.models.user import User

class UserRepository(BaseRepository[User]):
    async def get_by_username(self, db: Any, username: str) -> Optional[User]:
        doc = await db[self.collection_name].find_one({"username": username})
        return self.model(**doc) if doc else None

user_repository = UserRepository(User)
