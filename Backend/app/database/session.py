from typing import Any, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

# Initialize Motor Client
client = AsyncIOMotorClient(settings.MONGODB_URL)
raw_database = client[settings.MONGODB_DB]

class SQLAlchemyMockResult:
    def __init__(self, items):
        self._items = items

    def scalars(self):
        return self

    def first(self):
        return self._items[0] if self._items else None

    def all(self):
        return self._items

class MotorDatabaseWrapper:
    def __init__(self, db):
        self._db = db
        self._staged_objects = []

    def __getitem__(self, name):
        return self._db[name]

    def __getattr__(self, name):
        return getattr(self._db, name)

    def add(self, obj):
        if obj not in self._staged_objects:
            self._staged_objects.append(obj)

    def add_all(self, objs):
        for obj in objs:
            self.add(obj)

    async def commit(self):
        await self.flush()

    async def rollback(self):
        self._staged_objects.clear()

    async def refresh(self, obj):
        # Refresh is used to populate fields after save
        obj_id = getattr(obj, "_id", None) or getattr(obj, "id", None)
        collection_name = getattr(obj, "__tablename__", None)
        if obj_id and collection_name:
            query_id = ObjectId(obj_id) if isinstance(obj_id, str) and ObjectId.is_valid(obj_id) else obj_id
            doc = await self._db[collection_name].find_one({"_id": query_id})
            if doc:
                # Re-assign properties to obj
                if "_id" in doc:
                    doc["id"] = str(doc["_id"])
                for k, v in doc.items():
                    setattr(obj, k, v)

    async def delete(self, obj):
        obj_id = getattr(obj, "_id", None) or getattr(obj, "id", None)
        collection_name = getattr(obj, "__tablename__", None)
        if obj_id and collection_name:
            query_id = ObjectId(obj_id) if isinstance(obj_id, str) and ObjectId.is_valid(obj_id) else obj_id
            await self._db[collection_name].delete_one({"_id": query_id})
            if obj in self._staged_objects:
                self._staged_objects.remove(obj)

    async def flush(self):
        # Save all staged objects to MongoDB
        for obj in self._staged_objects:
            collection_name = getattr(obj, "__tablename__", None)
            if not collection_name:
                continue
            
            data = obj.to_dict()
            obj_id = getattr(obj, "_id", None) or getattr(obj, "id", None)
            
            if obj_id:
                query_id = ObjectId(obj_id) if isinstance(obj_id, str) and ObjectId.is_valid(obj_id) else obj_id
                payload = {k: v for k, v in data.items() if k not in ("id", "_id")}
                await self._db[collection_name].update_one({"_id": query_id}, {"$set": payload})
            else:
                payload = {k: v for k, v in data.items() if k not in ("id", "_id")}
                result = await self._db[collection_name].insert_one(payload)
                obj._id = result.inserted_id
                obj.id = str(result.inserted_id)
                
        self._staged_objects.clear()

    async def close(self):
        pass

    async def execute(self, statement, *args, **kwargs):
        # Dynamically execute SQLAlchemy select queries against MongoDB
        try:
            from sqlalchemy.sql.selectable import Select
            if not isinstance(statement, Select):
                return SQLAlchemyMockResult([])
        except ImportError:
            return SQLAlchemyMockResult([])
            
        froms = statement.get_final_froms()
        if not froms:
            return SQLAlchemyMockResult([])
        model = froms[0]
        collection_name = getattr(model, "__tablename__", None)
        if not collection_name:
            return SQLAlchemyMockResult([])
            
        query = {}
        where = statement.whereclause
        
        def parse_where(where_node):
            if where_node is None:
                return {}
            
            from sqlalchemy.sql.elements import BinaryExpression, BooleanClauseList, BindParameter
            if isinstance(where_node, BinaryExpression):
                left = getattr(where_node, "left", None)
                right = getattr(where_node, "right", None)
                
                col_name = getattr(left, "name", None)
                if not col_name:
                    return {}
                
                val = None
                if hasattr(right, "value"):
                    val = right.value
                elif isinstance(right, BindParameter):
                    val = right.value
                else:
                    val = str(right)
                
                operator = getattr(where_node, "operator", None)
                op_name = operator.__name__ if operator else "eq"
                
                # Map column 'id' to '_id' in MongoDB
                if col_name == "id":
                    col_name = "_id"
                    if isinstance(val, str) and ObjectId.is_valid(val):
                        val = ObjectId(val)
                elif col_name in ("product_id", "category_id", "cart_id", "cashier_id", "customer_id", "coupon_id", "order_id", "ingredient_id", "item_id"):
                    if isinstance(val, int):
                        val = str(val)
                
                if op_name in ("eq", "comma_op", "is_"):
                    return {col_name: val}
                elif op_name in ("ne", "is_not"):
                    return {col_name: {"$ne": val}}
                elif op_name in ("ilike", "like"):
                    pattern = str(val).replace("%", "")
                    return {col_name: {"$regex": pattern, "$options": "i"}}
                elif op_name == "gt":
                    return {col_name: {"$gt": val}}
                elif op_name == "lt":
                    return {col_name: {"$lt": val}}
                elif op_name == "ge":
                    return {col_name: {"$gte": val}}
                elif op_name == "le":
                    return {col_name: {"$lte": val}}
                    
            elif isinstance(where_node, BooleanClauseList):
                sub_queries = [parse_where(c) for c in where_node.clauses]
                combined = {}
                for q in sub_queries:
                    for k, v in q.items():
                        if k in combined:
                            if isinstance(combined[k], dict) and isinstance(v, dict):
                                combined[k].update(v)
                            else:
                                combined[k] = v
                        else:
                            combined[k] = v
                return combined
            return {}

        try:
            query = parse_where(where)
        except Exception:
            pass
            
        cursor = self._db[collection_name].find(query)
        docs = await cursor.to_list(length=100)
        
        objects = [model(**doc) for doc in docs]
        return SQLAlchemyMockResult(objects)

# Wrap the MongoDB client
database = MotorDatabaseWrapper(raw_database)

async def get_db():
    """
    Dependency that yields the wrapped Motor database instance.
    """
    yield database
