from typing import Generic, TypeVar, Type, List, Optional, Any, Dict, Union
from bson import ObjectId
from app.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model
        self.collection_name = model.__tablename__

    async def get(self, db: Any, id: Any) -> Optional[ModelType]:
        try:
            # Try ObjectId first if it's a valid 24-char hex string
            query_id = ObjectId(id) if isinstance(id, str) and ObjectId.is_valid(id) else id
            doc = await db[self.collection_name].find_one({"_id": query_id})
            return self.model(**doc) if doc else None
        except Exception:
            return None

    async def get_multi(self, db: Any, *, skip: int = 0, limit: int = 100) -> List[ModelType]:
        cursor = db[self.collection_name].find().skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self.model(**doc) for doc in docs]

    async def create(self, db: Any, *, obj_in: Dict[str, Any]) -> ModelType:
        data = dict(obj_in)
        # Pop id or _id if present in obj_in
        data.pop("id", None)
        data.pop("_id", None)
        
        # Auto-populate created_at and updated_at
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if "created_at" not in data or not data["created_at"]:
            data["created_at"] = now
        if "updated_at" not in data or not data["updated_at"]:
            data["updated_at"] = now
            
        # Recursively convert Decimal to float for PyMongo compatibility
        from decimal import Decimal
        def convert_decimals(obj):
            if isinstance(obj, dict):
                return {k: convert_decimals(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_decimals(v) for v in obj]
            elif isinstance(obj, Decimal):
                return float(obj)
            return obj
        data = convert_decimals(data)
            
        result = await db[self.collection_name].insert_one(data)
        data["_id"] = result.inserted_id
        return self.model(**data)

    async def update(
        self, db: Any, *, db_obj: ModelType, obj_in: Union[Dict[str, Any], Any]
    ) -> ModelType:
        if isinstance(obj_in, dict):
            update_data = dict(obj_in)
        else:
            # Handle Pydantic models
            update_data = obj_in.model_dump(exclude_unset=True)
        
        # Remove primary keys from update
        update_data = {k: v for k, v in update_data.items() if k not in ("id", "_id")}
        
        # Auto-update updated_at
        from datetime import datetime, timezone
        update_data["updated_at"] = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # Recursively convert Decimal to float for PyMongo compatibility
        from decimal import Decimal
        def convert_decimals(obj):
            if isinstance(obj, dict):
                return {k: convert_decimals(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_decimals(v) for v in obj]
            elif isinstance(obj, Decimal):
                return float(obj)
            return obj
        update_data = convert_decimals(update_data)
        
        # Get query ID
        db_id = getattr(db_obj, "_id", None) or (ObjectId(db_obj.id) if isinstance(db_obj.id, str) else db_obj.id)
        
        await db[self.collection_name].update_one({"_id": db_id}, {"$set": update_data})
        
        # Fetch updated
        doc = await db[self.collection_name].find_one({"_id": db_id})
        return self.model(**doc)

    async def remove(self, db: Any, *, id: Any) -> Optional[ModelType]:
        db_obj = await self.get(db, id)
        if db_obj:
            db_id = getattr(db_obj, "_id", None) or (ObjectId(db_obj.id) if isinstance(db_obj.id, str) else db_obj.id)
            await db[self.collection_name].delete_one({"_id": db_id})
        return db_obj
